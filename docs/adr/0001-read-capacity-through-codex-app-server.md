# Read capacity through Codex app-server

Use a separately launched, read-only Codex app-server JSON-RPC session to obtain Quota Windows and Full Reset Credits. Do not inspect Codex process memory, intercept the desktop app's private stdio transport, scrape browser cookies, or store Codex credentials. This follows the public protocol and preserves a clean process boundary, at the cost of depending on an installed and authenticated Codex executable.
