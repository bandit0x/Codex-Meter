use crate::capacity::Diagnostic;
use serde::Serialize;
use std::{
    collections::HashSet,
    sync::Mutex,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::{process::Command, time::timeout};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

const PROCESS_TIMEOUT: Duration = Duration::from_secs(2);
const REGISTRY_TIMEOUT: Duration = Duration::from_secs(2);
const HEALTH_PROBE_TIMEOUT: Duration = Duration::from_secs(9);
const COUNTRY_PROBE_TIMEOUT: Duration = Duration::from_secs(3);
const HEALTH_CONNECT_TIMEOUT: &str = "5";
const HEALTH_MAX_TIME: &str = "8";
const COUNTRY_CONNECT_TIMEOUT: &str = "1";
const COUNTRY_MAX_TIME: &str = "2";
const COUNTRY_ENDPOINT: &str = "https://api.country.is/";
const HEALTH_ENDPOINT: &str = "https://www.gstatic.com/generate_204";
const REQUIRED_PROCESSES: [&str; 2] = ["tomato-cloud.exe", "tomato-dataplane-agent.exe"];

#[derive(Clone, Copy)]
struct ProbeSettings {
    connect_timeout: &'static str,
    max_time: &'static str,
    command_timeout: Duration,
}

const HEALTH_PROBE: ProbeSettings = ProbeSettings {
    connect_timeout: HEALTH_CONNECT_TIMEOUT,
    max_time: HEALTH_MAX_TIME,
    command_timeout: HEALTH_PROBE_TIMEOUT,
};

const COUNTRY_PROBE: ProbeSettings = ProbeSettings {
    connect_timeout: COUNTRY_CONNECT_TIMEOUT,
    max_time: COUNTRY_MAX_TIME,
    command_timeout: COUNTRY_PROBE_TIMEOUT,
};

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TomatoConnectionState {
    Healthy,
    Blocked,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TomatoConnectionSnapshot {
    pub state: TomatoConnectionState,
    pub country_code: Option<String>,
    pub latency_ms: Option<u64>,
    pub observed_at_ms: u64,
    pub diagnostic: Option<Diagnostic>,
}

#[derive(Debug)]
pub struct TomatoCloudService {
    last_country_code: Mutex<Option<String>>,
}

impl TomatoCloudService {
    pub fn new() -> Self {
        Self {
            last_country_code: Mutex::new(None),
        }
    }

    pub async fn read_connection(&self) -> TomatoConnectionSnapshot {
        let country_code = self
            .last_country_code
            .lock()
            .ok()
            .and_then(|value| value.clone());

        let running_processes = match read_running_processes().await {
            Ok(processes) => processes,
            Err(diagnostic) => return TomatoConnectionSnapshot::blocked(country_code, diagnostic),
        };
        let missing = REQUIRED_PROCESSES
            .iter()
            .copied()
            .filter(|process| !running_processes.contains(*process))
            .collect::<Vec<_>>();
        if !missing.is_empty() {
            return TomatoConnectionSnapshot::blocked(
                country_code,
                Diagnostic::new("CRV-401", "TomatoCloud runtime is not running")
                    .with_detail(format!("Missing required runtime: {}", missing.join(", "))),
            );
        }

        let proxy = match read_system_proxy().await {
            Ok(proxy) => proxy,
            Err(diagnostic) => return TomatoConnectionSnapshot::blocked(country_code, diagnostic),
        };
        if !is_loopback_proxy(&proxy) {
            return TomatoConnectionSnapshot::blocked(
                country_code,
                Diagnostic::new("CRV-403", "TomatoCloud local proxy is unavailable")
                    .with_detail("The enabled Windows HTTPS proxy is not a loopback endpoint"),
            );
        }

        let health_probe = match route_probe(&proxy, HEALTH_ENDPOINT, HEALTH_PROBE).await {
            Ok(probe) if (200..300).contains(&probe.http_status) => probe,
            Ok(probe) => {
                return TomatoConnectionSnapshot::blocked(
                    country_code,
                    Diagnostic::new("CRV-404", "TomatoCloud route is unavailable")
                        .with_detail(format!("Health probe returned HTTP {}", probe.http_status)),
                );
            }
            Err(diagnostic) => return TomatoConnectionSnapshot::blocked(country_code, diagnostic),
        };

        let country_code = match route_probe(&proxy, COUNTRY_ENDPOINT, COUNTRY_PROBE).await {
            Ok(probe) if probe.http_status == 200 => {
                let country_code = country_code_from_body(&probe.body).or(country_code);
                if let Some(country_code) = country_code.as_ref() {
                    if let Ok(mut remembered) = self.last_country_code.lock() {
                        *remembered = Some(country_code.clone());
                    }
                }
                country_code
            }
            _ => country_code,
        };

        TomatoConnectionSnapshot::healthy(country_code, health_probe.latency_ms)
    }
}

impl TomatoConnectionSnapshot {
    fn healthy(country_code: Option<String>, latency_ms: u64) -> Self {
        Self {
            state: TomatoConnectionState::Healthy,
            country_code,
            latency_ms: Some(latency_ms),
            observed_at_ms: now_ms(),
            diagnostic: None,
        }
    }

    fn blocked(country_code: Option<String>, diagnostic: Diagnostic) -> Self {
        Self {
            state: TomatoConnectionState::Blocked,
            country_code,
            latency_ms: None,
            observed_at_ms: now_ms(),
            diagnostic: Some(diagnostic),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
struct RouteProbeResult {
    http_status: u16,
    latency_ms: u64,
    body: String,
}

async fn read_running_processes() -> Result<HashSet<String>, Diagnostic> {
    let output = command_output(
        Command::new("tasklist.exe")
            .args(["/FO", "CSV", "/NH"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null()),
        PROCESS_TIMEOUT,
        "CRV-400",
        "Unable to inspect the TomatoCloud runtime",
    )
    .await?;
    if !output.status.success() {
        return Err(Diagnostic::new(
            "CRV-400",
            "Unable to inspect the TomatoCloud runtime",
        ));
    }
    Ok(parse_tasklist(&String::from_utf8_lossy(&output.stdout)))
}

async fn read_system_proxy() -> Result<String, Diagnostic> {
    let output = command_output(
        Command::new("reg.exe")
            .args([
                "query",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                "/v",
                "ProxyEnable",
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null()),
        REGISTRY_TIMEOUT,
        "CRV-402",
        "TomatoCloud local proxy is unavailable",
    )
    .await?;
    if !output.status.success()
        || !registry_flag_is_enabled(&String::from_utf8_lossy(&output.stdout))
    {
        return Err(
            Diagnostic::new("CRV-402", "TomatoCloud local proxy is unavailable")
                .with_detail("Windows system proxy is not enabled"),
        );
    }

    let output = command_output(
        Command::new("reg.exe")
            .args([
                "query",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                "/v",
                "ProxyServer",
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null()),
        REGISTRY_TIMEOUT,
        "CRV-402",
        "TomatoCloud local proxy is unavailable",
    )
    .await?;
    if !output.status.success() {
        return Err(
            Diagnostic::new("CRV-402", "TomatoCloud local proxy is unavailable")
                .with_detail("Windows system proxy does not provide a server"),
        );
    }

    extract_proxy_server(&String::from_utf8_lossy(&output.stdout)).ok_or_else(|| {
        Diagnostic::new("CRV-402", "TomatoCloud local proxy is unavailable")
            .with_detail("Windows system proxy server could not be parsed")
    })
}

async fn route_probe(
    proxy: &str,
    endpoint: &str,
    settings: ProbeSettings,
) -> Result<RouteProbeResult, Diagnostic> {
    let proxy_url = format!("http://{proxy}");
    let output = command_output(
        Command::new("curl.exe")
            .args([
                "--silent",
                "--show-error",
                "--output",
                "-",
                "--write-out",
                "\n%{http_code} %{time_total}",
                "--connect-timeout",
                settings.connect_timeout,
                "--max-time",
                settings.max_time,
                "--retry",
                "0",
                "--proxy",
                &proxy_url,
                endpoint,
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null()),
        settings.command_timeout,
        "CRV-404",
        "TomatoCloud route is unavailable",
    )
    .await?;
    parse_curl_output(&String::from_utf8_lossy(&output.stdout)).ok_or_else(|| {
        Diagnostic::new("CRV-404", "TomatoCloud route is unavailable")
            .with_detail("Route probe did not return a valid HTTP result")
    })
}

async fn command_output(
    command: &mut Command,
    duration: Duration,
    code: &'static str,
    message: &'static str,
) -> Result<std::process::Output, Diagnostic> {
    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    timeout(duration, command.output())
        .await
        .map_err(|_| Diagnostic::new(code, message).with_detail("The check timed out"))?
        .map_err(|error| Diagnostic::new(code, message).with_detail(error.to_string()))
}

fn parse_tasklist(raw: &str) -> HashSet<String> {
    raw.lines()
        .filter_map(|line| line.trim().strip_prefix('"'))
        .filter_map(|line| line.split('"').next())
        .map(|name| name.to_ascii_lowercase())
        .collect()
}

fn registry_flag_is_enabled(raw: &str) -> bool {
    raw.lines().any(|line| {
        let tokens = line.split_whitespace().collect::<Vec<_>>();
        tokens.len() >= 3
            && tokens[0].eq_ignore_ascii_case("ProxyEnable")
            && tokens[1].eq_ignore_ascii_case("REG_DWORD")
            && tokens[2].eq_ignore_ascii_case("0x1")
    })
}

fn extract_proxy_server(raw: &str) -> Option<String> {
    let value = raw
        .lines()
        .find_map(|line| line.split_once("REG_SZ").map(|(_, value)| value.trim()))?;
    let protocol_specific = value
        .split(';')
        .find_map(|segment| segment.trim().strip_prefix("https="))
        .or_else(|| {
            value
                .split(';')
                .find_map(|segment| segment.trim().strip_prefix("http="))
        });
    protocol_specific
        .or(Some(value))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn is_loopback_proxy(proxy: &str) -> bool {
    let endpoint = proxy
        .trim()
        .strip_prefix("http://")
        .or_else(|| proxy.trim().strip_prefix("https://"))
        .unwrap_or(proxy.trim());
    let Some((host, port)) = endpoint.rsplit_once(':') else {
        return false;
    };
    let host = host.trim_matches(['[', ']']);
    matches!(host, "127.0.0.1" | "localhost" | "::1")
        && port.parse::<u16>().is_ok_and(|port| port > 0)
}

fn parse_curl_output(raw: &str) -> Option<RouteProbeResult> {
    let (body, metadata) = raw.rsplit_once('\n')?;
    let mut fields = metadata.split_whitespace();
    let http_status = fields.next()?.parse::<u16>().ok()?;
    let latency_seconds = fields.next()?.parse::<f64>().ok()?;
    if !latency_seconds.is_finite() || latency_seconds < 0.0 {
        return None;
    }
    Some(RouteProbeResult {
        http_status,
        latency_ms: (latency_seconds * 1_000.0).round() as u64,
        body: body.trim().to_owned(),
    })
}

fn country_code_from_body(body: &str) -> Option<String> {
    let value = serde_json::from_str::<serde_json::Value>(body).ok()?;
    let country = value.get("country")?.as_str()?.trim().to_ascii_uppercase();
    let normalized = if country == "GB" {
        "UK".to_owned()
    } else {
        country
    };
    (normalized.len() == 2
        && normalized
            .chars()
            .all(|character| character.is_ascii_alphabetic()))
    .then_some(normalized)
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_running_processes_without_relying_on_localized_tasklist_headers() {
        let processes = parse_tasklist(
            "\"tomato-cloud.exe\",\"108\",\"Console\",\"1\",\"10,000 K\"\n\"tomato-dataplane-agent.exe\",\"109\",\"Console\",\"1\",\"12,000 K\"",
        );
        assert!(processes.contains("tomato-cloud.exe"));
        assert!(processes.contains("tomato-dataplane-agent.exe"));
    }

    #[test]
    fn parses_a_protocol_specific_loopback_proxy() {
        let raw = "    ProxyServer    REG_SZ    http=127.0.0.1:7888;https=127.0.0.1:7888";
        assert_eq!(extract_proxy_server(raw).as_deref(), Some("127.0.0.1:7888"));
        assert!(is_loopback_proxy("127.0.0.1:7888"));
        assert!(!is_loopback_proxy("example.org:443"));
    }

    #[test]
    fn parses_curl_metadata_and_normalizes_exit_country() {
        let result = parse_curl_output("{\"ip\":\"203.0.113.10\",\"country\":\"GB\"}\n200 0.0427")
            .expect("probe result");
        assert_eq!(result.http_status, 200);
        assert_eq!(result.latency_ms, 43);
        assert_eq!(country_code_from_body(&result.body).as_deref(), Some("UK"));
    }

    #[test]
    fn rejects_disabled_proxy_and_malformed_probe_metadata() {
        assert!(!registry_flag_is_enabled("ProxyEnable    REG_DWORD    0x0"));
        assert!(parse_curl_output("not a probe result").is_none());
    }
}
