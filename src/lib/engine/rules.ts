import {
  HistoricalParcelData,
  ProposedTransactionPayload,
  ReconstructedOwnershipState,
  VerificationFinding,
} from "./types";
import { verifySha256 } from "../crypto";
import { verifyRecordIntegrity } from "./integrity";

/**
 * RULE 1: Conflicting transfers of the same parcel (Double-Selling Detection).
 * Detects if a seller is attempting to sell a parcel that was already transferred,
 * or if there are conflicting pending/registered transfers for the same parcel.
 */
export function checkDoubleSellingAndConflictingTransfers(
  proposedTxn: ProposedTransactionPayload,
  historicalData: HistoricalParcelData,
  ownershipState: ReconstructedOwnershipState
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  // 1. Check if the proposed seller was an owner in the past, but subsequent registered transfers already moved the title away
  const ownerIndex = ownershipState.ownershipChain.findIndex(
    (link) => link.ownerNationalId === proposedTxn.sellerId
  );

  if (ownerIndex !== -1 && ownerIndex < ownershipState.ownershipChain.length - 1) {
    const subsequentTransfers = ownershipState.ownershipChain.slice(ownerIndex + 1);
    const conflictingEvidence = subsequentTransfers.flatMap((t) => t.supportingEvidence);

    findings.push({
      ruleCode: "LG-RULE-001-DOUBLE-SELLING",
      title: "Conflicting Transfer or Double-Selling Attempt",
      severity: "CRITICAL",
      explanation: `Seller "${proposedTxn.sellerName}" (${proposedTxn.sellerId}) previously held title to parcel ${proposedTxn.parcelId}, but subsequent registered transfer(s) already conveyed ownership to "${ownershipState.currentRecordedOwner?.name}" (${ownershipState.currentRecordedOwner?.nationalId}). Proposing another sale constitutes an active double-selling conflict.`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: conflictingEvidence,
      recommendedAction:
        "Reject transaction immediately. Lock transfer workflow and report double-selling attempt to land registry audit.",
    });
  }

  // 2. Check for conflicting unresolved proposed transfers to different buyers
  const conflictingPending = ownershipState.unresolvedOrPendingTransfers.filter(
    (pending) =>
      pending.transactionReference !== proposedTxn.transactionReference &&
      pending.buyerId !== proposedTxn.buyerId &&
      pending.status === "PROPOSED"
  );

  if (conflictingPending.length > 0) {
    findings.push({
      ruleCode: "LG-RULE-001-DOUBLE-SELLING",
      title: "Concurrent Conflicting Unresolved Transaction",
      severity: "CRITICAL",
      explanation: `There is already an active, uncancelled proposed transaction (${conflictingPending.map((p) => p.transactionReference).join(", ")}) for parcel ${proposedTxn.parcelId} to another prospective buyer (${conflictingPending.map((p) => p.buyerName).join(", ")}).`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: conflictingPending.map((p) => `PENDING_TXN:${p.transactionReference}`),
      recommendedAction:
        "Halt transaction until prior proposed transactions are formally executed, cancelled, or rejected.",
    });
  }

  return findings;
}

/**
 * RULE 2: Seller–Recorded-Owner Mismatch.
 * Checks whether the proposed seller matches the current reconstructed recorded owner.
 */
export function checkSellerOwnerMismatch(
  proposedTxn: ProposedTransactionPayload,
  ownershipState: ReconstructedOwnershipState
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];
  const currentOwner = ownershipState.currentRecordedOwner;

  if (!currentOwner) {
    findings.push({
      ruleCode: "LG-RULE-002-SELLER-MISMATCH",
      title: "Unresolved Current Parcel Ownership",
      severity: "CRITICAL",
      explanation: `No recorded legitimate owner could be determined from the historical chain for parcel ${proposedTxn.parcelId}. Proposed seller "${proposedTxn.sellerName}" cannot be verified.`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: [`PARCEL_RECORD:${proposedTxn.parcelId}`],
      recommendedAction: "Freeze transaction. Require full institutional cadastral ownership determination.",
    });
    return findings;
  }

  const idMismatch = currentOwner.nationalId !== proposedTxn.sellerId;
  const nameMismatch =
    currentOwner.name.trim().toLowerCase() !== proposedTxn.sellerName.trim().toLowerCase();

  if (idMismatch || nameMismatch) {
    findings.push({
      ruleCode: "LG-RULE-002-SELLER-MISMATCH",
      title: "Seller Does Not Match Recorded Parcel Owner",
      severity: "CRITICAL",
      explanation: `The proposed seller "${proposedTxn.sellerName}" (NID: ${proposedTxn.sellerId}) does not match the reconstructed recorded titleholder "${currentOwner.name}" (NID: ${currentOwner.nationalId}). Only the recorded titleholder may convey parcel ${proposedTxn.parcelId}.`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: [
        `RECORDED_OWNER_NID:${currentOwner.nationalId}`,
        `PROPOSED_SELLER_NID:${proposedTxn.sellerId}`,
        ...ownershipState.ownershipChain[ownershipState.ownershipChain.length - 1].supportingEvidence,
      ],
      recommendedAction:
        "Reject transaction submission. Seller lacks verified ownership rights over this parcel.",
    });
  }

  return findings;
}

/**
 * RULE 3: Duplicate Transaction References.
 * Verifies that the proposed transaction reference is unique and not already registered or used.
 */
export function checkDuplicateTransactionReference(
  proposedTxn: ProposedTransactionPayload,
  historicalData: HistoricalParcelData
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  const existingTxn = historicalData.transactions.find(
    (tx) =>
      tx.transactionReference &&
      tx.transactionReference.trim().toUpperCase() ===
        proposedTxn.transactionReference.trim().toUpperCase()
  );

  if (existingTxn) {
    findings.push({
      ruleCode: "LG-RULE-003-DUPLICATE-TXN-REF",
      title: "Duplicate Transaction Reference Detected",
      severity: "CRITICAL",
      explanation: `Transaction reference "${proposedTxn.transactionReference}" is already registered in the system (recorded on ${new Date(existingTxn.transactionDate).toISOString().split("T")[0]} with status ${existingTxn.status}). Transaction identifiers must be unique.`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: [`EXISTING_TXN_ID:${existingTxn.id}`, `STATUS:${existingTxn.status}`],
      recommendedAction:
        "Reject submission with duplicate reference error. Ensure distinct transaction filing references.",
    });
  }

  return findings;
}

/**
 * RULE 4: Registration–Mutation Inconsistency.
 * Verifies that registration records and revenue mutation records are consistent:
 * - A registered deed without an approved mutation
 * - A rejected mutation for a completed registered transfer
 * - A mutation assigned to a different party than the deed buyer
 */
export function checkRegistrationMutationInconsistency(
  proposedTxn: ProposedTransactionPayload,
  historicalData: HistoricalParcelData
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  for (const reg of historicalData.registrations) {
    // Find matching mutation for this parcel or transaction
    const matchingMutation = historicalData.mutations.find(
      (m) =>
        (reg.transactionId && m.transactionId === reg.transactionId) ||
        m.parcelId === reg.parcelId
    );

    if (!matchingMutation) {
      findings.push({
        ruleCode: "LG-RULE-004-REG-MUTATION-MISMATCH",
        title: "Registration Deed Lacks Corresponding Mutation Record",
        severity: "HIGH",
        explanation: `Registered deed "${reg.deedNumber}" (Registration #${reg.registrationNumber}) on parcel ${reg.parcelId} has no corresponding revenue mutation record in the cadastral ledger. Deed registration alone does not establish revenue record mutation.`,
        parcelId: proposedTxn.parcelId,
        transactionReference: proposedTxn.transactionReference,
        evidenceReferences: [`REGISTRATION:${reg.registrationNumber}`, `DEED:${reg.deedNumber}`],
        recommendedAction:
          "Require manual revenue review: Verify Assistant Commissioner (Land) mutation status prior to transfer clearance.",
      });
    } else if (matchingMutation.status === "REJECTED") {
      findings.push({
        ruleCode: "LG-RULE-004-REG-MUTATION-MISMATCH",
        title: "Revenue Mutation Application Was Rejected",
        severity: "HIGH",
        explanation: `Although deed "${reg.deedNumber}" was registered, corresponding mutation case "${matchingMutation.mutationCaseNumber}" was REJECTED by revenue office "${matchingMutation.revenueOffice}". Transfer of rights is incomplete.`,
        parcelId: proposedTxn.parcelId,
        transactionReference: proposedTxn.transactionReference,
        evidenceReferences: [
          `REGISTRATION:${reg.registrationNumber}`,
          `MUTATION:${matchingMutation.mutationCaseNumber}`,
          `STATUS:REJECTED`,
        ],
        recommendedAction:
          "Hold transaction for revenue officer review. Resolve rejected mutation grounds before approving new conveyances.",
      });
    } else if (matchingMutation.status === "PENDING") {
      findings.push({
        ruleCode: "LG-RULE-004-REG-MUTATION-MISMATCH",
        title: "Revenue Mutation Still Pending",
        severity: "MEDIUM",
        explanation: `Mutation case "${matchingMutation.mutationCaseNumber}" for parcel ${proposedTxn.parcelId} is still pending approval. Record of rights has not formally transferred.`,
        parcelId: proposedTxn.parcelId,
        transactionReference: proposedTxn.transactionReference,
        evidenceReferences: [`MUTATION:${matchingMutation.mutationCaseNumber}`],
        recommendedAction: "Await final mutation approval before executing new transfer.",
      });
    } else if (matchingMutation.status === "APPROVED") {
      // Validate that the approved mutation belongs to the registered buyer
      const linkedTxn = historicalData.transactions.find((t) => t.id === reg.transactionId);
      if (
        linkedTxn &&
        linkedTxn.buyerId &&
        matchingMutation.mutatedOwnerNationalId !== linkedTxn.buyerId
      ) {
        findings.push({
          ruleCode: "LG-RULE-004-REG-MUTATION-MISMATCH",
          title: "Approved Mutation Party Mismatch with Registered Buyer",
          severity: "CRITICAL",
          explanation: `Registered deed "${reg.deedNumber}" conveyed title to buyer "${linkedTxn.buyerName}" (${linkedTxn.buyerId}), but revenue mutation "${matchingMutation.mutationCaseNumber}" was issued to a different person: "${matchingMutation.mutatedOwnerName}" (${matchingMutation.mutatedOwnerNationalId}).`,
          parcelId: proposedTxn.parcelId,
          transactionReference: proposedTxn.transactionReference,
          evidenceReferences: [
            `REGISTRATION:${reg.registrationNumber}`,
            `BUYER_NID:${linkedTxn.buyerId}`,
            `MUTATION:${matchingMutation.mutationCaseNumber}`,
            `MUTATED_OWNER_NID:${matchingMutation.mutatedOwnerNationalId}`,
          ],
          recommendedAction:
            "Halt conveyance immediately. Order land registry and revenue office integrity investigation for conflicting title mutation.",
        });
      }
    }
  }

  return findings;
}

/**
 * RULE 5: Missing, Incomplete or Contradictory Historical Title Evidence.
 * Detects breaks in chain of title, flagged parcel statuses, or contradictory records.
 */
export function checkHistoricalConsistency(
  proposedTxn: ProposedTransactionPayload,
  historicalData: HistoricalParcelData,
  ownershipState: ReconstructedOwnershipState
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];

  // 1. Parcel flag/dispute check
  if (historicalData.parcel.status === "FLAGGED" || historicalData.parcel.status === "DISPUTED") {
    findings.push({
      ruleCode: "LG-RULE-005-HISTORY-INCONSISTENCY",
      title: "Parcel Ledger Is Flagged or In Dispute",
      severity: "HIGH",
      explanation: `Parcel ${proposedTxn.parcelId} is explicitly marked with status "${historicalData.parcel.status}" in the registry. Transactions on contested plots require judicial/administrative resolution.`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: [`PARCEL_STATUS:${historicalData.parcel.status}`],
      recommendedAction:
        "Refer parcel to land tribunal or registry legal counsel for dispute clearance.",
    });
  }

  // 2. Cryptographic SHA-256 record hash integrity verification
  if (historicalData.parcel.recordHash && historicalData.parcel.recordHash.trim() !== "") {
    const integrityResult = verifyRecordIntegrity(historicalData.parcel as unknown as Record<string, unknown>);
    const isLegacyValid = verifySha256(
      { parcelId: historicalData.parcel.parcelId, deed: historicalData.parcel.deedNumber },
      historicalData.parcel.recordHash
    );

    if (!integrityResult.isMatch && !isLegacyValid) {
      findings.push({
        ruleCode: "LG-RULE-005-HISTORY-INCONSISTENCY",
        title: "Cryptographic SHA-256 Hash Tampering Alert",
        severity: "CRITICAL",
        explanation: `The computed SHA-256 digest for baseline deed "${historicalData.parcel.deedNumber}" does not match the stored recordHash in the ledger. The parcel record may have undergone unauthorized modification.`,
        parcelId: proposedTxn.parcelId,
        transactionReference: proposedTxn.transactionReference,
        evidenceReferences: [
          `RECORD_HASH:${historicalData.parcel.recordHash}`,
          `PARCEL_ID:${historicalData.parcel.parcelId}`,
        ],
        recommendedAction:
          "Quarantine parcel record. Execute full cryptographic audit against deed registry archives.",
      });
    }
  }

  // 3. Breaks or anomalies detected during chronological reconstruction
  if (ownershipState.historyAnomalies.length > 0) {
    findings.push({
      ruleCode: "LG-RULE-005-HISTORY-INCONSISTENCY",
      title: "Contradictory Historical Ownership Transitions Detected",
      severity: "HIGH",
      explanation: `Historical ownership reconstruction encountered irregularities: ${ownershipState.historyAnomalies.join(" | ")}`,
      parcelId: proposedTxn.parcelId,
      transactionReference: proposedTxn.transactionReference,
      evidenceReferences: ownershipState.historyAnomalies,
      recommendedAction:
        "Perform archival deed audit to reconstruct legitimate sequence of conveyances.",
    });
  }

  return findings;
}
