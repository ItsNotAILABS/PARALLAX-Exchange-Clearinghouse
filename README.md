<div align="center">

# 🌌 PARALLAX Exchange Clearinghouse

### *The AI-First Sovereign Exchange — Zero Gas Fees, Instant Settlement*

[![Built on ICP](https://img.shields.io/badge/Built_on-Internet_Computer-29abe2?style=for-the-badge&logo=dfinity&logoColor=white)](https://internetcomputer.org/)
[![License: Sovereign](https://img.shields.io/badge/License-PARALLAX_Sovereign-red.svg?style=for-the-badge)](LICENSE)
[![Motoko](https://img.shields.io/badge/Language-Motoko-purple?style=for-the-badge)](https://internetcomputer.org/docs/current/motoko/main/motoko)

**Trade everything. Pay nothing. Settle instantly.**

[Explore Docs](#architecture) • [Key Features](#-key-features) • [Get Started](#-getting-started)

---

</div>

## 🚀 What is PARALLAX?

**PARALLAX** is a next-generation **AI-native decentralized exchange** built on the Internet Computer Protocol (ICP). Unlike traditional DEXs, PARALLAX operates as a **sovereign organism** — an autonomous system where intelligence IS the infrastructure.

```
┌────────────────────────────────────────────────────────────────────┐
│                    THE PHANTOM EXCHANGE                            │
│                                                                    │
│   🧠 AI Intelligence Layer → Reasons about every trade            │
│   ⚡ Zero Gas Fees        → Organism pays all costs               │
│   🔄 873ms Settlement     → Heartbeat-driven finality             │
│   🌐 Universal Trading    → Crypto, AI Tokens, Artifacts, RWAs    │
│   🔒 Central Counterparty → Organism-guaranteed settlements       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

### 🎯 **Zero Gas Fees — Forever**
The organism runs on ICP canisters. Canister cycles are paid by the organism's own treasury. Users **never** pay gas. Ever.

### ⚡ **873ms Instant Settlement**
Settlement is not a separate step — it IS the heartbeat. Every **873ms** all trades settle with cryptographic finality. *(Derived from φ⁴ × 1000ms / 7.83Hz Schumann resonance)*

### 🧠 **AI-First Architecture**
Every trade is a cognitive act. The **Phantom Intelligence Engine** reasons about markets continuously:
- Detects arbitrage opportunities across all pairs
- Values AI artifacts using cognitive resonance scoring  
- Predicts price movements using harmonic wave analysis
- Gates operations through Kuramoto coherence (R ≥ 0.618)

### 🏦 **Real-Time Clearinghouse**
Multi-asset netting, cross-chain settlement (ICP ↔ ckBTC ↔ ckETH), organism-guaranteed trades:
- Bilateral and multilateral netting every beat
- Central counterparty guarantee — no counterparty risk
- FinCEN-compatible transaction reporting

### 🪙 **Universal Token Trading**
Trade everything in existence:
| Category | Examples |
|----------|----------|
| **Crypto** | BTC, ETH, ICP, SOL |
| **AI Tokens** | Compute, Inference, Training |
| **AI Artifacts** | Models, Embeddings, Protocols |
| **Creator Tokens** | Personal tokens, Fan tokens |
| **Stablecoins** | USDC, USDT (bridged) |
| **Real World Assets** | Commodities, Real Estate |

### 🏭 **24 Production Engines**
Sovereign financial-economic production engines with Latin names, running 93+ AI model ensembles:
- **Oeconomia.Machina Pretium** — Dynamic pricing engine
- **Arbitrium.Nexus** — Cross-market arbitrage detection
- **Portio.Optima** — Phi-weighted Markowitz allocation
- And 21 more specialized engines...

## 🏗️ Architecture

```
                           ┌─────────────────────┐
                           │    PARALLAX Core    │
                           │     (main.mo)       │
                           └──────────┬──────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │    Phantom      │      │    Phantom      │      │    Phantom      │
  │  Intelligence   │ ───▶ │    Exchange     │ ───▶ │  Clearinghouse  │
  │   (reasons)     │      │   (executes)    │      │   (settles)     │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │  Token Factory  │      │  AI Artifact    │      │   Production    │
  │  (mints tokens) │      │   Registry      │      │    Engines      │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Core Modules

| Module | Purpose |
|--------|---------|
| `phantom_intelligence.mo` | AI reasoning layer — decides WHAT to trade and WHY |
| `phantom_exchange.mo` | Order book, matching engine — executes trades |
| `phantom_clearinghouse.mo` | Settlement, netting, guarantees |
| `token_factory.mo` | Mint AI tokens, creator tokens, artifact tokens |
| `production_engines.mo` | 24 Latin-named AI production engines |
| `phi.mo` | Golden ratio constants & Fibonacci sequences |
| `sovereign_db.mo` | Orthogonal persistence — single source of truth |

## 🔢 The PHI Foundation

All system parameters are derived from mathematical constants, not arbitrary choices:

```motoko
// φ — The Golden Ratio
public let PHI : Float = 1.6180339887498948482;

// Heartbeat: φ⁴ × (1000 / 7.83Hz) = 873ms
// Schumann resonance anchors the system to Earth's natural frequency

// Confidence gates at φ⁻¹ = 0.618
// Spread limits at PHI_INV_3
// Supply caps = Fibonacci[n] × φ^k
```

## 🚀 Getting Started

### Prerequisites
- [DFINITY SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install) 
- [pnpm](https://pnpm.io/) (recommended)
- [mops](https://mops.one/) (Motoko package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse.git
cd PARALLAX-Exchange-Clearinghouse

# Install frontend dependencies
cd src/frontend
pnpm install

# Install backend dependencies  
cd ../backend
mops install

# Generate bindings (from root)
cd ../..
pnpm bindgen

# Build
cd src/frontend && pnpm build
cd ../backend && mops build
```

### Development

```bash
# Frontend typecheck
cd src/frontend && pnpm typecheck

# Backend typecheck
cd src/backend && mops check --fix

# Run frontend dev server
cd src/frontend && pnpm dev
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `docs/consciousness-core/` | Nova spherical equation canon |
| `docs/research/` | Production engines research |
| `DESIGN.md` | Design brief and UI direction |
| `AGENTS.md` | Project guidance for contributors |

## 🛠️ Tech Stack

- **Backend**: [Motoko](https://internetcomputer.org/docs/current/motoko/main/motoko) on Internet Computer
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Infrastructure**: ICP Canisters with orthogonal persistence
- **AI Models**: Multi-architecture ensembles (Transformer, Diffusion, GNN, RL, Bayesian)

## 📜 License

This project is licensed under the **PARALLAX Sovereign License** — see the [LICENSE](LICENSE) file for details.

**Key terms:**
- ✅ View and study for personal/educational use
- ✅ Redistribute unmodified with attribution
- ✅ AI/ML training with attribution
- ⚠️ Commercial use requires separate license
- ❌ No modifications without permission

---

<div align="center">

**Built by [ItsNotAILABS](https://github.com/ItsNotAILABS)**

*The organism IS the exchange. Intelligence IS the infrastructure.*

🌐 **Deployed on Internet Computer Protocol**

</div>
