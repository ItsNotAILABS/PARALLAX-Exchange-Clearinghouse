/**
 * JuliaPanel.tsx — PARALLAX Julia Bridge Monitor & Control Panel
 * ================================================================
 * Displays the Julia bridge state: workers, coherence, dispatches, pending messages.
 * Allows registering new Julia workers and monitoring bridge health.
 *
 * DOCTRINE: Julia's multiple dispatch = harmonic frequency routing.
 * The panel makes the invisible bridge visible.
 *
 * The Architect of the Field: Alfredo Medina Hernandez.
 */

import { useState } from "react";
import {
  type MedinaJulia,
  type MedinaJuliaWorker,
  JuliaDomain,
  defaultMedinaJulia,
  juliaHealth,
  juliaDomainLabel,
  PHI_INV,
} from "../models";

export default function JuliaPanel() {
  const [juliaState, setJuliaState] = useState<MedinaJulia>(
    defaultMedinaJulia(),
  );
  const [newWorkerEndpoint, setNewWorkerEndpoint] = useState("");
  const [newWorkerDomain, setNewWorkerDomain] = useState<JuliaDomain>(
    JuliaDomain.DIFFERENTIAL_EQUATIONS,
  );

  const health = juliaHealth(juliaState);
  const aliveWorkers = juliaState.workers.filter((w) => w.isAlive);

  function registerWorker() {
    if (!newWorkerEndpoint.trim()) return;

    const worker: MedinaJuliaWorker = {
      workerId: `julia-${Date.now().toString(36)}`,
      endpoint: newWorkerEndpoint.trim(),
      domain: newWorkerDomain,
      entanglement: PHI_INV,
      lastSyncBeat: juliaState.lastBridgeBeat,
      isAlive: true,
      precision: 1.0,
      taskQueue: 0,
      dispatchCount: 0,
    };

    setJuliaState((prev) => ({
      ...prev,
      workers: [...prev.workers, worker],
      bridgeCoherence: Math.min(
        1.0,
        prev.bridgeCoherence + PHI_INV * 0.1,
      ),
    }));
    setNewWorkerEndpoint("");
  }

  function removeWorker(workerId: string) {
    setJuliaState((prev) => ({
      ...prev,
      workers: prev.workers.filter((w) => w.workerId !== workerId),
    }));
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-lg font-semibold">⬡</span>
          <h2 className="text-sm font-semibold text-purple-300 tracking-wide">
            JULIA BRIDGE
          </h2>
          <span className="text-[10px] text-zinc-500 font-mono">
            LEX_PONTIS_JULIA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              health > 0.6
                ? "bg-green-400"
                : health > 0.3
                  ? "bg-yellow-400"
                  : "bg-red-400"
            }`}
          />
          <span className="text-[11px] text-zinc-400 font-mono">
            {(health * 100).toFixed(1)}% health
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          label="Coherence"
          value={juliaState.bridgeCoherence.toFixed(4)}
          unit="φ"
        />
        <MetricCard
          label="Workers"
          value={`${aliveWorkers.length}/${juliaState.workers.length}`}
          unit="alive"
        />
        <MetricCard
          label="Dispatches"
          value={juliaState.totalDispatches.toString()}
          unit="total"
        />
        <MetricCard
          label="Pending"
          value={juliaState.pendingMessages.length.toString()}
          unit="msgs"
        />
      </div>

      {/* Workers List */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
          Workers ({juliaState.workers.length}/{juliaState.maxWorkers} max)
        </h3>
        {juliaState.workers.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic">
            No Julia workers registered. Add an endpoint below.
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {juliaState.workers.map((worker) => (
              <WorkerRow
                key={worker.workerId}
                worker={worker}
                onRemove={() => removeWorker(worker.workerId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Register Worker */}
      {juliaState.workers.length < juliaState.maxWorkers && (
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <h3 className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
            Register Worker
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWorkerEndpoint}
              onChange={(e) => setNewWorkerEndpoint(e.target.value)}
              placeholder="http://localhost:8080/julia"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
            <select
              value={newWorkerDomain}
              onChange={(e) =>
                setNewWorkerDomain(Number(e.target.value) as JuliaDomain)
              }
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              {Object.values(JuliaDomain)
                .filter((v) => typeof v === "number")
                .map((d) => (
                  <option key={d} value={d}>
                    {juliaDomainLabel(d as JuliaDomain)}
                  </option>
                ))}
            </select>
            <button
              onClick={registerWorker}
              disabled={!newWorkerEndpoint.trim()}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs rounded font-medium transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* Bridge Info */}
      <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between">
        <span>Batch: F(8)={juliaState.batchSize}</span>
        <span>Sync: F(3)={juliaState.syncBeats} beats</span>
        <span>Max: F(7)={juliaState.maxWorkers} workers</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center bg-zinc-900/50 rounded-lg px-2 py-2 border border-zinc-800/50">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-mono text-zinc-200">{value}</span>
      <span className="text-[9px] text-zinc-600">{unit}</span>
    </div>
  );
}

function WorkerRow({
  worker,
  onRemove,
}: {
  worker: MedinaJuliaWorker;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/30 rounded px-2 py-1 border border-zinc-800/30">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          worker.isAlive ? "bg-green-400" : "bg-red-400"
        }`}
      />
      <span className="text-[11px] text-zinc-300 font-mono truncate flex-1">
        {worker.endpoint}
      </span>
      <span className="text-[10px] text-purple-400">
        {juliaDomainLabel(worker.domain)}
      </span>
      <span className="text-[10px] text-zinc-500 font-mono">
        φ={worker.entanglement.toFixed(3)}
      </span>
      <button
        onClick={onRemove}
        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
        title="Remove worker"
      >
        ✕
      </button>
    </div>
  );
}
