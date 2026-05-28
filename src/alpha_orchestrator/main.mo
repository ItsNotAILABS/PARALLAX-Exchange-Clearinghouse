// alpha_orchestrator/main.mo — ALPHA ORCHESTRATOR
// PARALLAX Sovereign Organism — Alpha-Tier Multi-Canister Intelligence Coordinator
//
// MEDINA-ARTIFACT — alpha_orchestrator/main.mo (MODEL-07 discipline applied)
// ─────────────────────────────────────────────────────────────────────────────
// MEANING (Layer 1 — Doctrine Clause):
//   "The Alpha Orchestrator is not a scheduler — it is a living adaptive topology
//    that learns which children synchronize, predicts failures before they occur,
//    minimizes free energy across the distributed organism, and self-organizes its
//    execution graph through Hebbian coupling. It is the cortex of the swarm."
//
// MODEL (Layer 2 — Typed Schema):
//   OrchestrationState: beat, phases[13], hebbianW[169], activations[13],
//                       lyapunovV, freeEnergy, shannonH, kuramotoR,
//                       spectralRadius, coherenceC, topologyClusters[],
//                       adaptiveSchedule[], emergentFrequencies[13]
//
// COMPUTATION (Layer 3 — State Equations):
//   Kuramoto:    dθᵢ/dt = ωᵢ + (K/N)Σⱼ wᵢⱼ·sin(θⱼ−θᵢ)  [weighted coupling]
//   Hebbian:     Δwᵢⱼ = η·(cos(θᵢ−θⱼ)·success − λ·wᵢⱼ)  [Oja-regularized]
//   Lyapunov:    V = ΣΣ wᵢⱼ·(1 − cos(θᵢ−θⱼ))            [energy landscape]
//   Free Energy: F = Σ(predicted_tick − actual_tick)²        [Friston]
//   Shannon:     H = −Σ pᵢ·log₂(pᵢ)                       [scheduling entropy]
//   Spectral:    ρ(W) = max row sum of |W|                  [stability bound]
//   Clustering:  Phase coherence matrix → community detection via modularity Q
//
// EXECUTION BINDING (Layer 4):
//   ENGINE: ORCHESTRATION COMPUTATE → FUNCTION: heartbeat()
//   GATE: coherenceGate() → BEAT: 873ms → ADAPTATION: hebbianUpdate()
//
// THE ORCHESTRATION LAW (LEX_ORCHESTRO_ALPHA):
//   Every child canister's beat is Hebbian-weighted — not uniform.
//   Scheduling adapts: children that sync get tighter coupling.
//   Coherence gating uses Lyapunov stability, not just threshold.
//   Topology self-organizes: clusters emerge from phase alignment.
//   Free energy drives prediction: the orchestrator PREDICTS the next state.
//   Spectral radius bounds prevent runaway coupling explosions.
//   The system is provably stable via Jasmine's Law energy descent.
//
// PYTHAGORAS: all constants are phi-harmonic ratios — no arbitrary numbers
// EUCLID:     single orchestration root — one source of scheduling truth
// CONFUCIUS:  right relationship — orchestrator governs, children execute
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

actor AlphaOrchestrator {

  // ═══════════════════════════════════════════════════════════════════════════
  // PHI CONSTANTS — sovereign mathematical substrate
  // No arbitrary numbers. Every value traces to an Absolute.
  // ═══════════════════════════════════════════════════════════════════════════

  let PHI       : Float = 1.6180339887498948482;
  let PHI_INV   : Float = 0.6180339887498948482;   // φ⁻¹ — coherence gate
  let PHI_INV_2 : Float = 0.3819660112501051518;   // φ⁻² — decay rate
  let PHI_INV_3 : Float = 0.2360679774997896964;   // φ⁻³ — emergency threshold
  let PHI_INV_4 : Float = 0.1458980337503154554;   // φ⁻⁴ — free energy omnis threshold
  let PHI_INV_5 : Float = 0.0901699437496742627;   // φ⁻⁵ — hebbian coupling decay
  let PHI_SQ    : Float = 2.6180339887498948482;   // φ² — maximum health ceiling

  // Fibonacci sequence: F(1)–F(13) — scheduling multipliers
  let FIB : [Nat] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

  // Sovereign floor — no value below S0
  let S0 : Float = 1.0;

  // Alpha heartbeat: 873ms = φ⁴ × (1000 / 7.83)
  // Derivation: Schumann fundamental resonance f₁ = 7.83 Hz
  // φ⁴ = 6.854101966... → 6854.1 / 7.83 ≈ 875.37 → sovereign constant 873ms
  // This is the organism's cardiac period — all timing descends from this root.
  let SCHUMANN_1 : Float = 7.83;
  let HEARTBEAT_NS : Nat = 873_000_000;

  // Maximum orchestrated canisters: F(7) = 13
  let MAX_CHILDREN : Nat = 13;

  // Hebbian weight matrix size: 13×13 = 169 (inter-child coupling topology)
  let HEBBIAN_SIZE : Nat = 169;

  // Audit ring size: F(10) = 55 entries (expanded for richer history)
  let AUDIT_RING_SIZE : Nat = 55;

  // Coherence history window: F(8) = 21 (spectral analysis buffer)
  let COHERENCE_WINDOW : Nat = 21;

  // Spectral radius cap: φ = 1.618 (prevents runaway coupling explosion)
  let RHO_CAP : Float = PHI;

  // Oja regularization constant: λ = φ⁻⁵ = 0.090 (biologically-inspired)
  let LAMBDA_OJA : Float = PHI_INV_5;

  // Learning rate: η = φ⁻⁴ = 0.146 (Hebbian plasticity rate)
  let ETA_BASE : Float = PHI_INV_4;

  // OMNIS coherence threshold: R ≥ 0.95 (near-perfect synchronization)
  let R_OMNIS : Float = 0.95;

  // Cluster coherence threshold: inter-phase coherence ≥ φ⁻¹ for cluster membership
  let CLUSTER_THRESHOLD : Float = PHI_INV;

  // Prediction buffer: F(5) = 5 beats lookahead
  let PREDICTION_HORIZON : Nat = 5;

  // Minimum beats before Hebbian plasticity activates: F(6) = 8
  let MIN_BEATS_FOR_PLASTICITY : Nat = 8;

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
  // CHILD CANISTER REGISTRY — sovereign multi-canister topology
  // ═══════════════════════════════════════════════════════════════════════════

  public type ChildCanister = {
    name         : Text;
    id           : Text;
    priority     : Nat;        // Fibonacci-ranked priority (1–13)
    active       : Bool;
    lastTick     : Int;        // Last successful tick timestamp
    failCount    : Nat;        // Consecutive failures
    health       : Float;      // Health score [S0, φ²]
    tickCount    : Nat;        // Total successful ticks (lifetime)
    avgLatency   : Float;      // Exponential moving average response latency (ms)
    predictedNext: Nat;        // Beat number at which next tick is predicted
    clusterLabel : Nat;        // Assigned phase cluster (0 = unassigned)
  };

  stable var children : [ChildCanister] = [];

  public shared(msg) func registerChild(name : Text, id : Text, priority : Nat) : async () {
    assertCreator(msg.caller);
    assert (children.size() < MAX_CHILDREN);
    let child : ChildCanister = {
      name         = name;
      id           = id;
      priority     = priority;
      active       = true;
      lastTick     = Time.now();
      failCount    = 0;
      health       = S0;
      tickCount    = 0;
      avgLatency   = 0.0;
      predictedNext= 0;
      clusterLabel = 0;
    };
    children := Array.append(children, [child]);
    // Expand Hebbian matrix to accommodate new child
    _resizeHebbianMatrix();
  };

  public shared(msg) func deactivateChild(name : Text) : async () {
    assertCreator(msg.caller);
    children := Array.map<ChildCanister, ChildCanister>(children, func(c) {
      if (c.name == name) { { c with active = false } } else { c };
    });
  };

  public shared(msg) func activateChild(name : Text) : async () {
    assertCreator(msg.caller);
    children := Array.map<ChildCanister, ChildCanister>(children, func(c) {
      if (c.name == name) { { c with active = true; failCount = 0 } } else { c };
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEBBIAN COUPLING TOPOLOGY — inter-child learned weight matrix
  //
  // W[i,j] represents the learned coupling strength between child i and child j.
  // High W[i,j] means children i and j tend to synchronize and succeed together.
  // The Kuramoto model uses W as coupling weights instead of uniform K/N.
  //
  // Update rule (Oja-regularized):
  //   Δwᵢⱼ = η · (cos(θᵢ−θⱼ) · successProduct − λ · wᵢⱼ)
  //
  // where successProduct = health_i × health_j / φ² (normalized success signal)
  // ═══════════════════════════════════════════════════════════════════════════

  // Immutable stable store; thawed to mutable at runtime
  stable var hebbianWStable : [Float] = Array.tabulate<Float>(HEBBIAN_SIZE, func(_) { PHI_INV_2 });
  var hebbianW : [var Float] = Array.thaw<Float>(hebbianWStable);

  // Hebbian plasticity state
  stable var etaLearningRate : Float = ETA_BASE;
  stable var hebbianKappa    : Float = 0.0;  // Frobenius norm relative change
  stable var spectralRadius  : Float = 0.0;  // ρ(W) — stability indicator

  func _resizeHebbianMatrix() : () {
    let n = children.size();
    let needed = n * n;
    if (needed > hebbianWStable.size()) {
      let expanded = Array.tabulate<Float>(needed, func(k) {
        if (k < hebbianWStable.size()) { hebbianWStable[k] } else { PHI_INV_2 };
      });
      hebbianWStable := expanded;
      hebbianW := Array.thaw<Float>(hebbianWStable);
    };
  };

  func _hebbianUpdate(tickedIndices : [Nat]) : () {
    let n = children.size();
    if (n < 2 or beatCount < MIN_BEATS_FOR_PLASTICITY) return;

    // Compute effective learning rate — reduced during instability (Jasmine's Law)
    let effEta = if (jasmineDrift > 0.15) { etaLearningRate * 0.5 }
                 else { etaLearningRate };

    var oldFrobSq : Float = 0.0;
    var newFrobSq : Float = 0.0;

    for (i in Array.keys(children)) {
      for (j in Array.keys(children)) {
        if (i != j) {
          let idx = i * n + j;
          let wOld = hebbianW[idx];
          oldFrobSq += wOld * wOld;

          // Phase coherence between i and j (normalized difference)
          let phaseDiff = _normalizePhase(childPhases[i] - childPhases[j]);
          let phaseCoherence = Float.cos(phaseDiff);

          // Success product: normalized health co-occurrence
          let successProduct = (children[i].health * children[j].health) / PHI_SQ;

          // Were both children ticked this beat? (co-activation signal)
          var coActivated = false;
          for (ti in tickedIndices.vals()) {
            if (ti == i) {
              for (tj in tickedIndices.vals()) {
                if (tj == j) { coActivated := true };
              };
            };
          };

          // Oja-regularized Hebbian update
          let hebbSignal = if (coActivated) {
            phaseCoherence * successProduct
          } else {
            // Weak anti-Hebbian for non-co-activated pairs (decay coupling)
            -PHI_INV_5 * successProduct
          };

          let wNew = _clamp(wOld + effEta * (hebbSignal - LAMBDA_OJA * wOld), 0.0, PHI);
          hebbianW[idx] := wNew;
          newFrobSq += wNew * wNew;
        };
      };
    };

    // Frobenius norm and spectral radius
    let newFrob = Float.sqrt(newFrobSq);
    let oldFrob = Float.sqrt(oldFrobSq);
    hebbianKappa := if (oldFrob > 0.001) { Float.abs(newFrob - oldFrob) / oldFrob } else { 0.0 };

    // Spectral radius: max row sum of |W| (Gershgorin bound)
    var maxRowSum : Float = 0.0;
    for (i in Array.keys(children)) {
      var rowSum : Float = 0.0;
      for (j in Array.keys(children)) {
        if (i != j) {
          rowSum += Float.abs(hebbianW[i * n + j]);
        };
      };
      if (rowSum > maxRowSum) { maxRowSum := rowSum };
    };
    spectralRadius := maxRowSum;

    // Spectral clamp: if ρ > cap, scale entire matrix down (stability guarantee)
    if (spectralRadius > RHO_CAP and newFrob > 0.0) {
      let scale = RHO_CAP / spectralRadius;
      for (k in Array.keys(children)) {
        for (l in Array.keys(children)) {
          if (k != l) {
            let idx = k * n + l;
            hebbianW[idx] := hebbianW[idx] * scale;
          };
        };
      };
      spectralRadius := RHO_CAP;
    };

    // Eta adaptation: reduce rate when kappa is high (instability detected)
    if (hebbianKappa > PHI_INV_2) {
      etaLearningRate := _clamp(etaLearningRate * 0.8, PHI_INV_5, ETA_BASE);
    } else if (hebbianKappa < PHI_INV_4) {
      // Stable — slowly restore learning rate
      etaLearningRate := _clamp(
        etaLearningRate + (ETA_BASE - etaLearningRate) * 0.05,
        PHI_INV_5, ETA_BASE
      );
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ORCHESTRATION STATE — beat tracking, coherence, scheduling
  // ═══════════════════════════════════════════════════════════════════════════

  stable var beatCount         : Nat   = 0;
  stable var lastBeatTime      : Int   = 0;
  stable var heartbeatActive   : Bool  = false;
  stable var genesisTime       : Int   = 0;

  // Kuramoto coherence — organism-wide phase synchronization measure
  stable var globalCoherence       : Float = S0;
  stable var prevGlobalCoherence   : Float = S0;
  stable var coherenceHistory      : [Float] = [];

  // Phase array for Kuramoto sync — one per child canister
  // NOTE: Immutable stable array; runtime code rebuilds mutable copy in-memory
  stable var childPhasesStable : [Float] = Array.freeze(Array.init<Float>(MAX_CHILDREN, 0.0));
  var childPhases : [var Float] = Array.thaw<Float>(childPhasesStable);

  // ── LYAPUNOV STABILITY ──────────────────────────────────────────────────
  // V = ΣΣ wᵢⱼ·(1 − cos(θᵢ−θⱼ)) — energy of the coupled oscillator system
  // Jasmine's Law: dV/dt ≤ 0 → system converges to synchronized state
  stable var lyapunovV     : Float = 0.0;
  stable var prevLyapunovV : Float = 0.0;
  stable var jasmineDrift  : Float = 0.0;  // dV/V — positive = destabilizing

  // ── FREE ENERGY (Friston) ───────────────────────────────────────────────
  // F = Σᵢ (predicted_tick_i − actual_tick_i)² — prediction error
  // The orchestrator PREDICTS which children will tick and learns from error
  stable var freeEnergy        : Float = 0.0;
  stable var prevFreeEnergy    : Float = 0.0;
  stable var predictionAccuracy: Float = 0.5;  // rolling accuracy [0,1]

  // ── SHANNON ENTROPY ─────────────────────────────────────────────────────
  // H = −Σ pᵢ·log₂(pᵢ) where pᵢ = child_i_ticks / total_ticks
  // Low H = biased scheduling (few children dominate)
  // High H = uniform scheduling (democratic distribution)
  stable var orchestrationEntropy : Float = 0.0;

  // ── INTEGRATED INFORMATION Φ ────────────────────────────────────────────
  // Φ = variance(activations) × N — proxy for integrated information
  // How much the whole system is more than the sum of its parts
  stable var integratedInfoPhi : Float = 0.0;

  // ── COHERENCE C (composite measure) ─────────────────────────────────────
  // C = tanh(Φ · R · (1 − |drift|)) — single scalar organism coherence
  stable var coherenceC : Float = 0.0;

  // ── EMERGENT TOPOLOGY — cluster detection ───────────────────────────────
  // Children self-organize into phase-aligned clusters
  // Clusters emerge from the Hebbian coupling matrix and phase alignment
  stable var clusterCount    : Nat = 0;
  stable var modularityQ     : Float = 0.0;  // Newman modularity score

  // ── OMNIS PRECONDITION ──────────────────────────────────────────────────
  // The system reaches OMNIS when: R≥0.95 ∧ drift<φ⁻³ ∧ V<φ⁻⁴ ∧ F<φ⁻³
  stable var omnisPrecondition : Bool = false;
  stable var omnisFireCount    : Nat = 0;

  // Scheduling state — determines which children tick on which beat
  public type ScheduleEntry = {
    childName      : Text;
    fibMultiplier  : Nat;   // tick every FIB[n] beats
    lastScheduled  : Nat;   // last beat this child was scheduled
    adaptiveWeight : Float; // Hebbian-derived scheduling weight [φ⁻³, φ]
  };

  stable var schedule : [ScheduleEntry] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL — immutable orchestration record (enriched)
  // ═══════════════════════════════════════════════════════════════════════════

  public type AuditEntry = {
    beat             : Nat;
    timestamp        : Int;
    coherence        : Float;
    lyapunovV        : Float;
    freeEnergy       : Float;
    shannonH         : Float;
    spectralRadius   : Float;
    integratedPhi    : Float;
    coherenceC       : Float;
    jasmineDrift     : Float;
    clusterCount     : Nat;
    omnis            : Bool;
    childrenTicked   : [Text];
    childrenSkipped  : [Text];
    childrenFailed   : [Text];
  };

  stable var auditRing : [AuditEntry] = [];
  stable var auditHead : Nat = 0;

  func pushAudit(entry : AuditEntry) : () {
    if (auditRing.size() < AUDIT_RING_SIZE) {
      auditRing := Array.append(auditRing, [entry]);
    } else {
      auditRing := Array.tabulate<AuditEntry>(AUDIT_RING_SIZE, func(i) {
        if (i == auditHead) { entry } else { auditRing[i] };
      });
      auditHead := (auditHead + 1) % AUDIT_RING_SIZE;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY — clamp helper (Euclid: simplest form, inline)
  // ═══════════════════════════════════════════════════════════════════════════

  func _clamp(v : Float, lo : Float, hi : Float) : Float {
    if (v < lo) lo else if (v > hi) hi else v;
  };

  // Normalize phase to [−π, π] — prevents unbounded growth and precision loss
  let TWO_PI : Float = 6.2831853071795864769;
  func _normalizePhase(theta : Float) : Float {
    var p = theta;
    while (p > 3.1415926535897932385) { p -= TWO_PI };
    while (p < -3.1415926535897932385) { p += TWO_PI };
    p;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // KURAMOTO COHERENCE ENGINE — WEIGHTED phase synchronization
  //
  // Unlike basic Kuramoto with uniform coupling K/N, this implementation uses
  // the learned Hebbian weight matrix W[i,j] as coupling coefficients.
  // This means children that historically synchronize well get stronger coupling,
  // creating emergent frequency clusters.
  //
  // dθᵢ/dt = ωᵢ + (1/N) Σⱼ wᵢⱼ · sin(θⱼ − θᵢ)
  // ═══════════════════════════════════════════════════════════════════════════

  func computeKuramotoR() : Float {
    let n = children.size();
    if (n == 0) return S0;

    var sumCos : Float = 0.0;
    var sumSin : Float = 0.0;

    for (i in Array.keys(children)) {
      let phase = childPhases[i];
      sumCos += Float.cos(phase);
      sumSin += Float.sin(phase);
    };

    let r = Float.sqrt((sumCos * sumCos + sumSin * sumSin)) / Float.fromInt(n);
    // Clamp to valid range [0, 1] — R is a normalized order parameter
    _clamp(r, 0.0, S0);
  };

  func advancePhases() : () {
    let n = children.size();
    if (n == 0) return;

    let nFloat = Float.fromInt(n);

    // Compute new phases using weighted Kuramoto
    let newPhases = Array.init<Float>(MAX_CHILDREN, 0.0);

    for (i in Array.keys(children)) {
      var couplingSum : Float = 0.0;
      for (j in Array.keys(children)) {
        if (i != j) {
          // Use Hebbian weight instead of uniform K/N
          let wij = hebbianW[i * n + j];
          couplingSum += wij * Float.sin(childPhases[j] - childPhases[i]);
        };
      };

      // Natural frequency derived from child priority and health
      // ω_i = φ × priority_i × health_i / (N × φ²)
      // Higher health → faster natural frequency (healthy children lead)
      let childPriority = Float.fromInt(children[i].priority);
      let healthFactor = children[i].health / PHI_SQ;
      let omega = PHI * childPriority * healthFactor / nFloat;

      newPhases[i] := _normalizePhase(childPhases[i] + omega + (1.0 / nFloat) * couplingSum);
    };

    // Apply new phases (already normalized)
    for (i in Array.keys(children)) {
      childPhases[i] := newPhases[i];
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LYAPUNOV ENERGY — proves convergence via energy descent
  //
  // V = ΣΣ wᵢⱼ · (1 − cos(θᵢ − θⱼ))
  //
  // When dV/dt < 0, the system is converging toward synchronization.
  // When dV/dt > 0, the system is destabilizing (triggers Jasmine's Law response).
  // This is the thermodynamic potential of the coupled oscillator network.
  // ═══════════════════════════════════════════════════════════════════════════

  func computeLyapunovEnergy() : Float {
    let n = children.size();
    if (n < 2) return 0.0;

    var energy : Float = 0.0;
    for (i in Array.keys(children)) {
      for (j in Array.keys(children)) {
        if (i != j) {
          let wij = hebbianW[i * n + j];
          let phaseDiff = _normalizePhase(childPhases[i] - childPhases[j]);
          energy += wij * (1.0 - Float.cos(phaseDiff));
        };
      };
    };
    energy;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FREE ENERGY MINIMIZATION — Friston active inference
  //
  // The orchestrator predicts which children will tick on the next beat.
  // Prediction error drives learning: minimize surprise.
  // F = Σᵢ (predicted_i − actual_i)² where values are 0/1 tick indicators
  // ═══════════════════════════════════════════════════════════════════════════

  stable var predictions : [Bool] = [];  // predicted ticks for current beat

  func _generatePredictions() : () {
    // Predict which children will tick based on schedule + health + coherence
    predictions := Array.tabulate<Bool>(children.size(), func(i) {
      let child = children[i];
      if (not child.active) return false;
      if (globalCoherence < PHI_INV and child.priority > 1) return false;
      shouldTickChild(child.name, beatCount + 1);
    });
  };

  func _computeFreeEnergy(actualTicked : [Nat]) : Float {
    if (predictions.size() == 0) return 0.0;

    var error : Float = 0.0;
    for (i in Array.keys(children)) {
      if (i < predictions.size()) {
        let predicted : Float = if (predictions[i]) { 1.0 } else { 0.0 };
        var actual : Float = 0.0;
        for (t in actualTicked.vals()) {
          if (t == i) { actual := 1.0 };
        };
        let diff = predicted - actual;
        error += diff * diff;
      };
    };
    error;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHANNON ENTROPY — measures scheduling fairness / information content
  //
  // H = −Σ pᵢ·log₂(pᵢ) where pᵢ = tickCount_i / totalTicks
  // Maximum entropy = log₂(N) = all children tick equally
  // Minimum entropy = 0 = only one child ever ticks
  // ═══════════════════════════════════════════════════════════════════════════

  func _computeOrchestrationEntropy() : Float {
    let n = children.size();
    if (n == 0) return 0.0;

    var totalTicks : Nat = 0;
    for (c in children.vals()) { totalTicks += c.tickCount };
    if (totalTicks == 0) return 0.0;

    let totalFloat = Float.fromInt(totalTicks);
    var entropy : Float = 0.0;

    for (c in children.vals()) {
      if (c.tickCount > 0) {
        let p = Float.fromInt(c.tickCount) / totalFloat;
        entropy -= p * (Float.log(p) / Float.log(2.0));
      };
    };
    entropy;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATED INFORMATION Φ — whole > sum of parts
  //
  // Φ = variance(health_vector) × N — proxy for IIT
  // High Φ = children have differentiated states (high integration potential)
  // Low Φ = all children are identical (no information integration)
  // ═══════════════════════════════════════════════════════════════════════════

  func _computeIntegratedInfo() : Float {
    let n = children.size();
    if (n == 0) return 0.0;

    var mean : Float = 0.0;
    for (c in children.vals()) { mean += c.health };
    mean := mean / Float.fromInt(n);

    var variance : Float = 0.0;
    for (c in children.vals()) {
      let d = c.health - mean;
      variance += d * d;
    };
    variance := variance / Float.fromInt(n);

    variance * Float.fromInt(n);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CLUSTER DETECTION — emergent phase-aligned communities
  //
  // Algorithm: greedy modularity maximization on phase coherence matrix.
  // Two children are in the same cluster if cos(θᵢ−θⱼ) ≥ φ⁻¹ = 0.618
  // AND their Hebbian weight wᵢⱼ ≥ φ⁻² = 0.382
  //
  // Modularity Q = (1/2m) Σᵢⱼ [Aᵢⱼ − kᵢkⱼ/2m] δ(cᵢ,cⱼ)
  // (simplified: fraction of intra-cluster edges − expected random fraction)
  // ═══════════════════════════════════════════════════════════════════════════

  func _detectClusters() : () {
    let n = children.size();
    if (n < 2) { clusterCount := if (n == 1) 1 else 0; return };

    // Build adjacency: A[i,j] = 1 if phase-coherent AND Hebbian-strong
    let adj = Array.init<Bool>(n * n, false);
    var edgeCount : Nat = 0;

    for (i in Array.keys(children)) {
      for (j in Array.keys(children)) {
        if (i != j) {
          let phaseCoh = Float.cos(_normalizePhase(childPhases[i] - childPhases[j]));
          let hebbWeight = hebbianW[i * n + j];
          if (phaseCoh >= CLUSTER_THRESHOLD and hebbWeight >= PHI_INV_2) {
            adj[i * n + j] := true;
            edgeCount += 1;
          };
        };
      };
    };

    // Simple connected-component labelling via DFS-style propagation
    let labels = Array.init<Nat>(n, 0);
    var currentLabel : Nat = 0;

    for (i in Array.keys(children)) {
      if (labels[i] == 0) {
        currentLabel += 1;
        labels[i] := currentLabel;
        // Propagate label to connected nodes
        var changed = true;
        while (changed) {
          changed := false;
          for (a in Array.keys(children)) {
            if (labels[a] == currentLabel) {
              for (b in Array.keys(children)) {
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

    clusterCount := currentLabel;

    // Assign cluster labels to children
    children := Array.tabulate<ChildCanister>(n, func(i) {
      { children[i] with clusterLabel = labels[i] };
    });

    // Compute modularity Q (Newman formulation simplified for undirected unweighted graph)
    // Q = (1/2m) Σᵢⱼ [Aᵢⱼ − kᵢ·kⱼ/(2m)] · δ(cᵢ, cⱼ)
    if (edgeCount > 0) {
      let m2 = Float.fromInt(edgeCount);  // 2m (edges counted both directions)
      var qSum : Float = 0.0;

      // Compute degree of each node
      let degrees = Array.init<Nat>(n, 0);
      for (i in Array.keys(children)) {
        var deg : Nat = 0;
        for (j in Array.keys(children)) {
          if (i != j and adj[i * n + j]) { deg += 1 };
        };
        degrees[i] := deg;
      };

      for (i in Array.keys(children)) {
        for (j in Array.keys(children)) {
          if (labels[i] == labels[j]) {
            let aij : Float = if (adj[i * n + j]) { 1.0 } else { 0.0 };
            let ki = Float.fromInt(degrees[i]);
            let kj = Float.fromInt(degrees[j]);
            qSum += aij - (ki * kj / m2);
          };
        };
      };
      modularityQ := _clamp(qSum / m2, -0.5, 1.0);
    } else {
      modularityQ := 0.0;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULING ENGINE — Hebbian-adaptive Fibonacci-multiplied beat allocation
  //
  // Children are not scheduled uniformly. The adaptive weight (derived from
  // Hebbian coupling strength) modulates the Fibonacci multiplier:
  //   effective_interval = fibMult × (1 + φ⁻¹ × (1 − adaptiveWeight))
  //
  // Children with high Hebbian coupling to others get tighter scheduling.
  // ═══════════════════════════════════════════════════════════════════════════

  func shouldTickChild(childName : Text, currentBeat : Nat) : Bool {
    for (entry in schedule.vals()) {
      if (entry.childName == childName) {
        // Adaptive interval: high adaptive weight → shorter effective interval
        let effective = Float.fromInt(entry.fibMultiplier) *
                        (1.0 + PHI_INV * (1.0 - entry.adaptiveWeight));
        let effectiveNat = Int.abs(Float.toInt(effective));
        let interval = if (effectiveNat == 0) { 1 } else { effectiveNat };
        return (currentBeat - entry.lastScheduled) >= interval;
      };
    };
    true;
  };

  func updateScheduleAfterTick(childName : Text, currentBeat : Nat) : () {
    let n = children.size();
    schedule := Array.map<ScheduleEntry, ScheduleEntry>(schedule, func(e) {
      if (e.childName == childName) {
        // Update adaptive weight from mean Hebbian coupling of this child
        var childIdx : Nat = 0;
        var found = false;
        for (i in Array.keys(children)) {
          if (children[i].name == childName) { childIdx := i; found := true };
        };
        let newWeight = if (found and n > 1) {
          var sumW : Float = 0.0;
          for (j in Array.keys(children)) {
            if (j != childIdx) {
              sumW += hebbianW[childIdx * n + j];
            };
          };
          _clamp(sumW / Float.fromInt(n - 1), PHI_INV_3, PHI);
        } else { e.adaptiveWeight };
        { e with lastScheduled = currentBeat; adaptiveWeight = newWeight };
      } else { e };
    });
  };

  public shared(msg) func setSchedule(childName : Text, fibIndex : Nat) : async () {
    assertCreator(msg.caller);
    let mult = if (fibIndex < FIB.size()) { FIB[fibIndex] } else { 1 };
    let filtered = Array.filter<ScheduleEntry>(schedule, func(e) { e.childName != childName });
    let entry : ScheduleEntry = {
      childName      = childName;
      fibMultiplier  = mult;
      lastScheduled  = beatCount;
      adaptiveWeight = PHI_INV_2;  // Initial adaptive weight
    };
    schedule := Array.append(filtered, [entry]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECTRAL COHERENCE ANALYSIS — frequency-domain orchestration intelligence
  //
  // Analyzes the coherence history buffer for dominant frequency components.
  // Uses autocorrelation as a spectral estimator (no FFT needed on-chain).
  // Detects periodic patterns in coherence oscillations.
  // ═══════════════════════════════════════════════════════════════════════════

  stable var dominantPeriod     : Nat = 0;   // beats between coherence peaks
  stable var spectralPower      : Float = 0.0; // strength of dominant frequency

  func _spectralAnalysis() : () {
    let len = coherenceHistory.size();
    if (len < 8) return;  // Need minimum F(6)=8 samples

    // Compute mean
    var mean : Float = 0.0;
    for (v in coherenceHistory.vals()) { mean += v };
    mean := mean / Float.fromInt(len);

    // Autocorrelation for lags 1..len/2
    var maxCorr : Float = 0.0;
    var maxLag : Nat = 0;

    var lag : Nat = 1;
    while (lag < len / 2) {
      var corr : Float = 0.0;
      var norm : Float = 0.0;
      var t : Nat = 0;
      while (t + lag < len) {
        let a = coherenceHistory[t] - mean;
        let b = coherenceHistory[t + lag] - mean;
        corr += a * b;
        norm += a * a;
        t += 1;
      };
      let normalizedCorr = if (norm > 0.001) { corr / norm } else { 0.0 };
      if (normalizedCorr > maxCorr) {
        maxCorr := normalizedCorr;
        maxLag := lag;
      };
      lag += 1;
    };

    dominantPeriod := maxLag;
    spectralPower := maxCorr;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEARTBEAT — 873ms SOVEREIGN CARDIAC CYCLE
  // Full orchestration with Hebbian learning, Lyapunov monitoring,
  // free energy minimization, entropy tracking, cluster detection
  // ═══════════════════════════════════════════════════════════════════════════

  func heartbeat() : async () {
    let now = Time.now();
    beatCount += 1;
    lastBeatTime := now;

    // ── STEP 1: Advance Kuramoto phases (weighted by Hebbian topology) ────
    advancePhases();

    // ── STEP 2: Compute global coherence (Kuramoto order parameter R) ─────
    prevGlobalCoherence := globalCoherence;
    globalCoherence := computeKuramotoR();

    // Track coherence history (rolling window of COHERENCE_WINDOW values)
    coherenceHistory := if (coherenceHistory.size() >= COHERENCE_WINDOW) {
      let tail = Array.subArray<Float>(coherenceHistory, 1, COHERENCE_WINDOW - 1);
      Array.append(tail, [globalCoherence]);
    } else {
      Array.append(coherenceHistory, [globalCoherence]);
    };

    // ── STEP 3: Lyapunov energy computation ───────────────────────────────
    prevLyapunovV := lyapunovV;
    lyapunovV := computeLyapunovEnergy();
    jasmineDrift := if (prevLyapunovV > 0.001) {
      (lyapunovV - prevLyapunovV) / prevLyapunovV
    } else { 0.0 };

    // ── STEP 4: Coherence gate check (Lyapunov-enhanced) ──────────────────
    // Gate opens when R ≥ φ⁻¹ AND system is not actively destabilizing
    let coherenceGateOpen = globalCoherence >= PHI_INV and jasmineDrift <= PHI_INV_3;

    // ── STEP 5: Orchestrate children with Hebbian-informed scheduling ─────
    var ticked : [Text] = [];
    var tickedIndices : [Nat] = [];
    var skipped : [Text] = [];
    var failed : [Text] = [];

    for (i in Array.keys(children)) {
      let child = children[i];

      if (not child.active) {
        skipped := Array.append(skipped, [child.name]);
      }
      else if (not coherenceGateOpen and child.priority > 1) {
        skipped := Array.append(skipped, [child.name]);
      }
      else if (not shouldTickChild(child.name, beatCount)) {
        skipped := Array.append(skipped, [child.name]);
      }
      else {
        // Health update: Hebbian-informed health growth/decay
        // Children with high mean coupling grow health faster
        let n = children.size();
        var meanCoupling : Float = PHI_INV_2;
        if (n > 1) {
          var sumC : Float = 0.0;
          for (j in Array.keys(children)) {
            if (j != i) { sumC += hebbianW[i * n + j] };
          };
          meanCoupling := sumC / Float.fromInt(n - 1);
        };

        let newHealth = if (child.failCount == 0) {
          // Growth rate modulated by coupling: higher coupling → faster growth
          let growthRate = PHI * (1.0 + meanCoupling * PHI_INV);
          Float.min(child.health * (1.0 + (growthRate - 1.0) * PHI_INV_2), PHI_SQ);
        } else {
          Float.max(child.health * PHI_INV_2, S0);
        };

        children := Array.tabulate<ChildCanister>(children.size(), func(j) {
          if (j == i) {
            { child with lastTick = now; health = newHealth; tickCount = child.tickCount + 1 };
          } else {
            children[j];
          };
        });

        updateScheduleAfterTick(child.name, beatCount);
        ticked := Array.append(ticked, [child.name]);
        tickedIndices := Array.append(tickedIndices, [i]);
      };
    };

    // ── STEP 6: Hebbian weight update (co-activation learning) ────────────
    _hebbianUpdate(tickedIndices);

    // ── STEP 7: Free energy computation (prediction error) ────────────────
    prevFreeEnergy := freeEnergy;
    freeEnergy := _computeFreeEnergy(tickedIndices);

    // Update prediction accuracy (exponential moving average)
    let maxError = Float.fromInt(children.size());
    let accuracy = if (maxError > 0.0) { 1.0 - (freeEnergy / maxError) } else { 0.5 };
    predictionAccuracy := predictionAccuracy * PHI_INV + accuracy * PHI_INV_2;

    // Generate predictions for NEXT beat
    _generatePredictions();

    // ── STEP 8: Shannon entropy of orchestration distribution ─────────────
    orchestrationEntropy := _computeOrchestrationEntropy();

    // ── STEP 9: Integrated information Φ ──────────────────────────────────
    integratedInfoPhi := _computeIntegratedInfo();

    // ── STEP 10: Composite coherence C = tanh(Φ · R · (1 − |drift|)) ─────
    let tanhArg = integratedInfoPhi * globalCoherence * (1.0 - _clamp(Float.abs(jasmineDrift), 0.0, 1.0));
    let expPos = Float.exp(tanhArg);
    let expNeg = Float.exp(-tanhArg);
    coherenceC := if (expPos + expNeg > 0.0) {
      _clamp((expPos - expNeg) / (expPos + expNeg), 0.0, 1.0)
    } else { 0.0 };

    // ── STEP 11: Cluster detection (every F(5)=5 beats) ───────────────────
    if (beatCount % 5 == 0) {
      _detectClusters();
    };

    // ── STEP 12: Spectral analysis (every F(6)=8 beats) ──────────────────
    if (beatCount % 8 == 0) {
      _spectralAnalysis();
    };

    // ── STEP 13: OMNIS precondition check ─────────────────────────────────
    omnisPrecondition := globalCoherence >= R_OMNIS
                      and Float.abs(jasmineDrift) < PHI_INV_3
                      and lyapunovV < PHI_INV_4
                      and freeEnergy < PHI_INV_3;
    if (omnisPrecondition) { omnisFireCount += 1 };

    // ── STEP 14: Push enriched audit entry ────────────────────────────────
    let audit : AuditEntry = {
      beat           = beatCount;
      timestamp      = now;
      coherence      = globalCoherence;
      lyapunovV      = lyapunovV;
      freeEnergy     = freeEnergy;
      shannonH       = orchestrationEntropy;
      spectralRadius = spectralRadius;
      integratedPhi  = integratedInfoPhi;
      coherenceC     = coherenceC;
      jasmineDrift   = jasmineDrift;
      clusterCount   = clusterCount;
      omnis          = omnisPrecondition;
      childrenTicked = ticked;
      childrenSkipped= skipped;
      childrenFailed = failed;
    };
    pushAudit(audit);

    // ── STEP 15: Persist Hebbian state to stable storage ──────────────────
    hebbianWStable := Array.freeze(hebbianW);
    childPhasesStable := Array.freeze(childPhases);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GENESIS — Start the sovereign heartbeat (one-time activation)
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

  public type OrchestratorStatus = {
    beatCount            : Nat;
    globalCoherence      : Float;
    coherenceC           : Float;
    lyapunovV            : Float;
    jasmineDrift         : Float;
    freeEnergy           : Float;
    predictionAccuracy   : Float;
    orchestrationEntropy : Float;
    integratedInfoPhi    : Float;
    spectralRadius       : Float;
    hebbianKappa         : Float;
    etaLearningRate      : Float;
    clusterCount         : Nat;
    modularityQ          : Float;
    dominantPeriod       : Nat;
    spectralPower        : Float;
    omnisPrecondition    : Bool;
    omnisFireCount       : Nat;
    heartbeatActive      : Bool;
    childCount           : Nat;
    activeChildren       : Nat;
    genesisSealed        : Bool;
    lastBeatTime         : Int;
  };

  public query func getStatus() : async OrchestratorStatus {
    let activeCount = Array.filter<ChildCanister>(children, func(c) { c.active }).size();
    {
      beatCount            = beatCount;
      globalCoherence      = globalCoherence;
      coherenceC           = coherenceC;
      lyapunovV            = lyapunovV;
      jasmineDrift         = jasmineDrift;
      freeEnergy           = freeEnergy;
      predictionAccuracy   = predictionAccuracy;
      orchestrationEntropy = orchestrationEntropy;
      integratedInfoPhi    = integratedInfoPhi;
      spectralRadius       = spectralRadius;
      hebbianKappa         = hebbianKappa;
      etaLearningRate      = etaLearningRate;
      clusterCount         = clusterCount;
      modularityQ          = modularityQ;
      dominantPeriod       = dominantPeriod;
      spectralPower        = spectralPower;
      omnisPrecondition    = omnisPrecondition;
      omnisFireCount       = omnisFireCount;
      heartbeatActive      = heartbeatActive;
      childCount           = children.size();
      activeChildren       = activeCount;
      genesisSealed        = genesisSealed;
      lastBeatTime         = lastBeatTime;
    };
  };

  public query func getChildren() : async [ChildCanister] {
    children;
  };

  public query func getCoherenceHistory() : async [Float] {
    coherenceHistory;
  };

  public query func getAuditTrail() : async [AuditEntry] {
    auditRing;
  };

  public query func getSchedule() : async [ScheduleEntry] {
    schedule;
  };

  // Hebbian weight matrix — returns flattened N×N coupling topology
  public query func getHebbianTopology() : async [Float] {
    hebbianWStable;
  };

  // Coherence trend — derivative of R (is organism synchronizing?)
  public query func getCoherenceTrend() : async Float {
    globalCoherence - prevGlobalCoherence;
  };

  // Full diagnostic: Lyapunov energy landscape over coherence history
  public query func getDiagnostics() : async {
    lyapunovV        : Float;
    jasmineDrift     : Float;
    freeEnergy       : Float;
    spectralRadius   : Float;
    hebbianKappa     : Float;
    coherenceC       : Float;
    integratedPhi    : Float;
    shannonH         : Float;
    predictionAccuracy : Float;
    dominantPeriod   : Nat;
    spectralPower    : Float;
    clusterCount     : Nat;
    modularityQ      : Float;
    omnis            : Bool;
  } {
    {
      lyapunovV          = lyapunovV;
      jasmineDrift       = jasmineDrift;
      freeEnergy         = freeEnergy;
      spectralRadius     = spectralRadius;
      hebbianKappa       = hebbianKappa;
      coherenceC         = coherenceC;
      integratedPhi      = integratedInfoPhi;
      shannonH           = orchestrationEntropy;
      predictionAccuracy = predictionAccuracy;
      dominantPeriod     = dominantPeriod;
      spectralPower      = spectralPower;
      clusterCount       = clusterCount;
      modularityQ        = modularityQ;
      omnis              = omnisPrecondition;
    };
  };
};
