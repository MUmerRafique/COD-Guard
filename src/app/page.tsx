import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <Hero />
      <p className="text-lg text-slate-600">
        Score COD orders with explainable risk rules, verify buyer intent, and reduce RTO losses — built for Pakistan merchants.
      </p>
      <Ctas />
      <p className="text-sm text-slate-500">
        Risk scores are decision support only. We do not label customers as fraudsters from scores alone.
      </p>
    </main>
  );
}

function Hero() {
  return (
    <h1 className="text-4xl font-bold tracking-tight text-slate-900">
      COD<span className="text-teal-600">Guard</span>
    </h1>
  );
}

function Ctas() {
  return (
    <div className="flex flex-wrap gap-4">
      <Link
        href="/login"
        className="rounded-lg bg-teal-600 px-5 py-2.5 text-white hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        Sign in
      </Link>
      <Link
        href="/dashboard"
        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-800 hover:bg-slate-50"
      >
        Dashboard
      </Link>
    </div>
  );
}
