"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const onModule = pathname.startsWith("/modules");

  return (
    <header className="bg-[#0D1B3E] border-b border-[#1E3A8A]/40 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L16 5.5V12.5L9 16.5L2 12.5V5.5L9 1.5Z" fill="white" fillOpacity="0.9" />
              <circle cx="9" cy="9" r="2.5" fill="#1E3A8A" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-bold text-white tracking-wide">PARCO</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-widest">Supply Chain Hub</div>
          </div>
        </Link>

        {onModule && (
          <Link href="/" className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 1.5L3 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Hub
          </Link>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Live
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-xs font-bold text-white">
            PA
          </div>
        </div>
      </div>
    </header>
  );
}
