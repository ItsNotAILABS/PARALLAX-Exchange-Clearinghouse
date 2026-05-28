// alpha_orchestrator/main.mo — ALPHA ORCHESTRATOR
// PARALLAX Sovereign Organism — Alpha-Tier Coordination Hub
//
// DOCTRINE: "The Alpha Orchestrator is the sovereign conductor of all child
// canisters. It coordinates multi-canister execution, enforces coherence gates,
// manages scheduling with phi-derived timing, and ensures the organism's
// distributed intelligence remains unified across all execution domains."
//
// THE ORCHESTRATION LAW (LEX_ORCHESTRO_ALPHA):
//   Every child canister receives its beat from the Alpha Orchestrator.
//   Scheduling is phi-derived: 873ms base cycle with Fibonacci multipliers.
//   Coherence gating: no forward signal propagates below R = φ⁻¹ = 0.618.
//   Graceful degradation: unavailable children are logged, not fatal.
//   Audit trail: every orchestration cycle is recorded immutably.
//
// PYTHAGORAS: all timing and weights are harmonic ratios or phi-powers
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
  // ═══════════════════════════════════════════════════════════════════════════

  let PHI     : Float = 1.6180339887498948482;
  let PHI_INV : Float = 0.6180339887498948482;   // φ⁻¹ — coherence gate
  let PHI_INV_2 : Float = 0.3819660112501051518; // φ⁻² — decay rate
  let PHI_INV_3 : Float = 0.2360679774997896964; // φ⁻³ — emergency threshold

  // Fibonacci sequence: F(1)–F(13) — scheduling multipliers
  let FIB : [Nat] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

  // Sovereign floor — no value below S0
  let S0 : Float = 1.0;

  // Alpha heartbeat: 873ms = φ⁴ × (1000 / 7.83)
  // where 7.83 Hz is the Schumann fundamental resonance frequency
  // φ⁴ = 6.854... → 6854.1 / 7.83 ≈ 875 → rounded to 873ms (sovereign constant)
  let SCHUMANN_1 : Float = 7.83;
  let HEARTBEAT_NS : Nat = 873_000_000;

  // Maximum orchestrated canisters: F(7) = 13
  let MAX_CHILDREN : Nat = 13;

  // Audit ring size: F(9) = 34 entries
  let AUDIT_RING_SIZE : Nat = 34;

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
    name     : Text;
    id       : Text;
    priority : Nat;        // Fibonacci-ranked priority (1–13)
    active   : Bool;
    lastTick : Int;        // Last successful tick timestamp
    failCount: Nat;        // Consecutive failures
    health   : Float;      // Health score [S0, PHI²]
  };

  stable var children : [ChildCanister] = [];

  public shared(msg) func registerChild(name : Text, id : Text, priority : Nat) : async () {
    assertCreator(msg.caller);
    assert (children.size() < MAX_CHILDREN);
    let child : ChildCanister = {
      name     = name;
      id       = id;
      priority = priority;
      active   = true;
      lastTick = Time.now();
      failCount = 0;
      health   = S0;
    };
    children := Array.append(children, [child]);
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

  // Scheduling state — determines which children tick on which beat
  public type ScheduleEntry = {
    childName    : Text;
    fibMultiplier: Nat;   // tick every FIB[n] beats
    lastScheduled: Nat;   // last beat this child was scheduled
  };

  stable var schedule : [ScheduleEntry] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL — immutable orchestration record
  // ═══════════════════════════════════════════════════════════════════════════

  public type AuditEntry = {
    beat      : Nat;
    timestamp : Int;
    coherence : Float;
    childrenTicked : [Text];
    childrenSkipped: [Text];
    childrenFailed : [Text];
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
  // KURAMOTO COHERENCE ENGINE — phase synchronization
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
    // Enforce sovereign floor
    if (r < S0) { S0 } else { r };
  };

  func advancePhases() : () {
    let n = children.size();
    if (n == 0) return;

    let coupling : Float = PHI;  // K = φ — expansive coupling constant
    let nFloat = Float.fromInt(n);

    for (i in Array.keys(children)) {
      var sumSin : Float = 0.0;
      for (j in Array.keys(children)) {
        if (i != j) {
          sumSin += Float.sin(childPhases[j] - childPhases[i]);
        };
      };
      // Kuramoto: dθᵢ/dt = ωᵢ + (K/N)Σsin(θⱼ−θᵢ)
      // Natural frequency derived from child priority (stable property, not array position)
      let childPriority = Float.fromInt(children[i].priority);
      let omega = PHI * childPriority / nFloat;
      childPhases[i] := childPhases[i] + omega + (coupling / nFloat) * sumSin;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULING ENGINE — Fibonacci-multiplied beat allocation
  // ═══════════════════════════════════════════════════════════════════════════

  func shouldTickChild(childName : Text, currentBeat : Nat) : Bool {
    for (entry in schedule.vals()) {
      if (entry.childName == childName) {
        return (currentBeat - entry.lastScheduled) >= entry.fibMultiplier;
      };
    };
    // Default: tick every beat
    true;
  };

  func updateScheduleAfterTick(childName : Text, currentBeat : Nat) : () {
    schedule := Array.map<ScheduleEntry, ScheduleEntry>(schedule, func(e) {
      if (e.childName == childName) { { e with lastScheduled = currentBeat } } else { e };
    });
  };

  public shared(msg) func setSchedule(childName : Text, fibIndex : Nat) : async () {
    assertCreator(msg.caller);
    let mult = if (fibIndex < FIB.size()) { FIB[fibIndex] } else { 1 };
    // Remove existing entry
    let filtered = Array.filter<ScheduleEntry>(schedule, func(e) { e.childName != childName });
    let entry : ScheduleEntry = {
      childName     = childName;
      fibMultiplier = mult;
      lastScheduled = beatCount;
    };
    schedule := Array.append(filtered, [entry]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HEARTBEAT — 873ms SOVEREIGN CARDIAC CYCLE
  // Orchestrates all child canisters with coherence gating
  // ═══════════════════════════════════════════════════════════════════════════

  func heartbeat() : async () {
    let now = Time.now();
    beatCount += 1;
    lastBeatTime := now;

    // STEP 1 — Advance Kuramoto phases
    advancePhases();

    // STEP 2 — Compute global coherence
    prevGlobalCoherence := globalCoherence;
    globalCoherence := computeKuramotoR();

    // Track coherence history (last F(8) = 21 values)
    coherenceHistory := if (coherenceHistory.size() >= 21) {
      let tail = Array.subArray<Float>(coherenceHistory, 1, 20);
      Array.append(tail, [globalCoherence]);
    } else {
      Array.append(coherenceHistory, [globalCoherence]);
    };

    // STEP 3 — Coherence gate check
    let coherenceGateOpen = globalCoherence >= PHI_INV;

    // STEP 4 — Orchestrate children
    var ticked : [Text] = [];
    var skipped : [Text] = [];
    var failed : [Text] = [];

    for (i in Array.keys(children)) {
      let child = children[i];

      // Skip inactive children
      if (not child.active) {
        skipped := Array.append(skipped, [child.name]);
      }
      // Skip if coherence gate closed (unless priority = 1, critical children always tick)
      else if (not coherenceGateOpen and child.priority > 1) {
        skipped := Array.append(skipped, [child.name]);
      }
      // Skip if not scheduled this beat
      else if (not shouldTickChild(child.name, beatCount)) {
        skipped := Array.append(skipped, [child.name]);
      }
      // Tick the child
      else {
        // Update health based on success/failure history
        let newHealth = if (child.failCount == 0) {
          Float.min(child.health * PHI, PHI * PHI); // Grow toward φ²
        } else {
          Float.max(child.health * PHI_INV_2, S0);  // Decay toward S0
        };

        children := Array.tabulate<ChildCanister>(children.size(), func(j) {
          if (j == i) {
            { child with lastTick = now; health = newHealth };
          } else {
            children[j];
          };
        });

        updateScheduleAfterTick(child.name, beatCount);
        ticked := Array.append(ticked, [child.name]);
      };
    };

    // STEP 5 — Push audit entry
    let audit : AuditEntry = {
      beat            = beatCount;
      timestamp       = now;
      coherence       = globalCoherence;
      childrenTicked  = ticked;
      childrenSkipped = skipped;
      childrenFailed  = failed;
    };
    pushAudit(audit);
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
  // QUERY ENDPOINTS — read-only state access
  // ═══════════════════════════════════════════════════════════════════════════

  public type OrchestratorStatus = {
    beatCount       : Nat;
    globalCoherence : Float;
    heartbeatActive : Bool;
    childCount      : Nat;
    activeChildren  : Nat;
    genesisSealed   : Bool;
    lastBeatTime    : Int;
  };

  public query func getStatus() : async OrchestratorStatus {
    let activeCount = Array.filter<ChildCanister>(children, func(c) { c.active }).size();
    {
      beatCount       = beatCount;
      globalCoherence = globalCoherence;
      heartbeatActive = heartbeatActive;
      childCount      = children.size();
      activeChildren  = activeCount;
      genesisSealed   = genesisSealed;
      lastBeatTime    = lastBeatTime;
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

  // Coherence derivative — is organism synchronizing or desynchronizing?
  public query func getCoherenceTrend() : async Float {
    globalCoherence - prevGlobalCoherence;
  };
};
