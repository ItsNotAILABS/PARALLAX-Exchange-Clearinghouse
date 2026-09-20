# PARALLAX × Monad — one focus

Shift: keep the PARALLAX organism (ICP Motoko, 873ms heartbeat, ADRE) as cognition.
Add a **Monad EVM rail** for settlement, wallets, and Metropolis hackathon work.

## Facts
- Hackathon: [Metropolis](https://hackathon.monad.xyz/resources) · 1 Sep–13 Oct · $250k+ · intake open
- Monad **mainnet chain id 143** · **testnet 10143**
- PARALLAX today: ICP canisters in `src/backend/`, React in `src/frontend/`, ETH already sketched in `src/backend/world/eth_integration.mo`

## Split (do not rewrite ICP)
| Layer | Where |
| --- | --- |
| Intelligence, heartbeat, clearing logic | ICP Motoko (existing) |
| EVM settlement, swaps, receipts agents can send | Monad (new `contracts/` Foundry + wagmi) |
| Agent wallet / deploy | monskills `wallet/` + Safe |
| Frontend | existing React; add Monad via wagmi `useSendTransactionSync` |

## Next
1. Scaffold `contracts/` Foundry on **testnet 10143** (OpenZeppelin, not a new matching engine).
2. Wire `eth_integration.mo` / python SDK to Monad RPC — receipts, not a second organism.
3. Register this repo as the Pocket crew project (Grok + Codex seats).

Hackathon login: GitHub / Google / Discord are **separate accounts**.
