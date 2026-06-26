"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── types ─────────────────────────────────────────────────── */
type VesselState = "At Anchorage" | "Berthing" | "Discharging" | "Sailed" | "Inbound";
type TankStatus  = "Normal" | "High" | "Critical" | "Low";

interface ScheduledVessel {
  id: string; name: string; flag: string; berth: string | null;
  state: VesselState; cargo: string; mt: string;
  eta: string; etd: string; dischargeRate: string;
}
interface Tank {
  id: string; location: string; grade: string;
  capacity: number; current: number;
}
interface SimRow {
  hour: number; label: string;
  dischargeIn: number; pumpedOut: number;
  startVol: number; alert: boolean;
}

/* ─── seed data ─────────────────────────────────────────────── */
const VESSELS: ScheduledVessel[] = [
  { id: "MV-0051", name: "MT Al Noor",       flag: "🇵🇰", berth: "Keamari Pier 1",    state: "Discharging",  cargo: "Arab Light Crude",  mt: "42,000", eta: "Jun 26, 14:30", etd: "Jun 27, 08:00", dischargeRate: "1,800 MT/hr" },
  { id: "MV-0052", name: "MT Habib Star",    flag: "🇸🇦", berth: null,                state: "At Anchorage", cargo: "Arab Light Crude",  mt: "35,200", eta: "Jun 26, 17:00", etd: "Jun 27, 20:00", dischargeRate: "1,800 MT/hr" },
  { id: "MV-0053", name: "MT Gulf Voyager",  flag: "🇦🇪", berth: "Port Qasim FOTCO",  state: "Inbound",      cargo: "Murban Crude",      mt: "28,000", eta: "Jun 26, 22:00", etd: "Jun 27, 14:00", dischargeRate: "1,500 MT/hr" },
];

const TANKS_KORANGI: Tank[] = [
  { id: "K-01", location: "Korangi PS-1", grade: "Arab Light",   capacity: 120000, current: 98400 },
  { id: "K-02", location: "Korangi PS-1", grade: "Murban",       capacity: 80000,  current: 52000 },
  { id: "K-03", location: "Korangi PS-1", grade: "Arab Medium",  capacity: 100000, current: 40000 },
];
const TANKS_MCR: Tank[] = [
  { id: "M-01", location: "MCR Mahmoodkot", grade: "Arab Light",  capacity: 150000, current: 120000 },
  { id: "M-02", location: "MCR Mahmoodkot", grade: "Murban",      capacity: 100000, current: 45000  },
  { id: "M-03", location: "MCR Mahmoodkot", grade: "Slop/Mix",    capacity: 50000,  current: 18000  },
];

const PIPELINES = [
  { name: "KKLP (Keamari → Korangi)",      rate: "1,200 MT/hr", utilisation: 92, status: "High Load"  },
  { name: "KMK (Korangi → Mahmoodkot)",    rate: "850 MT/hr",   utilisation: 78, status: "Normal"     },
  { name: "MFM (Products, north)",          rate: "400 MT/hr",   utilisation: 65, status: "Normal"     },
];

/* Build 72h simulator rows for K-01 (tightest tank) */
const K01_CAP = 120000;
const DISCHARGE_RATE = 1800; // MT/hr from MV-0051
const PUMP_RATE = 850;       // KMK pump-out MT/hr
const SIM_ROWS: SimRow[] = Array.from({ length: 13 }, (_, i) => {
  const startVol = 98400 + i * (DISCHARGE_RATE - PUMP_RATE);
  const pctFull = startVol / K01_CAP;
  return {
    hour: i,
    label: `+${i}h (${String(14 + i).padStart(2, "0")}:30)`,
    dischargeIn: DISCHARGE_RATE,
    pumpedOut: PUMP_RATE,
    startVol: Math.round(startVol),
    alert: pctFull >= 0.95,
  };
});

/* ─── helpers ────────────────────────────────────────────────── */
function tankStatus(t: Tank): TankStatus {
  const pct = t.current / t.capacity;
  if (pct >= 0.95) return "Critical";
  if (pct >= 0.80) return "High";
  if (pct <= 0.20) return "Low";
  return "Normal";
}
const TANK_C: Record<TankStatus, { badge: string; bar: string }> = {
  Critical: { badge: "bg-red-50 text-red-700 border border-red-200",     bar: "bg-red-500"    },
  High:     { badge: "bg-amber-50 text-amber-700 border border-amber-200", bar: "bg-amber-400" },
  Normal:   { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", bar: "bg-emerald-400" },
  Low:      { badge: "bg-slate-100 text-slate-500 border border-slate-200", bar: "bg-slate-300" },
};
const STATE_C: Record<VesselState, string> = {
  Discharging:  "bg-blue-50 text-blue-700 border border-blue-200",
  Berthing:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "At Anchorage": "bg-amber-50 text-amber-700 border border-amber-200",
  Sailed:       "bg-slate-100 text-slate-500 border border-slate-200",
  Inbound:      "bg-purple-50 text-purple-700 border border-purple-200",
};

/* ─── tabs ───────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "schedule",  label: "Port Schedule" },
  { id: "inventory", label: "Tank Inventory" },
  { id: "simulator", label: "Ullage Simulator" },
];
const BASE = "/operations/ullage-optimizer";

/* ═══════════════════════════════════════════════════════════════ */

export default function UllagePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading…</div>}>
      <UllageInner />
    </Suspense>
  );
}

function UllageInner() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  const totalKorangiUllage = TANKS_KORANGI.reduce((s, t) => s + (t.capacity - t.current), 0);
  const kpis = [
    { label: "Vessels at Anchorage", value: "1",                        sub: "awaiting berth" },
    { label: "Currently Discharging", value: "2",                       sub: "active berths"  },
    { label: "Korangi Total Ullage",  value: `${(totalKorangiUllage / 1000).toFixed(0)}k MT`, sub: "available capacity" },
    { label: "Next Alert In",         value: "~8h",                     sub: "K-01 at 95% est." },
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
            <span className="text-slate-200">ULL — Berthing &amp; Ullage Optimizer</span>
          </p>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                ULL
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Berthing &amp; Ullage Optimizer
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-berth scheduling · tank ullage monitoring · 72h overflow forecasting
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
                    ? "border-[#0EA5E9] text-white"
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
        {tab === "schedule"  && <ScheduleTab />}
        {tab === "inventory" && <InventoryTab />}
        {tab === "simulator" && <SimulatorTab />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 1 · OVERVIEW
────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const summary = [
    { label: "Korangi Ullage Available", value: "109,600 MT", color: "border-sky-400", bg: "bg-sky-50", text: "text-sky-700" },
    { label: "MCR Ullage Available",     value: "142,000 MT", color: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "High Tank Alerts",         value: "1",          color: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
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
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Active Vessel Pipeline</h3>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live tracking
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {VESSELS.map((v) => (
            <div key={v.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                {v.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#0D1B3E]">{v.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{v.id}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {v.cargo} · {v.mt} MT · {v.berth ?? "Unassigned"} · ETA {v.eta}
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400">Discharge Rate</div>
                  <div className="text-xs font-semibold text-[#0D1B3E]">{v.dischargeRate}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium inline-flex ${STATE_C[v.state]}`}>
                  {v.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 2 · PORT SCHEDULE
────────────────────────────────────────────────────────────── */
function ScheduleTab() {
  const berths = [
    { name: "Keamari Pier 1",   vessel: VESSELS[0], note: null },
    { name: "Keamari Pier 2",   vessel: VESSELS[1], note: "Awaiting customs clearance before berthing" },
    { name: "Port Qasim FOTCO", vessel: VESSELS[2], note: null },
  ];

  const STATE_FLOW: VesselState[] = ["Inbound", "At Anchorage", "Berthing", "Discharging", "Sailed"];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Berth Schedule — Jun 26, 2026</h3>
        <button className="bg-[#0EA5E9] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sky-600 transition-colors">
          + Schedule Vessel
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {berths.map((b) => {
          const v = b.vessel;
          const stateIdx = STATE_FLOW.indexOf(v.state);
          return (
            <div key={b.name} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-[#0D1B3E] uppercase tracking-wide">{b.name}</div>
                  {b.note && <div className="text-[10px] text-amber-600 mt-0.5">{b.note}</div>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0 ${STATE_C[v.state]}`}>
                  {v.state}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="text-lg">{v.flag}</div>
                <div>
                  <div className="text-sm font-semibold text-[#0D1B3E]">{v.name}</div>
                  <div className="text-xs text-slate-500">{v.cargo} · {v.mt} MT</div>
                </div>
                <div className="ml-auto text-right text-xs text-slate-500 hidden sm:block">
                  <div>ETA {v.eta}</div>
                  <div>ETD {v.etd}</div>
                </div>
              </div>

              {/* State progress bar */}
              <div className="flex items-center gap-0">
                {STATE_FLOW.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex-1 h-1 rounded-full mx-0.5 overflow-hidden bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${i <= stateIdx ? "bg-[#0EA5E9]" : ""}`}
                        style={{ width: i <= stateIdx ? "100%" : "0%" }}
                      />
                    </div>
                    {i === stateIdx && (
                      <div className="text-[9px] text-sky-600 font-bold whitespace-nowrap px-1">{s}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 3 · TANK INVENTORY
────────────────────────────────────────────────────────────── */
function TankTable({ tanks, title }: { tanks: Tank[]; title: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h3 className="text-[13px] font-semibold text-[#0D1B3E]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <th className="text-left px-5 py-2.5 font-semibold">Tank</th>
              <th className="text-left px-4 py-2.5 font-semibold">Grade</th>
              <th className="text-right px-4 py-2.5 font-semibold">Capacity (MT)</th>
              <th className="text-right px-4 py-2.5 font-semibold">Current (MT)</th>
              <th className="text-right px-4 py-2.5 font-semibold">Ullage (MT)</th>
              <th className="text-left px-4 py-2.5 font-semibold">Fill %</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tanks.map((t) => {
              const s = tankStatus(t);
              const pct = (t.current / t.capacity) * 100;
              const ullage = t.capacity - t.current;
              const c = TANK_C[s];
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[#0D1B3E]">{t.id}</td>
                  <td className="px-4 py-3 text-slate-600">{t.grade}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {t.capacity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#0D1B3E]">
                    {t.current.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sky-700 font-semibold">
                    {ullage.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.bar}`}
                          style={{ width: `${pct.toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.badge}`}>{s}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryTab() {
  return (
    <>
      <TankTable tanks={TANKS_KORANGI} title="Korangi PS-1 — Shore Tank Group" />
      <TankTable tanks={TANKS_MCR} title="MCR Mahmoodkot — Crude Tank Farm" />

      {/* Pipeline flows */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Active Pipeline Flows</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {PIPELINES.map((p) => (
            <div key={p.name} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#0D1B3E]">{p.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{p.rate}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.utilisation >= 90 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${p.utilisation}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-600 w-8">{p.utilisation}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  p.utilisation >= 90
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 4 · ULLAGE SIMULATOR
────────────────────────────────────────────────────────────── */
function SimulatorTab() {
  const [dischargeRate, setDischargeRate] = useState(DISCHARGE_RATE);
  const [pumpRate, setPumpRate] = useState(PUMP_RATE);

  const rows: SimRow[] = Array.from({ length: 13 }, (_, i) => {
    const startVol = 98400 + i * (dischargeRate - pumpRate);
    return {
      hour: i,
      label: `+${i}h`,
      dischargeIn: dischargeRate,
      pumpedOut: pumpRate,
      startVol: Math.round(startVol),
      alert: startVol / K01_CAP >= 0.95,
    };
  });

  const firstAlert = rows.find((r) => r.alert);
  const alertPct = firstAlert ? ((firstAlert.startVol / K01_CAP) * 100).toFixed(1) : null;

  return (
    <>
      {/* Alert banner */}
      {firstAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Tank K-01 projected to reach {alertPct}% at {firstAlert.label} from now
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Recommend reducing MT Al Noor discharge rate to {Math.round(pumpRate * 1.05)} MT/hr
              or increasing KMK pump-out rate to {Math.round(dischargeRate * 0.95)} MT/hr.
            </p>
          </div>
        </div>
      )}

      {/* Rate controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[13px] font-semibold text-[#0D1B3E] mb-4">Scenario Parameters — Tank K-01</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1.5">
              Ship Discharge Rate (MT/hr)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={500} max={2500} step={50} value={dischargeRate}
                onChange={(e) => setDischargeRate(Number(e.target.value))}
                className="flex-1 accent-[#0EA5E9]"
              />
              <span className="font-mono text-sm font-bold text-[#0D1B3E] w-14 text-right">
                {dischargeRate.toLocaleString()}
              </span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1.5">
              KMK Pipeline Pump-Out Rate (MT/hr)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={400} max={1400} step={50} value={pumpRate}
                onChange={(e) => setPumpRate(Number(e.target.value))}
                className="flex-1 accent-[#0EA5E9]"
              />
              <span className="font-mono text-sm font-bold text-[#0D1B3E] w-14 text-right">
                {pumpRate.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          Net fill rate: {(dischargeRate - pumpRate).toLocaleString()} MT/hr ·
          Tank K-01 capacity: {K01_CAP.toLocaleString()} MT
        </p>
      </div>

      {/* 72h forecast table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">
            72h Rolling Forecast — Tank K-01 (Arab Light, Korangi PS-1)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold">Horizon</th>
                <th className="text-right px-4 py-2.5 font-semibold">Discharge In (MT/hr)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Pumped Out (MT/hr)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Forecasted Vol (MT)</th>
                <th className="text-right px-4 py-2.5 font-semibold">% Full</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const pct = (r.startVol / K01_CAP) * 100;
                return (
                  <tr
                    key={r.hour}
                    className={r.alert ? "bg-red-50" : "hover:bg-slate-50 transition-colors"}
                  >
                    <td className="px-5 py-2.5 font-mono text-slate-600">{r.label}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                      {r.dischargeIn.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                      {r.pumpedOut.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${
                      r.alert ? "text-red-700" : "text-[#0D1B3E]"
                    }`}>
                      {r.startVol.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${
                      r.alert ? "text-red-700 font-bold" : "text-slate-600"
                    }`}>
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5">
                      {r.alert ? (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          ⚠ Overflow Risk
                        </span>
                      ) : pct >= 80 ? (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          High
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Normal
                        </span>
                      )}
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
