mod capacity;
mod preferences;

use capacity::{CapacityService, CapacitySnapshot, Diagnostic};
use preferences::{restore_window_position, DisplayPreferences, PreferencesStore};
use tauri::{Manager, State, WebviewWindow, WindowEvent};

#[cfg(target_os = "windows")]
const FIXED_WEBVIEW2_DIRECTORY: &str = "webview2-runtime";

#[cfg(target_os = "windows")]
fn bundled_webview2_runtime(executable: &std::path::Path) -> Option<std::path::PathBuf> {
    let runtime = executable.parent()?.join(FIXED_WEBVIEW2_DIRECTORY);
    let executable_exists = runtime.join("msedgewebview2.exe").is_file();
    let engine_exists = runtime.join("msedge.dll").is_file();
    (executable_exists && engine_exists).then_some(runtime)
}

#[cfg(target_os = "windows")]
fn configure_bundled_webview2_runtime() {
    if std::env::var_os("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER").is_some() {
        return;
    }
    let Ok(executable) = std::env::current_exe() else {
        return;
    };
    if let Some(runtime) = bundled_webview2_runtime(&executable) {
        std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", runtime);
    }
}

#[tauri::command]
async fn read_capacity_snapshot(
    service: State<'_, CapacityService>,
) -> Result<CapacitySnapshot, Diagnostic> {
    service.read_snapshot().await
}

#[tauri::command]
fn load_display_preferences(store: State<'_, PreferencesStore>) -> DisplayPreferences {
    store.load()
}

#[tauri::command]
fn save_display_preferences(
    store: State<'_, PreferencesStore>,
    mut preferences: DisplayPreferences,
) -> Result<(), Diagnostic> {
    let current = store.load();
    preferences.x = current.x;
    preferences.y = current.y;
    store.save(preferences)
}

#[tauri::command]
async fn enable_temporary_click_through(
    window: WebviewWindow,
    duration_ms: u64,
) -> Result<(), Diagnostic> {
    if !(1_000..=30_000).contains(&duration_ms) {
        return Err(Diagnostic::new(
            "CRV-305",
            "鼠标穿透时长必须在 1 到 30 秒之间",
        ));
    }

    window.set_ignore_cursor_events(true).map_err(|error| {
        Diagnostic::new("CRV-306", "无法启用鼠标穿透").with_detail(error.to_string())
    })?;
    let recovery_window = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(duration_ms)).await;
        let _ = recovery_window.set_ignore_cursor_events(false);
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    configure_bundled_webview2_runtime();

    tauri::Builder::default()
        .manage(CapacityService::from_environment())
        .setup(|app| {
            let store = PreferencesStore::new(app.handle());
            if let Some(window) = app.get_webview_window("main") {
                restore_window_position(&window, &store);
            }
            app.manage(store);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Moved(position) = event {
                let _ = window
                    .state::<PreferencesStore>()
                    .update_position(*position);
            }
        })
        .invoke_handler(tauri::generate_handler![
            read_capacity_snapshot,
            load_display_preferences,
            save_display_preferences,
            enable_temporary_click_through
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Codex Capacity");
}

#[cfg(all(test, target_os = "windows"))]
mod webview2_tests {
    use super::*;
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn finds_only_a_complete_runtime_next_to_the_portable_executable() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let root = std::env::temp_dir().join(format!("crv-webview2-{unique}"));
        let executable = root.join("Codex Capacity.exe");
        let runtime = root.join(FIXED_WEBVIEW2_DIRECTORY);
        fs::create_dir_all(&runtime).expect("runtime directory");
        fs::write(&executable, []).expect("portable executable fixture");

        assert_eq!(bundled_webview2_runtime(&executable), None);
        fs::write(runtime.join("msedgewebview2.exe"), []).expect("runtime executable fixture");
        assert_eq!(bundled_webview2_runtime(&executable), None);
        fs::write(runtime.join("msedge.dll"), []).expect("runtime engine fixture");
        assert_eq!(bundled_webview2_runtime(&executable), Some(runtime));

        fs::remove_dir_all(root).expect("remove fixture");
    }
}
