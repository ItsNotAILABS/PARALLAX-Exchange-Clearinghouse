# PARALLAX Commercial Grade Sync

This document is the current commercial-readiness spine for `PARALLAX-Exchange-Clearinghouse`.

## Status

PARALLAX is now a commercial-alpha system: a paper/testnet financial operating platform with governed trading workflows, receipts, proof rooms, multi-repo federation, model-training manifests, native C/C++ policy surfaces, Latin trading agents, Cloudflare/private-cloud runway, and validation gates.

It is not a live financial institution, broker, custodian, regulated exchange, or audited fund.

## Synchronized surfaces

| Plane | Current synchronized surfaces |
|---|---|
| Product | universal trading terminal, action console, launch surface, paper route preview |
| Execution | AI wallet policy, human approval threshold, Latin agents, paper order lifecycle |
| Proof | receipt chain, proof room, model-training receipt, commercial validation receipt |
| Federation | registered feeder repos, feeder manifests, promotion gates, private trunk boundary |
| Model | feeder classifier, risk gatekeeper, execution router, receipt writer, seed examples |
| Deployment | Cloudflare edge, tunnel runway, private sovereign clouds, private blockchain clouds |
| Native | C/C++ AI wallet interface, native tests, Latin agent TypeScript engine |
| Governance | paper/testnet-first posture, operator halt, public-claim boundary, follow-up registry |

## Commercial standard

A release is commercial-grade only when the following gates are green:

```bash
pnpm commercial:validate
pnpm alpha:models
pnpm alpha:product
pnpm alpha:launch
```

The commercial gate checks the registry in `config/commercial/parallax.commercial-grade.json` and emits `dist/commercial/commercial-validation-receipt.json`.

## Hard boundaries

These remain blocked until separate legal, security, compliance, custody, broker, liquidity, and external-audit gates exist:

- live money movement,
- live broker execution,
- private-key custody,
- regulated exchange activity,
- public mainnet bridge,
- guaranteed performance claims,
- external audit claims not backed by evidence.

## Open sync item

PR #34, the older three-agent orchestration layer, remains open and should be reviewed against the newer federation, model-training, and Latin-agent architecture. Do not merge it blindly because the trunk has moved forward.

## Commercial next release path

1. Run the commercial gate locally or in CI.
2. Confirm PR #34 is either closed as superseded or rebased into the current architecture.
3. Connect the Latin agent workflow to the Control Tower UI.
4. Make the proof room show commercial validation receipts.
5. Bind SNS token governance records into PARALLAX feeder ingestion.
6. Add a release tag only after all alpha gates pass.
