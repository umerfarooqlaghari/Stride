"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── types ─────────────────────────────────────────────────── */
type RecStatus = "Within Threshold" | "Near Threshold" | "Anomaly Flagged";
type SegStatus  = "Pass" | "Warning" | "Fail";

interface Voyage {
  id: string; vessel: string; blQty: number; portOutturn: number;
  pipelineInlet: number; refineryReceipt: number; status: RecStatus;
}
interface Segment {
  name: string; nodeA: string; nodeB: string;
  aVol: number; bVol: number; threshold: number;
}

/* ─── seed data ─────────────────────────────────────────────── */
const VOYAGES: Voyage[] = [
  { id: "VYG-2026-041", vessel: "MT Habib Star",   blQty: 35420, portOutturn: 35384, pipelineInlet: 35313, refineryReceipt: 35243, status: "Within Threshold" },
  { id: "VYG-2026-038", vessel: "Al Noor",          blQty: 41850, portOutturn: 41678, pipelineInlet: 41444, refineryReceipt: 41263, status: "Near Threshold"    },
  { id: "VYG-2026-035", vessel: "Pak Pioneer",      blQty: 38200, portOutturn: 38086, pipelineInlet: 38010, refineryReceipt: 37848, status: "Anomaly Flagged"    },
  { id: "VYG-2026-032", vessel: "Gulf Express",     blQty: 28400, portOutturn: 28372, pipelineInlet: 28315, refineryReceipt: 28258, status: "Within Threshold"  },
];

function voyageVariance(v: Voyage) {
  return ((v.blQty - v.refineryReceipt) / v.blQty) * 100;
}

function voyageSegments(v: Voyage): Segment[] {
  return [
    { name: "Ship Transit",     nodeA: "Bill of Lading",  nodeB: "Port Outturn",      aVol: v.blQty,         bVol: v.portOutturn,     threshold: 0.50 },
    { name: "Shore Transfer",   nodeA: "Port Outturn",    nodeB: "Pipeline Inlet",    aVol: v.portOutturn,   bVol: v.pipelineInlet,   threshold: 0.20 },
    { name: "KMK Pipeline",     nodeA: "Pipeline Inlet",  nodeB: "Refinery Receipt",  aVol: v.pipelineInlet, bVol: v.refineryReceipt, threshold: 0.20 },
  ];
}

function segVariance(s: Segment) {
  return ((s.aVol - s.bVol) / s.aVol) * 100;
}
function segStatus(s: Segment): SegStatus {
  const v = segVariance(s);
  if (v > s.threshold * 1.5) return "Fail";
  if (v > s.threshold)       return "Warning";
  return "Pass";
}

/* ─── colour maps ────────────────────────────────────────────── */
const REC_C: Record<RecStatus, string> = {
  "Within Threshold": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Near Threshold":   "bg-amber-50 text-amber-700 border border-amber-200",
  "Anomaly Flagged":  "bg-red-50 text-red-700 border border-red-200",
};
const SEG_C: Record<SegStatus, { row: string; badge: string }> = {
  Pass:    { row: "",               badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  Warning: { row: "bg-amber-50/40", badge: "bg-amber-50 text-amber-700 border border-amber-200"      },
  Fail:    { row: "bg-red-50",      badge: "bg-red-50 text-red-700 border border-red-200"             },
};

/* ─── ASTM conversion ────────────────────────────────────────── */
function calcNSV(obsVol: number, unit: "MT" | "BBL", tempC: number, apiGravity: number): number {
  // Simplified VCF approximation: API 11.1 Table 6A
  const alpha = 0.00033 + (0.00000028 * apiGravity);
  const deltaT = tempC - 15;
  const vcf = 1 - alpha * deltaT;
  const vol = unit === "BBL" ? obsVol * 0.13640 : obsVol; // 1 bbl crude ≈ 0.1364 MT
  return Math.round(vol * vcf * 100) / 100;
}

/* ─── tabs ───────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "converter", label: "Volume Converter" },
  { id: "ledger",    label: "Reconciliation Ledger" },
  { id: "audit",     label: "Loss Audit" },
];
const BASE = "/operations/loss-control";

/* ═══════════════════════════════════════════════════════════════ */

export default function LossControlPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading…</div>}>
      <LossControlInner />
    </Suspense>
  );
}

function LossControlInner() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  const kpis = [
    { label: "Voyages Under Review",  value: "4",      sub: "active reconciliations" },
    { label: "Ship-Shore Avg Var.",   value: "0.18%",  sub: "last 30 days" },
    { label: "Pipeline Loss MTD",     value: "0.22%",  sub: "KMK Jun 2026" },
    { label: "Anomalies Flagged",     value: "1",      sub: "exceeds threshold" },
  ];

  return (
    <div>
      {/* ── Module header ── */}
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 pt-5 pb-0">
          <p className="text-[10px] text-slate-400 mb-3">
            <Link href="/operations" className="hover:text-slate-200 transition-colors">
              Operations Hub
            </Link>
            {" / "}
            <span className="text-slate-200">REC — Hydrocarbon Loss Control</span>
          </p>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                REC
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Hydrocarbon Loss Control &amp; Volumetric Reconciliation
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  ASTM MPMS Ch. 11 conversion · 4-node custody chain · threshold auditing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                <div className="text-lg font-bold text-white">{k.value}</div>
                <div className="text-[10px] text-slate-300 leading-tight">{k.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 mt-5 border-b border-white/10">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`${BASE}?tab=${t.id}`}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-[#14B8A6] text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-6 space-y-5">
        {tab === "overview"  && <OverviewTab />}
        {tab === "converter" && <ConverterTab />}
        {tab === "ledger"    && <LedgerTab />}
        {tab === "audit"     && <AuditTab />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 1 · OVERVIEW
────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const summary = [
    { label: "Total Crude Reconciled MTD", value: "143,870 MT", color: "border-teal-400", bg: "bg-teal-50",    text: "text-teal-700" },
    { label: "Total Volume Loss MTD",      value: "321 MT",     color: "border-amber-400", bg: "bg-amber-50",  text: "text-amber-700" },
    { label: "Anomalies Pending Review",   value: "1",          color: "border-red-400",   bg: "bg-red-50",    text: "text-red-700" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className={`${s.bg} border-t-2 ${s.color} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Recent Voyage Reconciliations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold">Voyage</th>
                <th className="text-left px-4 py-2.5 font-semibold">Vessel</th>
                <th className="text-right px-4 py-2.5 font-semibold">B/L (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Refinery Receipt (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Loss (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Variance %</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VOYAGES.map((v) => {
                const loss = v.blQty - v.refineryReceipt;
                const variance = voyageVariance(v);
                return (
                  <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${v.status === "Anomaly Flagged" ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-3 font-mono text-slate-500">{v.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#0D1B3E]">{v.vessel}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{v.blQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{v.refineryReceipt.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">-{loss.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      v.status === "Anomaly Flagged" ? "text-red-700" : v.status === "Near Threshold" ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {variance.toFixed(3)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium inline-flex ${REC_C[v.status]}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 2 · VOLUME CONVERTER
────────────────────────────────────────────────────────────── */
function ConverterTab() {
  const [obsVol, setObsVol]   = useState<string>("38200");
  const [unit, setUnit]       = useState<"MT" | "BBL">("MT");
  const [temp, setTemp]       = useState<string>("32");
  const [apiGrav, setApiGrav] = useState<string>("34.5");
  const [result, setResult]   = useState<number | null>(null);

  const calculate = () => {
    const vol  = parseFloat(obsVol)  || 0;
    const t    = parseFloat(temp)    || 15;
    const api  = parseFloat(apiGrav) || 30;
    setResult(calcNSV(vol, unit, t, api));
  };

  const vcf = result && parseFloat(obsVol)
    ? (result / (unit === "BBL" ? parseFloat(obsVol) * 0.13640 : parseFloat(obsVol))).toFixed(5)
    : null;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Input form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">ASTM MPMS Chapter 11 Converter</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transforms observed volumes to Net Standard Volume (NSV) at 15°C (60°F) baseline.
          </p>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1.5">
            Observed Volume
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={obsVol}
              onChange={(e) => setObsVol(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. 38200"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "MT" | "BBL")}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="MT">MT</option>
              <option value="BBL">BBL</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1.5">
            Observed Temperature (°C)
          </label>
          <input
            type="number"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="e.g. 32"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1.5">
            API Gravity (°API)
          </label>
          <input
            type="number"
            value={apiGrav}
            onChange={(e) => setApiGrav(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="e.g. 34.5"
          />
        </div>

        <button
          onClick={calculate}
          className="w-full bg-[#14B8A6] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-teal-600 transition-colors"
        >
          Calculate NSV
        </button>
      </div>

      {/* Result pane */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <h3 className="text-[13px] font-semibold text-[#0D1B3E] mb-4">Conversion Result</h3>
        {result !== null ? (
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-teal-700">{result.toLocaleString()} MT</div>
              <div className="text-xs text-teal-600 mt-1">Net Standard Volume at 15°C</div>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Observed Volume",     value: `${parseFloat(obsVol).toLocaleString()} ${unit}` },
                { label: "Observed Temp",        value: `${temp} °C` },
                { label: "API Gravity",           value: `${apiGrav} °API` },
                { label: "VCF Applied",           value: vcf ?? "—" },
                { label: "Baseline Temp",         value: "15 °C (60 °F)" },
                { label: "Standard",              value: "ASTM MPMS Chapter 11" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-mono font-semibold text-[#0D1B3E]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Enter values and press Calculate to see the NSV result.
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 3 · RECONCILIATION LEDGER
────────────────────────────────────────────────────────────── */
function LedgerTab() {
  const [selectedVoyage, setSelectedVoyage] = useState(VOYAGES[2].id);
  const voyage = VOYAGES.find((v) => v.id === selectedVoyage) ?? VOYAGES[0];

  const nodes = [
    { label: "Node 1",  name: "Bill of Lading",    vol: voyage.blQty,           icon: "🚢" },
    { label: "Node 2",  name: "Port Outturn",       vol: voyage.portOutturn,     icon: "⚓" },
    { label: "Node 3",  name: "Pipeline Inlet",     vol: voyage.pipelineInlet,   icon: "🛢️" },
    { label: "Node 4",  name: "Refinery Receipt",   vol: voyage.refineryReceipt, icon: "🏭" },
  ];

  return (
    <>
      {/* Voyage selector */}
      <div className="flex items-center gap-3">
        <label className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Select Voyage</label>
        <select
          value={selectedVoyage}
          onChange={(e) => setSelectedVoyage(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {VOYAGES.map((v) => (
            <option key={v.id} value={v.id}>{v.id} — {v.vessel}</option>
          ))}
        </select>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${REC_C[voyage.status]}`}>
          {voyage.status}
        </span>
      </div>

      {/* Node chain visual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[13px] font-semibold text-[#0D1B3E] mb-4">
          Custody Transfer Chain — {voyage.id}
        </h3>
        <div className="flex items-stretch gap-0 overflow-x-auto">
          {nodes.map((n, i) => (
            <div key={n.label} className="flex items-center flex-1 min-w-[130px]">
              <div className="flex-1 text-center">
                <div className="text-xl mb-1">{n.icon}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{n.label}</div>
                <div className="text-[11px] font-semibold text-[#0D1B3E] mt-0.5">{n.name}</div>
                <div className="text-sm font-bold text-[#14B8A6] mt-1 font-mono">
                  {n.vol.toLocaleString()} MT
                </div>
                {i > 0 && (
                  <div className="mt-1">
                    <span className={`text-[10px] font-mono font-bold ${
                      ((nodes[i-1].vol - n.vol) / nodes[i-1].vol) * 100 > 0.20
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}>
                      Δ -{(nodes[i-1].vol - n.vol).toLocaleString()} MT
                    </span>
                  </div>
                )}
              </div>
              {i < nodes.length - 1 && (
                <div className="text-slate-300 text-lg px-1 shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ledger table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold">Transfer Segment</th>
                <th className="text-left px-4 py-2.5 font-semibold">From Node</th>
                <th className="text-left px-4 py-2.5 font-semibold">To Node</th>
                <th className="text-right px-4 py-2.5 font-semibold">From Vol (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">To Vol (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Loss (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Variance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voyageSegments(voyage).map((seg) => {
                const loss = seg.aVol - seg.bVol;
                const variance = segVariance(seg);
                const s = segStatus(seg);
                return (
                  <tr key={seg.name} className={`${SEG_C[s].row} hover:brightness-95 transition-all`}>
                    <td className="px-5 py-3 font-semibold text-[#0D1B3E]">{seg.name}</td>
                    <td className="px-4 py-3 text-slate-500">{seg.nodeA}</td>
                    <td className="px-4 py-3 text-slate-500">{seg.nodeB}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{seg.aVol.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{seg.bVol.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">-{loss.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      s === "Fail" ? "text-red-700" : s === "Warning" ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {variance.toFixed(3)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 4 · LOSS AUDIT
────────────────────────────────────────────────────────────── */
function AuditTab() {
  const [selectedVoyage, setSelectedVoyage] = useState(VOYAGES[2].id);
  const voyage = VOYAGES.find((v) => v.id === selectedVoyage) ?? VOYAGES[0];
  const segments = voyageSegments(voyage);
  const anomaly = segments.find((s) => segStatus(s) === "Fail");

  return (
    <>
      <div className="flex items-center gap-3">
        <label className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Voyage</label>
        <select
          value={selectedVoyage}
          onChange={(e) => setSelectedVoyage(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {VOYAGES.map((v) => (
            <option key={v.id} value={v.id}>{v.id} — {v.vessel}</option>
          ))}
        </select>
      </div>

      {/* Segment audit table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Segment Variance vs. Threshold</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pipeline (KMK) allowance 0.20% · Shore transfer allowance 0.20% · Sea transit allowance 0.50%
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold">Segment</th>
                <th className="text-left px-4 py-2.5 font-semibold">Transfer Points</th>
                <th className="text-right px-4 py-2.5 font-semibold">Variance %</th>
                <th className="text-right px-4 py-2.5 font-semibold">Threshold</th>
                <th className="text-right px-4 py-2.5 font-semibold">Excess</th>
                <th className="text-left px-4 py-2.5 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((seg) => {
                const variance = segVariance(seg);
                const s = segStatus(seg);
                const excess = variance - seg.threshold;
                const c = SEG_C[s];
                return (
                  <tr key={seg.name} className={`${c.row}`}>
                    <td className="px-5 py-3.5 font-semibold text-[#0D1B3E]">{seg.name}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {seg.nodeA} → {seg.nodeB}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold ${
                      s === "Fail" ? "text-red-700" : s === "Warning" ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {variance.toFixed(3)}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                      {seg.threshold.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono ${
                      excess > 0 ? "text-red-600 font-bold" : "text-slate-300"
                    }`}>
                      {excess > 0 ? `+${excess.toFixed(3)}%` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium inline-flex ${c.badge}`}>
                        {s}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomaly detail */}
      {anomaly && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">
                Anomaly Detected — {anomaly.name} Exceeds Tolerance
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Voyage {voyage.id} · {voyage.vessel}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {[
              { label: "Transfer Segment", value: anomaly.name },
              { label: "Measured Variance", value: `${segVariance(anomaly).toFixed(3)}%` },
              { label: "Industry Threshold", value: `${anomaly.threshold.toFixed(2)}%` },
              { label: "From", value: `${anomaly.nodeA} — ${anomaly.aVol.toLocaleString()} MT` },
              { label: "To",   value: `${anomaly.nodeB} — ${anomaly.bVol.toLocaleString()} MT` },
              { label: "Volume Discrepancy", value: `${(anomaly.aVol - anomaly.bVol).toLocaleString()} MT` },
            ].map((r) => (
              <div key={r.label} className="bg-white/60 rounded-lg px-3 py-2">
                <div className="text-[10px] text-red-500 font-medium uppercase tracking-wide">{r.label}</div>
                <div className="text-red-800 font-bold mt-0.5">{r.value}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-red-600 mt-3">
            Recommended action: Engage SGS/Bureau Veritas for independent re-measurement at both
            {" "}{anomaly.nodeA} and {anomaly.nodeB}. Preserve all meter tickets and ullage reports.
          </p>
        </div>
      )}
    </>
  );
}
