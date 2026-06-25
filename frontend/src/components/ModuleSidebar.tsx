"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV = [
  {
    tag: "A", label: "Upstream Intake", sub: "Berthing & Cargo",
    href: "/modules/upstream-intake",
    tabs: [
      { id: "overview",     label: "Overview" },
      { id: "vessel-queue", label: "Vessel Queue" },
      { id: "berth-status", label: "Berth Status" },
      { id: "cargo-intake", label: "Cargo Intake" },
    ],
  },
  {
    tag: "B", label: "OCR Hub", sub: "Document Processing",
    href: "/modules/ocr-hub",
    tabs: [
      { id: "overview",       label: "Overview" },
      { id: "document-queue", label: "Document Queue" },
      { id: "matched",        label: "Matched" },
      { id: "exceptions",     label: "Exceptions" },
    ],
  },
  {
    tag: "C", label: "Gantry & Fleet", sub: "Operations",
    href: "/modules/gantry-fleet",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "cranes",   label: "Crane Operations" },
      { id: "fleet",    label: "Fleet Dispatch" },
    ],
  },
  {
    tag: "D", label: "e-POD", sub: "Driver App",
    href: "/modules/epod",
    tabs: [
      { id: "overview",     label: "Overview" },
      { id: "active-trips", label: "Active Trips" },
      { id: "driver-app",   label: "Driver App" },
    ],
  },
  {
    tag: "E", label: "O2C / SAP", sub: "Finance & ERP",
    href: "/modules/o2c-sap",
    tabs: [
      { id: "overview",  label: "Overview" },
      { id: "orders",    label: "Sales Orders" },
      { id: "invoices",  label: "Invoices" },
      { id: "sap-sync",  label: "SAP Sync" },
    ],
  },
];

export default function ModuleSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "overview";

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
      <div className="px-4 pt-4 pb-2.5 border-b border-slate-100">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Modules</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map((m) => {
          const isActive = pathname.startsWith(m.href);
          return (
            <div key={m.tag} className="mb-0.5">
              <Link
                href={`${m.href}?tab=overview`}
                className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#0D1B3E]" : "hover:bg-slate-100"
                }`}
              >
                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{m.tag}</span>
                <div className="min-w-0">
                  <div className={`text-[12px] font-semibold truncate leading-tight ${isActive ? "text-white" : "text-[#0D1B3E]"}`}>
                    {m.label}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                    {m.sub}
                  </div>
                </div>
              </Link>

              {isActive && (
                <div className="ml-[22px] mt-0.5 mb-2 border-l-2 border-slate-200 pl-3 flex flex-col gap-0.5">
                  {m.tabs.map((t) => (
                    <Link
                      key={t.id}
                      href={`${m.href}?tab=${t.id}`}
                      className={`block text-[11px] py-1 px-2 rounded transition-colors ${
                        activeTab === t.id
                          ? "bg-[#E8EEF8] text-[#0D1B3E] font-semibold"
                          : "text-slate-500 hover:text-[#0D1B3E] hover:bg-slate-50"
                      }`}
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0D1B3E] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 1.5L3 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Hub
        </Link>
      </div>
    </aside>
  );
}
