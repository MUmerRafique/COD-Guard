import { DashboardNav } from "@/components/DashboardNav";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-teal-800">
            CODGuard
          </Link>
          <span className="text-xs text-slate-500">Asia/Karachi · PKR</span>
        </div>
      </header>
      <DashboardShell>
        <DashboardNav />
        {children}
      </DashboardShell>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">{children}</main>;
}
