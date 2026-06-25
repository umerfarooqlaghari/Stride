"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* ── types ── */
type TripStatus = "Assigned" | "Loading" | "En Route" | "Arrived" | "Signing" | "Delivered";
interface Trip {
  id: string; driver: string; truck: string; customer: string;
  cargo: string; dispatched: string; status: TripStatus; pod: string;
}

const TRIPS: Trip[] = [
  { id: "TRIP-5501", driver: "Sajjad Ahmed",  truck: "TRK-101", customer: "PARCO Retail – DHA",         cargo: "HSD 8,000L",       dispatched: "08:30", status: "Delivered", pod: "Signed"   },
  { id: "TRIP-5502", driver: "Naeem Baig",    truck: "TRK-102", customer: "PSO Depot – Korangi",        cargo: "Crude 12,000L",    dispatched: "09:10", status: "En Route", pod: "Pending"  },
  { id: "TRIP-5503", driver: "Kamran Zaidi",  truck: "TRK-103", customer: "Shell Station – F-10",       cargo: "HSD 5,000L",       dispatched: "09:45", status: "Delivered", pod: "Signed"   },
  { id: "TRIP-5504", driver: "Rizwan Pasha",  truck: "TRK-104", customer: "PARCO Wholesale – SITE",    cargo: "Naphtha 9,500L",   dispatched: "10:20", status: "Loading",   pod: "—"        },
  { id: "TRIP-5505", driver: "Adeel Shah",    truck: "TRK-105", customer: "Industrial Zone – Quetta",  cargo: "Lubricants 3,000L",dispatched: "11:00", status: "Assigned",  pod: "—"        },
  { id: "TRIP-5506", driver: "Bilal Hassan",  truck: "TRK-106", customer: "Airport Fueling – KHI",     cargo: "Jet-A1 20,000L",   dispatched: "11:30", status: "En Route", pod: "Pending"  },
];

const SC: Record<TripStatus, string> = {
  Assigned:  "bg-slate-100 text-slate-600 border border-slate-200",
  Loading:   "bg-purple-50 text-purple-700 border border-purple-200",
  "En Route":"bg-blue-50 text-blue-700 border border-blue-200",
  Arrived:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Signing:   "bg-amber-50 text-amber-700 border border-amber-200",
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};
const PC: Record<string, string> = {
  Signed: "text-emerald-600", Pending: "text-amber-600", "—": "text-slate-400",
};

const TABS = [
  { id: "overview",     label: "Overview"     },
  { id: "active-trips", label: "Active Trips" },
  { id: "driver-app",   label: "Driver App"   },
];
const BASE = "/modules/epod";

/* ────────────────────────────────────────────────
   DRIVER APP MOBILE SIMULATOR
──────────────────────────────────────────────── */
const STEP_ORDER: TripStatus[] = ["Assigned", "Loading", "En Route", "Arrived", "Signing", "Delivered"];

const STEP_INFO: Record<TripStatus, { title: string; desc: string; btn: string; btnColor: string; }> = {
  Assigned:  { title: "Trip Assigned",      desc: "Proceed to loading bay and confirm cargo pick-up.",          btn: "Start Loading",          btnColor: "bg-[#0D1B3E]"    },
  Loading:   { title: "Loading in Progress",desc: "Cargo loading underway at PARCO Terminal 2.",               btn: "Loading Complete",       btnColor: "bg-purple-700"   },
  "En Route":{ title: "En Route",           desc: "Navigate to destination. ETA updates are live.",            btn: "I've Arrived",           btnColor: "bg-blue-700"     },
  Arrived:   { title: "Arrived at Site",    desc: "You've reached the customer site. Get authorised signature.",btn: "Capture Signature",     btnColor: "bg-indigo-700"   },
  Signing:   { title: "Signing in Progress",desc: "Customer is signing the Proof of Delivery document.",       btn: "Submit POD",             btnColor: "bg-amber-600"    },
  Delivered: { title: "Delivery Complete",  desc: "Proof of Delivery submitted. Trip closed.",                 btn: "View Summary",           btnColor: "bg-emerald-700"  },
};

function DriverPhone({ trip, step, onAdvance }: {
  trip: Trip;
  step: TripStatus;
  onAdvance: () => void;
}) {
  const info = STEP_INFO[step];
  const stepIdx = STEP_ORDER.indexOf(step);
  const isDone = step === "Delivered";

  return (
    <div className="flex flex-col items-center">
      {/* phone frame */}
      <div
        className="relative bg-[#1C1C1E] rounded-[44px] shadow-2xl"
        style={{ width: 280, minHeight: 580, border: "6px solid #2C2C2E" }}
      >
        {/* side volume buttons */}
        <div className="absolute left-[-10px] top-[80px]  w-[4px] h-[36px] bg-[#3C3C3E] rounded-l-full" />
        <div className="absolute left-[-10px] top-[128px] w-[4px] h-[48px] bg-[#3C3C3E] rounded-l-full" />
        <div className="absolute left-[-10px] top-[188px] w-[4px] h-[48px] bg-[#3C3C3E] rounded-l-full" />
        <div className="absolute right-[-10px] top-[120px] w-[4px] h-[64px] bg-[#3C3C3E] rounded-r-full" />

        {/* screen */}
        <div className="flex flex-col h-full overflow-hidden rounded-[38px] bg-[#F2F2F7]" style={{ minHeight: 556 }}>

          {/* status bar */}
          <div className="bg-[#0D1B3E] px-5 py-2 flex items-center justify-between shrink-0">
            <span className="text-white text-[11px] font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="white" opacity="0.9"><rect x="0" y="5" width="2" height="5" rx="0.5"/><rect x="3" y="3" width="2" height="7" rx="0.5"/><rect x="6" y="1" width="2" height="9" rx="0.5"/><rect x="9" y="0" width="2" height="10" rx="0.5" opacity="0.4"/></svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 2.5C9.2 2.5 11.1 3.5 12.4 5L13.5 3.9C11.9 2.1 9.6 1 7 1 4.4 1 2.1 2.1 0.5 3.9L1.6 5C2.9 3.5 4.8 2.5 7 2.5Z" fill="white" fillOpacity="0.9"/><circle cx="7" cy="8" r="1.5" fill="white"/></svg>
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-2.5 border border-white/60 rounded-sm overflow-hidden flex items-center px-0.5"><div className="h-1.5 bg-emerald-400 rounded-sm" style={{ width: "70%" }} /></div>
              </div>
            </div>
          </div>

          {/* app header */}
          <div className="bg-[#0D1B3E] px-4 pb-3 shrink-0">
            <p className="text-white text-[14px] font-bold">PARCO Driver</p>
            <p className="text-slate-300 text-[10px] mt-0.5 font-mono">{trip.id} · {step}</p>
          </div>

          {/* progress steps */}
          <div className="bg-white px-4 py-3 flex items-center gap-1 shrink-0 border-b border-slate-100">
            {STEP_ORDER.map((s, i) => {
              const done    = i <  stepIdx;
              const current = i === stepIdx;
              return (
                <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                    done    ? "bg-emerald-500 text-white"
                    : current ? "bg-[#0D1B3E] text-white ring-2 ring-[#0D1B3E]/20"
                    : "bg-slate-200 text-slate-400"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* content area */}
          <div className="flex-1 px-4 py-3 flex flex-col gap-3">

            {/* trip card */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Delivery Details</div>
              <div className="text-[12px] font-bold text-[#0D1B3E]">{trip.customer}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{trip.cargo}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="4" r="2" stroke="#94a3b8" strokeWidth="1.2"/><path d="M5 9S1.5 6 1.5 4a3.5 3.5 0 017 0C8.5 6 5 9 5 9z" stroke="#94a3b8" strokeWidth="1.2"/></svg>
                {trip.customer}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#94a3b8" strokeWidth="1.2"/><path d="M5 2.5V5l1.5 1" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Dispatched {trip.dispatched}
              </div>
            </div>

            {/* step info */}
            <div className={`rounded-xl p-3 ${isDone ? "bg-emerald-50 border border-emerald-200" : "bg-[#EEF2FF] border border-[#C7D2FE]"}`}>
              {isDone && (
                <div className="text-center mb-2">
                  <div className="text-3xl mb-1">✅</div>
                </div>
              )}
              <div className={`text-[12px] font-bold mb-1 ${isDone ? "text-emerald-700" : "text-[#0D1B3E]"}`}>{info.title}</div>
              <div className={`text-[10px] leading-relaxed ${isDone ? "text-emerald-600" : "text-slate-500"}`}>{info.desc}</div>
              {step === "Signing" && (
                <div className="mt-2 bg-white rounded-lg border border-slate-200 h-16 flex items-center justify-center">
                  <svg width="80" height="30" viewBox="0 0 80 30" fill="none">
                    <path d="M5 20 Q15 8 20 18 Q25 28 35 12 Q42 2 50 15 Q56 24 65 10 Q70 4 75 16" stroke="#1E3A8A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* action button */}
          {!isDone && (
            <div className="px-4 pb-5 pt-2 shrink-0 bg-white border-t border-slate-100">
              <button
                onClick={onAdvance}
                className={`w-full py-3 rounded-2xl text-white text-[13px] font-bold transition-all active:scale-[0.98] ${info.btnColor} hover:opacity-90`}
              >
                {info.btn}
              </button>
            </div>
          )}
          {isDone && (
            <div className="px-4 pb-5 pt-2 shrink-0 bg-white border-t border-slate-100 text-center">
              <p className="text-[11px] text-emerald-600 font-semibold">POD Submitted ✓</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Syncing with SAP…</p>
            </div>
          )}
        </div>
      </div>

      {/* step label below phone */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">Step {stepIdx + 1} of {STEP_ORDER.length}</p>
        <p className="text-sm font-semibold text-[#0D1B3E] mt-0.5">{STEP_INFO[step].title}</p>
      </div>
    </div>
  );
}

/* ── page ── */
function PageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [simTrip, setSimTrip] = useState<Trip>(TRIPS[1]); // Naeem Baig - En Route
  const [simStep, setSimStep] = useState<TripStatus>("En Route");

  const advanceTrip = (id: string) => {
    setTrips(ts => ts.map(t => {
      if (t.id !== id) return t;
      const idx = STEP_ORDER.indexOf(t.status);
      const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
      return { ...t, status: next, pod: next === "Delivered" ? "Signed" : t.pod };
    }));
  };
  const advanceSim = () => {
    const idx = STEP_ORDER.indexOf(simStep);
    if (idx < STEP_ORDER.length - 1) setSimStep(STEP_ORDER[idx + 1]);
  };

  const delivered = trips.filter(t => t.status === "Delivered").length;
  const enRoute   = trips.filter(t => t.status === "En Route").length;

  return (
    <div>
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-200">Hub</Link><span>/</span>
            <span className="text-slate-300">Module D — e-POD</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">e-POD Driver App</h1>
              <p className="text-sm text-slate-400 mt-1">Digital proof-of-delivery, driver assignments, and last-mile confirmation.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />Live
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Total Trips",    value: trips.length.toString() },
              { label: "Delivered Today",value: delivered.toString()    },
              { label: "En Route",       value: enRoute.toString()      },
              { label: "POD Signed",     value: trips.filter(t=>t.pod==="Signed").length.toString() },
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

      <div className="p-6">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Delivered",  v: delivered,                                         c: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { label: "En Route",   v: enRoute,                                           c: "text-blue-700",    bg: "bg-blue-50 border-blue-200"       },
                { label: "Loading",    v: trips.filter(t=>t.status==="Loading").length,      c: "text-purple-700",  bg: "bg-purple-50 border-purple-200"   },
                { label: "Assigned",   v: trips.filter(t=>t.status==="Assigned").length,     c: "text-slate-600",   bg: "bg-slate-50 border-slate-200"     },
              ].map(s=>(
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 text-sm font-semibold text-[#0D1B3E]">Trip Summary</div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Trip","Driver","Customer","Cargo","Status","POD"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map(t=>(
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{t.id}</td>
                      <td className="px-5 py-3 font-medium text-[#0D1B3E]">{t.driver}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-[160px] truncate">{t.customer}</td>
                      <td className="px-5 py-3 text-slate-500">{t.cargo}</td>
                      <td className="px-5 py-3"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${SC[t.status]}`}>{t.status}</span></td>
                      <td className={`px-5 py-3 text-xs font-semibold ${PC[t.pod] ?? "text-slate-400"}`}>{t.pod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIVE TRIPS */}
        {tab === "active-trips" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Active Trips</h3>
              <span className="text-xs text-slate-400">Click Advance to move trip to next stage</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Trip ID","Driver","Truck","Customer","Cargo","Dispatched","Status","e-POD","Advance"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map(t=>(
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{t.id}</td>
                      <td className="px-4 py-3.5 font-medium text-[#0D1B3E]">{t.driver}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{t.truck}</td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[140px] truncate">{t.customer}</td>
                      <td className="px-4 py-3.5 text-slate-500">{t.cargo}</td>
                      <td className="px-4 py-3.5 text-slate-500">{t.dispatched}</td>
                      <td className="px-4 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${SC[t.status]}`}>{t.status}</span></td>
                      <td className={`px-4 py-3.5 text-xs font-semibold ${PC[t.pod] ?? "text-slate-400"}`}>{t.pod}</td>
                      <td className="px-4 py-3.5">
                        {t.status !== "Delivered" ? (
                          <button
                            onClick={() => { advanceTrip(t.id); if (t.id === simTrip.id) advanceSim(); }}
                            className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#0D1B3E] text-white hover:bg-[#1E3A8A] transition-colors"
                          >
                            Advance →
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold">✓ Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRIVER APP */}
        {tab === "driver-app" && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* simulator */}
            <div className="shrink-0">
              <DriverPhone trip={simTrip} step={simStep} onAdvance={advanceSim} />
            </div>

            {/* right panel */}
            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Select Trip to Simulate</h3>
              <div className="space-y-2">
                {trips.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSimTrip(t); setSimStep(t.status); }}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                      simTrip.id === t.id
                        ? "border-[#0D1B3E] bg-[#0D1B3E]/5 ring-1 ring-[#0D1B3E]/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-slate-400">{t.id}</span>
                        <div className="text-sm font-semibold text-[#0D1B3E] mt-0.5">{t.driver}</div>
                        <div className="text-xs text-slate-500">{t.customer} · {t.cargo}</div>
                      </div>
                      <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${SC[t.status]}`}>{t.status}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 text-xs text-[#0D1B3E]">
                <p className="font-semibold mb-1">How to use the Driver App simulator</p>
                <ul className="text-slate-500 space-y-0.5 list-disc list-inside">
                  <li>Select any trip from the list above</li>
                  <li>Use the action button in the phone to advance through delivery stages</li>
                  <li>Progress is reflected in the Active Trips table too</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EPODPage() {
  return <Suspense><PageContent /></Suspense>;
}
