# PARALLAX Runtime Authority And Receipt Remediation

## Context

PARALLAX has moved toward a polyglot planning/runtime surface and regulated readiness gates. Before any live broker, settlement, internal-token, Monad, or external runtime lane is exposed beyond paper/testnet mode, authority and receipts need to become enforceable.

## Problems To Fix

- Public Worker surfaces have permissive CORS and no visible authentication boundary.
- Receipts are ephemeral or hash-only rather than signed and durable.
- Short FNV-derived identifiers are insufficient for authority or audit identity.
- Dispatch currently acknowledges accepted governed execution but does not prove the selected runtime executed.
- Readiness attestations are ordinary booleans rather than signed/verifiable claims.
- Settlement remains paper/testnet-first, but gates should enforce that invariant mechanically.

## Acceptance Criteria

- Require authenticated operator/service identity for all non-public routes.
- Replace short IDs with collision-resistant identifiers for tasks, receipts, proposals, and settlement objects.
- Persist signed/HMAC receipt chains for planning, dispatch, runtime execution, settlement proposal, approval, denial, and paper/testnet result.
- Convert readiness booleans into signed attestations or machine-verifiable evidence references.
- Ensure live broker/mainnet/internal-token execution remains denied unless all required signed gates pass.
- Add tests for missing auth, wrong operator, receipt chain validation, unsigned attestation denial, paper/testnet enforcement, live execution denial, and runtime dispatch proof.

## Architecture Invariant

PARALLAX must expose verifiable execution and machine-checkable coordination, not trust-based dispatch acknowledgements.
