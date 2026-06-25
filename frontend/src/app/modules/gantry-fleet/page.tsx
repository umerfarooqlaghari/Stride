"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type CraneStatus = "Active" | "Idle" | "Maintenance";
type TruckStatus = "En Route" | "Loading" | "Delivered" | "Idle";

interface Crane { id: string; zone: string; status: CraneStatus; operator: string; cycles: number; load: string; util: number; }
interface Truck  { id: string; driver: string; destination: string; cargo: string; status: TruckStatus; eta: string; }

const CRANES: Crane[] = [
  { id: "GC-01", zone: "North Yard", status: "Active",      operator: "Tariq M.",  cycles: 42, load: "28 MT", util: 88 },
  { id: "GC-02", zone: "North Yard", status: "Active",      operator: "Asim R.",   cycles: 39, load: "30 MT", util: 82 },
  { id: "GC-03", zone: "South Yard", status: "Idle",        operator: "—",         cycles: 0,  load: "—",     util: 0  },
  { id: "GC-04", zone: "South Yard", status: "Active",      operator: "Bilal H.",  cycles: 51, load: "25 MT", util: 91 },
  { id: "GC-05", zone: "East Jetty", status: "Maintenance", operator: "Workshop",  cycles: 0,  load: "—",     util: 0  },
  { id: "GC-06", zone: "East Jetty", status: "Active",      operator: "Usman K.",  cycles: 35, load: "22 MT", util: 74 },
  { id: "GC-07", zone: "West Jetty", status: "Active",      operator: "Haris N.",  cycles: 47, load: "29 MT", util: 79 },
  { id: "GC-08", zone: "West Jetty", status: "Active",      operator: "Faisal Q.", cycles: 44, load: "26 MT", util: 85 },
];
const TRUCKS: Truck[] = [
  { id: "TRK-101", driver: "Sajjad A.",  destination: "Terminal 3",     cargo: "HSD",        status: "En Route",  eta: "13:45" },
  { id: "TRK-102", driver: "Naeem B.",   destination: "Refinery Gate",  cargo: "Crude Oil",  status: "Loading",   eta: "—"     },
  { id: "TRK-103", driver: "Kamran Z.",  destination: "Customer Site",  cargo: "Lubricants", status: "Delivered", eta: "—"     },
  { id: "TRK-104", driver: "Rizwan P.",  destination: "Terminal 1",     cargo: "Naphtha",    status: "En Route",  eta: "14:20" },
  { id: "TRK-105", driver: "Adeel S.",   destination: "South Depot",    cargo: "HSD",        status: "Idle",      eta: "—"     },
];

const CC: Record<CraneStatus, string> = {
  Active:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Idle:        "bg-slate-100 text-slate-600 border border-slate-200",
  Maintenance: "bg-amber-50 text-amber-700 border border-amber-200",
};
const TC: Record<TruckStatus, string> = {
  "En Route":  "bg-blue-50 text-blue-700 border border-blue-200",
  Loading:     "bg-purple-50 text-purple-700 border border-purple-200",
  Delivered:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Idle:        "bg-slate-100 text-slate-600 border border-slate-200",
};

const TABS = [
  { id: "overview", label: "Overview"         },
  { id: "cranes",   label: "Crane Operations" },
  { id: "fleet",    label: "Fleet Dispatch"   },
];
const BASE = "/modules/gantry-fleet";

function UtilBar({ v }: { v: number }) {
  const c = v >= 80 ? "bg-[#0D1B3E]" : v >= 50 ? "bg-blue-400" : "bg-slate-200";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${c} rounded-full`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs text-slate-600 tabular-nums">{v > 0 ? `${v}%` : "—"}</span>
    </div>
  );
}

function PageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const [cranes, setCranes] = useState<Crane[]>(CRANES);
  const [trucks, setTrucks] = useState<Truck[]>(TRUCKS);

  const activateCrane  = (id: string) => setCranes(cs => cs.map(c => c.id === id ? { ...c, status: "Active" } : c));
  const sendMaint      = (id: string) => setCranes(cs => cs.map(c => c.id === id ? { ...c, status: "Maintenance", operator: "Workshop", load: "—", util: 0 } : c));
  const dispatchTruck  = (id: string) => setTrucks(ts => ts.map(t => t.id === id ? { ...t, status: "En Route", eta: "15:00" } : t));
  const recallTruck    = (id: string) => setTrucks(ts => ts.map(t => t.id === id ? { ...t, status: "Idle", eta: "—" } : t));

  const activeCount = cranes.filter(c => c.status === "Active").length;
  const enRoute     = trucks.filter(t => t.status === "En Route").length;

  return (
    <div>
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-200">Hub</Link><span>/</span>
            <span className="text-slate-300">Module C — Gantry & Fleet</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">Smart Gantry & Fleet</h1>
              <p className="text-sm text-slate-400 mt-1">Real-time crane dispatch, truck fleet tracking, and yard management.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />Live
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Cranes Active",    value: `${activeCount} / ${cranes.length}` },
              { label: "Trucks En Route",  value: enRoute.toString() },
              { label: "Throughput / hr",  value: "340 MT" },
              { label: "Avg Utilisation",  value: `${Math.round(cranes.filter(c=>c.util>0).reduce((s,c)=>s+c.util,0) / Math.max(activeCount,1))}%` },
            ].map(k=>(
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-lg font-bold">{k.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 flex border-t border-white/10">
          {TABS.map(t=>(
            <Link key={t.id} href={`${BASE}?tab=${t.id}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-white text-white" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >{t.label}</Link>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Active Cranes",  v: activeCount,                                             c: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Trucks En Route",v: enRoute,                                                 c: "text-blue-700",    bg: "bg-blue-50 border-blue-200"       },
                { label: "In Maintenance", v: cranes.filter(c=>c.status==="Maintenance").length,       c: "text-amber-600",   bg: "bg-amber-50 border-amber-200"     },
              ].map(s=>(
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {/* mini crane table */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 text-sm font-semibold text-[#0D1B3E]">Crane Quick View</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50">{["Crane","Zone","Status","Operator","Cycles","Utilisation"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {cranes.map(c=>(
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0D1B3E]">{c.id}</td>
                        <td className="px-5 py-3 text-slate-500">{c.zone}</td>
                        <td className="px-5 py-3"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${CC[c.status]}`}>{c.status}</span></td>
                        <td className="px-5 py-3 text-slate-600">{c.operator}</td>
                        <td className="px-5 py-3 text-slate-700 font-medium">{c.cycles > 0 ? c.cycles : "—"}</td>
                        <td className="px-5 py-3"><UtilBar v={c.util} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "cranes" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Gantry Crane Operations</h3>
              <span className="text-xs text-slate-400">{activeCount} / {cranes.length} active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Crane","Zone","Status","Operator","Cycles","Load","Utilisation","Actions"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {cranes.map(c=>(
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0D1B3E]">{c.id}</td>
                      <td className="px-5 py-3.5 text-slate-500">{c.zone}</td>
                      <td className="px-5 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${CC[c.status]}`}>{c.status}</span></td>
                      <td className="px-5 py-3.5 text-slate-600">{c.operator}</td>
                      <td className="px-5 py-3.5 font-medium">{c.cycles > 0 ? c.cycles : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500">{c.load}</td>
                      <td className="px-5 py-3.5"><UtilBar v={c.util} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {(c.status === "Idle" || c.status === "Maintenance") && (
                            <button onClick={()=>activateCrane(c.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Activate</button>
                          )}
                          {c.status === "Active" && (
                            <button onClick={()=>sendMaint(c.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">Maintenance</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "fleet" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Fleet Dispatch</h3>
              <span className="text-xs text-slate-400">{trucks.length} trucks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Truck","Driver","Destination","Cargo","Status","ETA","Actions"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {trucks.map(t=>(
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0D1B3E]">{t.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{t.driver}</td>
                      <td className="px-5 py-3.5 text-slate-600">{t.destination}</td>
                      <td className="px-5 py-3.5 text-slate-500">{t.cargo}</td>
                      <td className="px-5 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${TC[t.status]}`}>{t.status}</span></td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{t.eta}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {t.status === "Idle" && <button onClick={()=>dispatchTruck(t.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#0D1B3E] text-white hover:bg-[#1E3A8A] transition-colors">Dispatch</button>}
                          {t.status === "En Route" && <button onClick={()=>recallTruck(t.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 transition-colors">Recall</button>}
                        </div>
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

export default function GantryFleetPage() {
  return <Suspense><PageContent /></Suspense>;
}
