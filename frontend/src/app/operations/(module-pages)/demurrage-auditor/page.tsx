"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── types ─────────────────────────────────────────────────── */
type ClaimStatus = "Under Dispute" | "Under Review" | "Settled" | "Time-Bar Risk";
type DocStatus = "Verified" | "Processing" | "Error" | "Pending Review";
type Category = "Shore Constraint" | "Environmental" | "Vessel Fault";

interface Claim {
  id: string; vessel: string; voyage: string; status: ClaimStatus;
  claimed: string; calculated: string; delta: string;
  timeBar: string; daysLeft: number;
}
interface MaritimeDoc {
  id: string; type: string; vessel: string; voyage: string;
  uploaded: string; status: DocStatus; pages: number;
}
interface SofEvent {
  id: number; start: string; end: string; duration: number;
  description: string; defaultCategory: Category;
}

/* ─── seed data ─────────────────────────────────────────────── */
const CLAIMS: Claim[] = [
  { id: "DMR-2026-041", vessel: "MT Habib Star",  voyage: "V-2026-08/03", status: "Under Dispute", claimed: "$84,500",  calculated: "$31,200", delta: "-$53,300", timeBar: "Jul 12, 2026", daysLeft: 16 },
  { id: "DMR-2026-040", vessel: "Al Noor",         voyage: "V-2026-07/28", status: "Time-Bar Risk", claimed: "$28,000",  calculated: "$18,400", delta: "-$9,600",  timeBar: "Jun 28, 2026", daysLeft: 2  },
  { id: "DMR-2026-035", vessel: "Gulf Express",    voyage: "V-2026-06/22", status: "Under Review",  claimed: "$110,000", calculated: "$47,800", delta: "-$62,200", timeBar: "Jul 25, 2026", daysLeft: 29 },
  { id: "DMR-2026-032", vessel: "Pak Pioneer",     voyage: "V-2026-06/01", status: "Settled",       claimed: "$45,500",  calculated: "$44,200", delta: "-$1,300",  timeBar: "Jul 01, 2026", daysLeft: 5  },
  { id: "DMR-2026-029", vessel: "MT Murban Star",  voyage: "V-2026-05/18", status: "Settled",       claimed: "$62,000",  calculated: "$58,800", delta: "-$3,200",  timeBar: "Jun 17, 2026", daysLeft: 0  },
];

const DOCUMENTS: MaritimeDoc[] = [
  { id: "DOC-2026-0091", type: "Statement of Facts",    vessel: "MT Habib Star", voyage: "V-2026-08/03", uploaded: "Jun 24, 09:14", status: "Verified",        pages: 4 },
  { id: "DOC-2026-0092", type: "Charter Party",          vessel: "MT Habib Star", voyage: "V-2026-08/03", uploaded: "Jun 24, 09:18", status: "Verified",        pages: 22 },
  { id: "DOC-2026-0093", type: "Notice of Readiness",    vessel: "MT Habib Star", voyage: "V-2026-08/03", uploaded: "Jun 24, 09:22", status: "Verified",        pages: 1  },
  { id: "DOC-2026-0088", type: "Statement of Facts",    vessel: "Gulf Express",  voyage: "V-2026-06/22", uploaded: "Jun 15, 11:30", status: "Pending Review",  pages: 6 },
  { id: "DOC-2026-0085", type: "Cargo Outturn Report",  vessel: "Al Noor",       voyage: "V-2026-07/28", uploaded: "Jun 10, 14:05", status: "Processing",      pages: 3 },
  { id: "DOC-2026-0082", type: "Bill of Lading",        vessel: "Al Noor",       voyage: "V-2026-07/28", uploaded: "Jun 10, 08:45", status: "Error",           pages: 2 },
];

const SOF_EVENTS: SofEvent[] = [
  { id: 1, start: "Jun 10, 06:00", end: "Jun 10, 08:30", duration: 2.50, description: "NOR tendered, vessel at anchorage awaiting berth",    defaultCategory: "Shore Constraint" },
  { id: 2, start: "Jun 10, 08:30", end: "Jun 10, 09:15", duration: 0.75, description: "Pilot boarded, tugs engaged, vessel manoeuvring",      defaultCategory: "Shore Constraint" },
  { id: 3, start: "Jun 10, 09:15", end: "Jun 10, 11:00", duration: 1.75, description: "Monsoon rain — discharge suspended by Master",         defaultCategory: "Environmental"    },
  { id: 4, start: "Jun 10, 11:00", end: "Jun 10, 11:45", duration: 0.75, description: "Ship's manifold valve failure — crew repair in progress", defaultCategory: "Vessel Fault"  },
  { id: 5, start: "Jun 10, 11:45", end: "Jun 11, 02:00", duration: 14.25, description: "Discharging crude oil at full contractual rate",       defaultCategory: "Shore Constraint" },
  { id: 6, start: "Jun 11, 02:00", end: "Jun 11, 04:30", duration: 2.50, description: "Shore tank K-01 high level — slow discharge instructed", defaultCategory: "Shore Constraint" },
  { id: 7, start: "Jun 11, 04:30", end: "Jun 11, 06:45", duration: 2.25, description: "Discharge resumed at full rate after KMK pump-up",     defaultCategory: "Shore Constraint" },
  { id: 8, start: "Jun 11, 06:45", end: "Jun 11, 08:00", duration: 1.25, description: "Final stripping & hose disconnection, vessel clearing", defaultCategory: "Shore Constraint" },
];

const ALLOWED_LAYTIME_HRS = 20;
const DAILY_RATE_USD = 25000;
const SHIPOWNER_INVOICE_USD = 84500;

const MULTIPLIERS: Record<Category, number> = {
  "Shore Constraint": 1.0,
  "Environmental":    0.5,
  "Vessel Fault":     0.0,
};

/* ─── colour maps ────────────────────────────────────────────── */
const CLAIM_C: Record<ClaimStatus, string> = {
  "Under Dispute":  "bg-red-50 text-red-700 border border-red-200",
  "Under Review":   "bg-amber-50 text-amber-700 border border-amber-200",
  "Settled":        "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Time-Bar Risk":  "bg-rose-50 text-rose-700 border border-rose-200",
};
const DOC_C: Record<DocStatus, string> = {
  "Verified":       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Processing":     "bg-blue-50 text-blue-700 border border-blue-200",
  "Error":          "bg-red-50 text-red-700 border border-red-200",
  "Pending Review": "bg-amber-50 text-amber-700 border border-amber-200",
};
const CAT_C: Record<Category, string> = {
  "Shore Constraint": "text-blue-700",
  "Environmental":    "text-amber-700",
  "Vessel Fault":     "text-slate-500",
};

/* ─── extracted fields for the selected doc ────────────────── */
const EXTRACTED_FIELDS = [
  { label: "Vessel Name",                value: "MT Habib Star" },
  { label: "Voyage Number",             value: "V-2026-08/03" },
  { label: "Charter Party Date",        value: "March 14, 2026" },
  { label: "Allowed Laytime",           value: "20 running hours" },
  { label: "Demurrage Rate",            value: "USD 25,000 / day" },
  { label: "Demurrage Currency",        value: "USD" },
  { label: "NOR Tendered",              value: "Jun 10, 2026 06:00 PKT" },
  { label: "NOR Accepted",              value: "Jun 10, 2026 08:30 PKT" },
  { label: "Vessel Departure",          value: "Jun 11, 2026 08:00 PKT" },
  { label: "Cargo",                     value: "Arab Light Crude Oil" },
  { label: "B/L Quantity",              value: "35,420 MT" },
];

/* ─── tabs ───────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "documents",  label: "Document Ingestion" },
  { id: "calculator", label: "Laytime Calculator" },
  { id: "disputes",   label: "Dispute Manager" },
];
const BASE = "/operations/demurrage-auditor";

/* ═══════════════════════════════════════════════════════════════ */

export default function DemurragePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading…</div>}>
      <DemurrageInner />
    </Suspense>
  );
}

function DemurrageInner() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  const kpis = [
    { label: "Active Disputes",      value: "3",    sub: "claims" },
    { label: "Demurrage Recovered",  value: "$2.4M", sub: "YTD" },
    { label: "Avg Settlement Time",  value: "18d",  sub: "last 12 months" },
    { label: "Time-Bar Alerts",      value: "2",    sub: "≤7 days remaining" },
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
            <span className="text-slate-200">DEM — AI Demurrage &amp; Laytime Auditor</span>
          </p>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F97316] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                DEM
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  AI Demurrage &amp; Laytime Auditor
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated laytime calculation · dispute generation · time-bar tracking
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
                    ? "border-[#F97316] text-white"
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
        {tab === "overview"   && <OverviewTab />}
        {tab === "documents"  && <DocumentsTab />}
        {tab === "calculator" && <CalculatorTab />}
        {tab === "disputes"   && <DisputesTab />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 1 · OVERVIEW
────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const summary = [
    { label: "Total Claims Filed (YTD)", value: "12",    color: "border-blue-400",    bg: "bg-blue-50",    text: "text-blue-700"    },
    { label: "Savings vs. Invoiced",      value: "$1.8M", color: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "Pending Settlement",        value: "4",    color: "border-amber-400",   bg: "bg-amber-50",   text: "text-amber-700"  },
  ];

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className={`${s.bg} border-t-2 ${s.color} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Claims table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Active & Recent Demurrage Claims</h3>
          <Link
            href={`${BASE}?tab=documents`}
            className="bg-[#F97316] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
          >
            + New Claim
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold">Claim ID</th>
                <th className="text-left px-4 py-2.5 font-semibold">Vessel</th>
                <th className="text-left px-4 py-2.5 font-semibold">Voyage</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-right px-4 py-2.5 font-semibold">Claimed</th>
                <th className="text-right px-4 py-2.5 font-semibold">Calculated</th>
                <th className="text-right px-4 py-2.5 font-semibold">Delta</th>
                <th className="text-left px-4 py-2.5 font-semibold">Time-Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CLAIMS.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-slate-500">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-[#0D1B3E]">{c.vessel}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{c.voyage}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium inline-flex ${CLAIM_C[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{c.claimed}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{c.calculated}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{c.delta}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600">{c.timeBar}</span>
                      {c.daysLeft <= 7 && c.daysLeft > 0 && (
                        <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold">
                          {c.daysLeft}d
                        </span>
                      )}
                      {c.daysLeft === 0 && (
                        <span className="rounded-full bg-slate-100 text-slate-400 px-1.5 py-0.5 text-[10px]">Closed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 2 · DOCUMENT INGESTION
────────────────────────────────────────────────────────────── */
function DocumentsTab() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>("DOC-2026-0091");

  return (
    <>
      {/* Upload zone */}
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-[#F97316] transition-colors p-8 text-center cursor-pointer">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#0D1B3E]">Upload Maritime Documents</p>
        <p className="text-xs text-slate-400 mt-1">
          Statement of Facts · Charter Party · Notice of Readiness · Bill of Lading
        </p>
        <p className="text-[10px] text-slate-300 mt-1">PDF, JPEG, PNG — multi-page supported</p>
      </div>

      {/* Document list + split-pane */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Document list */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Document Queue</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {DOCUMENTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={`w-full text-left px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors ${
                  selectedDoc === d.id ? "bg-orange-50/50 border-l-2 border-[#F97316]" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] text-slate-400">{d.id}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DOC_C[d.status]}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#0D1B3E]">{d.type}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {d.vessel} · {d.voyage} · {d.pages}p
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0 pt-0.5">{d.uploaded}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Extracted fields pane */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Extracted Fields</h3>
            {selectedDoc && (
              <span className="text-[10px] text-slate-400 font-mono">{selectedDoc}</span>
            )}
          </div>
          {selectedDoc === "DOC-2026-0091" ? (
            <div className="divide-y divide-slate-50">
              {EXTRACTED_FIELDS.map((f) => (
                <div key={f.label} className="flex items-start justify-between px-5 py-2.5 gap-4">
                  <span className="text-[11px] text-slate-400 shrink-0 pt-0.5 w-36">{f.label}</span>
                  <span className="text-[12px] font-semibold text-[#0D1B3E] text-right">{f.value}</span>
                </div>
              ))}
              <div className="px-5 py-3 bg-emerald-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[11px] text-emerald-700 font-medium">
                    11 of 11 fields extracted — confidence 98.4%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">
              Select a document to view extracted fields
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 3 · LAYTIME CALCULATOR
────────────────────────────────────────────────────────────── */
function CalculatorTab() {
  const [categories, setCategories] = useState<Record<number, Category>>(
    Object.fromEntries(SOF_EVENTS.map((e) => [e.id, e.defaultCategory])) as Record<number, Category>
  );

  const consumedHours = SOF_EVENTS.reduce(
    (sum, e) => sum + e.duration * MULTIPLIERS[categories[e.id]],
    0
  );
  const delta = consumedHours - ALLOWED_LAYTIME_HRS;
  const demurrageOwed = Math.max(0, delta) * (DAILY_RATE_USD / 24);
  const disputeAmount = SHIPOWNER_INVOICE_USD - demurrageOwed;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">Statement of Facts — Event Log</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            MT Habib Star · Voyage V-2026-08/03 · Reassign categories to recalculate in real-time
          </p>
        </div>
      </div>

      {/* SOF event table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold w-6">#</th>
                <th className="text-left px-4 py-2.5 font-semibold">Start</th>
                <th className="text-left px-4 py-2.5 font-semibold">End</th>
                <th className="text-right px-4 py-2.5 font-semibold">Hours</th>
                <th className="text-left px-4 py-2.5 font-semibold">Event Description</th>
                <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                <th className="text-right px-4 py-2.5 font-semibold">Mult.</th>
                <th className="text-right px-4 py-2.5 font-semibold">Counted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SOF_EVENTS.map((e) => {
                const cat = categories[e.id];
                const mult = MULTIPLIERS[cat];
                const counted = (e.duration * mult).toFixed(2);
                return (
                  <tr key={e.id} className={mult === 0 ? "bg-slate-50 opacity-60" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 text-slate-400 font-mono">{e.id}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">{e.start}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">{e.end}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{e.duration.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">{e.description}</td>
                    <td className="px-4 py-3">
                      <select
                        value={cat}
                        onChange={(ev) =>
                          setCategories((prev) => ({ ...prev, [e.id]: ev.target.value as Category }))
                        }
                        className={`text-[11px] font-medium border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 ${CAT_C[cat]}`}
                      >
                        <option value="Shore Constraint">Shore Constraint (100%)</option>
                        <option value="Environmental">Environmental (50%)</option>
                        <option value="Vessel Fault">Vessel Fault (0%)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-600">
                      {(mult * 100).toFixed(0)}%
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      mult === 0 ? "text-slate-300" : mult === 0.5 ? "text-amber-600" : "text-[#0D1B3E]"
                    }`}>
                      {counted}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation summary */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-[13px] font-semibold text-[#0D1B3E]">Laytime Statement</h4>
          {[
            { label: "Total Consumed Laytime", value: `${consumedHours.toFixed(2)} hrs`, bold: false },
            { label: "Allowed Laytime (Charter Party)", value: `${ALLOWED_LAYTIME_HRS.toFixed(2)} hrs`, bold: false },
            { label: "Δ Hours", value: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} hrs`, bold: true, highlight: delta > 0 ? "text-red-600" : "text-emerald-600" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
              <span className="text-slate-500">{row.label}</span>
              <span className={`font-mono ${row.bold ? "font-bold text-sm " : ""}${"highlight" in row ? row.highlight : "text-[#0D1B3E]"}`}>
                {row.value}
              </span>
            </div>
          ))}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Demurrage Rate</span>
              <span className="font-mono text-[#0D1B3E]">USD {DAILY_RATE_USD.toLocaleString()} / day</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold border-t border-slate-100 pt-2">
              <span className="text-[#0D1B3E]">Demurrage Owed</span>
              <span className="font-mono text-[#0D1B3E]">
                USD {demurrageOwed.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-[13px] font-semibold text-[#0D1B3E]">Financial Variance</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Shipowner&apos;s Invoice</span>
              <span className="font-mono text-red-600 font-semibold">
                USD {SHIPOWNER_INVOICE_USD.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">PARCO Calculated Amount</span>
              <span className="font-mono text-emerald-700 font-semibold">
                USD {demurrageOwed.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold border-t border-slate-200 pt-2">
              <span className="text-[#0D1B3E]">Dispute Amount</span>
              <span className="font-mono text-[#F97316]">
                USD {disputeAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 mt-2">
            <p className="text-[11px] text-orange-700 font-medium">
              Shipowner&apos;s invoice exceeds PARCO&apos;s calculation by{" "}
              {((disputeAmount / SHIPOWNER_INVOICE_USD) * 100).toFixed(1)}%.
              Proceed to Dispute Manager to generate a Letter of Protest.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TAB 4 · DISPUTE MANAGER
────────────────────────────────────────────────────────────── */
function DisputesTab() {
  const [selected, setSelected] = useState<Set<number>>(new Set([3, 4]));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedEvents = SOF_EVENTS.filter((e) => selected.has(e.id));
  const TIME_BAR_DAYS = 16;

  return (
    <>
      {/* Time-bar alert */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">
              Time-Bar Deadline: Jul 12, 2026
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              30 days from vessel departure (Jun 11). Dispute package must be submitted within{" "}
              <strong>{TIME_BAR_DAYS} days</strong>.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-center">
          <div className="text-2xl font-bold text-rose-700">{TIME_BAR_DAYS}</div>
          <div className="text-[10px] text-rose-500 uppercase tracking-wide">Days Left</div>
        </div>
      </div>

      {/* Select disputed events */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#0D1B3E]">
            Select Disputed SOF Events
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tick events you are challenging. These will be cited verbatim in the Letter of Protest.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {SOF_EVENTS.map((e) => (
            <label
              key={e.id}
              className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                selected.has(e.id) ? "bg-orange-50/40" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(e.id)}
                onChange={() => toggle(e.id)}
                className="mt-0.5 accent-[#F97316]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{e.start} – {e.end}</span>
                  <span className="font-mono text-[10px] text-slate-500">{e.duration.toFixed(2)}h</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5">{e.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Summary + export */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-[13px] font-semibold text-[#0D1B3E] mb-3">
            Selected Events ({selected.size})
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No events selected.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedEvents.map((e) => (
                <li key={e.id} className="text-xs text-slate-600 flex gap-2">
                  <span className="font-mono text-slate-400 shrink-0">{e.start}</span>
                  <span>{e.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <h4 className="text-[13px] font-semibold text-[#0D1B3E] mb-3">Generate Dispute Package</h4>
          <p className="text-xs text-slate-400 mb-4">
            Compiles a ZIP archive containing the formatted Letter of Protest (PDF) and the audited
            Laytime Statement with selected SOF events highlighted.
          </p>
          <div className="space-y-2 mb-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Letter of Protest (PDF) — PARCO letterhead
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Audited Laytime Statement (PDF)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Highlighted SOF event log ({selected.size} disputed events)
            </div>
          </div>
          <button
            disabled={selected.size === 0}
            className="mt-auto bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Dispute Package (.zip)
          </button>
        </div>
      </div>
    </>
  );
}
