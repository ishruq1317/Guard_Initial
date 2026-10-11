# LandGuard 🛡️
> **LandTech 2026 Hackathon — Track P3: Fraud & Double-Selling Detection**

LandGuard is a modern cryptographic land registry and pre-transaction verification platform designed to detect and eliminate duplicate land sales, fraudulent deed transfers, and title tampering before they occur.

---

## 📌 Project Overview & Problem Statement

Land title fraud and double-selling plague real-estate registries globally. Common vulnerabilities include:
- **Double-Selling:** A malicious seller executes simultaneous purchase agreements with multiple buyers before any single transfer registers.
- **Deed Tampering & Forgery:** Retrospective alteration of deed metadata, parcel boundaries, or owner identifiers.
- **Contested Overlaps:** Unregistered or conflicting spatial boundary claims across adjacent plots.

**LandGuard** addresses these vulnerabilities by establishing a tamper-evident cryptographic provenance chain for all parcel records using SHA-256 hashing, strictly validated input schemas, relational ledger persistence with SQLite/Prisma, and automated fraud-detection checks.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server components, client UI, and API route endpoints |
| **Language** | TypeScript (Strict Mode) | Type safety across domains, schemas, and database operations |
| **Styling** | Tailwind CSS | Responsive, accessible interface design |
| **Database & ORM** | SQLite + Prisma ORM | Relational parcel records, transfer transactions, and audit logs |
| **Validation** | Zod | Runtime schema validation for parcels and transactions |
| **Cryptography** | Node.js `crypto` | Deterministic SHA-256 parcel hashing & timing-safe verification |
| **Testing** | Vitest | Fast, isolated unit and integration test runner |

---

## 📂 Project Structure

```text
e:\LandGuard
├── docs/
│   └── architecture.md            # Detailed system and data architecture
├── prisma/
│   ├── schema.prisma              # Relational models: LandRecord, Transaction, AuditLog
│   └── dev.db                     # Local SQLite development database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parcels/route.ts   # Parcel list retrieval endpoint
│   │   │   └── verify/route.ts    # Deterministic fraud verification endpoint
│   │   ├── verify/
│   │   │   └── page.tsx           # Interactive Verification Workspace UI
│   │   ├── globals.css            # Tailwind styles
│   │   ├── layout.tsx             # Root layout with hackathon metadata
│   │   └── page.tsx               # Professional LandGuard landing page & status board
│   └── lib/
│       ├── crypto.ts              # SHA-256 deterministic hashing & constant-time verification
│       ├── prisma.ts              # Prisma singleton client instance
│       ├── engine/                # Core fraud detection & ownership reconstruction engine
│       │   ├── evaluate.ts        # Master evaluation orchestrator
│       │   ├── reconstruct.ts     # Chronological ownership reconstruction
│       │   ├── repository.ts      # Read-only database access layer
│       │   ├── rules.ts           # 5 deterministic fraud rules
│       │   ├── seed-data.ts       # Synthetic demonstration scenarios
│       │   └── types.ts           # Domain models & interfaces
│       └── validations/
│           └── land-record.ts     # Zod schemas for parcel input & transaction validation
├── .env.example                   # Environment variable template
├── next.config.mjs                # Next.js configuration
├── postcss.config.mjs             # PostCSS Tailwind plugins
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript compiler options (strict: true)
├── vitest.config.ts               # Vitest test runner configuration
└── package.json                   # Project scripts and dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### Installation & Local Setup

1. **Clone & Navigate into the Project:**
   ```bash
   cd e:\LandGuard
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

4. **Initialize SQLite Database & Apply Migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Seed Deterministic Synthetic Demonstration Scenarios:**
   ```bash
   npm run seed
   ```

6. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔍 Demonstration: Legitimate Sale vs. Double-Selling Detection

LandGuard exposes an automated verification API endpoint at `POST /api/verify`.

### Demo 1: Legitimate Transaction (`CLEAR`)
Parcel `SYN-PARCEL-101-CLEAN` was registered and mutated to verified owner `Bina Chowdhury` (`SYN-NID-1002`). She proposes conveying the parcel to buyer `Chandan Sen`:

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify" -Method POST -ContentType "application/json" -Body '{
  "transactionReference": "TXN-DEMO-LEGIT-001",
  "parcelId": "SYN-PARCEL-101-CLEAN",
  "sellerName": "Bina Chowdhury",
  "sellerId": "SYN-NID-1002",
  "buyerName": "Chandan Sen",
  "buyerId": "SYN-NID-1003",
  "amount": 1200000,
  "transactionDate": "2026-06-01T09:00:00Z"
}'
```
**Expected Result:** `status: "CLEAR"`, `findings: []`, with complete supporting provenance chain.

---

### Demo 2: Double-Selling Conflict Attempt (`CONFLICT_DETECTED`)
Parcel `SYN-PARCEL-102-DBL` was originally owned by `Farhan Kabir` (`SYN-NID-2001`), who already conveyed the title to `Golam Mostafa` in registered transaction `TXN-SYN-2023-102-1`. `Farhan Kabir` now attempts a second sale to `Habibur Rahman`:

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify" -Method POST -ContentType "application/json" -Body '{
  "transactionReference": "TXN-DEMO-DOUBLE-SELL",
  "parcelId": "SYN-PARCEL-102-DBL",
  "sellerName": "Farhan Kabir",
  "sellerId": "SYN-NID-2001",
  "buyerName": "Habibur Rahman",
  "buyerId": "SYN-NID-2003",
  "amount": 1800000,
  "transactionDate": "2026-07-15T14:00:00Z"
}'
```
**Expected Result:** `status: "CONFLICT_DETECTED"`, findings: `LG-RULE-001-DOUBLE-SELLING` and `LG-RULE-002-SELLER-MISMATCH`.

---

### Demo 3: Registration–Mutation Mismatch (`REVIEW_REQUIRED`)
Parcel `SYN-PARCEL-104-REGMUT` has a registered deed to `Monira Begum` (`SYN-NID-4002`), but her revenue mutation application was rejected by the revenue circle office:

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify" -Method POST -ContentType "application/json" -Body '{
  "transactionReference": "TXN-DEMO-C-REGMUT",
  "parcelId": "SYN-PARCEL-104-REGMUT",
  "sellerName": "Monira Begum",
  "sellerId": "SYN-NID-4002",
  "buyerName": "Nafis Iqbal",
  "buyerId": "SYN-NID-4003",
  "amount": 2500000,
  "transactionDate": "2026-08-10T11:00:00Z"
}'
```
**Expected Result:** `status: "REVIEW_REQUIRED"`, finding: `LG-RULE-004-REG-MUTATION-MISMATCH`.

---

## 🔐 Cryptographic Integrity & Tamper Evidence (Phase 4)

LandGuard includes a deterministic record canonicalization and SHA-256 integrity verifier (`POST /api/integrity/verify` and interactive workspace tab).

### Tamper Demonstration Scenarios

1. **Scenario A: Authentic Record (`INTEGRITY_VERIFIED`)**
   ```bash
   # PowerShell
   Invoke-RestMethod -Uri "http://localhost:3000/api/integrity/verify" -Method POST -ContentType "application/json" -Body '{
     "parcelId": "SYN-PARCEL-101-CLEAN"
   }'
   ```
   **Result:** `status: "INTEGRITY_VERIFIED"`, `isMatch: true`. Recalculated SHA-256 digest matches stored reference digest bit-for-bit.

2. **Scenario B: Controlled Tamper Simulation (`INTEGRITY_MISMATCH`)**
   ```bash
   # PowerShell
   Invoke-RestMethod -Uri "http://localhost:3000/api/integrity/verify" -Method POST -ContentType "application/json" -Body '{
     "parcelId": "SYN-PARCEL-101-CLEAN",
     "simulateTamper": {
       "ownerNationalId": "SYN-NID-TAMPERED-9999",
       "areaSqFt": 99999
     }
   }'
   ```
   **Result:** `status: "INTEGRITY_MISMATCH"`, `tamperedFields: ["ownerNationalId", "areaSqFt"]`. Detects digest divergence in memory without mutating the persistent SQLite database.

3. **Scenario C: Unindexed Legacy Record (`REFERENCE_MISSING`)**
   ```bash
   # PowerShell
   Invoke-RestMethod -Uri "http://localhost:3000/api/integrity/verify" -Method POST -ContentType "application/json" -Body '{
     "parcelId": "SYN-PARCEL-107-NOHASH"
   }'
   ```
   **Result:** `status: "REFERENCE_MISSING"`, `storedReferenceHash: null`. Explicitly flags missing reference baseline.

---

## ⚠️ Architectural Scope & Known Limitations

To ensure absolute transparency for judges and auditors:

1. **Colocated Storage Threat Model**:
   - In this local prototype, SQLite stores both land records and reference hashes in `dev.db`.
   - A privileged attacker with write access to the SQLite file could alter records and recalculate `recordHash`.
   - Production hardening requires external trust anchors (e.g. KMS/HSM digital signatures or public append-only transparency logs).
2. **Audit Log Enforcement**:
   - The application appends non-sensitive audit rows to `AuditLog`.
   - SQLite does not enforce cryptographic immutability at the storage engine level; true non-repudiation requires external WORM (Write Once, Read Many) storage.
3. **Algorithmic Consistency Scope**:
   - The fraud engine evaluates chronological consistency against synthetic recorded evidence.
   - It is a decision-support and fraud-prevention layer, not a statutory title guarantee or legal substitute for court adjudication.

---

## 🖥️ Judge Demonstration Walkthrough (Interactive UI)

Judges can evaluate all 6 scenarios in the interactive browser workspace at **[http://localhost:3000/verify](http://localhost:3000/verify)**:

### Part 1: Pre-Transaction Fraud Detection
1. Navigate to `/verify` and ensure the **Fraud & Double-Selling** tab is active.
2. Click **Demo A: Consistent Transaction**: Click *"Verify Transaction via Engine"* &rarr; observe green **VERIFICATION CLEAR** verdict with clean chain-of-title.
3. Click **Demo B: Double-Selling Conflict**: Click *"Verify Transaction via Engine"* &rarr; observe red **FATAL CONFLICT DETECTED** with `LG-RULE-001-DOUBLE-SELLING` and supporting evidence.
4. Click **Demo C: Registration–Mutation Mismatch**: Click *"Verify Transaction via Engine"* &rarr; observe amber **INSTITUTIONAL REVIEW REQUIRED** citing the rejected mutation.

### Part 2: Cryptographic Record Integrity
1. Click the **Cryptographic Integrity** pill at the top right of the workspace.
2. Click **Scenario A: Authentic Record**: Click *"Verify Cryptographic Integrity"* &rarr; observe green **INTEGRITY VERIFIED** banner and matching SHA-256 hex digests.
3. Click **Scenario B: Controlled Tamper Simulation**: Click *"Verify Cryptographic Integrity"* &rarr; observe red **INTEGRITY MISMATCH DETECTED** banner, divergent hash comparison, and red badges for altered fields (`ownerNationalId`, `areaSqFt`). Confirm database row is unaltered.
4. Click **Scenario C: Missing Reference Hash**: Click *"Verify Cryptographic Integrity"* &rarr; observe amber **REFERENCE HASH MISSING** banner indicating an unindexed record.

---

## 🧪 Testing & Quality Assurance

- **Run Automated Test Suite (33 tests):**
  ```bash
  npm run test
  ```
- **Type Checking (Strict TypeScript):**
  ```bash
  npm run typecheck
  ```
- **ESLint Validation:**
  ```bash
  npm run lint
  ```
- **Build Production Bundle:**
  ```bash
  npm run build
  ```

---

## ⚖️ Hackathon Compliance & Disclosures

### 1. Synthetic Demonstration Data Policy
In strict compliance with the **LandTech 2026 Hackathon** rules and data ethics standards:
- **All demonstration parcels, owner names, national IDs, deed identifiers, and geospatial coordinates used in LandGuard are 100% synthetic.**
- No real-world citizen records, personally identifiable information (PII), or live government land registry data are stored or processed.

### 2. Antigravity & Gemini AI Usage Disclosure
- This project's architectural scaffolding, foundational configuration, and initial test setup were pair-programmed using **Google Antigravity** powered by **Gemini** models.
- All core business rules, cryptographic verification strategies, and schemas have been audited and verified for hackathon compliance.
