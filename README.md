# Fab Editor for UE-MCP

An independent, opt-in experimental native plugin for interacting with Fab's Unreal Editor webview. Extracted from [ue-mcp PR #1033](https://github.com/db-lyon/ue-mcp/pull/1033), source revision `dac270ba2950fc9194d824f3991c390aadb93d89`.

**Release status: source-only alpha; native compilation and native/live integration tests are not yet validated.** See [VALIDATION.md](VALIDATION.md) for the results and build blocker. Do not treat this as production-ready.

**This is not an Epic-supported integration or a statement of compliance with Fab's terms.** Moving the integration out of the bridge does not authorize its use. Its online functionality still relies on undocumented Fab interfaces. Review [Fab's terms](https://www.fab.com/terms-of-service), obtain any required Epic authorization, and read [SECURITY.md](SECURITY.md) before enabling it.

## Packaging and requirements

- Standalone Unreal module: `ue/Plugins/FabEditor`.
- Uses only UE-MCP's public external-handler registration interface; no edits to the bridge module or Epic Fab source.
- UE-MCP **1.3.7 or later**. The pinned release's mutation guards fail closed for unknown method verbs; older affected releases are not supported.
- Bridge handler ABI 1, Unreal Engine 5.8, and the Fab plugin.
- Source-only alpha. A native project build is required after installation. Offline JavaScript/manifest checks do not prove native compilation or live Fab compatibility.

The npm package owns category `fab_editor`, dispatching native handler `fab_editor_request`. The action name is intentionally distinct from the old PR's `fab_editor` bridge method. Remove an old optional companion that already claims the `fab_editor` category before installing this one. Do not overwrite a modified bridge to install this plugin.

## Installation

Download the package tarball from [GitHub Releases](https://github.com/vaughn1990/ue-mcp-fab-editor/releases). From the intended Unreal project, use UE-MCP's normal plugin installer with that local tarball:

```text
ue-mcp plugin install /absolute/path/to/ue-mcp-fab-editor-0.1.0-alpha.1.tgz
```

Installing a native plugin changes that project's plugin files and requires rebuilding its Editor target. Close the matching editor and use the project's approved build entry point. Do not install into a project another task is modifying.

The GitHub tarball does not require an npm account. Do not assume this version is available in the npm registry unless it is explicitly listed there.

Online access is **disabled by default**, including authentication inspection. After independently establishing permission for your use, enable it in the project's `Config/DefaultEditorPerProjectUserSettings.ini`:

```ini
[FabEditor]
bEnableExperimentalWebAccess=True
```

This setting is an operator opt-in, **not permission from Epic**. The package does not enable it automatically.

## Tool usage

```text
fab_editor(action="fab_editor_request", operation="status")
fab_editor(action="fab_editor_request", operation="open")
fab_editor(action="fab_editor_request", operation="refresh_library", browserId=0)
fab_editor(action="fab_editor_request", operation="operation_status", operationId="...")
fab_editor(action="fab_editor_request", operation="search_library", query="medieval")
```

Operations: `status`, `open`, `refresh_library`, `search_library`, `get_owned_asset`, `inspect`, `activate`, `set_search`, `select_option`, `download`, `get_imported_assets`, `operation_status`, `cancel_operation`.

The historical `get_owned_asset` operation name remains, but its result is a **browser-reported acquired listing**, not an independently verified entitlement. Results contain `reportedOwned: true`, `ownershipVerified: false`, and `ownershipSource: fab_webview_report`; they do not emit the old `owned: true` assertion. Delivery classification is reported as `deliveryModeKnown`, not verified ownership.

For an interaction, obtain a fresh `snapshotId` and `elementId` from `inspect`. Native code owns snapshot state, checks its browser/URL and lifetime, and consumes it once. A changed or stale control requires another inspection.

Download additionally requires the exact listing `assetId`, explicit user authorization via `confirmDownload: true`, and `acknowledgeBrowserReportedOwnership: true`. This does not bypass Epic's entitlement enforcement. Purchases, claiming new products, code-plugin installation and complete-project creation are not provided.

**Submission is not completion.** Poll the returned operation, then verify actual files/imported assets separately. The legacy Fab folder mapping may be unavailable or incomplete; an empty mapping alone does not prove a transfer failed. Never automatically retry an uncertain mutation.

## What the experimental reader does

The library reader constructs its own same-origin authenticated requests using the webview session. It is not merely observing requests made by Fab's UI. Native code uses an undocumented reflected Fab token getter for an account-identity consistency check; it does not return the token to callers. These mechanisms retain the contractual concern described above.

Metadata comes from an untrusted page context. NoAI/other content-license restrictions are separate from service-access permission. This plugin grants no license to scrape, train models on, redistribute or otherwise use third-party content.

## Changes from the original PR

- Separate native module and `nativeModule` manifest; no JavaScript task shim or bridge-core patch.
- Experimental web access disabled by default.
- Native-held, single-use snapshots; operation IDs, snapshot IDs and reply nonces are distinct.
- Reply object identity and current Fab origin checked before accepting responses.
- No resource-timing endpoint/query telemetry.
- Bare `+` is not a download target; unlabeled controls cannot be activated.
- Browser claims are explicitly unverified; no cryptographic/page-compromise guarantee.
- New external method is covered by the supported host's mutation guard classification. File-specific checkout guards still cannot infer every path a Fab download may touch; use guards scoped to `all` or `mutations` when gating these operations.

## Development

```text
npm ci --ignore-scripts
npm run check
npm test
npm pack
```

Tests use synthetic page/account fixtures and make no live Fab requests. Never include account inventories, tokens, browser cache, downloaded assets, game-project files or build outputs in the package. Native compilation, native automation and live integration must be reported separately from these offline checks.

## License

MIT for this integration code; see LICENSE. Epic/Unreal/Fab and third-party content are not licensed by this package. Not affiliated with or endorsed by Epic Games or the UE-MCP maintainer.
