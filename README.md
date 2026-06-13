<div align="center">

<!-- Logo: auto-switches between dark/light depending on GitHub theme -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/parallax-logo.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/parallax-logo-dark.svg">
  <img alt="PARALLAX Exchange Clearinghouse" src="assets/parallax-logo.svg" width="700">
</picture>

<br/><br/>

<!-- Status Badges -->
[![CI](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/actions/workflows/ci.yml)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/ci.yml?branch=main&style=flat-square&label=build)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/actions)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=flat-square&logo=vitest&logoColor=white)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/actions)
[![TypeScript](https://img.shields.io/badge/typecheck-passing-blue?style=flat-square&logo=typescript&logoColor=white)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/actions)

<!-- Technology Badges -->
[![Built on ICP](https://img.shields.io/badge/Internet_Computer-ICP-29abe2?style=flat-square&logo=dfinity&logoColor=white)](https://internetcomputer.org/)
[![Motoko](https://img.shields.io/badge/Backend-Motoko-6B25C9?style=flat-square)](https://internetcomputer.org/docs/current/motoko/main/motoko)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

<!-- Research & Notebooks -->
[![Open In Colab](https://img.shields.io/badge/Open_In-Google_Colab-F9AB00?style=flat-square&logo=googlecolab&logoColor=white)](https://colab.research.google.com/github/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/blob/main/PARALLAX_Software_Notebook.ipynb)
[![Jupyter Notebook](https://img.shields.io/badge/Notebook-Jupyter-F37626?style=flat-square&logo=jupyter&logoColor=white)](PARALLAX_Software_Notebook.ipynb)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo-blue?style=flat-square&logo=doi&logoColor=white)](https://zenodo.org/records/)

<!-- License & Community -->
[![License](https://img.shields.io/badge/License-PARALLAX_Sovereign-red?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-informational?style=flat-square)](CITATION.cff)
[![GitHub Stars](https://img.shields.io/github/stars/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse?style=flat-square&color=yellow)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse?style=flat-square)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/issues)
[![Last Commit](https://img.shields.io/github/last-commit/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse?style=flat-square)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/commits)
[![Repo Size](https://img.shields.io/github/repo-size/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse?style=flat-square)](https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse)

---

**Trade everything. Pay nothing. Settle instantly.**

[Get Started](#-get-started) · [How It Works](#-how-it-works) · [Try It Free](#-try-it-now--zero-install) · [Documentation](#-documentation) · [For Developers](#-for-developers)

</div>

---

## 👋 Welcome to PARALLAX

**PARALLAX** is the world's first **AI-powered financial exchange** where you pay zero fees, your trades settle in under one second, and an intelligent system works 24/7 to protect your assets.

Think of it like a stock exchange — but smarter, faster, and free. No middlemen. No hidden costs. Just you and the market.

> **New here?** Skip straight to [Get Started](#-get-started) — you can be trading in under 60 seconds.

### Why People Use PARALLAX

| What You Want | How PARALLAX Delivers |
|:---|:---|
| **Trade without fees** | The system pays its own operating costs — you never see a gas fee |
| **Instant confirmation** | Every trade settles in 873 milliseconds — less than 1 second |
| **Trade AI assets** | Buy and sell AI models, compute time, agents, and more |
| **Sleep easy** | An AI watchdog monitors risk, ensures settlement, guarantees every trade |
| **One-click setup** | Docker, notebooks, or web app — choose your style |

---

## 🚀 Get Started

Choose the way that works best for you:

### Option 1: One-Click Docker (Recommended)

The easiest way to run everything locally. You just need [Docker](https://docs.docker.com/get-docker/) installed.

```bash
git clone https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse.git
cd PARALLAX-Exchange-Clearinghouse
docker compose up
```

That's it. Open your browser:
- **📊 Trading Interface** → [http://localhost:5173](http://localhost:5173)
- **🔗 Blockchain Explorer** → [http://localhost:8000](http://localhost:8000)

### Option 2: Try It Now — Zero Install

Don't want to install anything? Run our interactive notebook directly in your browser:

<div align="center">

[![Open In Colab](https://img.shields.io/badge/▶_Launch_PARALLAX-Open_in_Google_Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white)](https://colab.research.google.com/github/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/blob/main/PARALLAX_Software_Notebook.ipynb)

</div>

This notebook lets you:
- Place simulated trades and watch the matching engine work
- See settlement state with cryptographic proofs
- Mint AI tokens with phi-derived supply caps
- Explore the full system — all in your browser

### Option 3: Example Notebooks

Step-by-step guided experiences:

| Notebook | What You'll Do | Launch |
|:---------|:---------------|:------:|
| **Place Your First Trade** | Submit an order and watch it match | [![Colab](https://img.shields.io/badge/Open-Colab-F9AB00?style=flat-square&logo=googlecolab&logoColor=white)](https://colab.research.google.com/github/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/blob/main/examples/01_place_order.ipynb) |
| **View the Clearinghouse** | See settlement proofs and netting | [![Colab](https://img.shields.io/badge/Open-Colab-F9AB00?style=flat-square&logo=googlecolab&logoColor=white)](https://colab.research.google.com/github/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/blob/main/examples/02_query_clearinghouse.ipynb) |
| **Mint AI Tokens** | Create tokens with mathematical supply caps | [![Colab](https://img.shields.io/badge/Open-Colab-F9AB00?style=flat-square&logo=googlecolab&logoColor=white)](https://colab.research.google.com/github/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse/blob/main/examples/03_mint_ai_token.ipynb) |

---

## 🧠 How It Works

PARALLAX isn't just software — it's a **living system**. Here's what happens when you make a trade:

```
  You place a trade
        │
        ▼
  ┌─────────────────────┐
  │  🧠 AI Intelligence │  ← Analyzes your order, checks market conditions
  │     Engine          │     detects opportunities, validates coherence
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  ⚡ Exchange Engine  │  ← Matches your order with the best counterparty
  │     (Order Book)    │     executes at optimal price
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  🏦 Clearinghouse   │  ← Guarantees settlement, nets across assets
  │     (Settlement)    │     provides cryptographic proof of finality
  └──────────┬──────────┘
             │
             ▼
  ✅ Done — 873ms total
```

### The Three Pillars

| Pillar | What It Does | Why It Matters |
|:-------|:-------------|:---------------|
| **Phantom Intelligence** | AI that reasons about every trade | Prevents bad trades, finds opportunities |
| **Phantom Exchange** | Lightning-fast order matching | Your trades fill instantly |
| **Phantom Clearinghouse** | Guarantees every settlement | You always get what you're owed |

---

## 💰 What Can You Trade?

PARALLAX supports everything from traditional crypto to cutting-edge AI assets:

<details>
<summary><b>🪙 Cryptocurrency</b> — BTC, ETH, ICP, SOL and more</summary>

Trade major cryptocurrencies with zero fees and instant settlement. Cross-chain bridges support ckBTC and ckETH natively.
</details>

<details>
<summary><b>🤖 AI Compute Tokens</b> — GPU time, TPU access, Storage, Bandwidth</summary>

Buy and sell AI computing resources as tokens. Need GPU time for training? Purchase AIGPU tokens. Have idle compute? Sell it on the market.
</details>

<details>
<summary><b>🧬 AI Models & Agents</b> — Foundation models, Fine-tuned models, Autonomous agents</summary>

Trade tokenized AI intellectual property: large language models, fine-tuned specialists, autonomous agents with tools and memory, RAG pipelines, and more. 55+ artifact types supported.
</details>

<details>
<summary><b>📊 AI Governance Tokens</b> — Model votes, Safety audits, Certifications</summary>

Participate in AI governance: vote on model decisions, fund safety audits, earn certification tokens for verified AI systems.
</details>

<details>
<summary><b>🌍 Real World Assets</b> — Commodities, Real Estate (bridged)</summary>

Access tokenized real-world assets through verified bridges and oracles.
</details>

---

## 🔬 The Science Behind It

PARALLAX is built on mathematical constants, not arbitrary choices. Every parameter in the system traces back to fundamental physics and mathematics:

| Parameter | Value | Derivation |
|:----------|:------|:-----------|
| **Heartbeat** | 873ms | φ⁴ × (1000 / 7.83 Hz) — Golden ratio meets Schumann resonance |
| **Confidence Gate** | 0.618 | φ⁻¹ — The golden ratio inverse |
| **Supply Caps** | Fibonacci × φᵏ | Natural growth curves |
| **Coherence Threshold** | R ≥ 0.618 | Kuramoto synchronization |

<details>
<summary><b>🔢 Learn more about the mathematical foundation</b></summary>

```motoko
// φ — The Golden Ratio
public let PHI : Float = 1.6180339887498948482;

// Heartbeat interval: φ⁴ × (1000 / 7.83Hz) = 873ms
// The Schumann resonance (7.83 Hz) anchors the system to Earth's natural frequency

// All confidence gates operate at φ⁻¹ = 0.618
// Spread limits use PHI_INV_3
// Token supply caps follow Fibonacci[n] × φ^k sequences
```

This approach ensures the system operates in harmony with natural mathematical laws, producing stable, predictable behavior under all market conditions.
</details>

---

## 🏭 Production Engines

PARALLAX runs **24 sovereign production engines** — each a specialized AI system with a Latin designation:

| Engine | Name | Function |
|:-------|:-----|:---------|
| 🏷️ | **Oeconomia.Machina Pretium** | Dynamic pricing across all markets |
| 🔄 | **Arbitrium.Nexus** | Cross-market arbitrage detection |
| 📐 | **Portio.Optima** | Phi-weighted Markowitz portfolio allocation |
| 🛡️ | **Aegis.Securitas** | Risk management and position monitoring |
| ... | *+ 20 more engines* | Each running multi-model AI ensembles |

> **93+ AI model instances** run concurrently across Transformer, Diffusion, GNN, Reinforcement Learning, and Bayesian architectures.

---

## 📚 Documentation

### For Users

| Guide | Description |
|:------|:------------|
| [**Getting Started**](docs/defi/ONBOARDING.md) | Connect your wallet, fund your account, place your first trade |
| [**Supported Markets**](docs/defi/SUPPORTED_MARKETS.md) | Every trading pair, asset category, and market specification |
| [**Risk Disclosure**](docs/defi/RISK_DISCLOSURE.md) | Important information about risks and responsibilities |

### For Builders

| Guide | Description |
|:------|:------------|
| [**Trading Platform Architecture**](docs/defi/TRADING_PLATFORM.md) | Full technical architecture of the execution platform |
| [**Developer Guide**](docs/defi/DEVELOPER_GUIDE.md) | Build on PARALLAX — SDK, Agent Kit, trading bots |
| [**LP & Agent Integrations**](docs/defi/LP_AND_AGENTS.md) | Liquidity provider incentives and Agent Kit |
| [**Trust Boundaries**](docs/defi/TRUST_BOUNDARIES.md) | Security model and trust assumptions |
| [**Roadmap**](docs/defi/ROADMAP.md) | Current focus and path to SNS governance |

### Research

| Resource | Description |
|:---------|:------------|
| [**Software Notebook**](PARALLAX_Software_Notebook.ipynb) | Computational documentation — run the code yourself |
| [**Design Brief**](DESIGN.md) | UI/UX direction and design philosophy |
| `docs/consciousness-core/` | Nova spherical equation canon |
| `docs/research/` | Production engines research papers |

---

## 👩‍💻 For Developers

<details>
<summary><b>Manual Installation</b></summary>

**Prerequisites:**
- [Node.js 20+](https://nodejs.org/) with [pnpm](https://pnpm.io/)
- [DFINITY SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [mops](https://mops.one/) (Motoko package manager)

```bash
# Clone
git clone https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse.git
cd PARALLAX-Exchange-Clearinghouse

# Frontend
cd src/frontend && pnpm install --prefer-offline

# Backend
cd ../backend && mops install

# Generate type bindings (from project root)
cd ../.. && pnpm bindgen

# Build everything
cd src/frontend && pnpm build
cd ../backend && mops build
```
</summary>
</details>

<details>
<summary><b>Development Commands</b></summary>

```bash
# Start frontend dev server with hot reload
cd src/frontend && pnpm dev

# Typecheck frontend
cd src/frontend && pnpm typecheck

# Lint frontend
cd src/frontend && pnpm check

# Fix lint issues
cd src/frontend && pnpm fix

# Run frontend tests
cd src/frontend && pnpm test

# Typecheck backend (Motoko)
cd src/backend && mops check --fix

# Build backend
cd src/backend && mops build
```
</details>

<details>
<summary><b>Project Structure</b></summary>

```
PARALLAX-Exchange-Clearinghouse/
├── src/
│   ├── backend/              ← Motoko canisters (ICP blockchain)
│   │   ├── main.mo           ← Entry point
│   │   ├── phantom_intelligence.mo
│   │   ├── phantom_exchange.mo
│   │   ├── phantom_clearinghouse.mo
│   │   ├── token_factory.mo
│   │   ├── ai_artifact_registry.mo
│   │   ├── production_engines.mo
│   │   ├── phi.mo
│   │   ├── sovereign_db.mo
│   │   └── ... (80+ modules)
│   └── frontend/             ← React + TypeScript + Tailwind
│       └── src/
├── docs/                     ← User & developer documentation
├── examples/                 ← Interactive Jupyter notebooks
├── tools/                    ← CLI tools (parallax-dev, parallax-voice)
├── docker-compose.yml        ← One-command local deployment
├── PARALLAX_Software_Notebook.ipynb  ← Computational documentation
└── CITATION.cff              ← Academic citation metadata
```
</details>

<details>
<summary><b>Tech Stack</b></summary>

| Layer | Technology |
|:------|:-----------|
| **Blockchain** | [Internet Computer Protocol](https://internetcomputer.org/) (ICP) |
| **Smart Contracts** | [Motoko](https://internetcomputer.org/docs/current/motoko/main/motoko) |
| **Frontend** | React 19 + TypeScript 5 + Tailwind CSS 3 + Vite 5 |
| **3D Visualization** | Three.js + React Three Fiber |
| **State Management** | Zustand + TanStack Query |
| **Testing** | Vitest + Biome (lint) |
| **Infrastructure** | Docker + ICP Canisters (orthogonal persistence) |
| **AI Models** | Multi-architecture ensembles (Transformer, Diffusion, GNN, RL, Bayesian) |
</details>

---

## 📜 License

This project is released under the **PARALLAX Sovereign License v1.0** — see [LICENSE](LICENSE).

| Permission | Status |
|:-----------|:------:|
| View & study for personal/educational use | ✅ |
| Redistribute unmodified with attribution | ✅ |
| AI/ML training with attribution | ✅ |
| Commercial use | ⚠️ Separate license required |
| Modification without permission | ❌ |

---

## 📖 Citation

If you use PARALLAX in research or publications, please cite:

```bibtex
@software{parallax_exchange_2026,
  title     = {PARALLAX Exchange Clearinghouse: AI-First Sovereign Decentralized Exchange},
  author    = {ItsNotAILABS and Medina Hernandez, Alfredo},
  year      = {2026},
  version   = {0.1.0},
  url       = {https://github.com/ItsNotAILABS/PARALLAX-Exchange-Clearinghouse},
  note      = {PARALLAX Sovereign License v1.0}
}
```

---

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/parallax-logo.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/parallax-logo-dark.svg">
  <img alt="PARALLAX" src="assets/parallax-logo.svg" width="300">
</picture>

<br/>

**Built by [ItsNotAILABS](https://github.com/ItsNotAILABS)** · Created by [Alfredo Medina Hernandez](https://github.com/FreddyCreates)

*The organism IS the exchange. Intelligence IS the infrastructure.*

<br/>

[![ICP](https://img.shields.io/badge/Deployed_on-Internet_Computer-29abe2?style=for-the-badge&logo=dfinity&logoColor=white)](https://internetcomputer.org/)

<sub>© 2026 ItsNotAILABS — All Rights Reserved</sub>

</div>
