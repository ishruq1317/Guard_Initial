import { describe, it, expect } from "vitest";
import { reconstructOwnershipHistory } from "./reconstruct";
import { evaluateProposedTransaction } from "./evaluate";
import { createSyntheticDemonstrationScenarios } from "./seed-data";
import { HistoricalParcelData, ProposedTransactionPayload } from "./types";
import { generateSha256 } from "../crypto";

describe("LandGuard Ownership Reconstruction & Fraud Detection Engine", () => {
  const scenarios = createSyntheticDemonstrationScenarios();

  it("Scenario A: should verify a consistent ownership history as CLEAR", () => {
    const { historicalData, proposedTransaction } = scenarios.A;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("CLEAR");
    expect(result.findings).toHaveLength(0);
    expect(result.reconstructedOwner?.nationalId).toBe("SYN-NID-1002");
    expect(result.reconstructedOwner?.name).toBe("Bina Chowdhury");
    expect(result.supportingEvidence.chainSummary.length).toBeGreaterThanOrEqual(2);
  });

  it("Scenario B: should detect a second proposed sale as double-selling (CONFLICT_DETECTED)", () => {
    const { historicalData, proposedTransaction } = scenarios.B;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("CONFLICT_DETECTED");
    const doubleSellFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-001-DOUBLE-SELLING"
    );
    expect(doubleSellFinding).toBeDefined();
    expect(doubleSellFinding?.severity).toBe("CRITICAL");
    expect(doubleSellFinding?.evidenceReferences.length).toBeGreaterThan(0);
    expect(doubleSellFinding?.explanation).toContain("subsequent registered transfer(s) already conveyed ownership");
  });

  it("Scenario C: should detect a seller–recorded-owner mismatch (CONFLICT_DETECTED)", () => {
    const { historicalData, proposedTransaction } = scenarios.C;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("CONFLICT_DETECTED");
    const mismatchFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-002-SELLER-MISMATCH"
    );
    expect(mismatchFinding).toBeDefined();
    expect(mismatchFinding?.severity).toBe("CRITICAL");
    expect(mismatchFinding?.explanation).toContain("does not match the reconstructed recorded titleholder");
    expect(mismatchFinding?.evidenceReferences).toContain("RECORDED_OWNER_NID:SYN-NID-3001");
    expect(mismatchFinding?.evidenceReferences).toContain("PROPOSED_SELLER_NID:SYN-NID-3099");
  });

  it("Scenario D: should flag a registration–mutation mismatch (REVIEW_REQUIRED)", () => {
    const { historicalData, proposedTransaction } = scenarios.D;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("REVIEW_REQUIRED");
    const regMutFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-004-REG-MUTATION-MISMATCH"
    );
    expect(regMutFinding).toBeDefined();
    expect(regMutFinding?.severity).toBe("HIGH");
    expect(regMutFinding?.explanation).toContain("REJECTED");
    expect(regMutFinding?.recommendedAction).toContain("revenue officer review");
  });

  it("Scenario E: should detect duplicate transaction references (CONFLICT_DETECTED)", () => {
    const { historicalData, proposedTransaction } = scenarios.E;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("CONFLICT_DETECTED");
    const dupFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-003-DUPLICATE-TXN-REF"
    );
    expect(dupFinding).toBeDefined();
    expect(dupFinding?.severity).toBe("CRITICAL");
    expect(dupFinding?.explanation).toContain("already registered in the system");
  });

  it("Scenario F: should flag contradictory or flagged historical parcel records (REVIEW_REQUIRED)", () => {
    const { historicalData, proposedTransaction } = scenarios.F;
    const result = evaluateProposedTransaction(proposedTransaction, historicalData);

    expect(result.status).toBe("REVIEW_REQUIRED");
    const historyFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-005-HISTORY-INCONSISTENCY"
    );
    expect(historyFinding).toBeDefined();
    expect(historyFinding?.explanation).toContain("FLAGGED");
    expect(historyFinding?.recommendedAction).toContain("land tribunal");
  });

  it("should ignore CANCELLED and REJECTED transactions and maintain valid ownership", () => {
    const customData: HistoricalParcelData = {
      parcel: {
        id: "p-cancel-test",
        parcelId: "PARCEL-CANCEL-001",
        deedNumber: "DEED-CANCEL-001",
        ownerName: "Authentic Owner",
        ownerNationalId: "NID-AUTH-100",
        areaSqFt: 3000,
        status: "ACTIVE",
        recordHash: generateSha256({ parcelId: "PARCEL-CANCEL-001", deed: "DEED-CANCEL-001" }),
        createdAt: new Date("2021-01-01T00:00:00Z"),
      },
      transactions: [
        {
          id: "tx-cancelled",
          transactionReference: "TXN-CANCELLED-1",
          parcelId: "PARCEL-CANCEL-001",
          sellerName: "Authentic Owner",
          sellerId: "NID-AUTH-100",
          buyerName: "Failed Buyer",
          buyerId: "NID-FAIL-999",
          transactionDate: new Date("2022-01-01T00:00:00Z"),
          amount: 500000,
          status: "CANCELLED",
          recordHash: "hash-cancel",
        },
        {
          id: "tx-rejected",
          transactionReference: "TXN-REJECTED-2",
          parcelId: "PARCEL-CANCEL-001",
          sellerName: "Authentic Owner",
          sellerId: "NID-AUTH-100",
          buyerName: "Another Failed Buyer",
          buyerId: "NID-FAIL-888",
          transactionDate: new Date("2022-06-01T00:00:00Z"),
          amount: 500000,
          status: "REJECTED",
          recordHash: "hash-reject",
        },
      ],
      registrations: [],
      mutations: [],
    };

    const reconstruction = reconstructOwnershipHistory(customData);
    expect(reconstruction.currentRecordedOwner?.nationalId).toBe("NID-AUTH-100");
    expect(reconstruction.ownershipChain).toHaveLength(1);

    const proposed: ProposedTransactionPayload = {
      transactionReference: "TXN-VALID-NEXT",
      parcelId: "PARCEL-CANCEL-001",
      sellerName: "Authentic Owner",
      sellerId: "NID-AUTH-100",
      buyerName: "Legitimate Buyer",
      buyerId: "NID-LEGIT-200",
      amount: 600000,
      transactionDate: new Date("2026-01-01T00:00:00Z"),
    };

    const result = evaluateProposedTransaction(proposed, customData);
    expect(result.status).toBe("CLEAR");
  });

  it("should not treat PENDING or PROPOSED transactions as completed title transfers", () => {
    const customData: HistoricalParcelData = {
      parcel: {
        id: "p-pending-test",
        parcelId: "PARCEL-PENDING-001",
        deedNumber: "DEED-PENDING-001",
        ownerName: "Current Legal Owner",
        ownerNationalId: "NID-LEGAL-100",
        areaSqFt: 4000,
        status: "ACTIVE",
        recordHash: "hash-pending",
        createdAt: new Date("2020-01-01T00:00:00Z"),
      },
      transactions: [
        {
          id: "tx-pending-1",
          transactionReference: "TXN-PROPOSED-1",
          parcelId: "PARCEL-PENDING-001",
          sellerName: "Current Legal Owner",
          sellerId: "NID-LEGAL-100",
          buyerName: "Prospective Buyer A",
          buyerId: "NID-PROSPECT-A",
          transactionDate: new Date("2024-01-01T00:00:00Z"),
          amount: 700000,
          status: "PROPOSED",
          recordHash: "hash-prop-1",
        },
      ],
      registrations: [],
      mutations: [],
    };

    const reconstruction = reconstructOwnershipHistory(customData);
    // Owner must still be Current Legal Owner, NOT Prospective Buyer A!
    expect(reconstruction.currentRecordedOwner?.nationalId).toBe("NID-LEGAL-100");
    expect(reconstruction.unresolvedOrPendingTransfers).toHaveLength(1);

    // If a second prospective transaction is proposed to Buyer B while Transaction 1 is still proposed:
    const conflictingProposed: ProposedTransactionPayload = {
      transactionReference: "TXN-PROPOSED-2",
      parcelId: "PARCEL-PENDING-001",
      sellerName: "Current Legal Owner",
      sellerId: "NID-LEGAL-100",
      buyerName: "Prospective Buyer B",
      buyerId: "NID-PROSPECT-B",
      amount: 750000,
      transactionDate: new Date("2024-02-01T00:00:00Z"),
    };

    const result = evaluateProposedTransaction(conflictingProposed, customData);
    expect(result.status).toBe("CONFLICT_DETECTED");
    expect(result.findings.some((f) => f.ruleCode === "LG-RULE-001-DOUBLE-SELLING")).toBe(true);
  });

  it("should process historical events chronologically even if provided out of order", () => {
    const historicalData: HistoricalParcelData = {
      parcel: {
        id: "p-chrono-test",
        parcelId: "PARCEL-CHRONO-001",
        deedNumber: "DEED-CHRONO-001",
        ownerName: "Owner 1",
        ownerNationalId: "NID-1",
        areaSqFt: 3000,
        status: "ACTIVE",
        recordHash: "hash-c-001",
        createdAt: new Date("2018-01-01T00:00:00Z"),
      },
      transactions: [
        // Out of order: 2022 transaction listed BEFORE 2020 transaction
        {
          id: "tx-2",
          transactionReference: "TXN-2",
          parcelId: "PARCEL-CHRONO-001",
          sellerName: "Owner 2",
          sellerId: "NID-2",
          buyerName: "Owner 3",
          buyerId: "NID-3",
          transactionDate: new Date("2022-01-01T00:00:00Z"),
          amount: 600000,
          status: "REGISTERED",
          recordHash: "hash-tx-2",
        },
        {
          id: "tx-1",
          transactionReference: "TXN-1",
          parcelId: "PARCEL-CHRONO-001",
          sellerName: "Owner 1",
          sellerId: "NID-1",
          buyerName: "Owner 2",
          buyerId: "NID-2",
          transactionDate: new Date("2020-01-01T00:00:00Z"),
          amount: 500000,
          status: "REGISTERED",
          recordHash: "hash-tx-1",
        },
      ],
      registrations: [],
      mutations: [],
    };

    const reconstruction = reconstructOwnershipHistory(historicalData);
    // Even though tx-2 was first in the array, chronological ordering ensures final owner is Owner 3
    expect(reconstruction.currentRecordedOwner?.nationalId).toBe("NID-3");
    expect(reconstruction.ownershipChain).toHaveLength(3);
    expect(reconstruction.ownershipChain[1].ownerNationalId).toBe("NID-2");
    expect(reconstruction.ownershipChain[2].ownerNationalId).toBe("NID-3");
  });

  it("should detect an approved mutation issued to someone other than the registered deed buyer", () => {
    const historicalData: HistoricalParcelData = {
      parcel: {
        id: "p-mut-mismatch",
        parcelId: "PARCEL-MUT-MISMATCH",
        deedNumber: "DEED-MUT-001",
        ownerName: "Original Owner",
        ownerNationalId: "NID-ORIG-1",
        areaSqFt: 5000,
        status: "ACTIVE",
        recordHash: generateSha256({ parcelId: "PARCEL-MUT-MISMATCH", deed: "DEED-MUT-001" }),
        createdAt: new Date("2020-01-01T00:00:00Z"),
      },
      transactions: [
        {
          id: "tx-mut-1",
          transactionReference: "TXN-MUT-1",
          parcelId: "PARCEL-MUT-MISMATCH",
          sellerName: "Original Owner",
          sellerId: "NID-ORIG-1",
          buyerName: "Legitimate Buyer",
          buyerId: "NID-LEGIT-BUYER",
          transactionDate: new Date("2022-01-01T00:00:00Z"),
          amount: 800000,
          status: "REGISTERED",
          recordHash: "hash-tx-mut-1",
        },
      ],
      registrations: [
        {
          id: "reg-mut-1",
          registrationNumber: "REG-MUT-1",
          parcelId: "PARCEL-MUT-MISMATCH",
          deedNumber: "DEED-MUT-001",
          status: "REGISTERED",
          registeredDate: new Date("2022-01-01T00:00:00Z"),
          registryOffice: "Office 1",
          transactionId: "tx-mut-1",
        },
      ],
      mutations: [
        {
          id: "mut-fraud-1",
          mutationCaseNumber: "MUT-FRAUD-1",
          parcelId: "PARCEL-MUT-MISMATCH",
          status: "APPROVED",
          // Fraudulent mutation issued to someone else!
          mutatedOwnerName: "Fraudulent Claimant",
          mutatedOwnerNationalId: "NID-FRAUD-999",
          approvedDate: new Date("2022-02-01T00:00:00Z"),
          revenueOffice: "Office 2",
          transactionId: "tx-mut-1",
        },
      ],
    };

    const proposed: ProposedTransactionPayload = {
      transactionReference: "TXN-NEXT-01",
      parcelId: "PARCEL-MUT-MISMATCH",
      sellerName: "Legitimate Buyer",
      sellerId: "NID-LEGIT-BUYER",
      buyerName: "Next Buyer",
      buyerId: "NID-NEXT-002",
      amount: 900000,
      transactionDate: new Date("2026-01-01T00:00:00Z"),
    };

    const result = evaluateProposedTransaction(proposed, historicalData);
    expect(result.status).toBe("CONFLICT_DETECTED");
    const finding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-004-REG-MUTATION-MISMATCH"
    );
    expect(finding).toBeDefined();
    expect(finding?.title).toContain("Approved Mutation Party Mismatch");
    expect(finding?.severity).toBe("CRITICAL");
  });

  it("should trigger cryptographic tampering alert when recordHash does not match computed SHA-256", () => {
    const historicalData: HistoricalParcelData = {
      parcel: {
        id: "p-tamper",
        parcelId: "PARCEL-TAMPER-001",
        deedNumber: "DEED-TAMPER-001",
        ownerName: "Legit Citizen",
        ownerNationalId: "NID-LEGIT-1",
        areaSqFt: 4000,
        status: "ACTIVE",
        // Tampered / corrupted recordHash
        recordHash: "corrupted_or_altered_hash_000000000000000000000000000000000000000",
        createdAt: new Date("2020-01-01T00:00:00Z"),
      },
      transactions: [],
      registrations: [],
      mutations: [],
    };

    const proposed: ProposedTransactionPayload = {
      transactionReference: "TXN-TAMPER-TEST",
      parcelId: "PARCEL-TAMPER-001",
      sellerName: "Legit Citizen",
      sellerId: "NID-LEGIT-1",
      buyerName: "Buyer Test",
      buyerId: "NID-BUYER-TEST",
      amount: 500000,
      transactionDate: new Date("2026-01-01T00:00:00Z"),
    };

    const result = evaluateProposedTransaction(proposed, historicalData);
    expect(result.status).toBe("CONFLICT_DETECTED");
    const tamperFinding = result.findings.find(
      (f) => f.ruleCode === "LG-RULE-005-HISTORY-INCONSISTENCY"
    );
    expect(tamperFinding).toBeDefined();
    expect(tamperFinding?.title).toContain("Cryptographic SHA-256 Hash Tampering Alert");
    expect(tamperFinding?.severity).toBe("CRITICAL");
  });
});
