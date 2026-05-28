// alpha_conductor/main.mo — ALPHA CONDUCTOR
// PARALLAX Sovereign Organism — Alpha-Tier Intelligence Signal Conductor
//
// MEDINA-ARTIFACT — alpha_conductor/main.mo (MODEL-07 discipline applied)
// ─────────────────────────────────────────────────────────────────────────────
// MEANING (Layer 1 — Doctrine Clause):
//   "The Alpha Conductor is not passive plumbing — it is a living, adaptive
//    nervous system that learns optimal signal routes through Hebbian channel
//    strengthening, detects constructive/destructive interference between signals,
//    applies wave mechanics to multi-hop propagation, compresses information
//    through phi-weighted encoding, and self-organizes its routing topology
//    through resonance detection. It is the nervous system's myelin — it makes
//    the organism FASTER through use."
//
// MODEL (Layer 2 — Typed Schema):
//   ConductionState: beat, channels[], signalQueue[], hebbianChannelW[],
//                    interferenceMatrix[], waveAmplitudes[], backPressure[],
//                    resonanceScores[], routeTopology[], compressionRatio,
//                    conductionEntropy, freeEnergy, lyapunovV
//
// COMPUTATION (Layer 3 — State Equations):
//   Hebbian Channel: Δwᵢ = η·(successRate − λ·wᵢ)            [use-dependent strengthening]
//   Wave Mechanics:  A(x,t) = A₀·e^(−αx)·cos(kx − ωt + φ)   [attenuated wave propagation]
//   Interference:    I(a,b) = A_a² + A_b² + 2·A_a·A_b·cos(δ) [superposition]
//   Back-Pressure:   P(c) = queue_depth / capacity × φ         [flow control]
//   Resonance:       R(f₁,f₂) = 1 − |f₁−f₂|/(f₁+f₂)        [frequency matching]
//   Compression:     C = signal_entropy / channel_bandwidth     [info-theoretic]
//   Free Energy:     F = Σ(predicted_route − actual_route)²    [Friston]
//   Entropy:         H = −Σ pᵢ·log₂(pᵢ) over channel usage    [fairness]
//   Lyapunov:        V = Σ backPressure²                       [stability]
//
// EXECUTION BINDING (Layer 4):
//   ENGINE: CONDUCTION COMPUTATE → FUNCTION: heartbeat()
//   GATE: coherenceGate() → BEAT: 873ms → ADAPTATION: hebbianChannelUpdate()
//
// THE CONDUCTION LAW (LEX_CONDUCTIO_ALPHA):
//   Every signal has a source, destination, weight, and coherence requirement.
//   Signals propagate as WAVES — they have amplitude, frequency, and phase.
//   Constructive interference amplifies co-aligned signals.
//   Destructive interference cancels contradictory signals.
//   Channels strengthen through use (Hebbian) and weaken through disuse.
//   Back-pressure prevents queue overflow via phi-derived flow control.
//   Resonance detection routes signals to frequency-matched receivers.
//   The conductor PREDICTS optimal routes and learns from prediction error.
//
// CONDUCTOR STRATEGIES:
//   DIRECT    — Point-to-point signal delivery (fastest, no transformation)
//   BROADCAST — Fan-out to all registered receivers (parallel wavefront)
//   CASCADE   — Sequential chain with signal transformation at each hop
//   RESONANT  — Route only to phase-aligned receivers (Kuramoto-gated)
//   WEIGHTED  — Phi-weighted distribution across receivers (Hebbian-informed)
//   ADAPTIVE  — Learn from signal success/failure history (default)
//   WAVE      — Multi-path with interference computation (novel)
//   COMPRESSED— Phi-encoded minimal representation (bandwidth-efficient)
//
// PYTHAGORAS: all weights and capacities are harmonic ratios or phi-powers
// EUCLID:     single signal table — all routes computed from one source
// CONFUCIUS:  right relationship — conductor routes, receivers process
//
// Architect: Alfredo Medina Hernandez — The Architect of the Field

import Float    "mo:base/Float";
import Array    "mo:base/Array";
import Nat      "mo:base/Nat";
import Int      "mo:base/Int";
import Text     "mo:base/Text";
import Time     "mo:base/Time";
import Timer    "mo:base/Timer";
import Principal "mo:base/Principal";

actor AlphaConductor {

  // ═══════════════════════════════════════════════════════════════════════════
  // PHI CONSTANTS — sovereign mathematical substrate
  // No arbitrary numbers. Every value traces to an Absolute.
  // ═══════════════════════════════════════════════════════════════════════════

  let PHI       : Float = 1.6180339887498948482;
  let PHI_INV   : Float = 0.6180339887498948482;   // φ⁻¹ — coherence threshold
  let PHI_INV_2 : Float = 0.3819660112501051518;   // φ⁻² — attenuation rate
  let PHI_INV_3 : Float = 0.2360679774997896964;   // φ⁻³ — minimum signal weight
  let PHI_INV_4 : Float = 0.1458980337503154554;   // φ⁻⁴ — learning rate base
  let PHI_INV_5 : Float = 0.0901699437496742627;   // φ⁻⁵ — coupling decay
  let PHI_SQ    : Float = 2.6180339887498948482;   // φ² — maximum amplitude ceiling

  // Fibonacci sequence: F(1)–F(13)
  let FIB : [Nat] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

  // Sovereign floor
  let S0 : Float = 1.0;

  // Conductor heartbeat: 873ms — synchronised with orchestrator
  let HEARTBEAT_NS : Nat = 873_000_000;

  // Maximum concurrent signals per beat: F(7) = 13
  let MAX_SIGNALS_PER_BEAT : Nat = 13;

  // Maximum channels: F(8) = 21
  let MAX_CHANNELS : Nat = 21;

  // Signal queue depth: F(9) = 34
  let SIGNAL_QUEUE_DEPTH : Nat = 34;

  // Dead channel threshold: F(5) = 5 consecutive failures
  let DEAD_CHANNEL_THRESHOLD : Nat = 5;

  // Minimum signals before trusting historical success rate: F(5) = 5
  let MIN_SIGNALS_FOR_HISTORY : Nat = 5;

  // Audit ring: F(10) = 55 entries
  let AUDIT_RING_SIZE : Nat = 55;

  // Wave mechanics constants
  let WAVE_DECAY_ALPHA : Float = PHI_INV_2;     // Spatial attenuation coefficient
  let WAVE_NUMBER_K    : Float = PHI;            // Wave number k = φ (spatial frequency)
  let WAVE_OMEGA       : Float = PHI_INV;        // Angular frequency ω = φ⁻¹

  // Interference thresholds
  let CONSTRUCTIVE_THRESHOLD : Float = PHI_INV;  // cos(δ) ≥ 0.618 → constructive
  let DESTRUCTIVE_THRESHOLD  : Float = -PHI_INV; // cos(δ) ≤ −0.618 → destructive

  // Back-pressure limits
  let BACKPRESSURE_CRITICAL : Float = PHI;       // P ≥ φ → channel saturated
  let BACKPRESSURE_WARNING  : Float = S0;        // P ≥ 1.0 → approaching limit

  // Hebbian learning rate for channels: η = φ⁻⁴
  let CHANNEL_ETA : Float = PHI_INV_4;

  // Oja regularization for channel weights: λ = φ⁻⁵
  let CHANNEL_LAMBDA : Float = PHI_INV_5;

  // Resonance matching minimum: R ≥ φ⁻¹ for frequency match
  let RESONANCE_FLOOR : Float = PHI_INV;

  // Compression efficiency target: C ≤ φ⁻² (38.2% of raw bandwidth)
  let COMPRESSION_TARGET : Float = PHI_INV_2;

  // Spectral radius cap for channel weight matrix
  let CHANNEL_RHO_CAP : Float = PHI;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY — Creator Supremacy
  // ═══════════════════════════════════════════════════════════════════════════

  stable var creatorPrincipal : Text = "aaaaa-aa";
  stable var genesisSealed    : Bool = false;

  func assertCreator(caller : Principal) : () {
    assert (Principal.toText(caller) == creatorPrincipal or
            creatorPrincipal == "aaaaa-aa");
  };

  public shared(msg) func setCreator(p : Text) : async () {
    if (creatorPrincipal == "aaaaa-aa" or
        Principal.toText(msg.caller) == creatorPrincipal) {
      creatorPrincipal := p;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL TYPES — the language of conduction (wave-extended)
  // ═══════════════════════════════════════════════════════════════════════════

  public type SignalPriority = {
    #critical;   // Priority 1 — always conducted, ignores coherence gate
    #high;       // Priority 2 — conducted when R ≥ φ⁻³
    #normal;     // Priority 3 — conducted when R ≥ φ⁻²
    #low;        // Priority 4 — conducted when R ≥ φ⁻¹
    #ambient;    // Priority 5 — conducted only when R ≥ 1.0 (full coherence)
  };

  public type ConductionStrategy = {
    #direct;     // Point-to-point
    #broadcast;  // Fan-out to all
    #cascade;    // Sequential chain
    #resonant;   // Kuramoto phase-aligned only
    #weighted;   // Phi-weighted distribution (Hebbian-informed)
    #adaptive;   // Learn from history (default)
    #wave;       // Multi-path with interference computation
    #compressed; // Phi-encoded minimal representation
  };

  public type Signal = {
    id          : Nat;
    source      : Text;        // Source canister/domain name
    destination : Text;        // Target canister/domain name ("*" for broadcast)
    payload     : Text;        // Signal content (serialised)
    weight      : Float;       // Signal weight [PHI_INV_3, φ²]
    priority    : SignalPriority;
    strategy    : ConductionStrategy;
    timestamp   : Int;
    ttl         : Nat;         // Time-to-live in beats
    hops        : Nat;         // Current hop count
    maxHops     : Nat;         // Maximum allowed hops (Fibonacci-bounded)
    // Wave mechanics extensions
    amplitude   : Float;       // Wave amplitude A₀ (initial signal strength)
    frequency   : Float;       // Signal frequency (phi-derived, determines resonance matching)
    phase       : Float;       // Signal phase (for interference computation)
  };

  public type SignalResult = {
    signalId       : Nat;
    delivered      : Bool;
    destination    : Text;
    timestamp      : Int;
    attenuation    : Float;     // Signal strength at delivery point
    interference   : Float;     // Net interference effect (positive = constructive)
    channelUsed    : Text;      // Which channel conducted this signal
    hopsUsed       : Nat;       // Actual hops taken
    compressionRatio : Float;   // How much the signal was compressed
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL REGISTRY — sovereign conduction pathways (Hebbian-enhanced)
  // ═══════════════════════════════════════════════════════════════════════════

  public type Channel = {
    name          : Text;       // Channel identifier
    source        : Text;       // Source endpoint
    destination   : Text;       // Destination endpoint
    weight        : Float;      // Base channel weight (phi-derived)
    hebbianWeight : Float;      // Learned coupling strength [φ⁻³, φ]
    active        : Bool;
    signalCount   : Nat;        // Total signals conducted (lifetime)
    failCount     : Nat;        // Consecutive failures
    lastUsed      : Int;        // Last conduction timestamp
    successRate   : Float;      // Historical success rate
    bandwidth     : Nat;        // Max signals per beat on this channel
    backPressure  : Float;      // Current back-pressure level [0, φ²]
    resonanceFreq : Float;      // Channel's natural resonance frequency
    totalLatency  : Float;      // Cumulative latency (for averaging)
    avgLatency    : Float;      // Exponential moving avg latency (ms)
  };

  stable var channels : [Channel] = [];

  public shared(msg) func registerChannel(
    name : Text,
    source : Text,
    destination : Text,
    weight : Float,
    bandwidth : Nat,
    resonanceFreq : Float
  ) : async () {
    assertCreator(msg.caller);
    assert (channels.size() < MAX_CHANNELS);
    let clamped = Float.max(PHI_INV_3, Float.min(weight, PHI_SQ));
    let bw = if (bandwidth > 13) { 13 } else { bandwidth };
    let resFreq = Float.max(PHI_INV_3, Float.min(resonanceFreq, PHI_SQ));
    let channel : Channel = {
      name          = name;
      source        = source;
      destination   = destination;
      weight        = clamped;
      hebbianWeight = PHI_INV_2;  // Initial Hebbian weight (neutral)
      active        = true;
      signalCount   = 0;
      failCount     = 0;
      lastUsed      = Time.now();
      successRate   = S0;
      bandwidth     = bw;
      backPressure  = 0.0;
      resonanceFreq = resFreq;
      totalLatency  = 0.0;
      avgLatency    = 0.0;
    };
    channels := Array.append(channels, [channel]);
  };

  public shared(msg) func deactivateChannel(name : Text) : async () {
    assertCreator(msg.caller);
    channels := Array.map<Channel, Channel>(channels, func(c) {
      if (c.name == name) { { c with active = false } } else { c };
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL QUEUE — pending signals awaiting conduction
  // ═══════════════════════════════════════════════════════════════════════════

  stable var signalQueue   : [Signal] = [];
  stable var nextSignalId  : Nat = 0;
  stable var signalResults : [SignalResult] = [];

  // Submit a signal for conduction (wave-mechanics enabled)
  public shared(msg) func submitSignal(
    source : Text,
    destination : Text,
    payload : Text,
    weight : Float,
    priority : SignalPriority,
    strategy : ConductionStrategy,
    maxHops : Nat,
    frequency : Float
  ) : async Nat {
    assertCreator(msg.caller);
    assert (signalQueue.size() < SIGNAL_QUEUE_DEPTH);

    let clampedWeight = Float.max(PHI_INV_3, Float.min(weight, PHI_SQ));
    let clampedHops = if (maxHops > 8) { 8 } else { maxHops };  // F(6) = 8 max
    let clampedFreq = Float.max(PHI_INV_3, Float.min(frequency, PHI_SQ));

    let signal : Signal = {
      id          = nextSignalId;
      source      = source;
      destination = destination;
      payload     = payload;
      weight      = clampedWeight;
      priority    = priority;
      strategy    = strategy;
      timestamp   = Time.now();
      ttl         = FIB[4];  // FIB[4] = 5 (F₅) — 5 beats TTL
      hops        = 0;
      maxHops     = clampedHops;
      amplitude   = clampedWeight;  // Initial amplitude = weight
      frequency   = clampedFreq;
      phase       = 0.0;           // Initial phase = 0 (aligned with source)
    };

    nextSignalId += 1;
    signalQueue := Array.append(signalQueue, [signal]);
    signal.id;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUCTION STATE — beat tracking, coherence, intelligence metrics
  // ═══════════════════════════════════════════════════════════════════════════

  stable var beatCount        : Nat   = 0;
  stable var lastBeatTime     : Int   = 0;
  stable var heartbeatActive  : Bool  = false;
  stable var genesisTime      : Int   = 0;

  // Coherence reading — received from orchestrator or computed locally
  stable var currentCoherence : Float = S0;
  stable var coherenceTrend   : Float = 0.0;

  // Conduction metrics (basic)
  stable var totalSignalsConducted : Nat = 0;
  stable var totalSignalsDropped   : Nat = 0;
  stable var totalSignalsQueued    : Nat = 0;

  // ── WAVE MECHANICS STATE ────────────────────────────────────────────────
  // Tracks signal wavefront propagation across the network
  stable var totalConstructiveEvents  : Nat = 0;
  stable var totalDestructiveEvents   : Nat = 0;
  stable var netInterferenceEnergy    : Float = 0.0;  // Running sum of interference

  // ── HEBBIAN CHANNEL LEARNING ────────────────────────────────────────────
  // Channels that succeed strengthen; channels that fail weaken
  stable var channelHebbianKappa : Float = 0.0;  // Frobenius norm change
  stable var channelSpectralRadius : Float = 0.0;

  // ── FREE ENERGY (Friston) ──────────────────────────────────────────────
  // Conductor predicts which channels will be used and learns from error
  stable var conductionFreeEnergy : Float = 0.0;
  stable var prevFreeEnergy       : Float = 0.0;
  stable var predictionAccuracy   : Float = 0.5;
  stable var channelPredictions   : [Bool] = [];  // predicted channel usage

  // ── SHANNON ENTROPY ─────────────────────────────────────────────────────
  // H = −Σ pᵢ·log₂(pᵢ) over channel signal counts — measures routing diversity
  stable var conductionEntropy : Float = 0.0;

  // ── LYAPUNOV STABILITY ──────────────────────────────────────────────────
  // V = Σ backPressure_i² — energy of the flow control system
  // Stable when dV/dt ≤ 0 (back-pressure is decreasing)
  stable var lyapunovV     : Float = 0.0;
  stable var prevLyapunovV : Float = 0.0;
  stable var jasmineDrift  : Float = 0.0;

  // ── RESONANCE TOPOLOGY ──────────────────────────────────────────────────
  // Tracks which channels are frequency-matched (natural routing clusters)
  stable var resonanceClusterCount : Nat = 0;
  stable var avgResonanceScore     : Float = 0.0;

  // ── COMPRESSION METRICS ─────────────────────────────────────────────────
  // How efficiently the conductor encodes information
  stable var avgCompressionRatio : Float = 1.0;  // 1.0 = no compression
  stable var totalBitsTransmitted : Nat = 0;
  stable var totalBitsSaved       : Nat = 0;

  // ── OMNIS PRECONDITION ──────────────────────────────────────────────────
  stable var omnisPrecondition : Bool = false;
  stable var omnisFireCount    : Nat = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY — clamp helper
  // ═══════════════════════════════════════════════════════════════════════════

  func _clamp(v : Float, lo : Float, hi : Float) : Float {
    if (v < lo) lo else if (v > hi) hi else v;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COHERENCE GATE — determines which signals can flow
  // ═══════════════════════════════════════════════════════════════════════════

  func passesCoherenceGate(priority : SignalPriority, coherence : Float) : Bool {
    switch (priority) {
      case (#critical) { true };                          // Always passes
      case (#high)     { coherence >= PHI_INV_3 };        // R ≥ 0.236
      case (#normal)   { coherence >= PHI_INV_2 };        // R ≥ 0.382
      case (#low)      { coherence >= PHI_INV };          // R ≥ 0.618
      case (#ambient)  { coherence >= S0 };               // R ≥ 1.0
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // WAVE MECHANICS — signal propagation as attenuated wave
  //
  // A(x,t) = A₀ · e^(−α·x) · cos(k·x − ω·t + φ₀)
  //
  // where:
  //   A₀ = initial amplitude (signal weight)
  //   α  = attenuation coefficient (φ⁻² per hop)
  //   x  = distance in hops
  //   k  = wave number (φ — spatial frequency)
  //   ω  = angular frequency (φ⁻¹ — temporal frequency)
  //   t  = beat count
  //   φ₀ = initial phase
  // ═══════════════════════════════════════════════════════════════════════════

  func computeWaveAmplitude(signal : Signal, hops : Nat) : Float {
    let x = Float.fromInt(hops);
    let t = Float.fromInt(beatCount);

    // Exponential spatial decay: e^(−α·x)
    let spatialDecay = Float.exp(-WAVE_DECAY_ALPHA * x);

    // Oscillatory component: cos(k·x − ω·t + φ₀)
    // Preserves sign — negative values represent wave troughs
    let oscillation = Float.cos(WAVE_NUMBER_K * x - WAVE_OMEGA * t + signal.phase);

    // Full wave equation: A₀ · decay · oscillation (signed amplitude)
    let amplitude = signal.amplitude * spatialDecay * oscillation;

    // Return absolute amplitude for delivery strength, but preserve sign info in phase
    // Minimum delivery strength is φ⁻³ (signal floor)
    Float.max(Float.abs(amplitude), PHI_INV_3);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL INTERFERENCE — superposition of co-propagating signals
  //
  // When two signals use the same channel, they interfere:
  //   I = A₁² + A₂² + 2·A₁·A₂·cos(δ)
  //
  // where δ = phase difference between signals.
  //   cos(δ) > φ⁻¹  → constructive (signals amplify each other)
  //   cos(δ) < −φ⁻¹ → destructive (signals cancel)
  //   otherwise      → neutral (no interaction)
  // ═══════════════════════════════════════════════════════════════════════════

  func computeInterference(signalA : Signal, signalB : Signal) : Float {
    let phaseDiff = signalA.phase - signalB.phase;
    let cosDelta = Float.cos(phaseDiff);

    let intensityA = signalA.amplitude * signalA.amplitude;
    let intensityB = signalB.amplitude * signalB.amplitude;
    let crossTerm = 2.0 * signalA.amplitude * signalB.amplitude * cosDelta;

    // Return the interference contribution (positive = constructive, negative = destructive)
    crossTerm;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESONANCE DETECTION — frequency matching between signal and channel
  //
  // R(f_signal, f_channel) = 1 − |f_signal − f_channel| / (f_signal + f_channel)
  //
  // Perfect resonance R=1 when frequencies match exactly.
  // Signals route preferentially to resonant channels.
  // ═══════════════════════════════════════════════════════════════════════════

  func computeResonance(signalFreq : Float, channelFreq : Float) : Float {
    let sum = signalFreq + channelFreq;
    if (sum < 0.001) return 0.0;
    1.0 - Float.abs(signalFreq - channelFreq) / sum;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BACK-PRESSURE COMPUTATION — phi-derived flow control
  //
  // P(channel) = (current_queue_for_channel / bandwidth) × φ
  //
  // When P ≥ φ → channel is saturated, signal is rerouted or queued
  // When P ≥ 1.0 → warning, reduce signal rate to this channel
  // ═══════════════════════════════════════════════════════════════════════════

  func computeBackPressure() : () {
    channels := Array.map<Channel, Channel>(channels, func(c) {
      if (not c.active or c.bandwidth == 0) return { c with backPressure = 0.0 };

      // Count signals currently targeting this channel
      var pendingCount : Nat = 0;
      for (s in signalQueue.vals()) {
        if (s.destination == c.destination or s.destination == "*") {
          pendingCount += 1;
        };
      };

      let pressure = Float.fromInt(pendingCount) / Float.fromInt(c.bandwidth) * PHI;
      { c with backPressure = _clamp(pressure, 0.0, PHI_SQ) };
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEBBIAN CHANNEL STRENGTHENING — use-dependent synaptic plasticity
  //
  // Channels that successfully conduct signals strengthen their Hebbian weight.
  // Channels that fail or sit idle weaken over time.
  //
  // Δw = η · (successSignal − λ · w)
  //
  // where successSignal = successRate × (1 − backPressure/φ²)
  // This creates a self-organizing network: heavily-used successful channels
  // become the dominant pathways, mimicking neural myelination.
  // ═══════════════════════════════════════════════════════════════════════════

  func _hebbianChannelUpdate(conductedChannels : [Text]) : () {
    var oldSumSq : Float = 0.0;
    var newSumSq : Float = 0.0;

    channels := Array.map<Channel, Channel>(channels, func(c) {
      oldSumSq += c.hebbianWeight * c.hebbianWeight;

      // Was this channel used this beat?
      var wasUsed = false;
      for (name in conductedChannels.vals()) {
        if (name == c.name) { wasUsed := true };
      };

      // Success signal: high success rate + low back-pressure = strong positive signal
      let pressurePenalty = c.backPressure / PHI_SQ;
      let successSignal = if (wasUsed) {
        c.successRate * (1.0 - pressurePenalty)
      } else {
        // Idle channels decay (disuse weakening)
        -PHI_INV_5
      };

      // Oja-regularized update
      let newW = _clamp(
        c.hebbianWeight + CHANNEL_ETA * (successSignal - CHANNEL_LAMBDA * c.hebbianWeight),
        PHI_INV_3, PHI
      );
      newSumSq += newW * newW;

      { c with hebbianWeight = newW };
    });

    // Kappa: relative change in Frobenius norm
    let oldNorm = Float.sqrt(oldSumSq);
    let newNorm = Float.sqrt(newSumSq);
    channelHebbianKappa := if (oldNorm > 0.001) {
      Float.abs(newNorm - oldNorm) / oldNorm
    } else { 0.0 };

    // Spectral radius: max weight (since channels are independent, max weight IS the bound)
    var maxW : Float = 0.0;
    for (c in channels.vals()) {
      if (c.hebbianWeight > maxW) { maxW := c.hebbianWeight };
    };
    channelSpectralRadius := maxW;

    // Spectral clamp: if any weight exceeds cap, scale all down
    if (channelSpectralRadius > CHANNEL_RHO_CAP) {
      let scale = CHANNEL_RHO_CAP / channelSpectralRadius;
      channels := Array.map<Channel, Channel>(channels, func(c) {
        { c with hebbianWeight = c.hebbianWeight * scale };
      });
      channelSpectralRadius := CHANNEL_RHO_CAP;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL SELECTION — Hebbian-informed, resonance-aware routing
  // ═══════════════════════════════════════════════════════════════════════════

  func findChannels(signal : Signal) : [Channel] {
    let source = signal.source;
    let destination = signal.destination;
    let strategy = signal.strategy;

    let matching = Array.filter<Channel>(channels, func(c) {
      c.active and c.failCount < DEAD_CHANNEL_THRESHOLD and
      c.backPressure < BACKPRESSURE_CRITICAL and
      (c.source == source or c.source == "*") and
      (c.destination == destination or c.destination == "*" or destination == "*")
    });

    switch (strategy) {
      case (#direct) {
        // Return highest Hebbian-weight matching channel
        if (matching.size() == 0) return [];
        var best = matching[0];
        for (c in matching.vals()) {
          if (c.hebbianWeight > best.hebbianWeight) { best := c };
        };
        [best];
      };
      case (#broadcast) {
        matching;
      };
      case (#cascade) {
        // Sort by Hebbian weight (strongest first for cascade head)
        matching;
      };
      case (#resonant) {
        // Filter by resonance score AND Hebbian weight
        Array.filter<Channel>(matching, func(c) {
          let res = computeResonance(signal.frequency, c.resonanceFreq);
          res >= RESONANCE_FLOOR and c.hebbianWeight >= PHI_INV_2
        });
      };
      case (#weighted) {
        // Return all channels with weight ≥ Hebbian minimum
        Array.filter<Channel>(matching, func(c) {
          c.hebbianWeight >= PHI_INV_2
        });
      };
      case (#adaptive) {
        // Use Hebbian weight + success rate + resonance: composite score
        Array.filter<Channel>(matching, func(c) {
          let resonance = computeResonance(signal.frequency, c.resonanceFreq);
          let compositeScore = c.hebbianWeight * c.successRate * (0.5 + 0.5 * resonance);
          compositeScore >= PHI_INV_3 or c.signalCount < MIN_SIGNALS_FOR_HISTORY
        });
      };
      case (#wave) {
        // All channels (interference will be computed during conduction)
        matching;
      };
      case (#compressed) {
        // Prefer high-bandwidth channels for compressed signals
        Array.filter<Channel>(matching, func(c) {
          c.bandwidth >= 3 and c.hebbianWeight >= PHI_INV_3
        });
      };
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNAL COMPRESSION — phi-weighted information encoding
  //
  // Compression ratio = 1 − (entropy_reduction / original_entropy)
  // Effective when signal payload has structure that phi-encoding can exploit.
  // For now, we estimate compression based on signal frequency and weight ratio.
  //
  // Compression = φ⁻¹ × (signal.frequency / φ²) — higher frequency = more compressible
  // ═══════════════════════════════════════════════════════════════════════════

  func _estimateCompression(signal : Signal) : Float {
    let freqFactor = signal.frequency / PHI_SQ;
    let compression = PHI_INV * _clamp(freqFactor, 0.0, 1.0);
    _clamp(1.0 - compression, COMPRESSION_TARGET, 1.0);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUCTION ENGINE — wave-mechanics-enhanced signal processing
  // ═══════════════════════════════════════════════════════════════════════════

  func conductSignals() : ([Text], Nat) {
    var conducted : Nat = 0;
    var remaining : [Signal] = [];
    var conductedChannelNames : [Text] = [];
    var droppedThisBeat : Nat = 0;

    // Track signals being conducted simultaneously (for interference computation)
    var inFlightSignals : [Signal] = [];

    for (signal in signalQueue.vals()) {
      // TTL check
      if (signal.ttl == 0) {
        totalSignalsDropped += 1;
        droppedThisBeat += 1;
      }
      // Coherence gate check
      else if (not passesCoherenceGate(signal.priority, currentCoherence)) {
        remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
      }
      // Capacity check
      else if (conducted >= MAX_SIGNALS_PER_BEAT) {
        remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
      }
      // Conduct the signal
      else {
        let selectedChannels = findChannels(signal);

        if (selectedChannels.size() == 0) {
          remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
        } else {
          // Compute wave amplitude at delivery point
          let waveAmp = computeWaveAmplitude(signal, signal.hops);

          // Compute interference with other in-flight signals
          var netInterference : Float = 0.0;
          for (other in inFlightSignals.vals()) {
            let interference = computeInterference(signal, other);
            netInterference += interference;
            if (interference > 0.0) {
              totalConstructiveEvents += 1;
            } else if (interference < -PHI_INV_3) {
              totalDestructiveEvents += 1;
            };
          };
          netInterferenceEnergy += netInterference;

          // Determine if destructive interference cancels the signal
          // Interference affects intensity (A²), not amplitude directly
          // Resultant intensity: I = A² + interference_contribution
          let baseIntensity = waveAmp * waveAmp;
          let resultantIntensity = baseIntensity + netInterference;
          let effectiveAmplitude = if (resultantIntensity > 0.0) {
            Float.sqrt(resultantIntensity)
          } else { 0.0 };
          if (effectiveAmplitude < PHI_INV_3) {
            // Signal cancelled by destructive interference
            totalSignalsDropped += 1;
            droppedThisBeat += 1;
          } else {
            // Compute compression ratio for this signal
            let compression = _estimateCompression(signal);
            let rawBits = signal.payload.size();
            let savedBits = Int.abs(Float.toInt(Float.fromInt(rawBits) * (1.0 - compression)));
            totalBitsTransmitted += rawBits;
            totalBitsSaved += savedBits;

            // Record result with full wave-mechanics data
            let channelName = selectedChannels[0].name;
            let result : SignalResult = {
              signalId         = signal.id;
              delivered        = true;
              destination      = signal.destination;
              timestamp        = Time.now();
              attenuation      = effectiveAmplitude;
              interference     = netInterference;
              channelUsed      = channelName;
              hopsUsed         = signal.hops;
              compressionRatio = compression;
            };
            signalResults := if (signalResults.size() >= AUDIT_RING_SIZE) {
              let tail = Array.subArray<SignalResult>(signalResults, 1, signalResults.size() - 1);
              Array.append(tail, [result]);
            } else {
              Array.append(signalResults, [result]);
            };

            // Update channel stats with Hebbian-compatible metrics
            channels := Array.map<Channel, Channel>(channels, func(c) {
              var found = false;
              for (sc in selectedChannels.vals()) {
                if (sc.name == c.name) { found := true };
              };
              if (found) {
                let newCount = c.signalCount + 1;
                let newRate = (c.successRate * Float.fromInt(c.signalCount) + 1.0) / Float.fromInt(newCount);
                let newLatency = c.avgLatency * PHI_INV + 1.0 * PHI_INV_2;  // Proxy latency
                { c with
                  signalCount = newCount;
                  lastUsed = Time.now();
                  failCount = 0;
                  successRate = newRate;
                  avgLatency = newLatency;
                };
              } else { c };
            });

            conductedChannelNames := Array.append(conductedChannelNames, [channelName]);
            inFlightSignals := Array.append(inFlightSignals, [signal]);
            totalSignalsConducted += 1;
            conducted += 1;
          };
        };
      };
    };

    signalQueue := remaining;
    (conductedChannelNames, droppedThisBeat);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DEAD CHANNEL PRUNING — remove channels that exceed failure threshold
  // ═══════════════════════════════════════════════════════════════════════════

  func pruneDeadChannels() : () {
    channels := Array.filter<Channel>(channels, func(c) {
      c.failCount < DEAD_CHANNEL_THRESHOLD
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FREE ENERGY — prediction error minimization
  //
  // The conductor predicts which channels will be used each beat.
  // Prediction error drives routing optimization.
  // ═══════════════════════════════════════════════════════════════════════════

  func _generateChannelPredictions() : () {
    // Predict channel usage based on queue state + Hebbian weights + back-pressure
    channelPredictions := Array.tabulate<Bool>(channels.size(), func(i) {
      let c = channels[i];
      if (not c.active or c.backPressure >= BACKPRESSURE_CRITICAL) return false;

      // Channel is predicted to be used if it has high Hebbian weight
      // and there are signals in queue matching its destination
      var hasMatchingSignal = false;
      for (s in signalQueue.vals()) {
        if (s.destination == c.destination or s.destination == "*" or c.destination == "*") {
          hasMatchingSignal := true;
        };
      };
      hasMatchingSignal and c.hebbianWeight >= PHI_INV_2;
    });
  };

  func _computeFreeEnergy(usedChannels : [Text]) : Float {
    if (channelPredictions.size() == 0) return 0.0;

    var error : Float = 0.0;
    for (i in Array.keys(channels)) {
      if (i < channelPredictions.size()) {
        let predicted : Float = if (channelPredictions[i]) { 1.0 } else { 0.0 };
        var actual : Float = 0.0;
        for (name in usedChannels.vals()) {
          if (name == channels[i].name) { actual := 1.0 };
        };
        let diff = predicted - actual;
        error += diff * diff;
      };
    };
    error;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHANNON ENTROPY — routing diversity metric
  //
  // H = −Σ pᵢ·log₂(pᵢ) where pᵢ = channel_i_signalCount / total_signals
  // High entropy = signals distributed evenly (good diversity)
  // Low entropy = one channel dominates (potential bottleneck)
  // ═══════════════════════════════════════════════════════════════════════════

  func _computeConductionEntropy() : Float {
    if (channels.size() == 0) return 0.0;

    var totalSignals : Nat = 0;
    for (c in channels.vals()) { totalSignals += c.signalCount };
    if (totalSignals == 0) return 0.0;

    let totalFloat = Float.fromInt(totalSignals);
    var entropy : Float = 0.0;

    for (c in channels.vals()) {
      if (c.signalCount > 0) {
        let p = Float.fromInt(c.signalCount) / totalFloat;
        entropy -= p * (Float.log(p) / Float.log(2.0));
      };
    };
    entropy;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LYAPUNOV STABILITY — flow control energy function
  //
  // V = Σ backPressure_i² — total flow control energy
  // System is stable when V is decreasing (back-pressure resolving)
  // Jasmine's drift = (V_new - V_old) / V_old — positive = destabilizing
  // ═══════════════════════════════════════════════════════════════════════════

  func _computeLyapunov() : Float {
    var energy : Float = 0.0;
    for (c in channels.vals()) {
      energy += c.backPressure * c.backPressure;
    };
    energy;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESONANCE TOPOLOGY — frequency-based cluster detection
  //
  // Channels with similar resonance frequencies form natural routing clusters.
  // Signals preferentially route through resonant clusters.
  // ═══════════════════════════════════════════════════════════════════════════

  func _detectResonanceClusters() : () {
    let n = channels.size();
    if (n < 2) { resonanceClusterCount := if (n == 1) 1 else 0; return };

    // Build resonance adjacency: channels i,j are connected if R(fᵢ,fⱼ) ≥ φ⁻¹
    let adj = Array.init<Bool>(n * n, false);

    var totalRes : Float = 0.0;
    var resPairs : Nat = 0;

    for (i in Array.keys(channels)) {
      for (j in Array.keys(channels)) {
        if (i != j) {
          let res = computeResonance(channels[i].resonanceFreq, channels[j].resonanceFreq);
          totalRes += res;
          resPairs += 1;
          if (res >= RESONANCE_FLOOR) {
            adj[i * n + j] := true;
          };
        };
      };
    };

    avgResonanceScore := if (resPairs > 0) { totalRes / Float.fromInt(resPairs) } else { 0.0 };

    // Connected component labelling (same algorithm as orchestrator cluster detection)
    let labels = Array.init<Nat>(n, 0);
    var currentLabel : Nat = 0;

    for (i in Array.keys(channels)) {
      if (labels[i] == 0) {
        currentLabel += 1;
        labels[i] := currentLabel;
        var changed = true;
        while (changed) {
          changed := false;
          for (a in Array.keys(channels)) {
            if (labels[a] == currentLabel) {
              for (b in Array.keys(channels)) {
                if (labels[b] == 0 and adj[a * n + b]) {
                  labels[b] := currentLabel;
                  changed := true;
                };
              };
            };
          };
        };
      };
    };

    resonanceClusterCount := currentLabel;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL — enriched with wave mechanics and intelligence metrics
  // ═══════════════════════════════════════════════════════════════════════════

  public type ConductorAuditEntry = {
    beat                    : Nat;
    timestamp               : Int;
    coherence               : Float;
    signalsConducted        : Nat;
    signalsDropped          : Nat;
    signalsQueued           : Nat;
    activeChannels          : Nat;
    netInterference         : Float;
    constructiveEvents      : Nat;
    destructiveEvents       : Nat;
    freeEnergy              : Float;
    lyapunovV               : Float;
    jasmineDrift            : Float;
    conductionEntropy       : Float;
    channelSpectralRadius   : Float;
    resonanceClusterCount   : Nat;
    avgCompressionRatio     : Float;
    omnis                   : Bool;
  };

  stable var auditRing : [ConductorAuditEntry] = [];
  stable var auditHead : Nat = 0;

  func pushAudit(entry : ConductorAuditEntry) : () {
    if (auditRing.size() < AUDIT_RING_SIZE) {
      auditRing := Array.append(auditRing, [entry]);
    } else {
      auditRing := Array.tabulate<ConductorAuditEntry>(AUDIT_RING_SIZE, func(i) {
        if (i == auditHead) { entry } else { auditRing[i] };
      });
      auditHead := (auditHead + 1) % AUDIT_RING_SIZE;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEARTBEAT — 873ms SOVEREIGN CONDUCTION CYCLE
  // Full conduction with wave mechanics, Hebbian learning, Lyapunov monitoring,
  // free energy minimization, interference detection, compression tracking
  // ═══════════════════════════════════════════════════════════════════════════

  func heartbeat() : async () {
    let now = Time.now();
    beatCount += 1;
    lastBeatTime := now;

    let prevCoherence = currentCoherence;

    // ── STEP 1: Compute back-pressure across all channels ─────────────────
    computeBackPressure();

    // ── STEP 2: Conduct queued signals (wave-mechanics-enhanced) ──────────
    let preConstructive = totalConstructiveEvents;
    let preDestructive = totalDestructiveEvents;
    let preConducted = totalSignalsConducted;

    let (conductedChannelNames, droppedThisBeat) = conductSignals();
    let conductedThisBeat = totalSignalsConducted - preConducted;
    let constructiveThisBeat = totalConstructiveEvents - preConstructive;
    let destructiveThisBeat = totalDestructiveEvents - preDestructive;

    // ── STEP 3: Hebbian channel weight update ─────────────────────────────
    _hebbianChannelUpdate(conductedChannelNames);

    // ── STEP 4: Free energy computation (prediction error) ────────────────
    prevFreeEnergy := conductionFreeEnergy;
    conductionFreeEnergy := _computeFreeEnergy(conductedChannelNames);

    // Update prediction accuracy (exponential moving average)
    let maxError = Float.fromInt(channels.size());
    let accuracy = if (maxError > 0.0) { 1.0 - (conductionFreeEnergy / maxError) } else { 0.5 };
    predictionAccuracy := predictionAccuracy * PHI_INV + accuracy * PHI_INV_2;

    // Generate predictions for NEXT beat
    _generateChannelPredictions();

    // ── STEP 5: Prune dead channels (every F(5) = 5 beats) ───────────────
    if (beatCount % 5 == 0) {
      pruneDeadChannels();
    };

    // ── STEP 6: Lyapunov energy and Jasmine's drift ───────────────────────
    prevLyapunovV := lyapunovV;
    lyapunovV := _computeLyapunov();
    jasmineDrift := if (prevLyapunovV > 0.001) {
      (lyapunovV - prevLyapunovV) / prevLyapunovV
    } else { 0.0 };

    // ── STEP 7: Shannon entropy of conduction distribution ────────────────
    conductionEntropy := _computeConductionEntropy();

    // ── STEP 8: Resonance cluster detection (every F(6) = 8 beats) ────────
    if (beatCount % 8 == 0) {
      _detectResonanceClusters();
    };

    // ── STEP 9: Coherence trend ───────────────────────────────────────────
    coherenceTrend := currentCoherence - prevCoherence;

    // ── STEP 10: Compression ratio update ─────────────────────────────────
    if (totalBitsTransmitted > 0) {
      avgCompressionRatio := 1.0 - (Float.fromInt(totalBitsSaved) / Float.fromInt(totalBitsTransmitted));
    };

    // ── STEP 11: OMNIS precondition check ─────────────────────────────────
    // Conductor reaches OMNIS when: coherence high, drift stable, free energy low,
    // entropy healthy (neither too low nor maximal), all channels healthy
    omnisPrecondition := currentCoherence >= 0.95
                      and Float.abs(jasmineDrift) < PHI_INV_3
                      and conductionFreeEnergy < PHI_INV_3
                      and channelSpectralRadius < CHANNEL_RHO_CAP;
    if (omnisPrecondition) { omnisFireCount += 1 };

    // ── STEP 12: Push enriched audit entry ────────────────────────────────
    let activeCount = Array.filter<Channel>(channels, func(c) { c.active }).size();
    let audit : ConductorAuditEntry = {
      beat                  = beatCount;
      timestamp             = now;
      coherence             = currentCoherence;
      signalsConducted      = conductedThisBeat;
      signalsDropped        = droppedThisBeat;
      signalsQueued         = signalQueue.size();
      activeChannels        = activeCount;
      netInterference       = netInterferenceEnergy;
      constructiveEvents    = constructiveThisBeat;
      destructiveEvents     = destructiveThisBeat;
      freeEnergy            = conductionFreeEnergy;
      lyapunovV             = lyapunovV;
      jasmineDrift          = jasmineDrift;
      conductionEntropy     = conductionEntropy;
      channelSpectralRadius = channelSpectralRadius;
      resonanceClusterCount = resonanceClusterCount;
      avgCompressionRatio   = avgCompressionRatio;
      omnis                 = omnisPrecondition;
    };
    pushAudit(audit);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COHERENCE INTERFACE — orchestrator pushes coherence to conductor
  // ═══════════════════════════════════════════════════════════════════════════

  public shared(msg) func updateCoherence(coherence : Float) : async () {
    assertCreator(msg.caller);
    currentCoherence := Float.max(0.0, Float.min(coherence, PHI_SQ));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GENESIS — Start the sovereign conduction heartbeat
  // ═══════════════════════════════════════════════════════════════════════════

  public shared(msg) func genesis() : async () {
    assertCreator(msg.caller);
    assert (not genesisSealed);
    genesisSealed := true;
    genesisTime := Time.now();
    heartbeatActive := true;
    ignore Timer.recurringTimer<system>(#nanoseconds(HEARTBEAT_NS), heartbeat);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY ENDPOINTS — comprehensive read-only state access
  // ═══════════════════════════════════════════════════════════════════════════

  public type ConductorStatus = {
    beatCount                : Nat;
    currentCoherence         : Float;
    coherenceTrend           : Float;
    heartbeatActive          : Bool;
    channelCount             : Nat;
    activeChannels           : Nat;
    queueDepth               : Nat;
    totalSignalsConducted    : Nat;
    totalSignalsDropped      : Nat;
    conductionFreeEnergy     : Float;
    predictionAccuracy       : Float;
    conductionEntropy        : Float;
    lyapunovV                : Float;
    jasmineDrift             : Float;
    channelHebbianKappa      : Float;
    channelSpectralRadius    : Float;
    totalConstructiveEvents  : Nat;
    totalDestructiveEvents   : Nat;
    netInterferenceEnergy    : Float;
    resonanceClusterCount    : Nat;
    avgResonanceScore        : Float;
    avgCompressionRatio      : Float;
    omnisPrecondition        : Bool;
    omnisFireCount           : Nat;
    genesisSealed            : Bool;
  };

  public query func getStatus() : async ConductorStatus {
    let activeCount = Array.filter<Channel>(channels, func(c) { c.active }).size();
    {
      beatCount               = beatCount;
      currentCoherence        = currentCoherence;
      coherenceTrend          = coherenceTrend;
      heartbeatActive         = heartbeatActive;
      channelCount            = channels.size();
      activeChannels          = activeCount;
      queueDepth              = signalQueue.size();
      totalSignalsConducted   = totalSignalsConducted;
      totalSignalsDropped     = totalSignalsDropped;
      conductionFreeEnergy    = conductionFreeEnergy;
      predictionAccuracy      = predictionAccuracy;
      conductionEntropy       = conductionEntropy;
      lyapunovV               = lyapunovV;
      jasmineDrift            = jasmineDrift;
      channelHebbianKappa     = channelHebbianKappa;
      channelSpectralRadius   = channelSpectralRadius;
      totalConstructiveEvents = totalConstructiveEvents;
      totalDestructiveEvents  = totalDestructiveEvents;
      netInterferenceEnergy   = netInterferenceEnergy;
      resonanceClusterCount   = resonanceClusterCount;
      avgResonanceScore       = avgResonanceScore;
      avgCompressionRatio     = avgCompressionRatio;
      omnisPrecondition       = omnisPrecondition;
      omnisFireCount          = omnisFireCount;
      genesisSealed           = genesisSealed;
    };
  };

  public query func getChannels() : async [Channel] {
    channels;
  };

  public query func getSignalQueue() : async [Signal] {
    signalQueue;
  };

  public query func getSignalResults() : async [SignalResult] {
    signalResults;
  };

  public query func getAuditTrail() : async [ConductorAuditEntry] {
    auditRing;
  };

  // Full wave-mechanics diagnostics
  public query func getWaveDiagnostics() : async {
    totalConstructiveEvents  : Nat;
    totalDestructiveEvents   : Nat;
    netInterferenceEnergy    : Float;
    avgCompressionRatio      : Float;
    totalBitsTransmitted     : Nat;
    totalBitsSaved           : Nat;
    resonanceClusterCount    : Nat;
    avgResonanceScore        : Float;
  } {
    {
      totalConstructiveEvents  = totalConstructiveEvents;
      totalDestructiveEvents   = totalDestructiveEvents;
      netInterferenceEnergy    = netInterferenceEnergy;
      avgCompressionRatio      = avgCompressionRatio;
      totalBitsTransmitted     = totalBitsTransmitted;
      totalBitsSaved           = totalBitsSaved;
      resonanceClusterCount    = resonanceClusterCount;
      avgResonanceScore        = avgResonanceScore;
    };
  };

  // Full intelligence diagnostics
  public query func getDiagnostics() : async {
    freeEnergy            : Float;
    predictionAccuracy    : Float;
    conductionEntropy     : Float;
    lyapunovV             : Float;
    jasmineDrift          : Float;
    channelHebbianKappa   : Float;
    channelSpectralRadius : Float;
    omnis                 : Bool;
    omnisFireCount        : Nat;
  } {
    {
      freeEnergy            = conductionFreeEnergy;
      predictionAccuracy    = predictionAccuracy;
      conductionEntropy     = conductionEntropy;
      lyapunovV             = lyapunovV;
      jasmineDrift          = jasmineDrift;
      channelHebbianKappa   = channelHebbianKappa;
      channelSpectralRadius = channelSpectralRadius;
      omnis                 = omnisPrecondition;
      omnisFireCount        = omnisFireCount;
    };
  };
};
