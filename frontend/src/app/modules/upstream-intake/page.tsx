"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ── types ── */
type VStatus = "Berthed" | "Inbound" | "Waiting" | "Scheduled";
type BStatus = "Occupied" | "Available" | "Maintenance";
type IStatus = "Confirmed" | "Pending Confirmation" | "Discrepancy";
type DataSource = "Port API" | "Coordinator Log" | "Pending Sync";

interface Vessel {
  id: string; name: string; flag: string; eta: string; berth: string | null;
  status: VStatus; cargo: string; mt: string;
  source: DataSource; lastUpdated: string; loggedBy?: string;
}
interface Berth {
  id: string; name: string; status: BStatus; vessel: string | null;
  capacity: string; source: DataSource; lastUpdated: string;
}
interface Intake {
  id: string; vessel: string; product: string; quantity: string;
  billOfLading: string; time: string; status: IStatus; notes?: string;
}

/* ── seed ── */
const VESSELS: Vessel[] = [
  { id: "MV-0041", name: "Al Noor",      flag: "🇵🇰", eta: "14:30", berth: "B-1", status: "Berthed",   cargo: "Crude Oil", mt: "42,000", source: "Port API",       lastUpdated: "13:58" },
  { id: "MV-0042", name: "Habib Star",   flag: "🇸🇦", eta: "17:00", berth: null,  status: "Inbound",   cargo: "HSD",       mt: "18,500", source: "Port API",       lastUpdated: "14:10" },
  { id: "MV-0043", name: "Pak Pioneer",  flag: "🇵🇰", eta: "20:15", berth: null,  status: "Waiting",   cargo: "Crude Oil", mt: "38,200", source: "Coordinator Log",lastUpdated: "12:30", loggedBy: "A. Siddiqui" },
  { id: "MV-0044", name: "Gulf Express", flag: "🇦🇪", eta: "22:45", berth: null,  status: "Scheduled", cargo: "Naphtha",   mt: "9,800",  source: "Port API",       lastUpdated: "11:00" },
];
const BERTHS: Berth[] = [
  { id: "B-1", name: "North Berth", status: "Occupied",    vessel: "MV-0041", capacity: "50,000 MT", source: "Port API",       lastUpdated: "13:58" },
  { id: "B-2", name: "South Berth", status: "Available",   vessel: null,      capacity: "25,000 MT", source: "Port API",       lastUpdated: "14:10" },
  { id: "B-3", name: "East Jetty",  status: "Maintenance", vessel: null,      capacity: "45,000 MT", source: "Coordinator Log",lastUpdated: "09:00" },
  { id: "B-4", name: "West Jetty",  status: "Available",   vessel: null,      capacity: "30,000 MT", source: "Port API",       lastUpdated: "14:10" },
];
const INTAKE: Intake[] = [
  { id: "INT-001", vessel: "MV-0041", product: "Crude Oil", quantity: "42,000 MT", billOfLading: "BL-2026-0441", time: "14:45", status: "Pending Confirmation" },
  { id: "INT-002", vessel: "MV-0039", product: "HSD",       quantity: "18,200 MT", billOfLading: "BL-2026-0438", time: "11:30", status: "Confirmed"            },
  { id: "INT-003", vessel: "MV-0038", product: "Naphtha",   quantity: "9,500 MT",  billOfLading: "BL-2026-0435", time: "09:15", status: "Discrepancy",         notes: "Quantity short by 120 MT vs B/L" },
];

/* ── color maps ── */
const VC: Record<VStatus, string> = {
  Berthed:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Inbound:   "bg-blue-50 text-blue-700 border border-blue-200",
  Waiting:   "bg-amber-50 text-amber-700 border border-amber-200",
  Scheduled: "bg-slate-100 text-slate-600 border border-slate-200",
};
const BC: Record<BStatus, string> = {
  Occupied:    "bg-blue-50 text-blue-700 border border-blue-200",
  Available:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Maintenance: "bg-amber-50 text-amber-700 border border-amber-200",
};
const IC: Record<IStatus, string> = {
  "Confirmed":             "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Pending Confirmation":  "bg-amber-50 text-amber-700 border border-amber-200",
  "Discrepancy":           "bg-red-50 text-red-700 border border-red-200",
};
const SRC: Record<DataSource, { label: string; dot: string; text: string }> = {
  "Port API":       { label: "Port API",        dot: "bg-emerald-400", text: "text-emerald-700" },
  "Coordinator Log":{ label: "Coordinator Log", dot: "bg-amber-400",   text: "text-amber-700"   },
  "Pending Sync":   { label: "Pending Sync",    dot: "bg-slate-300",   text: "text-slate-500"   },
};

const TABS = [
  { id: "overview",     label: "Overview"     },
  { id: "vessel-queue", label: "Vessel Queue" },
  { id: "berth-status", label: "Berth Status" },
  { id: "cargo-intake", label: "Cargo Intake" },
];
const BASE = "/modules/upstream-intake";

/* ── source badge ── */
function SourceBadge({ src, loggedBy }: { src: DataSource; loggedBy?: string }) {
  const s = SRC[src];
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      <span className={`text-[10px] font-medium ${s.text}`}>
        {s.label}{loggedBy ? ` · ${loggedBy}` : ""}
      </span>
    </span>
  );
}

/* ── log update form (inline, per vessel row) ── */
function LogUpdateForm({ vessel, berths, onSubmit, onClose }: {
  vessel: Vessel;
  berths: Berth[];
  onSubmit: (vId: string, berthId: string | null, status: VStatus, notes: string) => void;
  onClose: () => void;
}) {
  const [berthId, setBerthId]   = useState<string>(vessel.berth ?? "");
  const [status,  setStatus]    = useState<VStatus>(vessel.status);
  const [notes,   setNotes]     = useState("");

  return (
    <tr className="bg-blue-50/50">
      <td colSpan={8} className="px-5 py-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="text-xs font-semibold text-[#0D1B3E] pt-1.5 shrink-0">
            Log port update for <span className="font-mono">{vessel.id}</span>
          </div>
          <select value={status} onChange={e => setStatus(e.target.value as VStatus)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-[#0D1B3E]">
            <option value="Scheduled">Scheduled</option>
            <option value="Inbound">Inbound</option>
            <option value="Waiting">Waiting</option>
            <option value="Berthed">Berthed</option>
          </select>
          {status === "Berthed" && (
            <select value={berthId} onChange={e => setBerthId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-[#0D1B3E]">
              <option value="">Select berth reported by port…</option>
              {berths.map(b => <option key={b.id} value={b.id}>{b.id} — {b.name}</option>)}
            </select>
          )}
          <input
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (e.g. received call from Qasim Port at 14:30)"
            className="flex-1 min-w-[200px] text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onSubmit(vessel.id, status === "Berthed" ? berthId : null, status, notes)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0D1B3E] text-white hover:bg-[#1E3A8A] transition-colors"
            >Save Log Entry</button>
            <button onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 pl-0">
          This entry will be recorded as a Coordinator Log. It does not command the port — it syncs PARCO&apos;s internal view with information received from the Port Authority.
        </p>
      </td>
    </tr>
  );
}

/* ══════════════ PAGE CONTENT ══════════════ */
function PageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  const [vessels, setVessels]       = useState<Vessel[]>(VESSELS);
  const [berths,  setBerths]        = useState<Berth[]>(BERTHS);
  const [intake,  setIntake]        = useState<Intake[]>(INTAKE);
  const [syncing, setSyncing]       = useState(false);
  const [lastSync, setLastSync]     = useState("14:10");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* Simulate pulling from Port API */
  const syncFromPort = () => {
    setSyncing(true);
    setTimeout(() => {
      const now = new Date().toTimeString().slice(0, 5);
      setVessels(vs => vs.map(v => ({ ...v, source: "Port API", lastUpdated: now })));
      setBerths(bs => bs.map(b => ({ ...b, source: "Port API", lastUpdated: now })));
      setLastSync(now);
      setSyncing(false);
    }, 1400);
  };

  /* PARCO coordinator logs what port told them */
  const logPortUpdate = (vId: string, berthId: string | null, status: VStatus, _notes: string) => {
    const now = new Date().toTimeString().slice(0, 5);
    setVessels(vs => vs.map(v =>
      v.id === vId
        ? { ...v, status, berth: berthId, source: "Coordinator Log", lastUpdated: now, loggedBy: "Current User" }
        : v
    ));
    if (berthId) {
      setBerths(bs => bs.map(b => {
        if (b.id === berthId) return { ...b, status: "Occupied", vessel: vId, source: "Coordinator Log", lastUpdated: now };
        if (b.vessel === vId)  return { ...b, status: "Available", vessel: null, source: "Coordinator Log", lastUpdated: now };
        return b;
      }));
    }
    setExpandedRow(null);
  };

  /* Cargo confirmation — this IS internal to PARCO (they confirm what they physically received) */
  const confirmIntake   = (id: string) => setIntake(r => r.map(i => i.id === id ? { ...i, status: "Confirmed"            } : i));
  const flagDiscrepancy = (id: string) => setIntake(r => r.map(i => i.id === id ? { ...i, status: "Discrepancy"          } : i));

  const avail  = berths.filter(b => b.status === "Available").length;
  const active = vessels.filter(v => v.status === "Berthed" || v.status === "Inbound").length;
  const apiSrc = vessels.filter(v => v.source === "Port API").length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-200">Hub</Link><span>/</span>
            <span className="text-slate-300">Module A — Upstream Intake</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">Upstream Intake & Berthing</h1>
              <p className="text-sm text-slate-400 mt-1">
                Read-only visibility into Port Authority berth status. PARCO monitors; the port operates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-400">Last port sync</p>
                <p className="text-xs font-semibold text-white">{lastSync} today</p>
              </div>
              <button
                onClick={syncFromPort}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-60"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={syncing ? "animate-spin" : ""}>
                  <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {syncing ? "Syncing…" : "Sync Port API"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Vessels Active",   value: active.toString() },
              { label: "Berths Available", value: `${avail} / ${berths.length}` },
              { label: "Via Port API",     value: `${apiSrc} / ${vessels.length}` },
              { label: "Pending Volume",   value: "12,400 MT" },
            ].map(k => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-lg font-bold">{k.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 flex border-t border-white/10">
          {TABS.map(t => (
            <Link key={t.id} href={`${BASE}?tab=${t.id}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-white text-white" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >{t.label}</Link>
          ))}
        </div>
      </div>

      {/* ── Data source notice ── */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center gap-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-blue-600">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Monitoring mode.</span> Berth assignments are owned by the Port Authority (Qasim Port / KICT). PARCO tracks status via live API feed. When the port&apos;s systems are unavailable, the shipping coordinator logs updates manually.
        </p>
      </div>

      {/* ── Content ── */}
      <div className="p-6 space-y-5">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            {/* Berth status grid — read-only */}
            <div className="grid md:grid-cols-4 gap-4">
              {berths.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">{b.id}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${BC[b.status]}`}>{b.status}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#0D1B3E]">{b.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{b.capacity}</div>
                  {b.vessel && <div className="mt-2 font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">{b.vessel}</div>}
                  <div className="mt-2">
                    <SourceBadge src={b.source} />
                  </div>
                </div>
              ))}
            </div>

            {/* Vessel list — read-only */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0D1B3E]">Today&apos;s Vessel Schedule</h3>
                <span className="text-xs text-slate-400">Reported by Port Authority</span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Vessel","ETA","Cargo","Volume","Port Berth","Status","Data Source"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {vessels.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#0D1B3E]">{v.flag} {v.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">{v.id}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">{v.eta}</td>
                      <td className="px-5 py-3 text-slate-500">{v.cargo}</td>
                      <td className="px-5 py-3 font-medium">{v.mt} MT</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{v.berth ?? "—"}</td>
                      <td className="px-5 py-3"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${VC[v.status]}`}>{v.status}</span></td>
                      <td className="px-5 py-3"><SourceBadge src={v.source} loggedBy={v.loggedBy} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* VESSEL QUEUE */}
        {tab === "vessel-queue" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0D1B3E]">Vessel Queue — Port Authority Status</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Berths are assigned by Qasim Port / KICT, not by PARCO. Use &quot;Log Port Update&quot; to record status notified via phone or email.
                </p>
              </div>
              <button onClick={syncFromPort} disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0D1B3E]/20 text-[#0D1B3E] text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-60 shrink-0">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className={syncing ? "animate-spin" : ""}>
                  <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {syncing ? "Syncing…" : "Sync Port API"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {["Vessel","Name","ETA","Cargo","Volume","Port Berth","Status","Source",""].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vessels.map(v => (
                    <>
                      <tr key={v.id} className="hover:bg-slate-50 border-t border-slate-100">
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{v.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-[#0D1B3E]">{v.flag} {v.name}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">{v.eta}</td>
                        <td className="px-4 py-3.5 text-slate-500">{v.cargo}</td>
                        <td className="px-4 py-3.5 font-medium">{v.mt} MT</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{v.berth ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${VC[v.status]}`}>{v.status}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <SourceBadge src={v.source} loggedBy={v.loggedBy} />
                          <div className="text-[10px] text-slate-400 mt-0.5">Updated {v.lastUpdated}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {expandedRow === v.id ? (
                            <button onClick={() => setExpandedRow(null)}
                              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                              Cancel
                            </button>
                          ) : (
                            <button onClick={() => setExpandedRow(v.id)}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
                              Log Port Update
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedRow === v.id && (
                        <LogUpdateForm
                          vessel={v}
                          berths={berths}
                          onSubmit={logPortUpdate}
                          onClose={() => setExpandedRow(null)}
                        />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BERTH STATUS — fully read-only */}
        {tab === "berth-status" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Berth occupancy reported by Port Authority. PARCO has no write access to berth allocation.</p>
              <button onClick={syncFromPort} disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors disabled:opacity-60 shrink-0">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className={syncing ? "animate-spin" : ""}>
                  <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {syncing ? "Syncing…" : "Refresh from Port API"}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {berths.map(b => {
                const v = vessels.find(vv => vv.id === b.vessel);
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{b.id}</span>
                        <h3 className="text-sm font-semibold text-[#0D1B3E] mt-0.5">{b.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Capacity: {b.capacity}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${BC[b.status]}`}>{b.status}</span>
                    </div>

                    {v ? (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs">
                        <div className="font-semibold text-[#0D1B3E]">{v.flag} {v.name} <span className="font-mono text-slate-400">({v.id})</span></div>
                        <div className="text-slate-500 mt-0.5">{v.cargo} · {v.mt} MT · ETA {v.eta}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic mb-3">
                        {b.status === "Available" ? "No vessel assigned by port." : "Berth unavailable — port maintenance."}
                      </div>
                    )}

                    {/* Read-only footer — source + last update only */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <SourceBadge src={b.source} />
                      <span className="text-[10px] text-slate-400">Updated {b.lastUpdated}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CARGO INTAKE — PARCO internal confirmation */}
        {tab === "cargo-intake" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Cargo Intake Confirmation</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PARCO&apos;s receiving team confirms quantities against the Bill of Lading. Discrepancies trigger an internal claim process.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Intake ID","Vessel","Product","Qty Received","Bill of Lading","Time","Status","PARCO Action"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {intake.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{i.id}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{i.vessel}</td>
                      <td className="px-5 py-3.5 font-medium text-[#0D1B3E]">{i.product}</td>
                      <td className="px-5 py-3.5 font-medium">{i.quantity}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{i.billOfLading}</td>
                      <td className="px-5 py-3.5 text-slate-500">{i.time}</td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${IC[i.status]}`}>{i.status}</span>
                          {i.notes && <div className="text-[10px] text-red-600 mt-1">{i.notes}</div>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {i.status === "Pending Confirmation" ? (
                          <div className="flex gap-2">
                            <button onClick={() => confirmIntake(i.id)}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                              Confirm Receipt
                            </button>
                            <button onClick={() => flagDiscrepancy(i.id)}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                              Flag Discrepancy
                            </button>
                          </div>
                        ) : i.status === "Discrepancy" ? (
                          <button className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">
                            Raise Claim
                          </button>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function UpstreamIntakePage() {
  return <Suspense><PageContent /></Suspense>;
}
