# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri 2 desktop shell for Windows 11 x64, with a Rust backend and a React/TypeScript interface. The first distributable target is a portable executable.

## Users

The primary and only confirmed user is the project owner, using Codex on a personal Windows 11 workstation during active coding sessions.

## Product Purpose

Provide an always-available, glanceable view of the user's current Codex capacity without requiring them to open Codex status views or a browser dashboard. Success means the user can manually launch the utility and immediately understand whether there is enough capacity to begin or continue a task, when each quota window resets, and how many earned full resets remain.

## Positioning

This is a focused, personal Codex companion rather than a multi-provider usage dashboard. It reads the same account-limit surface exposed by the local Codex app-server and presents only the information needed during a Windows coding session.

## Operating Context

- The user manually launches the app when needed; it must not start with Windows.
- The compact floating window is draggable and always on top.
- Left click expands details; right click opens settings.
- Mouse click-through can be toggled.
- Codex Desktop or Codex CLI is already installed and authenticated for the same Windows user.

## Capabilities and Constraints

- Show the five-hour and weekly Codex quota windows.
- Give the five-hour and weekly Quota Windows equal top-level visual priority.
- Show remaining percentage, reset countdown, and absolute reset time for each available window.
- Show the number of available earned full-reset credits and the nearest known expiry time.
- The first release is read-only and must not consume a reset credit.
- Read quota data through a separately launched, read-only `codex app-server` JSON-RPC session. Do not inspect process memory, intercept the desktop app's private stdio transport, scrape browser cookies, or store provider credentials.
- Handle missing Codex, logged-out state, unavailable rate-limit fields, stale data, timeouts, and temporary disconnection with actionable diagnostics.
- Initial delivery is a Windows 11 x64 portable executable. An installer is deferred.

## Brand Commitments

The interface must use a liquid-glass material language while remaining quiet enough to sit above a coding workspace. The glass effect must preserve legibility and state clarity rather than becoming a neon gaming HUD or a generic stack of translucent cards. The project follows a comp-led workflow: saved design drawings must be approved before implementation and later serve as the visual acceptance reference. No product name, logo, palette, or typography has been confirmed yet.

## Evidence on Hand

- The running Microsoft Store Codex installation was observed launching `codex.exe` in `app-server` mode under the desktop process.
- OpenAI's public app-server protocol documents the required rate-limit and reset-credit fields.
- Existing open-source Windows companions demonstrate viable tray, floating-window, caching, and error-handling patterns.
- No user-provided logo, imagery, copy deck, or other brand asset exists. Future work must not fabricate endorsements or affiliation with OpenAI.

## Product Principles

- Glance first: the most important remaining-capacity signal must be readable without opening details.
- Read-only trust: monitoring must never consume credits, alter Codex state, or collect credentials.
- Honest freshness: stale, missing, or conflicting upstream data must be labeled rather than presented as current truth.
- Quiet presence: stay available above work without stealing focus or creating visual noise.
- Narrow scope: complete the Codex-only core journey before adding packaging, history, analytics, or other providers.
