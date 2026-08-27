use crate::capacity::{Diagnostic, SourceState};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    env, fs,
    path::PathBuf,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::{io::AsyncWriteExt, process::Command, time::timeout};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

const COMMAND_TIMEOUT: Duration = Duration::from_secs(15);
const QUOTA_PATH: &str = "/api/monitor/usage/quota/limit";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZCodeQuotaSnapshot {
    pub source_state: SourceState,
    pub five_hour: Option<ZCodeQuotaWindow>,
    pub weekly: Option<ZCodeQuotaWindow>,
    pub plan_level: Option<String>,
    pub observed_at_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZCodeQuotaWindow {
    pub used_percent: f64,
    pub remaining_percent: f64,
    pub window_duration_mins: u64,
    pub resets_at: u64,
    pub quota_total: u64,
    pub quota_used: u64,
    pub quota_remaining: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct QuotaRequest {
    url: String,
    api_key: String,
}

#[derive(Debug, Deserialize)]
struct ZCodeConfigFile {
    #[serde(default)]
    provider: BTreeMap<String, ZCodeProviderEntry>,
}

#[derive(Debug, Deserialize)]
struct ZCodeProviderEntry {
    #[serde(default)]
    enabled: bool,
    #[serde(default, rename = "systemDisabledReason")]
    system_disabled_reason: Option<String>,
    #[serde(default)]
    options: ZCodeProviderOptions,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
struct ZCodeProviderOptions {
    #[serde(rename = "apiKey")]
    api_key: String,
    #[serde(rename = "baseURL")]
    base_url: String,
}

#[derive(Debug, Deserialize)]
struct QuotaResponse {
    code: Option<i64>,
    #[serde(default)]
    msg: Option<String>,
    #[serde(default)]
    success: Option<bool>,
    #[serde(default)]
    data: Option<QuotaData>,
}

#[derive(Debug, Deserialize)]
struct QuotaData {
    #[serde(default)]
    limits: Vec<QuotaLimit>,
    #[serde(default)]
    level: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QuotaLimit {
    #[serde(rename = "type")]
    kind: String,
    unit: Option<u64>,
    number: Option<u64>,
    usage: Option<u64>,
    current_value: Option<u64>,
    remaining: Option<u64>,
    percentage: Option<f64>,
    next_reset_time: Option<u64>,
}

#[derive(Debug)]
pub struct ZCodeQuotaService {
    fixture_path: Option<PathBuf>,
}

impl ZCodeQuotaService {
    pub fn from_environment() -> Self {
        Self {
            fixture_path: env::var_os("CODEX_CREDITS_ZCODE_QUOTA_RESPONSE_FILE").map(PathBuf::from),
        }
    }

    #[cfg(test)]
    fn from_fixture_path(path: PathBuf) -> Self {
        Self {
            fixture_path: Some(path),
        }
    }

    pub async fn read_snapshot(&self) -> Result<ZCodeQuotaSnapshot, Diagnostic> {
        if let Some(path) = &self.fixture_path {
            let raw = fs::read_to_string(path).map_err(|error| {
                Diagnostic::new("CRV-506", "ZCode 配额 fixture 无法读取")
                    .with_detail(error.to_string())
            })?;
            return parse_quota_payload(&raw);
        }

        let request = resolve_quota_request(&env_lookup)?;
        let body = fetch_quota_body(&request).await?;
        parse_quota_payload(&body)
    }
}

fn env_lookup(name: &str) -> Option<String> {
    env::var(name)
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
}

fn resolve_quota_request(
    lookup: &dyn Fn(&str) -> Option<String>,
) -> Result<QuotaRequest, Diagnostic> {
    let config = read_config_request(lookup);
    let api_key = lookup("ZCODE_BIGMODEL_USAGE_API_KEY")
        .or_else(|| lookup("BIGMODEL_USAGE_API_KEY"))
        .or_else(|| {
            config
                .as_ref()
                .ok()
                .map(|request| request.api_key.clone())
                .filter(|key| !key.is_empty())
        });
    let url = lookup("ZCODE_BIGMODEL_USAGE_QUOTA_URL")
        .or_else(|| lookup("BIGMODEL_USAGE_QUOTA_URL"))
        .or_else(|| {
            config
                .as_ref()
                .ok()
                .map(|request| request.url.clone())
                .filter(|url| !url.is_empty())
        });

    if let (Some(api_key), Some(url)) = (&api_key, &url) {
        if api_key.contains('"') || api_key.contains('\n') {
            return Err(Diagnostic::new(
                "CRV-503",
                "ZCode API Key 含有无法安全传递的字符",
            ));
        }
        return Ok(QuotaRequest {
            url: url.clone(),
            api_key: api_key.clone(),
        });
    }

    Err(match &config {
        Err(diagnostic) => diagnostic.clone(),
        Ok(_) if api_key.is_none() => Diagnostic::new("CRV-503", "ZCode 编程包未配置 API Key"),
        Ok(_) => Diagnostic::new("CRV-501", "未检测到 ZCode 配额端点")
            .with_detail("缺少 BIGMODEL_USAGE_QUOTA_URL 环境变量或可用的 ZCode 配置"),
    })
}

fn read_config_request(
    lookup: &dyn Fn(&str) -> Option<String>,
) -> Result<QuotaRequest, Diagnostic> {
    let config_dir = lookup("CODEX_CREDITS_ZCODE_CONFIG_DIR")
        .map(PathBuf::from)
        .or_else(|| {
            env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join(".zcode").join("v2"))
        });
    let Some(config_dir) = config_dir else {
        return Err(
            Diagnostic::new("CRV-501", "未检测到 ZCode 配置").with_detail("无法定位用户目录")
        );
    };
    let path = config_dir.join("config.json");
    let raw = fs::read_to_string(&path).map_err(|error| {
        Diagnostic::new("CRV-501", "未检测到 ZCode 配置")
            .with_detail(format!("无法读取 {}: {error}", path.display()))
    })?;
    let config: ZCodeConfigFile = serde_json::from_str(&raw).map_err(|error| {
        Diagnostic::new("CRV-501", "ZCode 配置无法解析").with_detail(error.to_string())
    })?;

    let coding_plans = config
        .provider
        .iter()
        .filter(|(id, entry)| {
            id.ends_with("-coding-plan") && entry.enabled && entry.system_disabled_reason.is_none()
        })
        .collect::<Vec<_>>();
    if coding_plans.is_empty() {
        return Err(
            Diagnostic::new("CRV-502", "ZCode 编程包未启用").with_detail(
                "config.json 中没有启用的 coding-plan provider，请在 ZCode 内订阅并启用编程包",
            ),
        );
    }

    for (id, entry) in coding_plans {
        let api_key = entry.options.api_key.trim().to_owned();
        if api_key.is_empty() {
            continue;
        }
        let Some(url) = quota_url_from_base_url(&entry.options.base_url) else {
            return Err(
                Diagnostic::new("CRV-503", "ZCode 编程包配置不完整").with_detail(format!(
                    "provider {id} 的 baseURL 无法解析: {}",
                    entry.options.base_url
                )),
            );
        };
        return Ok(QuotaRequest { url, api_key });
    }

    Err(Diagnostic::new("CRV-503", "ZCode 编程包未配置 API Key")
        .with_detail("启用的 coding-plan provider 均未携带 apiKey"))
}

fn quota_url_from_base_url(base_url: &str) -> Option<String> {
    let base_url = base_url.trim();
    let (scheme, rest) = base_url.split_once("://")?;
    let authority = rest.split(['/', '?', '#']).next()?;
    if scheme.is_empty() || authority.is_empty() {
        return None;
    }
    Some(format!("{scheme}://{authority}{QUOTA_PATH}"))
}

async fn fetch_quota_body(request: &QuotaRequest) -> Result<String, Diagnostic> {
    let network_failure =
        || Diagnostic::new("CRV-504", "ZCode 配额服务不可达").with_detail("curl 无法访问配额端点");

    let mut command = Command::new("curl.exe");
    command.args([
        "--silent",
        "--show-error",
        "--output",
        "-",
        "--write-out",
        "\n%{http_code}",
        "--connect-timeout",
        "5",
        "--max-time",
        "10",
        "--retry",
        "0",
        "--config",
        "-",
    ]);
    command.arg(&request.url);
    command
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null());
    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let mut child = command
        .spawn()
        .map_err(|error| network_failure().with_detail(error.to_string()))?;
    // Authorization 头经 stdin 配置传入，key 不进入进程命令行
    let stdin_config = format!("header = \"Authorization: {}\"\n", request.api_key);
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(stdin_config.as_bytes()).await;
        drop(stdin);
    }
    let output = timeout(COMMAND_TIMEOUT, child.wait_with_output())
        .await
        .map_err(|_| network_failure().with_detail("请求超时"))?
        .map_err(|error| network_failure().with_detail(error.to_string()))?;

    let text = String::from_utf8_lossy(&output.stdout);
    let (body, status_line) = text
        .rsplit_once('\n')
        .ok_or_else(|| network_failure().with_detail("curl 未返回 HTTP 状态行"))?;
    let status: u16 = status_line
        .trim()
        .parse()
        .map_err(|_| network_failure().with_detail(format!("无法解析 HTTP 状态: {status_line}")))?;
    if status != 200 {
        let detail: String = body.trim().chars().take(200).collect();
        return Err(Diagnostic::new("CRV-505", "ZCode 配额服务返回异常状态")
            .with_detail(format!("HTTP {status}: {detail}")));
    }
    Ok(body.to_owned())
}

fn parse_quota_payload(raw: &str) -> Result<ZCodeQuotaSnapshot, Diagnostic> {
    let payload: QuotaResponse = serde_json::from_str(raw).map_err(|error| {
        Diagnostic::new("CRV-506", "ZCode 配额响应无法解析").with_detail(error.to_string())
    })?;
    if payload.success != Some(true) && payload.code != Some(200) {
        let message = payload
            .msg
            .unwrap_or_else(|| "配额服务未返回成功状态".to_owned());
        return Err(Diagnostic::new("CRV-507", "ZCode 配额查询失败").with_detail(message));
    }
    let data = payload
        .data
        .ok_or_else(|| Diagnostic::new("CRV-506", "ZCode 配额响应缺少 data"))?;

    let mut limits = data
        .limits
        .into_iter()
        .filter(|limit| limit.kind == "CREDIT_LIMIT")
        .collect::<Vec<_>>();
    if limits.is_empty() {
        return Err(Diagnostic::new("CRV-508", "ZCode 配额窗口数据缺失")
            .with_detail("响应中没有 CREDIT_LIMIT 窗口"));
    }
    limits.sort_by_key(|limit| limit.next_reset_time.unwrap_or(0));

    let five_hour = to_window(limits.first().expect("limits is not empty"))?;
    let weekly = if limits.len() > 1 {
        Some(to_window(limits.last().expect("limits is not empty"))?)
    } else {
        None
    };

    Ok(ZCodeQuotaSnapshot {
        source_state: SourceState::Healthy,
        five_hour: Some(five_hour),
        weekly,
        plan_level: data
            .level
            .map(|level| level.trim().to_owned())
            .filter(|level| !level.is_empty()),
        observed_at_ms: now_ms(),
    })
}

fn to_window(limit: &QuotaLimit) -> Result<ZCodeQuotaWindow, Diagnostic> {
    let invalid =
        |detail: &str| Diagnostic::new("CRV-508", "ZCode 配额窗口数据异常").with_detail(detail);
    let Some(percentage) = limit.percentage else {
        return Err(invalid("配额窗口缺少 percentage"));
    };
    if !percentage.is_finite() || !(0.0..=100.0).contains(&percentage) {
        return Err(invalid("percentage 超出 0-100 范围"));
    }
    Ok(ZCodeQuotaWindow {
        used_percent: percentage,
        remaining_percent: 100.0 - percentage,
        window_duration_mins: window_duration_mins(limit.unit, limit.number),
        resets_at: limit.next_reset_time.unwrap_or(0) / 1000,
        quota_total: limit.usage.unwrap_or(0),
        quota_used: limit.current_value.unwrap_or(0),
        quota_remaining: limit.remaining.unwrap_or(0),
    })
}

fn window_duration_mins(unit: Option<u64>, number: Option<u64>) -> u64 {
    match (unit, number) {
        (Some(3), Some(5)) => 300,
        (Some(6), Some(1)) => 10_080,
        _ => 0,
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn repo_fixture_path() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("fixtures")
            .join("zcode-quota-fixture.json")
    }

    fn fixture_raw() -> String {
        fs::read_to_string(repo_fixture_path()).expect("read zcode quota fixture")
    }

    #[test]
    fn parses_fixture_dual_windows_and_classifies_by_reset_time() {
        let snapshot = parse_quota_payload(&fixture_raw()).expect("parse fixture payload");

        let five_hour = snapshot.five_hour.expect("five hour window");
        assert!((five_hour.used_percent - 24.0).abs() < f64::EPSILON);
        assert!((five_hour.remaining_percent - 76.0).abs() < f64::EPSILON);
        assert_eq!(five_hour.window_duration_mins, 300);
        assert_eq!(five_hour.resets_at, 1_787_810_092);
        assert_eq!(five_hour.quota_total, 2000);
        assert_eq!(five_hour.quota_used, 480);
        assert_eq!(five_hour.quota_remaining, 1520);

        let weekly = snapshot.weekly.expect("weekly window");
        assert!((weekly.used_percent - 58.0).abs() < f64::EPSILON);
        assert_eq!(weekly.window_duration_mins, 10_080);
        assert_eq!(weekly.resets_at, 1_788_395_128);

        assert_eq!(snapshot.plan_level.as_deref(), Some("pro"));
        assert!(snapshot.observed_at_ms > 0);
    }

    #[test]
    fn single_window_falls_into_five_hour_slot() {
        let raw = r#"{"code":200,"success":true,"data":{"limits":[{"type":"CREDIT_LIMIT","unit":3,"number":5,"usage":120,"currentValue":30,"remaining":90,"percentage":25,"nextResetTime":1787810092514}],"level":"lite"}}"#;
        let snapshot = parse_quota_payload(raw).expect("parse single window");
        assert!(snapshot.five_hour.is_some());
        assert!(snapshot.weekly.is_none());
        assert_eq!(snapshot.plan_level.as_deref(), Some("lite"));
    }

    #[test]
    fn non_success_payload_maps_to_CRV_507_with_message() {
        let raw = r#"{"code":500,"msg":"user has no coding plan","success":false}"#;
        let error = parse_quota_payload(raw).expect_err("expect failure");
        assert_eq!(error.code, "CRV-507");
        assert!(error.detail.expect("detail").contains("no coding plan"));
    }

    #[test]
    fn malformed_json_maps_to_CRV_506() {
        let error = parse_quota_payload("not json").expect_err("expect failure");
        assert_eq!(error.code, "CRV-506");
    }

    #[test]
    fn missing_data_maps_to_CRV_506() {
        let raw = r#"{"code":200,"success":true}"#;
        let error = parse_quota_payload(raw).expect_err("expect failure");
        assert_eq!(error.code, "CRV-506");
    }

    #[test]
    fn out_of_range_percentage_maps_to_CRV_508() {
        let raw = r#"{"code":200,"success":true,"data":{"limits":[{"type":"CREDIT_LIMIT","percentage":140,"nextResetTime":1787810092514}]}}"#;
        let error = parse_quota_payload(raw).expect_err("expect failure");
        assert_eq!(error.code, "CRV-508");
    }

    #[test]
    fn missing_credit_limits_maps_to_CRV_508() {
        let raw = r#"{"code":200,"success":true,"data":{"limits":[]}}"#;
        let error = parse_quota_payload(raw).expect_err("expect failure");
        assert_eq!(error.code, "CRV-508");
    }

    #[test]
    fn quota_url_derives_from_provider_base_url_origin() {
        assert_eq!(
            quota_url_from_base_url("https://open.bigmodel.cn/api/anthropic").as_deref(),
            Some("https://open.bigmodel.cn/api/monitor/usage/quota/limit")
        );
        assert_eq!(
            quota_url_from_base_url("https://api.z.ai/api/anthropic").as_deref(),
            Some("https://api.z.ai/api/monitor/usage/quota/limit")
        );
        assert_eq!(
            quota_url_from_base_url("https://host.example:8443/base/path").as_deref(),
            Some("https://host.example:8443/api/monitor/usage/quota/limit")
        );
        assert_eq!(quota_url_from_base_url("not a url"), None);
        assert_eq!(quota_url_from_base_url(""), None);
    }

    fn lookup_from<'a>(map: &'a [(&'a str, &'a str)]) -> impl Fn(&str) -> Option<String> + 'a {
        move |name| {
            map.iter()
                .find(|(key, _)| *key == name)
                .map(|(_, value)| (*value).to_owned())
        }
    }

    #[test]
    fn resolve_quota_request_prefers_environment_overrides() {
        let lookup = lookup_from(&[
            ("ZCODE_BIGMODEL_USAGE_API_KEY", "test-key"),
            ("BIGMODEL_USAGE_QUOTA_URL", "https://example.test/quota"),
        ]);
        let request = resolve_quota_request(&lookup).expect("resolve from env");
        assert_eq!(request.api_key, "test-key");
        assert_eq!(request.url, "https://example.test/quota");
    }

    #[test]
    fn resolve_quota_request_reports_missing_config() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let missing_dir = std::env::temp_dir()
            .join(format!("crv-zcode-missing-{unique}"))
            .to_string_lossy()
            .into_owned();
        let entries = [("CODEX_CREDITS_ZCODE_CONFIG_DIR", missing_dir.as_str())];
        let lookup = lookup_from(&entries);
        let error = resolve_quota_request(&lookup).expect_err("expect failure");
        assert_eq!(error.code, "CRV-501");
    }

    #[test]
    fn resolve_quota_request_rejects_keys_unsafe_for_curl_config() {
        let lookup = lookup_from(&[
            ("ZCODE_BIGMODEL_USAGE_API_KEY", "bad\"key"),
            ("BIGMODEL_USAGE_QUOTA_URL", "https://example.test/quota"),
        ]);
        let error = resolve_quota_request(&lookup).expect_err("expect failure");
        assert_eq!(error.code, "CRV-503");
    }

    fn write_temp_config(content: &serde_json::Value) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("crv-zcode-config-{unique}"));
        fs::create_dir_all(&dir).expect("config dir");
        fs::write(
            dir.join("config.json"),
            serde_json::to_string_pretty(content).expect("config json"),
        )
        .expect("write config");
        dir
    }

    fn coding_plan_config(enabled: bool, api_key: &str) -> serde_json::Value {
        serde_json::json!({
            "provider": {
                "builtin:bigmodel-coding-plan": {
                    "name": "BigModel - Coding Plan",
                    "kind": "anthropic",
                    "options": {
                        "apiKey": api_key,
                        "baseURL": "https://open.bigmodel.cn/api/anthropic"
                    },
                    "enabled": enabled
                },
                "builtin:bigmodel-start-plan": {
                    "kind": "anthropic",
                    "options": {"apiKey": "jwt-token", "baseURL": "https://zcode.z.ai/api/v1/zcode-plan/anthropic"},
                    "enabled": false,
                    "systemDisabledReason": "coding_plan_not_entitled"
                }
            }
        })
    }

    #[test]
    fn resolve_quota_request_reads_enabled_coding_plan_from_config() {
        let dir = write_temp_config(&coding_plan_config(true, "config-key"));
        let lookup = |name: &str| {
            (name == "CODEX_CREDITS_ZCODE_CONFIG_DIR").then(|| dir.to_string_lossy().into_owned())
        };
        let request = resolve_quota_request(&lookup).expect("resolve from config");
        assert_eq!(request.api_key, "config-key");
        assert_eq!(
            request.url,
            "https://open.bigmodel.cn/api/monitor/usage/quota/limit"
        );
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn resolve_quota_request_reports_no_enabled_coding_plan() {
        let dir = write_temp_config(&coding_plan_config(false, "config-key"));
        let lookup = |name: &str| {
            (name == "CODEX_CREDITS_ZCODE_CONFIG_DIR").then(|| dir.to_string_lossy().into_owned())
        };
        let error = resolve_quota_request(&lookup).expect_err("expect failure");
        assert_eq!(error.code, "CRV-502");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn resolve_quota_request_reports_missing_key() {
        let dir = write_temp_config(&coding_plan_config(true, ""));
        let lookup = |name: &str| {
            (name == "CODEX_CREDITS_ZCODE_CONFIG_DIR").then(|| dir.to_string_lossy().into_owned())
        };
        let error = resolve_quota_request(&lookup).expect_err("expect failure");
        assert_eq!(error.code, "CRV-503");
        let _ = fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn fixture_file_completes_the_read_snapshot_journey() {
        let service = ZCodeQuotaService::from_fixture_path(repo_fixture_path());
        let snapshot = service.read_snapshot().await.expect("fixture snapshot");
        assert!(snapshot.five_hour.is_some());
        assert!(snapshot.weekly.is_some());
        assert_eq!(snapshot.plan_level.as_deref(), Some("pro"));
    }
}
