"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type DocStatus = "Matched" | "Review" | "Failed" | "Processing";
interface Doc {
  id: string; type: string; source: string; submitted: string;
  confidence: number; status: DocStatus; fields: number;
}

const DOCS: Doc[] = [
  { id: "DOC-2841", type: "Bill of Lading",       source: "MV-0041", submitted: "09:12", confidence: 98.4, status: "Matched",    fields: 14 },
  { id: "DOC-2842", type: "Cargo Manifest",        source: "MV-0042", submitted: "09:35", confidence: 91.2, status: "Review",     fields: 22 },
  { id: "DOC-2843", type: "Commercial Invoice",    source: "MV-0041", submitted: "10:02", confidence: 99.1, status: "Matched",    fields: 18 },
  { id: "DOC-2844", type: "Certificate of Origin", source: "MV-0043", submitted: "10:18", confidence: 74.6, status: "Failed",     fields: 9  },
  { id: "DOC-2845", type: "Letter of Credit",      source: "MV-0044", submitted: "11:05", confidence: 96.8, status: "Matched",    fields: 31 },
  { id: "DOC-2846", type: "Customs Declaration",   source: "MV-0042", submitted: "11:22", confidence: 88.0, status: "Review",     fields: 27 },
  { id: "DOC-2847", type: "Packing List",          source: "MV-0043", submitted: "12:01", confidence: 55.3, status: "Failed",     fields: 11 },
];

const SC: Record<DocStatus, string> = {
  Matched:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Review:     "bg-amber-50 text-amber-700 border border-amber-200",
  Failed:     "bg-red-50 text-red-700 border border-red-200",
  Processing: "bg-blue-50 text-blue-700 border border-blue-200",
};

const TABS = [
  { id: "overview",       label: "Overview"       },
  { id: "document-queue", label: "Document Queue" },
  { id: "matched",        label: "Matched"        },
  { id: "exceptions",     label: "Exceptions"     },
];
const BASE = "/modules/ocr-hub";

function ConfBar({ value }: { value: number }) {
  const c = value >= 95 ? "bg-emerald-500" : value >= 80 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${c} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-600 font-medium tabular-nums">{value}%</span>
    </div>
  );
}

function DocTable({ docs, onApprove, onReject, onReprocess }: {
  docs: Doc[];
  onApprove?: (id: string) => void;
  onReject?:  (id: string) => void;
  onReprocess?: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50">{["Doc ID","Type","Source","Submitted","Fields","Confidence","Status","Actions"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{d.id}</td>
                <td className="px-5 py-3.5 font-medium text-[#0D1B3E]">{d.type}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{d.source}</td>
                <td className="px-5 py-3.5 text-slate-500">{d.submitted}</td>
                <td className="px-5 py-3.5 text-slate-600">{d.fields}</td>
                <td className="px-5 py-3.5"><ConfBar value={d.confidence} /></td>
                <td className="px-5 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${SC[d.status]}`}>{d.status}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    {d.status === "Review" && onApprove && (
                      <button onClick={() => onApprove(d.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Approve</button>
                    )}
                    {d.status === "Review" && onReject && (
                      <button onClick={() => onReject(d.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Reject</button>
                    )}
                    {d.status === "Failed" && onReprocess && (
                      <button onClick={() => onReprocess(d.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">Re-process</button>
                    )}
                    {d.status === "Matched" && <span className="text-xs text-slate-400">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const [docs, setDocs] = useState<Doc[]>(DOCS);

  const approve    = (id: string) => setDocs(d => d.map(r => r.id === id ? { ...r, status: "Matched"    } : r));
  const reject     = (id: string) => setDocs(d => d.map(r => r.id === id ? { ...r, status: "Failed"     } : r));
  const reprocess  = (id: string) => setDocs(d => d.map(r => r.id === id ? { ...r, status: "Processing" } : r));

  const matched  = docs.filter(d => d.status === "Matched");
  const review   = docs.filter(d => d.status === "Review");
  const failed   = docs.filter(d => d.status === "Failed");
  const avgConf  = (docs.reduce((s,d)=>s+d.confidence,0)/docs.length).toFixed(1);

  return (
    <div>
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-200">Hub</Link><span>/</span>
            <span className="text-slate-300">Module B — OCR Hub</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">Transitional OCR Hub</h1>
              <p className="text-sm text-slate-400 mt-1">Automated document ingestion, OCR extraction, and data reconciliation.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />Processing
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Total Docs",      value: docs.length.toString() },
              { label: "Auto-Matched",    value: matched.length.toString() },
              { label: "Needs Review",    value: review.length.toString() },
              { label: "Avg Confidence",  value: `${avgConf}%` },
            ].map(k=>(
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

      <div className="p-6 space-y-5">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Matched",          v: matched.length, c: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Needs Review",     v: review.length,  c: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
                { label: "Failed / Rejected",v: failed.length,  c: "text-red-600",     bg: "bg-red-50 border-red-200"        },
              ].map(s=>(
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <DocTable docs={docs} onApprove={approve} onReject={reject} onReprocess={reprocess} />
          </>
        )}
        {tab === "document-queue" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">All Documents</h3>
              <span className="text-xs text-slate-400">{docs.length} total</span>
            </div>
            <DocTable docs={docs} onApprove={approve} onReject={reject} onReprocess={reprocess} />
          </>
        )}
        {tab === "matched" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#0D1B3E]">Successfully Matched</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2 py-0.5 rounded-full">{matched.length} docs</span>
            </div>
            <DocTable docs={matched} />
          </>
        )}
        {tab === "exceptions" && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0D1B3E]">Exceptions & Failures</span>
                <span className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium px-2 py-0.5 rounded-full">{[...review,...failed].length} items</span>
              </div>
            </div>
            <DocTable docs={[...review,...failed]} onApprove={approve} onReject={reject} onReprocess={reprocess} />
          </>
        )}
      </div>
    </div>
  );
}

export default function OCRHubPage() {
  return <Suspense><PageContent /></Suspense>;
}
