#[tauri::command]
pub async fn relaunch_app(app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        // On macOS, `app.restart()` spawns the executable directly as a child
        // process, which can be killed when the parent exits after an update
        // replaces the .app bundle. Using `open -n` goes through LaunchServices,
        // which reliably starts an independent process.
        if let Ok(exe) = std::env::current_exe() {
            if let Some(bundle) = exe.parent().and_then(|p| p.parent()).and_then(|p| p.parent()) {
                let _ = std::process::Command::new("open")
                    .arg("-n")
                    .arg(bundle)
                    .spawn();
            }
        }
        app.exit(0);
    }

    #[cfg(not(target_os = "macos"))]
    {
        app.restart();
    }
}
