"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type OrderStatus  = "Pending Approval" | "Processing" | "In Transit" | "Invoice Sent" | "Delivered";
type SyncStatus   = "Synced" | "Pending" | "Hold" | "Failed";
type InvStatus    = "Sent" | "Paid" | "Overdue";

interface Order   { id: string; customer: string; product: string; qty: string; value: string; created: string; status: OrderStatus; sync: SyncStatus; }
interface Invoice { id: string; order: string; amount: string; issued: string; due: string; status: InvStatus; }
interface SyncLog { id: string; entity: string; action: string; time: string; status: SyncStatus; message: string; }

const ORDERS: Order[] = [
  { id: "SO-88421", customer: "PSO Karachi",      product: "HSD",        qty: "50,000 L",  value: "PKR 11.2M", created: "2026-06-25", status: "Invoice Sent",     sync: "Synced"  },
  { id: "SO-88422", customer: "Shell Pakistan",   product: "Naphtha",    qty: "25,000 L",  value: "PKR 4.8M",  created: "2026-06-25", status: "Delivered",        sync: "Synced"  },
  { id: "SO-88423", customer: "PARCO Retail",     product: "Crude Oil",  qty: "80,000 L",  value: "PKR 22.5M", created: "2026-06-26", status: "In Transit",       sync: "Pending" },
  { id: "SO-88424", customer: "OGDCL",            product: "Jet-A1",     qty: "120,000 L", value: "PKR 38.1M", created: "2026-06-26", status: "Processing",       sync: "Pending" },
  { id: "SO-88425", customer: "Attock Refinery",  product: "Lubricants", qty: "8,000 L",   value: "PKR 2.1M",  created: "2026-06-26", status: "Invoice Sent",     sync: "Synced"  },
  { id: "SO-88426", customer: "PIA Fueling",      product: "Jet-A1",     qty: "200,000 L", value: "PKR 63.4M", created: "2026-06-26", status: "Pending Approval", sync: "Hold"    },
];
const INVOICES: Invoice[] = [
  { id: "INV-20614", order: "SO-88421", amount: "PKR 11.2M", issued: "2026-06-25", due: "2026-07-25", status: "Sent"    },
  { id: "INV-20615", order: "SO-88422", amount: "PKR 4.8M",  issued: "2026-06-25", due: "2026-07-25", status: "Paid"    },
  { id: "INV-20616", order: "SO-88425", amount: "PKR 2.1M",  issued: "2026-06-26", due: "2026-07-26", status: "Sent"    },
];
const SYNC_LOG: SyncLog[] = [
  { id: "SYNC-001", entity: "SO-88421", action: "Order Created",     time: "09:12", status: "Synced",  message: "Successfully posted to SAP SD" },
  { id: "SYNC-002", entity: "INV-20614",action: "Invoice Generated", time: "09:14", status: "Synced",  message: "FI document 0090003142 created"  },
  { id: "SYNC-003", entity: "SO-88423", action: "Order Created",     time: "10:05", status: "Pending", message: "Awaiting HANA replication"        },
  { id: "SYNC-004", entity: "SO-88426", action: "Credit Check",      time: "11:30", status: "Hold",    message: "Credit limit exceeded — manual review required" },
  { id: "SYNC-005", entity: "SO-88424", action: "Delivery Note",     time: "11:42", status: "Failed",  message: "Material document mismatch"       },
];

const OC: Record<OrderStatus, string> = {
  "Pending Approval": "bg-slate-100 text-slate-600 border border-slate-200",
  Processing:         "bg-amber-50 text-amber-700 border border-amber-200",
  "In Transit":       "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Invoice Sent":     "bg-blue-50 text-blue-700 border border-blue-200",
  Delivered:          "bg-emerald-50 text-emerald-700 border border-emerald-200",
};
const SC: Record<SyncStatus, string> = {
  Synced:  "text-emerald-600",
  Pending: "text-amber-600",
  Hold:    "text-red-600",
  Failed:  "text-red-700",
};
const IC: Record<InvStatus, string> = {
  Sent:    "bg-blue-50 text-blue-700 border border-blue-200",
  Paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Overdue: "bg-red-50 text-red-700 border border-red-200",
};
const SLC: Record<SyncStatus, string> = {
  Synced:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Hold:    "bg-red-50 text-red-700 border border-red-200",
  Failed:  "bg-red-50 text-red-700 border border-red-200",
};

const TABS = [
  { id: "overview",  label: "Overview"      },
  { id: "orders",    label: "Sales Orders"  },
  { id: "invoices",  label: "Invoices"      },
  { id: "sap-sync",  label: "SAP Sync"      },
];
const BASE = "/modules/o2c-sap";

function PageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const [orders,   setOrders]   = useState<Order[]>(ORDERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [syncLog,  setSyncLog]  = useState<SyncLog[]>(SYNC_LOG);

  const approveOrder  = (id: string) => setOrders(o => o.map(r => r.id === id ? { ...r, status: "Processing", sync: "Pending" } : r));
  const holdOrder     = (id: string) => setOrders(o => o.map(r => r.id === id ? { ...r, status: "Pending Approval", sync: "Hold" } : r));
  const genInvoice    = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setOrders(o => o.map(r => r.id === id ? { ...r, status: "Invoice Sent", sync: "Synced" } : r));
    setInvoices(i => [...i, {
      id: `INV-${20617 + i.length}`, order: id, amount: order.value,
      issued: "2026-06-26", due: "2026-07-26", status: "Sent",
    }]);
  };
  const markPaid      = (id: string) => setInvoices(i => i.map(r => r.id === id ? { ...r, status: "Paid" } : r));
  const retrySync     = (id: string) => setSyncLog(s => s.map(r => r.id === id ? { ...r, status: "Synced", message: "Retry successful — document posted" } : r));

  const synced  = orders.filter(o => o.sync === "Synced").length;
  const revenue = "PKR 142M";

  return (
    <div>
      <div className="bg-[#0D1B3E] text-white">
        <div className="px-6 py-7">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-200">Hub</Link><span>/</span>
            <span className="text-slate-300">Module E — O2C / SAP</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">O2C / SAP HANA Integration</h1>
              <p className="text-sm text-slate-400 mt-1">Order-to-cash pipeline, SAP HANA sync, and auto invoice generation.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />SAP Connected
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Open Orders",   value: orders.filter(o=>o.status!=="Delivered").length.toString() },
              { label: "SAP Synced",    value: `${synced} / ${orders.length}` },
              { label: "SLA Met (30d)", value: "98.1%" },
              { label: "Revenue Today", value: revenue  },
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

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pending Approval", v: orders.filter(o=>o.status==="Pending Approval").length, c: "text-slate-600",   bg: "bg-slate-50 border-slate-200"    },
                { label: "Processing",       v: orders.filter(o=>o.status==="Processing").length,       c: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
                { label: "Invoiced",         v: orders.filter(o=>o.status==="Invoice Sent").length,     c: "text-blue-700",    bg: "bg-blue-50 border-blue-200"      },
                { label: "Delivered",        v: orders.filter(o=>o.status==="Delivered").length,        c: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200"},
              ].map(s=>(
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 text-sm font-semibold text-[#0D1B3E]">Recent Orders</div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Order","Customer","Product","Value","Status","SAP Sync"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o=>(
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0D1B3E]">{o.id}</td>
                      <td className="px-5 py-3 font-medium text-[#0D1B3E]">{o.customer}</td>
                      <td className="px-5 py-3 text-slate-500">{o.product}</td>
                      <td className="px-5 py-3 font-medium tabular-nums">{o.value}</td>
                      <td className="px-5 py-3"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${OC[o.status]}`}>{o.status}</span></td>
                      <td className={`px-5 py-3 text-xs font-semibold ${SC[o.sync]}`}>{o.sync}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Sales Orders</h3>
              <span className="text-xs text-slate-400">{orders.length} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["Order","Customer","Product","Qty","Value","Created","Status","SAP","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o=>(
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#0D1B3E]">{o.id}</td>
                      <td className="px-4 py-3.5 font-medium text-[#0D1B3E]">{o.customer}</td>
                      <td className="px-4 py-3.5 text-slate-500">{o.product}</td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-600">{o.qty}</td>
                      <td className="px-4 py-3.5 font-medium tabular-nums">{o.value}</td>
                      <td className="px-4 py-3.5 text-slate-500">{o.created}</td>
                      <td className="px-4 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${OC[o.status]}`}>{o.status}</span></td>
                      <td className={`px-4 py-3.5 text-xs font-semibold ${SC[o.sync]}`}>{o.sync}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          {o.status === "Pending Approval" && (
                            <button onClick={()=>approveOrder(o.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Approve</button>
                          )}
                          {(o.status === "Processing" || o.status === "In Transit") && (
                            <button onClick={()=>genInvoice(o.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#0D1B3E] text-white hover:bg-[#1E3A8A] transition-colors">Gen Invoice</button>
                          )}
                          {o.status !== "Delivered" && (
                            <button onClick={()=>holdOrder(o.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">Hold</button>
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

        {/* INVOICES */}
        {tab === "invoices" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">Invoice Register</h3>
              <span className="text-xs text-slate-400">{invoices.length} invoices</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50">{["Invoice","Order Ref","Amount","Issued","Due","Status","Actions"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(i=>(
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0D1B3E]">{i.id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{i.order}</td>
                    <td className="px-5 py-3.5 font-medium tabular-nums">{i.amount}</td>
                    <td className="px-5 py-3.5 text-slate-500">{i.issued}</td>
                    <td className="px-5 py-3.5 text-slate-500">{i.due}</td>
                    <td className="px-5 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${IC[i.status]}`}>{i.status}</span></td>
                    <td className="px-5 py-3.5">
                      {i.status === "Sent" && (
                        <button onClick={()=>markPaid(i.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Mark Paid</button>
                      )}
                      {i.status !== "Sent" && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SAP SYNC */}
        {tab === "sap-sync" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1B3E]">SAP HANA Sync Log</h3>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Connected to SAP S/4HANA
              </div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50">{["Sync ID","Entity","Action","Time","Status","Message","Actions"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {syncLog.map(s=>(
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{s.id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0D1B3E]">{s.entity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.action}</td>
                    <td className="px-5 py-3.5 text-slate-500">{s.time}</td>
                    <td className="px-5 py-3.5"><span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${SLC[s.status]}`}>{s.status}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[200px] truncate">{s.message}</td>
                    <td className="px-5 py-3.5">
                      {(s.status === "Failed" || s.status === "Hold") && (
                        <button onClick={()=>retrySync(s.id)} className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#0D1B3E] text-white hover:bg-[#1E3A8A] transition-colors">Retry</button>
                      )}
                      {(s.status === "Synced" || s.status === "Pending") && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default function O2CSAPPage() {
  return <Suspense><PageContent /></Suspense>;
}
