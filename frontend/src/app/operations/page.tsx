import Link from "next/link";

const opsModules = [
  {
    code: "DEM",
    label: "AI Demurrage & Laytime Auditor",
    description:
      "Ingest SOF and charter party documents, tokenize event logs into structured tables, calculate laytime liability against contract terms, and generate time-bar-aware dispute packages.",
    href: "/operations/demurrage-auditor",
    accent: "#F97316",
    accentBg: "bg-[#F97316]",
    accentText: "text-[#F97316]",
    accentBorder: "border-[#F97316]",
    kpis: [
      { label: "Active Disputes", value: "3" },
      { label: "Recovered YTD", value: "$2.4M" },
      { label: "Time-Bar Alerts", value: "2" },
    ],
  },
  {
    code: "ULL",
    label: "Berthing & Ullage Optimizer",
    description:
      "Coordinate multi-berth vessel scheduling with real-time Korangi PS-1 and MCR Mahmoodkot tank ullage levels, pipeline flow rates, and 72-hour overflow forecasting.",
    href: "/operations/ullage-optimizer",
    accent: "#0EA5E9",
    accentBg: "bg-[#0EA5E9]",
    accentText: "text-[#0EA5E9]",
    accentBorder: "border-[#0EA5E9]",
    kpis: [
      { label: "Vessels Active", value: "3" },
      { label: "Korangi Ullage", value: "45,000 MT" },
      { label: "Next Alert In", value: "8h" },
    ],
  },
  {
    code: "REC",
    label: "Hydrocarbon Loss Control",
    description:
      "Reconcile crude volumes across all four custody transfer nodes — Bill of Lading through refinery receipt — applying ASTM MPMS Chapter 11 standards and flagging anomalous losses.",
    href: "/operations/loss-control",
    accent: "#14B8A6",
    accentBg: "bg-[#14B8A6]",
    accentText: "text-[#14B8A6]",
    accentBorder: "border-[#14B8A6]",
    kpis: [
      { label: "Under Review", value: "4" },
      { label: "Avg Variance", value: "0.18%" },
      { label: "Anomalies", value: "1" },
    ],
  },
];

const hubStats = [
  { label: "Active Disputes", value: "3" },
  { label: "Pipeline Loss MTD", value: "0.22%" },
  { label: "Korangi Ullage", value: "45,000 MT" },
  { label: "Open Anomalies", value: "1" },
];

export default function OperationsHub() {
  return (
    <div className="flex-1 bg-slate-50">
      {/* Hero banner */}
      <div className="bg-[#0D1B3E] text-white">
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300 mb-2">
            PARCO · Internal Systems Platform
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">Operation Manageability</h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Three modules covering maritime financial controls, port scheduling, tank space
            management, and hydrocarbon loss reconciliation across PARCO&apos;s crude import
            and pipeline operations.
          </p>

          {/* Hub KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {hubStats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Modules
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {opsModules.map((m) => (
            <Link
              key={m.code}
              href={m.href}
              className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5 flex flex-col"
            >
              {/* Module header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-md ${m.accentBg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}
                  >
                    {m.code}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0D1B3E] leading-tight">
                      {m.label}
                    </div>
                    <div className={`text-[10px] font-medium ${m.accentText}`}>
                      Operation Manageability
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#0F766E] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.description}</p>

              {/* KPIs */}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                {m.kpis.map((k) => (
                  <div key={k.label}>
                    <div className="text-sm font-bold text-[#0D1B3E]">{k.value}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{k.label}</div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          PARCO Downstream Digitization · Operation Manageability · Platform v1.0
        </p>
      </div>
    </div>
  );
}
