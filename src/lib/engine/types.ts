/**
 * Domain types and interfaces for LandGuard Ownership Reconstruction & Fraud Detection Engine.
 * Hackathon Track: P3 — Fraud & Double-Selling Detection.
 */

export type TransactionStatus =
  | "PROPOSED"
  | "REGISTERED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type RegistrationStatus = "REGISTERED" | "REJECTED" | "PENDING";

export type MutationStatus = "APPROVED" | "REJECTED" | "PENDING" | "NOT_APPLIED";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

/**
 * Standard verification outcome statuses:
 * - CONFLICT_DETECTED: Fatal conflicting claim, active double-selling, seller mismatch, or duplicate reference.
 * - REVIEW_REQUIRED: Administrative mismatch (e.g. mutation missing or rejected) or incomplete historical chain.
 * - CLEAR: No configured inconsistency detected in the available synthetic records up to the evaluation date.
 */
export type VerificationStatus = "CLEAR" | "REVIEW_REQUIRED" | "CONFLICT_DETECTED";

export interface PartyReference {
  name: string;
  nationalId: string;
}

export interface VerificationFinding {
  ruleCode: string;
  title: string;
  severity: FindingSeverity;
  explanation: string;
  parcelId: string;
  transactionReference?: string;
  evidenceReferences: string[];
  recommendedAction: string;
}

export interface OwnershipEvent {
  eventId: string;
  parcelId: string;
  eventType:
    | "BASELINE_TITLE"
    | "DEED_REGISTRATION"
    | "MUTATION_RECORD"
    | "TRANSACTION_PROPOSED"
    | "TRANSACTION_COMPLETED"
    | "TRANSACTION_REJECTED"
    | "TRANSACTION_CANCELLED";
  date: Date;
  parties: {
    from?: PartyReference;
    to?: PartyReference;
  };
  referenceId: string;
  status: string;
  details: string;
  recordHash?: string;
}

export interface OwnershipChainLink {
  ownerName: string;
  ownerNationalId: string;
  effectiveFrom: Date;
  deedNumber?: string;
  registrationNumber?: string;
  mutationCaseNumber?: string;
  supportingEvidence: string[];
}

export interface ReconstructedOwnershipState {
  parcelId: string;
  currentRecordedOwner: PartyReference | null;
  baselineOwner: PartyReference | null;
  ownershipChain: OwnershipChainLink[];
  unresolvedOrPendingTransfers: Array<{
    transactionReference: string;
    buyerName: string;
    buyerId: string;
    sellerName: string;
    sellerId: string;
    date: Date;
    status: TransactionStatus;
  }>;
  isContestedOrFlagged: boolean;
  historyAnomalies: string[];
  evaluatedAsOfDate: Date;
  disclaimer: string;
}

export interface ProposedTransactionPayload {
  transactionReference: string;
  parcelId: string;
  sellerName: string;
  sellerId: string;
  buyerName: string;
  buyerId: string;
  amount: number;
  transactionDate: Date;
  deedNumber?: string;
}

export interface HistoricalParcelData {
  parcel: {
    id: string;
    parcelId: string;
    deedNumber: string;
    ownerName: string;
    ownerNationalId: string;
    areaSqFt: number;
    boundaryGeoJson?: string | null;
    status: string;
    recordHash: string;
    previousHash?: string | null;
    createdAt: Date;
  };
  transactions: Array<{
    id: string;
    transactionReference?: string | null;
    parcelId: string;
    sellerName: string;
    sellerId: string;
    buyerName: string;
    buyerId: string;
    transactionDate: Date;
    amount: number;
    status: string;
    recordHash: string;
    registrationRecord?: {
      id: string;
      registrationNumber: string;
      deedNumber: string;
      status: string;
      registeredDate: Date;
      registryOffice: string;
    } | null;
    mutationRecord?: {
      id: string;
      mutationCaseNumber: string;
      status: string;
      mutatedOwnerName: string;
      mutatedOwnerNationalId: string;
      approvedDate?: Date | null;
      revenueOffice: string;
    } | null;
  }>;
  registrations: Array<{
    id: string;
    registrationNumber: string;
    parcelId: string;
    deedNumber: string;
    status: string;
    registeredDate: Date;
    registryOffice: string;
    transactionId?: string | null;
  }>;
  mutations: Array<{
    id: string;
    mutationCaseNumber: string;
    parcelId: string;
    status: string;
    mutatedOwnerName: string;
    mutatedOwnerNationalId: string;
    approvedDate?: Date | null;
    revenueOffice: string;
    transactionId?: string | null;
  }>;
}

export interface VerificationResult {
  status: VerificationStatus;
  parcelId: string;
  transactionReference: string;
  evaluatedAt: Date;
  reconstructedOwner: PartyReference | null;
  proposedSeller: PartyReference;
  proposedBuyer: PartyReference;
  findings: VerificationFinding[];
  supportingEvidence: {
    parcelBaseline: {
      parcelId: string;
      deedNumber: string;
      initialOwner: string;
      status: string;
    };
    chainSummary: OwnershipChainLink[];
    historicalTransactionCount: number;
    registrationRecordsCount: number;
    mutationRecordsCount: number;
  };
  disclaimer: string;
}
