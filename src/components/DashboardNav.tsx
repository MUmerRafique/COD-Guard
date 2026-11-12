import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/orders/new", label: "New order" },
  { href: "/dashboard/import", label: "CSV import" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  return (
    <nav className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-4 text-sm font-medium" aria-label="Dashboard">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
