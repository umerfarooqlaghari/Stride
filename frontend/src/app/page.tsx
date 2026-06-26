import Link from "next/link";

const hubs = [
  {
    code: "SCH",
    label: "Supply Chain Hub",
    tagline: "Port-to-SAP Operations",
    description:
      "End-to-end crude intake through automated SAP invoicing — vessel scheduling, document OCR, gantry dispatch, e-POD delivery confirmation, and order-to-cash pipeline.",
    href: "/supply-chain",
    accentBg: "bg-[#1E3A8A]",
    accentText: "text-[#1E3A8A]",
    accentBorder: "border-[#1E3A8A]",
    moduleCount: 5,
    tags: ["Upstream Intake", "OCR Hub", "Gantry & Fleet", "e-POD", "O2C / SAP"],
    kpis: [
      { label: "Active Vessels", value: "4" },
      { label: "Daily Throughput", value: "48,200 MT" },
      { label: "Open Exceptions", value: "7" },
    ],
  },
  {
    code: "OPM",
    label: "Operation Manageability",
    tagline: "Maritime Controls & Reconciliation",
    description:
      "Demurrage claim auditing, ullage-aware berth scheduling, and multi-node hydrocarbon loss reconciliation across crude import and 870 km KMK pipeline operations.",
    href: "/operations",
    accentBg: "bg-[#0F766E]",
    accentText: "text-[#0F766E]",
    accentBorder: "border-[#0F766E]",
    moduleCount: 3,
    tags: ["Demurrage Auditor", "Ullage Optimizer", "Loss Control"],
    kpis: [
      { label: "Active Disputes", value: "3" },
      { label: "Korangi Ullage", value: "45,000 MT" },
      { label: "Anomalies Flagged", value: "1" },
    ],
  },
];

const systemStats = [
  { label: "System Uptime", value: "99.7%" },
  { label: "Total Modules", value: "8 / 8" },
  { label: "Daily Throughput", value: "48,200 MT" },
  { label: "Open Alerts", value: "5" },
];

export default function Home() {
  return (
    <div className="flex-1 bg-slate-50">
      {/* Hero banner */}
      <div className="bg-[#0D1B3E] text-white">
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
            PARCO Downstream Digitization
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">Internal Systems Platform</h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Two operational hubs — supply chain logistics and maritime operations management.
            Select a hub to navigate its modules.
          </p>

          {/* Platform KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {systemStats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hub cards */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Operational Hubs
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {hubs.map((h) => (
            <Link
              key={h.code}
              href={h.href}
              className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-6 flex flex-col"
            >
              {/* Hub header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${h.accentBg} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}
                  >
                    {h.code}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#0D1B3E] leading-tight">{h.label}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{h.tagline}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${h.accentText} ${h.accentBorder}`}
                  >
                    {h.moduleCount} Modules
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#1E3A8A] transition-colors mt-1">
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
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">{h.description}</p>

              {/* Module tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {h.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* KPIs */}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                {h.kpis.map((k) => (
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
          PARCO Downstream Digitization · Platform v1.0 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
