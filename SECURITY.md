# Security and release limitations

## Trust model

Fab webview data is untrusted. A script running in that page can alter DOM content and browser-reported library data. This integration must not be an entitlement authority or a mechanism for purchasing content.

The reply nonce is distinct from public operation and snapshot IDs and is not deliberately stored in a page-global snapshot or cancellation-map key. Native code checks the originating reply object, nonce, origin and operation lifetime. These are correlation/replay protections, **not a page-invisible authentication channel**: the injected code still runs in the page realm, where hostile script can potentially intercept callbacks. No claim of resistance to a compromised Fab page is made. An approved native/backend entitlement API would be needed for independent ownership verification.

Native snapshots are retained outside page-writable globals and are single-use. This prevents the old direct global-snapshot rewrite path; it does not make arbitrary page event handlers trustworthy. Response data is marked `ownershipVerified: false`.

## Default safeguards

- No online authentication inspection or requests until the operator explicitly enables experimental access in project settings.
- No token returned or logged by the integration. Custom-token mode is rejected before invoking Fab's getter because that mode may log credentials internally.
- HTTPS Fab origin restriction, native/frontend identity consistency checks, bounded responses, cursor-loop checks and no public-catalog fallback.
- Purchase/acquisition/account-action deny rules; downloads require separate confirmation and acknowledgement of browser-reported ownership.
- No complete-project or code-plugin delivery through the existing-project download path.
- UE-MCP >=1.3.7 required. All calls through the plugin's unknown native method verb enter mutation-scoped guards; this is deliberately conservative, including reads.

## Not established by offline tests

Native compilation, live integration behavior, malicious-page containment, Epic authorization, license compliance, trustworthy ownership, transfer completion and asset quality are not established by Node tests or a valid manifest. This package cannot cure these by changing its distribution format.

## Reporting

Do not place credentials, session tokens, account inventories or private asset data in public issues. Report a minimal synthetic reproduction. If the package has no private reporting channel at publication time, contact its publisher before sharing sensitive evidence.
