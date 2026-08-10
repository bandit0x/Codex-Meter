# Use Tauri, Rust, and React for the Windows shell

Build the Windows 11 x64 utility with a Tauri 2 shell, a Rust backend, and a React/TypeScript interface. This keeps process supervision and Windows integration in Rust while allowing the floating surface to use a flexible component-driven visual system; it accepts WebView2 as a runtime dependency instead of choosing a fully native WinUI implementation.
