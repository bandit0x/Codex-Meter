# Third-party notices

## Impeccable

This repository contains an Impeccable design-skill snapshot used only during
development. Impeccable is Copyright (c) Paul Bakaus and is licensed under the
Apache License 2.0. Its upstream `NOTICE.md` also attributes platform reference
material derived from ehmo's `platform-design-skills`, licensed under MIT.

- Source: <https://github.com/pbakaus/impeccable>
- License: <https://github.com/pbakaus/impeccable/blob/main/LICENSE>
- Notice: <https://github.com/pbakaus/impeccable/blob/main/NOTICE.md>

## OpenAI Codex CLI

This project uses the official `@openai/codex` Windows x64 runtime as a local,
read-only `app-server` process. The dependency is pinned in `package.json` and
is licensed under the Apache License 2.0.

- Source: <https://github.com/openai/codex>
- Package: <https://www.npmjs.com/package/@openai/codex>
- License: <https://github.com/openai/codex/blob/main/LICENSE>

## Microsoft Edge WebView2 Fixed Version Runtime

The portable directory includes the Microsoft Edge WebView2 Fixed Version
Runtime downloaded from Microsoft's official distribution service. The runtime
is redistributed under the Microsoft Edge WebView2 Runtime license terms and
retains the license files shipped in Microsoft's runtime package.

- Distribution guidance: <https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution>
- Download: <https://developer.microsoft.com/microsoft-edge/webview2/#download-section>

No project source, credentials, logs, or build artifacts are uploaded by this
integration. Authentication remains owned by Codex in the current Windows
user profile.

## Canvas UI GlassVanilla

The optical shell shader adapts rounded-SDF, Fresnel-Schlick, chromatic
dispersion and GGX ideas from Canvas UI's `GlassVanilla` component.
Copyright (c) 2026 David Haz. Licensed under the MIT License with Commons
Clause; it is used only as part of this application and is not redistributed
as a standalone component.

- Source: <https://github.com/DavidHDev/canvas-ui>
- License: <https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md>

## WebGL Fluid Simulation

The reservoir volume shader adapts the fluid-motion concepts of backward
advection, curl/vorticity and density-gradient lighting from Pavel Dobryakov's
WebGL Fluid Simulation. The implementation in this project is a bounded,
procedural single-pass field designed for the two quota reservoirs rather than
a copy of the reference project's framebuffer solver.
Copyright (c) 2017 Pavel Dobryakov. Licensed under the MIT License.

- Source: <https://github.com/PavelDoGreat/WebGL-Fluid-Simulation>
- License: <https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/LICENSE>
