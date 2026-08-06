# PARALLAX Exchange Ecosystem Release Harness

This harness turns `ItsNotAILABS/PARALLAX-Exchange-Clearinghouse` into a production release feeder for the NOVA model-family root.

## Purpose

PARALLAX Exchange/Clearinghouse feeds market-registry, clearing, netting, receipt, and audit evidence into the NOVA ecosystem. This repository should never be represented as a live regulated exchange merely because release documentation exists.

## Release package

Current package:

- `docs/release-harness/release-packages/v1.0.0/RELEASE.md`
- `docs/release-harness/release-packages/v1.0.0/release-manifest.json`

## Models

- PARALLAX Clearinghouse Model: market registry, netting, receipts, and proof-first execution boundaries.

## Required evidence

- model card
- market release schema
- feeder schema
- release manifest
- validator script
- GitHub Actions harness

## Promotion gates

Promotion to the main NOVA release registry requires:

1. CI success.
2. Operator approval.
3. Market/legal review before any public exchange, token, settlement, custody, or regulated claim.
4. Evidence receipts for any benchmark/performance statement.

## Boundaries

- no live trading authority
- no custody claim
- no regulated exchange approval claim
- no guaranteed profit claim
- no unsupervised settlement
- no production mainnet execution without approval
