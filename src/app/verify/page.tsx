"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  History,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Hash,
  Scale,
  AlertOctagon,
  ChevronRight,
  ArrowLeft,
  Fingerprint,
  FileDiff,
  FileLock,
  Info,
} from "lucide-react";

interface ParcelOption {
  parcelId: string;
  deedNumber: string;
  ownerName: string;
  ownerNationalId: string;
  areaSqFt: number;
  status: string;
  recordHash?: string;
}

interface Finding {
  ruleCode: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  explanation: string;
  parcelId: string;
  transactionReference?: string;
  evidenceReferences: string[];
  recommendedAction: string;
}

interface ChainLink {
  ownerName: string;
  ownerNationalId: string;
  effectiveFrom: string;
  deedNumber?: string;
  registrationNumber?: string;
  mutationCaseNumber?: string;
  supportingEvidence: string[];
}

interface VerificationResultData {
  status: "CLEAR" | "CONFLICT_DETECTED" | "REVIEW_REQUIRED";
  parcelId: string;
  transactionReference: string;
  evaluatedAt: string;
  reconstructedOwner: {
    name: string;
    nationalId: string;
  } | null;
  proposedSeller: {
    name: string;
    nationalId: string;
  };
  proposedBuyer: {
    name: string;
    nationalId: string;
  };
  findings: Finding[];
  supportingEvidence: {
    parcelBaseline: {
      parcelId: string;
      deedNumber: string;
      initialOwner: string;
      status: string;
    };
    chainSummary: ChainLink[];
    historicalTransactionCount: number;
    registrationRecordsCount: number;
    mutationRecordsCount: number;
  };
  disclaimer: string;
}

interface IntegrityResultData {
  recordId: string;
  parcelId: string;
  recordType: "LAND_RECORD";
  status: "INTEGRITY_VERIFIED" | "INTEGRITY_MISMATCH" | "REFERENCE_MISSING";
  storedReferenceHash: string | null;
  recalculatedHash: string;
  isMatch: boolean;
  verifiedAt: string;
  canonicalObject: {
    areaSqFt: number;
    boundaryGeoJson: string | null;
    deedNumber: string;
    ownerName: string;
    ownerNationalId: string;
    parcelId: string;
    previousHash: string | null;
  };
  canonicalString: string;
  explanation: string;
  tamperedFields: string[];
  simulated: boolean;
  trustBoundaryNotice: string;
}

export default function VerificationWorkspace() {
  const [activeTab, setActiveTab] = useState<"fraud" | "integrity">("fraud");
  const [parcels, setParcels] = useState<ParcelOption[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  // Fraud Form State
  const [formData, setFormData] = useState({
    transactionReference: "TXN-DEMO-A-CLEAN",
    parcelId: "SYN-PARCEL-101-CLEAN",
    sellerName: "Bina Chowdhury",
    sellerId: "SYN-NID-1002",
    buyerName: "Chandan Sen",
    buyerId: "SYN-NID-1003",
    amount: "1200000",
    transactionDate: "2026-06-01T09:00:00Z",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<Record<string, unknown> | null>(null);

  // Integrity State (Phase 4)
  const [integrityParcelId, setIntegrityParcelId] = useState("SYN-PARCEL-101-CLEAN");
  const [simulateTamperEnabled, setSimulateTamperEnabled] = useState(false);
  const [tamperForm, setTamperForm] = useState({
    ownerNationalId: "SYN-NID-TAMPERED-9999",
    areaSqFt: "99999",
    deedNumber: "",
  });
  const [integrityPreset, setIntegrityPreset] = useState<"A" | "B" | "C" | null>("A");
  const [isIntegrityLoading, setIsIntegrityLoading] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResultData | null>(null);
  const [integrityErrorMessage, setIntegrityErrorMessage] = useState<string | null>(null);

  // Load available parcels
  useEffect(() => {
    async function loadParcels() {
      try {
        const res = await fetch("/api/parcels");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setParcels(json.data);
        }
      } catch (err) {
        console.error("Failed to load parcels:", err);
      }
    }
    loadParcels();
  }, []);

  // Fraud Demo Scenarios Mapping
  const scenarios = [
    {
      id: "A",
      label: "Demo A: Consistent Transaction",
      badge: "Expected: CLEAR",
      badgeColor: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
      description: "Bina Chowdhury (reconstructed owner) sells parcel 101 to Chandan Sen with clean registered and mutated provenance.",
      data: {
        transactionReference: "TXN-DEMO-A-CLEAN",
        parcelId: "SYN-PARCEL-101-CLEAN",
        sellerName: "Bina Chowdhury",
        sellerId: "SYN-NID-1002",
        buyerName: "Chandan Sen",
        buyerId: "SYN-NID-1003",
        amount: "1200000",
        transactionDate: "2026-06-01T09:00:00Z",
      },
    },
    {
      id: "B",
      label: "Demo B: Double-Selling Conflict",
      badge: "Expected: CONFLICT_DETECTED",
      badgeColor: "bg-rose-950/80 text-rose-400 border-rose-800/60",
      description: "Farhan Kabir attempts a second sale of parcel 102 after already conveying title to Golam Mostafa.",
      data: {
        transactionReference: "TXN-DEMO-B-DBL",
        parcelId: "SYN-PARCEL-102-DBL",
        sellerName: "Farhan Kabir",
        sellerId: "SYN-NID-2001",
        buyerName: "Habibur Rahman",
        buyerId: "SYN-NID-2003",
        amount: "1800000",
        transactionDate: "2026-07-15T14:00:00Z",
      },
    },
    {
      id: "C",
      label: "Demo C: Registration–Mutation Mismatch",
      badge: "Expected: REVIEW_REQUIRED",
      badgeColor: "bg-amber-950/80 text-amber-400 border-amber-800/60",
      description: "Deed was registered on parcel 104, but the revenue mutation was rejected by the revenue office.",
      data: {
        transactionReference: "TXN-DEMO-C-REGMUT",
        parcelId: "SYN-PARCEL-104-REGMUT",
        sellerName: "Monira Begum",
        sellerId: "SYN-NID-4002",
        buyerName: "Nafis Iqbal",
        buyerId: "SYN-NID-4003",
        amount: "2500000",
        transactionDate: "2026-08-10T11:00:00Z",
      },
    },
  ];

  // Integrity Demonstration Presets (Phase 4)
  const integrityPresets = [
    {
      id: "A" as const,
      label: "Scenario A: Authentic Record",
      badge: "INTEGRITY_VERIFIED",
      badgeColor: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
      description: "Authoritative record for parcel 101 unchanged. Recalculated SHA-256 matches stored reference hash.",
      parcelId: "SYN-PARCEL-101-CLEAN",
      simulateTamper: false,
    },
    {
      id: "B" as const,
      label: "Scenario B: Controlled Tamper Simulation",
      badge: "INTEGRITY_MISMATCH",
      badgeColor: "bg-rose-950/80 text-rose-400 border-rose-800/60",
      description: "Simulates in-memory modification of owner national ID and plot surface area. Detects cryptographic divergence without altering SQLite.",
      parcelId: "SYN-PARCEL-101-CLEAN",
      simulateTamper: true,
      tamperValues: {
        ownerNationalId: "SYN-NID-TAMPERED-9999",
        areaSqFt: "99999",
        deedNumber: "",
      },
    },
    {
      id: "C" as const,
      label: "Scenario C: Missing Reference Hash",
      badge: "REFERENCE_MISSING",
      badgeColor: "bg-amber-950/80 text-amber-400 border-amber-800/60",
      description: "Unindexed synthetic parcel 107 with no stored cryptographic digest. Verifier identifies missing reference baseline.",
      parcelId: "SYN-PARCEL-107-NOHASH",
      simulateTamper: false,
    },
  ];

  const handleApplyScenario = (sc: (typeof scenarios)[0]) => {
    setSelectedScenario(sc.id);
    setFormData(sc.data);
    setResult(null);
    setErrorMessage(null);
    setValidationDetails(null);
  };

  const handleApplyIntegrityPreset = (preset: (typeof integrityPresets)[0]) => {
    setIntegrityPreset(preset.id);
    setIntegrityParcelId(preset.parcelId);
    setSimulateTamperEnabled(preset.simulateTamper);
    if (preset.simulateTamper && preset.tamperValues) {
      setTamperForm(preset.tamperValues);
    }
    setIntegrityResult(null);
    setIntegrityErrorMessage(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);
    setValidationDetails(null);

    try {
      const payload = {
        transactionReference: formData.transactionReference.trim(),
        parcelId: formData.parcelId.trim(),
        sellerName: formData.sellerName.trim(),
        sellerId: formData.sellerId.trim(),
        buyerName: formData.buyerName.trim(),
        buyerId: formData.buyerId.trim(),
        amount: parseFloat(formData.amount),
        transactionDate: formData.transactionDate,
      };

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setResult(json.data);
      } else {
        setErrorMessage(json.message || "Verification request failed.");
        if (json.details) {
          setValidationDetails(json.details);
        }
      }
    } catch (err) {
      console.error("API call error:", err);
      setErrorMessage("Network error: Unable to contact the verification server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIntegrityLoading(true);
    setIntegrityResult(null);
    setIntegrityErrorMessage(null);

    try {
      const payload: {
        parcelId: string;
        simulateTamper?: {
          ownerNationalId?: string;
          areaSqFt?: number;
          deedNumber?: string;
        };
      } = {
        parcelId: integrityParcelId.trim(),
      };

      if (simulateTamperEnabled) {
        const tamper: {
          ownerNationalId?: string;
          areaSqFt?: number;
          deedNumber?: string;
        } = {};
        if (tamperForm.ownerNationalId.trim()) {
          tamper.ownerNationalId = tamperForm.ownerNationalId.trim();
        }
        if (tamperForm.areaSqFt.trim()) {
          tamper.areaSqFt = parseFloat(tamperForm.areaSqFt);
        }
        if (tamperForm.deedNumber.trim()) {
          tamper.deedNumber = tamperForm.deedNumber.trim();
        }
        payload.simulateTamper = tamper;
      }

      const res = await fetch("/api/integrity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setIntegrityResult(json.data);
      } else {
        setIntegrityErrorMessage(json.message || "Integrity verification failed.");
      }
    } catch (err) {
      console.error("Integrity API call error:", err);
      setIntegrityErrorMessage("Network error: Unable to contact the integrity verifier.");
    } finally {
      setIsIntegrityLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium mr-2"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">LandGuard</span>
                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  {activeTab === "fraud" ? "Fraud Detection Workspace" : "Integrity Audit Workspace"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              P3 Engine Active &bull; SHA-256 Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Workspace Title & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {activeTab === "fraud" ? (
                <>
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                  Pre-Transaction Fraud &amp; Provenance Verification
                </>
              ) : (
                <>
                  <Fingerprint className="h-7 w-7 text-indigo-400" />
                  Cryptographic Integrity &amp; Tamper Evidence
                </>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === "fraud"
                ? "Evaluate proposed land conveyances against authoritative recorded deed history, mutation records, and active registered titleholders."
                : "Deterministic canonical SHA-256 integrity verification, tamper detection, and trust boundary auditing for synthetic land records."}
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("fraud")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "fraud"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Fraud &amp; Double-Selling
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("integrity")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "integrity"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              Cryptographic Integrity
            </button>
          </div>
        </div>

        {/* TAB 1: FRAUD & DOUBLE-SELLING DETECTION ENGINE */}
        {activeTab === "fraud" && (
          <div className="space-y-8">
            {/* Quick Scenario Selector Bar */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                ⚡ Hackathon Demo Presets (Select to populate transaction):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scenarios.map((sc) => {
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleApplyScenario(sc)}
                      className={`text-left p-3.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-800/90 border-emerald-500/80 shadow-sm shadow-emerald-500/10"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-slate-100">{sc.label}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                            {sc.badge}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{sc.description}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                        <span>Parcel: {sc.data.parcelId}</span>
                        <ChevronRight className="h-3 w-3 ml-auto text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout: Form on Left, Output & Provenance on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <FileCheck className="h-4.5 w-4.5 text-emerald-400" /> Proposed Transaction Parameters
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Enter proposed conveyance details. Client input will be analyzed in real time without altering authoritative recorded history.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Parcel Selector */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>Target Parcel Identifier *</span>
                      <span className="text-[10px] text-slate-500">From SQLite Registry</span>
                    </label>
                    <div className="relative">
                      <select
                        name="parcelId"
                        value={formData.parcelId}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 appearance-none font-mono"
                        required
                      >
                        {parcels.length > 0 ? (
                          parcels.map((p) => (
                            <option key={p.parcelId} value={p.parcelId}>
                              {p.parcelId} — Baseline Owner: {p.ownerName} ({p.status})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="SYN-PARCEL-101-CLEAN">SYN-PARCEL-101-CLEAN (Consistent History)</option>
                            <option value="SYN-PARCEL-102-DBL">SYN-PARCEL-102-DBL (Double-Selling Attempt)</option>
                            <option value="SYN-PARCEL-104-REGMUT">SYN-PARCEL-104-REGMUT (Mutation Mismatch)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Transaction Reference */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Transaction Filing Reference *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        name="transactionReference"
                        value={formData.transactionReference}
                        onChange={handleInputChange}
                        placeholder="e.g. TXN-2026-001"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Proposed Seller Details */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" /> Seller Name *
                      </label>
                      <input
                        type="text"
                        name="sellerName"
                        value={formData.sellerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Bina Chowdhury"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Seller National ID *
                      </label>
                      <input
                        type="text"
                        name="sellerId"
                        value={formData.sellerId}
                        onChange={handleInputChange}
                        placeholder="e.g. SYN-NID-1002"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Proposed Buyer Details */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" /> Buyer Name *
                      </label>
                      <input
                        type="text"
                        name="buyerName"
                        value={formData.buyerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Chandan Sen"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Buyer National ID *
                      </label>
                      <input
                        type="text"
                        name="buyerId"
                        value={formData.buyerId}
                        onChange={handleInputChange}
                        placeholder="e.g. SYN-NID-1003"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Transaction Amount (BDT) *
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="e.g. 1200000"
                        min="1"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" /> Proposed Date *
                      </label>
                      <input
                        type="text"
                        name="transactionDate"
                        value={formData.transactionDate}
                        onChange={handleInputChange}
                        placeholder="2026-06-01T09:00:00Z"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Evaluating Recorded Provenance...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify Transaction via Engine
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Error Message Display */}
                {errorMessage && (
                  <div className="mt-4 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-200 mb-1">
                      <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" /> Verification Request Error
                    </div>
                    <p>{errorMessage}</p>
                    {validationDetails && (
                      <pre className="mt-2 text-[10px] bg-slate-950 p-2 rounded text-slate-300 overflow-x-auto">
                        {JSON.stringify(validationDetails, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Results Column */}
              <div className="lg:col-span-7 space-y-6">
                {result ? (
                  <>
                    {/* Result Status Banner */}
                    <div
                      className={`border rounded-2xl p-6 ${
                        result.status === "CLEAR"
                          ? "bg-emerald-950/40 border-emerald-500/60"
                          : result.status === "CONFLICT_DETECTED"
                          ? "bg-rose-950/40 border-rose-500/60"
                          : "bg-amber-950/40 border-amber-500/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {result.status === "CLEAR" && (
                              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                            )}
                            {result.status === "CONFLICT_DETECTED" && (
                              <div className="h-9 w-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                <ShieldAlert className="h-5 w-5" />
                              </div>
                            )}
                            {result.status === "REVIEW_REQUIRED" && (
                              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
                                Verification Engine Verdict
                              </span>
                              <span
                                className={`text-xl font-extrabold tracking-tight ${
                                  result.status === "CLEAR"
                                    ? "text-emerald-300"
                                    : result.status === "CONFLICT_DETECTED"
                                    ? "text-rose-300"
                                    : "text-amber-300"
                                }`}
                              >
                                {result.status === "CLEAR" && "VERIFICATION CLEAR"}
                                {result.status === "CONFLICT_DETECTED" && "FATAL CONFLICT DETECTED"}
                                {result.status === "REVIEW_REQUIRED" && "INSTITUTIONAL REVIEW REQUIRED"}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mt-2">
                            {result.status === "CLEAR" &&
                              "No configured inconsistencies, conflicting sales, or title breaks were detected in the available synthetic records up to the proposed date."}
                            {result.status === "CONFLICT_DETECTED" &&
                              "One or more fatal title conflicts, double-selling attempts, or unauthorized seller mismatches were detected. Transaction must not proceed."}
                            {result.status === "REVIEW_REQUIRED" &&
                              "Administrative or revenue ledger discrepancies require formal review by a land revenue officer prior to deed registration."}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 block">Evaluated At</span>
                          <span className="text-xs font-mono text-slate-300">
                            {new Date(result.evaluatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Titleholder Comparison */}
                      <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                            Reconstructed Recorded Owner
                          </span>
                          <span className="text-sm font-bold text-white block mt-0.5">
                            {result.reconstructedOwner?.name ?? "UNRESOLVED"}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            NID: {result.reconstructedOwner?.nationalId ?? "N/A"}
                          </span>
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                            Proposed Transaction Seller
                          </span>
                          <span className="text-sm font-bold text-white block mt-0.5">
                            {result.proposedSeller.name}
                          </span>
                          <span
                            className={`text-[11px] font-mono ${
                              result.reconstructedOwner?.nationalId === result.proposedSeller.nationalId
                                ? "text-emerald-400"
                                : "text-rose-400 font-bold"
                            }`}
                          >
                            NID: {result.proposedSeller.nationalId}{" "}
                            {result.reconstructedOwner?.nationalId !== result.proposedSeller.nationalId &&
                              "(MISMATCH)"}
                          </span>
                        </div>
                      </div>

                      {/* Quick link to Cryptographic Integrity */}
                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Verify underlying parcel record against SHA-256 hash digest:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIntegrityParcelId(result.parcelId);
                            setSimulateTamperEnabled(false);
                            setActiveTab("integrity");
                          }}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <Fingerprint className="h-3.5 w-3.5" />
                          Inspect Cryptographic Integrity &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Findings Section */}
                    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-emerald-400" /> Algorithmic Findings &amp; Evidence ({result.findings.length})
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Evaluated against 5 core fraud detection rules
                        </span>
                      </h3>

                      {result.findings.length === 0 ? (
                        <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-4 text-xs text-emerald-300 flex items-center gap-3">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                          <div>
                            <strong>All 5 Verification Rules Passed Cleanly:</strong> No duplicate transaction reference, no seller mismatch, no conflicting transfers, no registration-mutation discrepancy, and no title breaks found.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {result.findings.map((f, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                      f.severity === "CRITICAL"
                                        ? "bg-rose-950/90 text-rose-300 border-rose-800"
                                        : "bg-amber-950/90 text-amber-300 border-amber-800"
                                    }`}
                                  >
                                    {f.severity}
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-400">{f.ruleCode}</span>
                                </div>
                                <span className="font-semibold text-white text-xs">{f.title}</span>
                              </div>

                              <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/50 p-2.5 rounded border border-slate-800/60">
                                {f.explanation}
                              </p>

                              {/* Evidence references */}
                              {f.evidenceReferences.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                                    Supporting Evidence References:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {f.evidenceReferences.map((ev, evIdx) => (
                                      <span
                                        key={evIdx}
                                        className="font-mono text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700/80"
                                      >
                                        {ev}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommended Action */}
                              <div className="text-[11px] pt-1 text-slate-400 flex items-start gap-1.5 border-t border-slate-900">
                                <Scale className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-slate-300">Action:</strong> {f.recommendedAction}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Provenance Chain Summary */}
                    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <History className="h-4 w-4 text-emerald-400" /> Reconstructed Chain of Title ({result.supportingEvidence.chainSummary.length} links)
                      </h3>

                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                        {result.supportingEvidence.chainSummary.map((link, idx) => (
                          <div key={idx} className="relative flex items-start gap-3 pl-6">
                            <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-emerald-400" />
                            <div className="w-full bg-slate-950/60 border border-slate-800/70 rounded-lg p-3 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-xs">
                                  {idx === 0 ? "Baseline Record: " : "Conveyed Title: "} {link.ownerName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {new Date(link.effectiveFrom).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                                NID: {link.ownerNationalId}
                              </span>
                              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                                {link.deedNumber && <span>Deed: {link.deedNumber}</span>}
                                {link.registrationNumber && <span>Reg: {link.registrationNumber}</span>}
                                {link.mutationCaseNumber && <span>Mutation: {link.mutationCaseNumber}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disclaimer Box */}
                    <div className="text-[11px] text-slate-500 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 leading-relaxed">
                      <strong className="text-slate-400">Disclaimer &amp; Compliance Notice: </strong>
                      {result.disclaimer}
                    </div>
                  </>
                ) : (
                  /* Initial Placeholder State */
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-4">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">No Verification Executed Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                      Select one of the Hackathon demonstration presets above or enter custom synthetic transaction parameters, then click &quot;Verify Transaction via Engine&quot;.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Lock className="h-3.5 w-3.5" /> Evaluates deterministic rules against SQLite without mutating historical rows.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CRYPTOGRAPHIC RECORD INTEGRITY & TAMPER EVIDENCE (PHASE 4) */}
        {activeTab === "integrity" && (
          <div className="space-y-8">
            {/* Quick Demonstration Presets Bar for Judges */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                ⚡ Cryptographic Tamper Demonstration Presets (Phase 4):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {integrityPresets.map((preset) => {
                  const isSelected = integrityPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyIntegrityPreset(preset)}
                      className={`text-left p-3.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-800/90 border-indigo-500/80 shadow-sm shadow-indigo-500/10"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-slate-100">{preset.label}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{preset.description}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1 font-mono text-[11px] text-indigo-400">
                        <span>Parcel: {preset.parcelId}</span>
                        <ChevronRight className="h-3 w-3 ml-auto text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Fingerprint className="h-4.5 w-4.5 text-indigo-400" /> Cryptographic Integrity Parameters
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Inspect the canonical SHA-256 digest of any synthetic land record or simulate non-destructive modifications.
                </p>

                <form onSubmit={handleIntegritySubmit} className="space-y-4 text-xs">
                  {/* Target Parcel Selector */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                      <span>Authoritative Land Parcel *</span>
                      <span className="text-[10px] text-slate-500">From SQLite Registry</span>
                    </label>
                    <select
                      value={integrityParcelId}
                      onChange={(e) => {
                        setIntegrityParcelId(e.target.value);
                        setIntegrityPreset(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      required
                    >
                      {parcels.map((p) => (
                        <option key={p.parcelId} value={p.parcelId}>
                          {p.parcelId} — {p.ownerName} ({p.deedNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tamper Simulation Toggle */}
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="simulateTamperCheck" className="text-slate-200 font-semibold cursor-pointer flex items-center gap-2">
                        <FileDiff className="h-4 w-4 text-indigo-400" />
                        Simulate Unauthorized Modification
                      </label>
                      <input
                        id="simulateTamperCheck"
                        type="checkbox"
                        checked={simulateTamperEnabled}
                        onChange={(e) => {
                          setSimulateTamperEnabled(e.target.checked);
                          setIntegrityPreset(null);
                        }}
                        className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Applies in-memory alterations during verification to demonstrate cryptographic mismatch detection. Authoritative SQLite records remain 100% unaltered.
                    </p>

                    {simulateTamperEnabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-slate-300 text-[11px] font-medium mb-1">
                            Altered Owner National ID
                          </label>
                          <input
                            type="text"
                            value={tamperForm.ownerNationalId}
                            onChange={(e) =>
                              setTamperForm((prev) => ({ ...prev, ownerNationalId: e.target.value }))
                            }
                            placeholder="e.g. SYN-NID-TAMPERED-9999"
                            className="w-full bg-slate-900 border border-rose-900/60 rounded px-2.5 py-1.5 text-rose-300 font-mono text-xs focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 text-[11px] font-medium mb-1">
                            Altered Surface Area (Sq Ft)
                          </label>
                          <input
                            type="number"
                            value={tamperForm.areaSqFt}
                            onChange={(e) =>
                              setTamperForm((prev) => ({ ...prev, areaSqFt: e.target.value }))
                            }
                            placeholder="e.g. 99999"
                            className="w-full bg-slate-900 border border-rose-900/60 rounded px-2.5 py-1.5 text-rose-300 font-mono text-xs focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isIntegrityLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 text-xs"
                    >
                      {isIntegrityLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Hashing Canonical Record...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-4 w-4" />
                          Verify Cryptographic Integrity
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {integrityErrorMessage && (
                  <div className="mt-4 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-200 mb-1">
                      <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" /> Integrity Verification Failed
                    </div>
                    <p>{integrityErrorMessage}</p>
                  </div>
                )}
              </div>

              {/* Output Column */}
              <div className="lg:col-span-7 space-y-6">
                {integrityResult ? (
                  <>
                    {/* Status Banner */}
                    <div
                      className={`border rounded-2xl p-6 ${
                        integrityResult.status === "INTEGRITY_VERIFIED"
                          ? "bg-emerald-950/40 border-emerald-500/60"
                          : integrityResult.status === "INTEGRITY_MISMATCH"
                          ? "bg-rose-950/40 border-rose-500/60"
                          : "bg-amber-950/40 border-amber-500/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {integrityResult.status === "INTEGRITY_VERIFIED" && (
                              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                            )}
                            {integrityResult.status === "INTEGRITY_MISMATCH" && (
                              <div className="h-9 w-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                <FileDiff className="h-5 w-5" />
                              </div>
                            )}
                            {integrityResult.status === "REFERENCE_MISSING" && (
                              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
                                Cryptographic Integrity Status
                              </span>
                              <span
                                className={`text-xl font-extrabold tracking-tight ${
                                  integrityResult.status === "INTEGRITY_VERIFIED"
                                    ? "text-emerald-300"
                                    : integrityResult.status === "INTEGRITY_MISMATCH"
                                    ? "text-rose-300"
                                    : "text-amber-300"
                                }`}
                              >
                                {integrityResult.status === "INTEGRITY_VERIFIED" && "INTEGRITY VERIFIED"}
                                {integrityResult.status === "INTEGRITY_MISMATCH" && "INTEGRITY MISMATCH DETECTED"}
                                {integrityResult.status === "REFERENCE_MISSING" && "REFERENCE HASH MISSING"}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mt-2">
                            {integrityResult.explanation}
                          </p>

                          {integrityResult.simulated && (
                            <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/80 text-rose-300">
                              SIMULATED IN-MEMORY AUDIT (SQLite database row was NOT modified)
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 block">Audited At</span>
                          <span className="text-xs font-mono text-slate-300">
                            {new Date(integrityResult.verifiedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Hash Comparison Box */}
                      <div className="mt-5 space-y-2 pt-4 border-t border-slate-800/80 text-xs">
                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>Authoritative Stored Reference Hash (SQLite):</span>
                            <span>{integrityResult.storedReferenceHash ? "Present" : "None"}</span>
                          </div>
                          <span className="text-emerald-400 break-all text-[11px] select-all">
                            {integrityResult.storedReferenceHash ?? "NULL / UNASSIGNED IN LEDGER"}
                          </span>
                        </div>

                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>Recalculated Canonical SHA-256 Digest:</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                integrityResult.isMatch
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : "bg-rose-950 text-rose-300 border border-rose-800"
                              }`}
                            >
                              {integrityResult.isMatch ? "MATCH" : "DIVERGENT"}
                            </span>
                          </div>
                          <span
                            className={`break-all text-[11px] select-all ${
                              integrityResult.isMatch ? "text-emerald-400" : "text-rose-400 font-bold"
                            }`}
                          >
                            {integrityResult.recalculatedHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tampered Fields Breakdown (if mismatch) */}
                    {integrityResult.tamperedFields.length > 0 && (
                      <div className="bg-rose-950/20 border border-rose-800/60 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <FileDiff className="h-4 w-4" /> Detected Modified Field Attributes ({integrityResult.tamperedFields.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {integrityResult.tamperedFields.map((field, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-xs bg-rose-950 text-rose-200 border border-rose-700/80 px-2.5 py-1 rounded"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Canonical Normalized Record Payload */}
                    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileLock className="h-4 w-4 text-indigo-400" />
                          Canonical Serialized Record Representation
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Lexicographically Sorted Keys</span>
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Exact normalized payload hashed to produce the SHA-256 digest. Internal DB keys (id, status, timestamps) are strictly excluded.
                      </p>
                      <pre className="text-[11px] font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-indigo-300 overflow-x-auto leading-relaxed">
                        {integrityResult.canonicalString}
                      </pre>
                    </div>

                    {/* Trust Boundary Disclosure Notice */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Info className="h-4 w-4 shrink-0" />
                        Architectural Trust Boundary &amp; Threat Model Disclosure
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {integrityResult.trustBoundaryNotice}
                      </p>
                      <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <strong className="text-slate-400">What It Proves:</strong> Bit-for-bit consistency against the reference digest established at record creation.
                        </div>
                        <div>
                          <strong className="text-slate-400">External Trust Anchor:</strong> Production architectures require KMS digital signatures or immutable append-only logs.
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Initial Placeholder State */
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-indigo-400/80 mb-4">
                      <Fingerprint className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">No Integrity Audit Executed Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                      Select one of the Phase 4 tamper demonstration presets above or choose a parcel and click &quot;Verify Cryptographic Integrity&quot;.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Lock className="h-3.5 w-3.5" /> Re-computes SHA-256 hash using native Node.js crypto and records non-sensitive audit log.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; LandTech 2026 Hackathon &bull; Track P3: Fraud &amp; Double-Selling Detection</span>
          <span>LandGuard Interactive Verification &amp; Cryptographic Integrity Workspace</span>
        </div>
      </footer>
    </div>
  );
}
