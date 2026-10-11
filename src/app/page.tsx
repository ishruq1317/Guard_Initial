import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, FileCheck, AlertTriangle, Cpu, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  const stackItems = [
    { name: "Next.js 15 App Router", status: "Operational", desc: "React Server Components & unified API layer" },
    { name: "TypeScript (Strict)", status: "Enforced", desc: "Type-safe schemas and domain logic" },
    { name: "Prisma ORM & SQLite", status: "Configured", desc: "Local relational storage with ledger models" },
    { name: "Node.js Crypto SHA-256", status: "Active", desc: "Deterministic hashing & record-integrity verification" },
    { name: "Zod Schema Validation", status: "Ready", desc: "Input sanitization and bounds enforcement" },
    { name: "Vitest Automated Suite", status: "Verified", desc: "Isolated unit tests for cryptographic functions" },
  ];

  const pillarCards = [
    {
      icon: Lock,
      title: "Cryptographic Provenance",
      badge: "Foundation Active",
      badgeType: "active",
      description:
        "Deterministic SHA-256 integrity hash calculation and constant-time verification implemented in Node.js crypto.",
    },
    {
      icon: FileCheck,
      title: "Strict Registry Validation",
      badge: "Foundation Active",
      badgeType: "active",
      description:
        "Zod validation schemas enforcing parcel formats, deed structure, positive surface area, and party IDs.",
    },
    {
      icon: Database,
      title: "Auditable Ledger & SQLite",
      badge: "Foundation Active",
      badgeType: "active",
      description:
        "Relational Prisma ORM models and SQLite migrations for Land Records, Transfer Transactions, and Audit Logs.",
    },
    {
      icon: AlertTriangle,
      title: "Double-Selling Detection",
      badge: "Engine Active",
      badgeType: "active",
      description:
        "Deterministic pre-transaction conflict engine analyzing recorded registered conveyances, seller ownership, and uncancelled concurrent proposals.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">LandGuard</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                P3 • LandTech 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all text-xs shadow-sm shadow-emerald-500/20"
            >
              <span>Verification Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex-1">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-6">
            <Cpu className="h-3.5 w-3.5" /> Hackathon Foundation • Fraud &amp; Double-Selling Detection
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Cryptographic Integrity for Modern <span className="text-emerald-400">Land Title</span> Registries.
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            LandGuard delivers real-time double-selling detection, tamper-evident deed hashing, and boundary verification
            to protect land registries against duplicate sales, forged transfers, and title fraud.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="h-4 w-4" />
              Open Verification Workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillarCards.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = pillar.badgeType === "active";
            return (
              <div
                key={pillar.title}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${
                        isActive
                          ? "bg-emerald-950/70 border-emerald-800/60 text-emerald-300"
                          : "bg-amber-950/60 border-amber-800/50 text-amber-300"
                      }`}
                    >
                      {pillar.badge}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-white mb-2">{pillar.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Status Card */}
        <div className="mt-12 bg-slate-900/40 border border-slate-800/90 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Core Stack Verification
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Verified framework scaffolding ready for fraud detection engine integration.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> All Foundations Green
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stackItems.map((item) => (
              <div
                key={item.name}
                className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-200">{item.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Synthetic Data & Ethics Notice */}
        <div className="mt-8 border border-amber-500/20 bg-amber-500/5 rounded-xl p-5 text-xs text-amber-300/90 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-200">Competition & Ethics Compliance Notice: </strong>
            In adherence with LandTech 2026 Hackathon standards, all demonstration parcels, citizen IDs, and deeds
            utilized across LandGuard are strictly synthetic. No personally identifiable information (PII) or real-world
            title records are stored. AI assistance provided via Google Antigravity &amp; Gemini models is formally disclosed.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; LandTech 2026 Hackathon &bull; Track P3: Fraud &amp; Double-Selling Detection</span>
          <span>LandGuard Foundation v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
