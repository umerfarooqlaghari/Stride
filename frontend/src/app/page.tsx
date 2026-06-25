import Link from "next/link";

const modules = [
  { tag: "A", label: "Upstream Intake & Berthing", color: "#C8102E", href: "/Design/PARCO Module A - Upstream Intake.dc.html" },
  { tag: "B", label: "Transitional OCR Hub", color: "#8B5CF6", href: "/Design/PARCO Module B - OCR Hub.dc.html" },
  { tag: "C", label: "Smart Gantry & Fleet", color: "#F59E0B", href: "/Design/PARCO Module C - Gantry & Fleet.dc.html" },
  { tag: "D", label: "e-POD Driver App", color: "#22C55E", href: "/Design/PARCO Module D - e-POD Driver App.dc.html" },
  { tag: "E", label: "O2C / SAP HANA Integration", color: "#3B82F6", href: "/Design/PARCO Module E - O2C SAP Hub.dc.html" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-[#C8102E] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L16 5.5V12.5L9 16.5L2 12.5V5.5L9 1.5Z" fill="white" fillOpacity="0.95" />
              <circle cx="9" cy="9" r="2.5" fill="#C8102E" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-extrabold text-[#E8EEF8] tracking-tight">PARCO</div>
            <div className="text-[10px] text-[#3A4A62] uppercase tracking-widest font-semibold">Downstream Supply Chain</div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-[#E8EEF8] tracking-tight mb-2">
          Supply Chain Demo
        </h1>
        <p className="text-sm text-[#4A5A72] mb-8 leading-relaxed">
          Five interconnected modules — vessel intake through to SAP auto-invoice.
        </p>

        {/* Hub CTA */}
        <a
          href="/Design/PARCO Supply Chain Hub - Standalone.html"
          className="block w-full mb-6 px-6 py-4 rounded-xl bg-[#C8102E] hover:bg-[#E5102E] transition-colors text-white font-bold text-sm text-center"
        >
          Open Supply Chain Hub →
        </a>

        {/* Module links */}
        <div className="flex flex-col gap-2">
          {modules.map((m) => (
            <a
              key={m.tag}
              href={m.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0E1626] border border-white/5 hover:border-white/10 hover:bg-[#131D30] transition-colors"
            >
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ color: m.color, background: `${m.color}18` }}
              >
                {m.tag}
              </span>
              <span className="text-sm text-[#8896A9]">{m.label}</span>
              <svg className="ml-auto" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke={m.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[#2A3A52]">
          PARCO Downstream Digitization · Design Prototype v1.0
        </p>
      </div>
    </main>
  );
}
