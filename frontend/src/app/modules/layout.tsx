import { Suspense } from "react";
import ModuleSidebar from "@/components/ModuleSidebar";

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Suspense fallback={<aside className="w-52 shrink-0 bg-white border-r border-slate-200" />}>
        <ModuleSidebar />
      </Suspense>
      <main className="flex-1 overflow-auto bg-slate-50 min-h-0">
        {children}
      </main>
    </div>
  );
}
