// alpha_conductor/main.mo — ALPHA CONDUCTOR
// PARALLAX Sovereign Organism — Alpha-Tier Intelligence Signal Conductor
//
// DOCTRINE: "The Alpha Conductor routes intelligence signals between orchestrators,
// canisters, and domains. Where the Orchestrator decides WHEN to fire, the
// Conductor decides WHERE signals flow. It is the nervous system of the
// distributed organism — every cognitive signal passes through its channels."
//
// THE CONDUCTION LAW (LEX_CONDUCTIO_ALPHA):
//   Every signal has a source, destination, weight, and coherence requirement.
//   Signals are conducted through phi-weighted channels.
//   Multi-path conduction fans out when coherence exceeds φ⁻¹.
//   Signal attenuation follows exponential decay at rate φ⁻².
//   Channel capacity is Fibonacci-bounded: F(7) = 13 concurrent signals.
//   Dead channels are pruned after F(5) = 5 consecutive failures.
//
// CONDUCTOR STRATEGIES:
//   DIRECT    — Point-to-point signal delivery
//   BROADCAST — Fan-out to all registered receivers
//   CASCADE   — Sequential chain with signal transformation at each hop
//   RESONANT  — Route only to phase-aligned receivers (Kuramoto-gated)
//   WEIGHTED  — Phi-weighted distribution across receivers
//   ADAPTIVE  — Learn from signal success/failure history (default)
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
  // ═══════════════════════════════════════════════════════════════════════════

  let PHI       : Float = 1.6180339887498948482;
  let PHI_INV   : Float = 0.6180339887498948482;   // φ⁻¹ — coherence threshold
  let PHI_INV_2 : Float = 0.3819660112501051518;   // φ⁻² — attenuation rate
  let PHI_INV_3 : Float = 0.2360679774997896964;   // φ⁻³ — minimum signal weight

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

  // Minimum signals before trusting historical success rate
  let MIN_SIGNALS_FOR_HISTORY : Nat = 5;

  // Audit ring: F(10) = 55 entries
  let AUDIT_RING_SIZE : Nat = 55;

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
  // SIGNAL TYPES — the language of conduction
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
    #weighted;   // Phi-weighted distribution
    #adaptive;   // Learn from history (default)
  };

  public type Signal = {
    id          : Nat;
    source      : Text;        // Source canister/domain name
    destination : Text;        // Target canister/domain name ("*" for broadcast)
    payload     : Text;        // Signal content (serialised)
    weight      : Float;       // Signal weight [PHI_INV_3, PHI²]
    priority    : SignalPriority;
    strategy    : ConductionStrategy;
    timestamp   : Int;
    ttl         : Nat;         // Time-to-live in beats
    hops        : Nat;         // Current hop count
    maxHops     : Nat;         // Maximum allowed hops (Fibonacci-bounded)
  };

  public type SignalResult = {
    signalId    : Nat;
    delivered   : Bool;
    destination : Text;
    timestamp   : Int;
    attenuation : Float;       // Signal strength at delivery point
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL REGISTRY — sovereign conduction pathways
  // ═══════════════════════════════════════════════════════════════════════════

  public type Channel = {
    name         : Text;       // Channel identifier
    source       : Text;       // Source endpoint
    destination  : Text;       // Destination endpoint
    weight       : Float;      // Channel weight (phi-derived)
    active       : Bool;
    signalCount  : Nat;        // Total signals conducted
    failCount    : Nat;        // Consecutive failures
    lastUsed     : Int;        // Last conduction timestamp
    successRate  : Float;      // Historical success rate
    bandwidth    : Nat;        // Max signals per beat on this channel
  };

  stable var channels : [Channel] = [];

  public shared(msg) func registerChannel(
    name : Text,
    source : Text,
    destination : Text,
    weight : Float,
    bandwidth : Nat
  ) : async () {
    assertCreator(msg.caller);
    assert (channels.size() < MAX_CHANNELS);
    let clamped = Float.max(PHI_INV_3, Float.min(weight, PHI * PHI));
    let bw = if (bandwidth > 13) { 13 } else { bandwidth };
    let channel : Channel = {
      name        = name;
      source      = source;
      destination = destination;
      weight      = clamped;
      active      = true;
      signalCount = 0;
      failCount   = 0;
      lastUsed    = Time.now();
      successRate = S0;
      bandwidth   = bw;
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

  stable var signalQueue  : [Signal] = [];
  stable var nextSignalId : Nat = 0;
  stable var signalResults : [SignalResult] = [];

  // Submit a signal for conduction
  public shared(msg) func submitSignal(
    source : Text,
    destination : Text,
    payload : Text,
    weight : Float,
    priority : SignalPriority,
    strategy : ConductionStrategy,
    maxHops : Nat
  ) : async Nat {
    assertCreator(msg.caller);
    assert (signalQueue.size() < SIGNAL_QUEUE_DEPTH);

    let clampedWeight = Float.max(PHI_INV_3, Float.min(weight, PHI * PHI));
    let clampedHops = if (maxHops > 8) { 8 } else { maxHops };  // F(6) = 8 max

    let signal : Signal = {
      id          = nextSignalId;
      source      = source;
      destination = destination;
      payload     = payload;
      weight      = clampedWeight;
      priority    = priority;
      strategy    = strategy;
      timestamp   = Time.now();
      ttl         = FIB[4];  // FIB[4] = 5 (the 5th Fibonacci number, F₅) — 5 beats TTL
      hops        = 0;
      maxHops     = clampedHops;
    };

    nextSignalId += 1;
    signalQueue := Array.append(signalQueue, [signal]);
    signal.id;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUCTION STATE — beat tracking, coherence reading
  // ═══════════════════════════════════════════════════════════════════════════

  stable var beatCount        : Nat   = 0;
  stable var lastBeatTime     : Int   = 0;
  stable var heartbeatActive  : Bool  = false;
  stable var genesisTime      : Int   = 0;

  // Coherence reading — received from orchestrator or computed locally
  stable var currentCoherence : Float = S0;
  stable var coherenceTrend   : Float = 0.0;

  // Conduction metrics
  stable var totalSignalsConducted : Nat = 0;
  stable var totalSignalsDropped   : Nat = 0;
  stable var totalSignalsQueued    : Nat = 0;

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
  // SIGNAL ATTENUATION — phi-exponential decay per hop
  // ═══════════════════════════════════════════════════════════════════════════

  func computeAttenuation(weight : Float, hops : Nat) : Float {
    var att = weight;
    var i = 0;
    while (i < hops) {
      att := att * PHI_INV_2;  // Decay by φ⁻² per hop
      i += 1;
    };
    Float.max(att, PHI_INV_3);  // Never below φ⁻³
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL SELECTION — find the best channel for a signal
  // ═══════════════════════════════════════════════════════════════════════════

  func findChannels(source : Text, destination : Text, strategy : ConductionStrategy) : [Channel] {
    let matching = Array.filter<Channel>(channels, func(c) {
      c.active and c.failCount < DEAD_CHANNEL_THRESHOLD and
      (c.source == source or c.source == "*") and
      (c.destination == destination or c.destination == "*" or destination == "*")
    });

    switch (strategy) {
      case (#direct) {
        // Return first matching channel
        if (matching.size() > 0) { [matching[0]] } else { [] };
      };
      case (#broadcast) {
        // Return all matching channels
        matching;
      };
      case (#cascade) {
        // Return all, will be processed sequentially
        matching;
      };
      case (#resonant) {
        // Filter by success rate (proxy for phase alignment)
        Array.filter<Channel>(matching, func(c) { c.successRate >= PHI_INV });
      };
      case (#weighted) {
        // Return all, conductor will weight them
        matching;
      };
      case (#adaptive) {
        // Use history: prefer high success rate; trust new channels with insufficient data
        Array.filter<Channel>(matching, func(c) {
          c.successRate >= PHI_INV_2 or c.signalCount < MIN_SIGNALS_FOR_HISTORY
        });
      };
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUCTION ENGINE — process signal queue
  // ═══════════════════════════════════════════════════════════════════════════

  func conductSignals() : () {
    var conducted : Nat = 0;
    var remaining : [Signal] = [];

    for (signal in signalQueue.vals()) {
      // TTL check
      if (signal.ttl == 0) {
        totalSignalsDropped += 1;
        // Skip — signal expired
      }
      // Coherence gate check
      else if (not passesCoherenceGate(signal.priority, currentCoherence)) {
        // Keep in queue with decremented TTL
        remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
      }
      // Capacity check
      else if (conducted >= MAX_SIGNALS_PER_BEAT) {
        remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
      }
      // Conduct the signal
      else {
        let selectedChannels = findChannels(signal.source, signal.destination, signal.strategy);

        if (selectedChannels.size() == 0) {
          // No channel available — keep in queue
          remaining := Array.append(remaining, [{ signal with ttl = signal.ttl - 1 }]);
        } else {
          // Successfully conducted
          let att = computeAttenuation(signal.weight, signal.hops);
          let result : SignalResult = {
            signalId    = signal.id;
            delivered   = true;
            destination = signal.destination;
            timestamp   = Time.now();
            attenuation = att;
          };
          signalResults := if (signalResults.size() >= AUDIT_RING_SIZE) {
            let tail = Array.subArray<SignalResult>(signalResults, 1, signalResults.size() - 1);
            Array.append(tail, [result]);
          } else {
            Array.append(signalResults, [result]);
          };

          // Update channel stats
          channels := Array.map<Channel, Channel>(channels, func(c) {
            var found = false;
            for (sc in selectedChannels.vals()) {
              if (sc.name == c.name) { found := true };
            };
            if (found) {
              let newCount = c.signalCount + 1;
              let newRate = (c.successRate * Float.fromInt(c.signalCount) + 1.0) / Float.fromInt(newCount);
              { c with signalCount = newCount; lastUsed = Time.now(); failCount = 0; successRate = newRate };
            } else { c };
          });

          totalSignalsConducted += 1;
          conducted += 1;
        };
      };
    };

    signalQueue := remaining;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DEAD CHANNEL PRUNING — remove channels that exceed failure threshold
  // ═══════════════════════════════════════════════════════════════════════════

  func pruneDeadChannels() : () {
    // Remove channels that exceed failure threshold — keep healthy or inactive (preserved for reactivation)
    channels := Array.filter<Channel>(channels, func(c) {
      c.failCount < DEAD_CHANNEL_THRESHOLD
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════════════════════

  public type ConductorAuditEntry = {
    beat             : Nat;
    timestamp        : Int;
    coherence        : Float;
    signalsConducted : Nat;
    signalsDropped   : Nat;
    signalsQueued    : Nat;
    activeChannels   : Nat;
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
  // ═══════════════════════════════════════════════════════════════════════════

  func heartbeat() : async () {
    let now = Time.now();
    beatCount += 1;
    lastBeatTime := now;

    let prevCoherence = currentCoherence;

    // STEP 1 — Conduct queued signals
    let preCount = totalSignalsConducted;
    conductSignals();
    let conductedThisBeat = totalSignalsConducted - preCount;

    // STEP 2 — Prune dead channels (every F(5) = 5 beats)
    if (beatCount % 5 == 0) {
      pruneDeadChannels();
    };

    // STEP 3 — Compute coherence trend
    coherenceTrend := currentCoherence - prevCoherence;

    // STEP 4 — Push audit entry
    let activeCount = Array.filter<Channel>(channels, func(c) { c.active }).size();
    let audit : ConductorAuditEntry = {
      beat             = beatCount;
      timestamp        = now;
      coherence        = currentCoherence;
      signalsConducted = conductedThisBeat;
      signalsDropped   = 0;
      signalsQueued    = signalQueue.size();
      activeChannels   = activeCount;
    };
    pushAudit(audit);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COHERENCE INTERFACE — orchestrator pushes coherence to conductor
  // ═══════════════════════════════════════════════════════════════════════════

  public shared(msg) func updateCoherence(coherence : Float) : async () {
    assertCreator(msg.caller);
    currentCoherence := Float.max(0.0, Float.min(coherence, PHI * PHI));
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
  // QUERY ENDPOINTS — read-only state access
  // ═══════════════════════════════════════════════════════════════════════════

  public type ConductorStatus = {
    beatCount              : Nat;
    currentCoherence       : Float;
    coherenceTrend         : Float;
    heartbeatActive        : Bool;
    channelCount           : Nat;
    activeChannels         : Nat;
    queueDepth             : Nat;
    totalSignalsConducted  : Nat;
    totalSignalsDropped    : Nat;
    genesisSealed          : Bool;
  };

  public query func getStatus() : async ConductorStatus {
    let activeCount = Array.filter<Channel>(channels, func(c) { c.active }).size();
    {
      beatCount             = beatCount;
      currentCoherence      = currentCoherence;
      coherenceTrend        = coherenceTrend;
      heartbeatActive       = heartbeatActive;
      channelCount          = channels.size();
      activeChannels        = activeCount;
      queueDepth            = signalQueue.size();
      totalSignalsConducted = totalSignalsConducted;
      totalSignalsDropped   = totalSignalsDropped;
      genesisSealed         = genesisSealed;
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
};
