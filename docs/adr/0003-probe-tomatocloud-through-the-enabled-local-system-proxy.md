# Probe TomatoCloud through the enabled local system proxy

Treat TomatoCloud as connected only when its required desktop and data-plane processes are running, Windows has an enabled loopback system proxy, and a real HTTPS request succeeds through that proxy. The probe reads the country of the routed public IP from `api.country.is`; it falls back to Google's `generate_204` endpoint when country lookup is unavailable. The healthy cadence is five seconds and the blocked cadence is one second after the previous attempt completes.

Do not inspect TomatoCloud private IPC, configuration, logs, memory, or credentials. This is less dependent on undocumented TomatoCloud internals, and it detects the important failure mode where every executable is running but the actual route is blocked. The trade-off is that an upstream probe endpoint may occasionally fail; the fallback limits this risk, and the UI retains the last known country only when a healthy fallback lacks a fresh one.
