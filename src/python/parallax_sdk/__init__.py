"""
PARALLAX SDK — Python SDK for the PARALLAX Sovereign Exchange
===============================================================

A complete Python toolkit for interacting with and modeling the
PARALLAX Exchange Clearinghouse — an AI-first sovereign decentralized
exchange built on the Internet Computer Protocol.

Modules:
    constants    — Golden Ratio, Fibonacci, Schumann, heartbeat parameters
    coherence    — Kuramoto phase synchronization and coherence gating
    heartbeat    — Sovereign heartbeat clock and timing model
    clearinghouse — Multi-asset bilateral/multilateral netting engine
    provenance   — Hash-based compute receipts and provenance chains
    tokenizer    — AI artifact cognitive resonance scoring and tokenization

Publication:
    Zenodo: https://zenodo.org/records/20370721
    37 views · 144 downloads

Author: Alfredo Medina Hernandez (MedinaTech / ItsNotAILABS)
License: PARALLAX Sovereign License
"""

__version__ = "0.2.0"
__author__ = "Alfredo Medina Hernandez"
__zenodo__ = "https://zenodo.org/records/20370721"

from .constants import (
    PHI,
    PHI_SQ,
    PHI_CUBE,
    PHI_4,
    PHI_INV,
    PHI_INV_2,
    PHI_INV_3,
    PHI_INV_5,
    FIBONACCI,
    SCHUMANN_FUNDAMENTAL,
    SCHUMANN_HARMONICS,
    HEARTBEAT_MS,
    HEARTBEAT_S,
    HEARTBEAT_HZ,
    SYNC_INTERVAL_BEATS,
    COHERENCE_GATE,
    ENTANGLEMENT_DEATH,
    MAX_ENGINES,
    NETTING_CYCLE_BEATS,
    fibonacci,
    fibonacci_sequence,
)

from .coherence import (
    KuramotoCoherenceGate,
    CoherenceResult,
    Oscillator,
)

from .heartbeat import (
    HeartbeatClock,
    HeartbeatPulse,
    derive_heartbeat,
    beat_to_time_ms,
    time_to_beat,
)

from .clearinghouse import (
    ClearinghouseEngine,
    AssetType,
    Obligation,
    NetPosition,
    NettingResult,
)

from .provenance import (
    ProvenanceChain,
    ComputeReceipt,
    GENESIS_HASH,
    fnv1a,
)

from .tokenizer import (
    ArtifactTokenizer,
    AIToken,
    ArtifactCategory,
    CognitiveResonanceScore,
    compute_resonance_score,
    compute_phi_coherence,
    compute_novelty,
)

__all__ = [
    # Constants
    "PHI", "PHI_SQ", "PHI_CUBE", "PHI_4",
    "PHI_INV", "PHI_INV_2", "PHI_INV_3", "PHI_INV_5",
    "FIBONACCI", "SCHUMANN_FUNDAMENTAL", "SCHUMANN_HARMONICS",
    "HEARTBEAT_MS", "HEARTBEAT_S", "HEARTBEAT_HZ",
    "SYNC_INTERVAL_BEATS", "COHERENCE_GATE", "ENTANGLEMENT_DEATH",
    "MAX_ENGINES", "NETTING_CYCLE_BEATS",
    "fibonacci", "fibonacci_sequence",
    # Coherence
    "KuramotoCoherenceGate", "CoherenceResult", "Oscillator",
    # Heartbeat
    "HeartbeatClock", "HeartbeatPulse",
    "derive_heartbeat", "beat_to_time_ms", "time_to_beat",
    # Clearinghouse
    "ClearinghouseEngine", "AssetType", "Obligation", "NetPosition", "NettingResult",
    # Provenance
    "ProvenanceChain", "ComputeReceipt", "GENESIS_HASH", "fnv1a",
    # Tokenizer
    "ArtifactTokenizer", "AIToken", "ArtifactCategory",
    "CognitiveResonanceScore", "compute_resonance_score",
    "compute_phi_coherence", "compute_novelty",
]
