# Validation: 0.1.0-alpha.1

Recorded 2026-09-07. This is a source-only experimental prerelease, not a native-certified or production release.

## Passed

- UE-MCP 1.3.7 manifest/native-module contract check.
- 34 offline Node tests: browser control policy, synthetic library responses, and package/native-source contracts.
- Package file-list review: no engine binaries, account inventories, credentials, game assets, or validation-project outputs.
- Git whitespace check.

The fixtures are synthetic and make no requests to Fab. Source-pattern assertions are not substitutes for executing the C++ implementation.

## Native build blocked

An isolated Win64 Development Editor validation project was prepared for an existing UE 5.8.2 source checkout. No running editor was closed and no existing game project was changed.

UnrealBuildTool's `-NoEngineChanges` gate refused the build because its dependency graph would modify existing shared engine artifacts, including NetCore and module manifests. The gate remained enabled. A precompiled-engine attempt did not remove those engine changes. The engine was not rebuilt for this release.

Consequently, native plugin compilation, linking, module loading, and `UE.MCP.FabEditor.LibraryContract` automation have **not passed**. The presence of a `.uplugin`, generated build graph, or passing Node tests does not establish any of those results.

## Release boundaries

- Online functionality remains disabled by default. No live Fab authentication, library, download, or import test was performed for this standalone release.
- No claim of Epic authorization, terms compliance, independent entitlement verification, or malicious-page containment is made.
- Validate the native build and offline native automation in a suitable isolated UE 5.8 environment before operational use. Live tests additionally require establishing the necessary permission for the intended use.
