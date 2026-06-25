import Link from "next/link";

const modules = [
  {
    tag: "A",
    label: "Upstream Intake & Berthing",
    description: "Vessel scheduling, berth allocation, and cargo intake operations.",
    href: "/modules/upstream-intake",
    kpis: [{ label: "Active Vessels", value: "4" }, { label: "Berths Available", value: "2" }, { label: "Pending MT", value: "12,400" }],
  },
  {
    tag: "B",
    label: "Transitional OCR Hub",
    description: "Automated document scanning, OCR processing, and data extraction pipeline.",
    href: "/modules/ocr-hub",
    kpis: [{ label: "Queue", value: "38" }, { label: "Processed Today", value: "214" }, { label: "Match Rate", value: "96.2%" }],
  },
  {
    tag: "C",
    label: "Smart Gantry & Fleet",
    description: "Real-time gantry crane dispatch, truck fleet tracking, and yard management.",
    href: "/modules/gantry-fleet",
    kpis: [{ label: "Cranes Active", value: "6/8" }, { label: "Trucks En Route", value: "23" }, { label: "Throughput/hr", value: "340 MT" }],
  },
  {
    tag: "D",
    label: "e-POD Driver App",
    description: "Digital proof-of-delivery, driver assignment, and last-mile confirmation.",
    href: "/modules/epod",
    kpis: [{ label: "Open Trips", value: "51" }, { label: "Delivered Today", value: "89" }, { label: "Exceptions", value: "3" }],
  },
  {
    tag: "E",
    label: "O2C / SAP HANA Integration",
    description: "Order-to-cash pipeline, SAP HANA sync, and automated invoice generation.",
    href: "/modules/o2c-sap",
    kpis: [{ label: "Open Orders", value: "127" }, { label: "Auto-Invoiced", value: "43" }, { label: "SLA Met", value: "98.1%" }],
  },
];

const platformStats = [
  { label: "Daily Throughput", value: "48,200 MT" },
  { label: "System Uptime", value: "99.7%" },
  { label: "Active Modules", value: "5 / 5" },
  { label: "Open Exceptions", value: "7" },
];

export default function Home() {
  return (
    <>
      <div className="flex-1 bg-slate-50">
        {/* Hero banner */}
        <div className="bg-[#0D1B3E] text-white">
          <div className="max-w-screen-xl mx-auto px-6 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
              PARCO Downstream Digitization
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">Supply Chain Hub</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Five interconnected modules spanning vessel intake through to SAP auto-invoice.
              Monitor, manage, and act across the entire downstream pipeline.
            </p>

            {/* Platform KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {platformStats.map((s) => (
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
            {modules.map((m) => (
              <Link
                key={m.tag}
                href={m.href}
                className="group bg-white rounded-xl border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md transition-all p-5 flex flex-col"
              >
                {/* Module header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-[#0D1B3E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.tag}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#0D1B3E] leading-tight">
                        {m.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Module {m.tag}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#1E3A8A] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            PARCO Downstream Digitization · Platform v1.0 · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}

