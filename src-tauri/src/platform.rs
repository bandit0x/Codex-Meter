/// Executable names that differ per platform.
///
/// Windows bundles `curl.exe`; macOS and Linux ship `curl`. The same split
/// applies to the Codex CLI shipped by the `@openai/codex` npm package and by
/// common installers.
pub(crate) fn curl_executable() -> &'static str {
    if cfg!(windows) {
        "curl.exe"
    } else {
        "curl"
    }
}

pub(crate) fn codex_binary_name() -> &'static str {
    if cfg!(windows) {
        "codex.exe"
    } else {
        "codex"
    }
}
