"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV = [
  {
    code: "DEM",
    label: "Demurrage Auditor",
    sub: "Laytime & Disputes",
    href: "/operations/demurrage-auditor",
    accent: "#F97316",
    tabs: [
      { id: "overview",   label: "Overview" },
      { id: "documents",  label: "Document Ingestion" },
      { id: "calculator", label: "Laytime Calculator" },
      { id: "disputes",   label: "Dispute Manager" },
    ],
  },
  {
    code: "ULL",
    label: "Ullage Optimizer",
    sub: "Berthing & Tank Space",
    href: "/operations/ullage-optimizer",
    accent: "#0EA5E9",
    tabs: [
      { id: "overview",   label: "Overview" },
      { id: "schedule",   label: "Port Schedule" },
      { id: "inventory",  label: "Tank Inventory" },
      { id: "simulator",  label: "Ullage Simulator" },
    ],
  },
  {
    code: "REC",
    label: "Loss Control",
    sub: "Volumetric Reconciliation",
    href: "/operations/loss-control",
    accent: "#14B8A6",
    tabs: [
      { id: "overview",   label: "Overview" },
      { id: "converter",  label: "Volume Converter" },
      { id: "ledger",     label: "Reconciliation Ledger" },
      { id: "audit",      label: "Loss Audit" },
    ],
  },
];

export default function OpsSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "overview";

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
      <div className="px-4 pt-4 pb-2.5 border-b border-slate-100">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
          Operation Manageability
        </p>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map((m) => {
          const isActive = pathname.startsWith(m.href);
          return (
            <div key={m.code} className="mb-0.5">
              <Link
                href={`${m.href}?tab=overview`}
                className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-colors ${
                  isActive ? "bg-[#0D1B3E]" : "hover:bg-slate-100"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                  style={isActive ? {} : { color: m.accent }}
                >
                  {m.code.slice(0, 3)}
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-[12px] font-semibold truncate leading-tight ${
                      isActive ? "text-white" : "text-[#0D1B3E]"
                    }`}
                  >
                    {m.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
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
        <Link
          href="/operations"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0D1B3E] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 1.5L3 6l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Operations Hub
        </Link>
      </div>
    </aside>
  );
}
