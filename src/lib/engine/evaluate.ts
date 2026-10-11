import {
  HistoricalParcelData,
  ProposedTransactionPayload,
  VerificationFinding,
  VerificationResult,
  VerificationStatus,
} from "./types";
import { reconstructOwnershipHistory } from "./reconstruct";
import {
  checkDoubleSellingAndConflictingTransfers,
  checkDuplicateTransactionReference,
  checkHistoricalConsistency,
  checkRegistrationMutationInconsistency,
  checkSellerOwnerMismatch,
} from "./rules";

const LEGAL_DISCLAIMER =
  "Synthetic Demonstration Notice: This LandGuard verification result is an algorithmic consistency analysis of synthetic recorded land evidence for the LandTech 2026 Hackathon. It does not establish legally binding ownership or constitute a certified government title search. A CLEAR status means no configured inconsistency was detected in the available synthetic records; it does not guarantee authenticity or legal validity.";

/**
 * Pure evaluation function that executes all fraud detection rules against a proposed transaction
 * and the parcel's recorded history up to the proposed transaction date.
 */
export function evaluateProposedTransaction(
  proposedTxn: ProposedTransactionPayload,
  historicalData: HistoricalParcelData
): VerificationResult {
  const evaluatedAt = new Date();

  // 1. Chronologically reconstruct ownership history as of the proposed transaction date
  const ownershipState = reconstructOwnershipHistory(
    historicalData,
    proposedTxn.transactionDate
  );

  // 2. Evaluate all deterministic rules
  const findings: VerificationFinding[] = [
    ...checkDuplicateTransactionReference(proposedTxn, historicalData),
    ...checkSellerOwnerMismatch(proposedTxn, ownershipState),
    ...checkDoubleSellingAndConflictingTransfers(proposedTxn, historicalData, ownershipState),
    ...checkRegistrationMutationInconsistency(proposedTxn, historicalData),
    ...checkHistoricalConsistency(proposedTxn, historicalData, ownershipState),
  ];

  // 3. Determine overall status based on rule findings
  let status: VerificationStatus = "CLEAR";
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHighOrMedium = findings.some(
    (f) => f.severity === "HIGH" || f.severity === "MEDIUM"
  );

  if (hasCritical) {
    status = "CONFLICT_DETECTED";
  } else if (hasHighOrMedium) {
    status = "REVIEW_REQUIRED";
  } else {
    status = "CLEAR";
  }

  return {
    status,
    parcelId: proposedTxn.parcelId,
    transactionReference: proposedTxn.transactionReference,
    evaluatedAt,
    reconstructedOwner: ownershipState.currentRecordedOwner,
    proposedSeller: {
      name: proposedTxn.sellerName,
      nationalId: proposedTxn.sellerId,
    },
    proposedBuyer: {
      name: proposedTxn.buyerName,
      nationalId: proposedTxn.buyerId,
    },
    findings,
    supportingEvidence: {
      parcelBaseline: {
        parcelId: historicalData.parcel.parcelId,
        deedNumber: historicalData.parcel.deedNumber,
        initialOwner: historicalData.parcel.ownerName,
        status: historicalData.parcel.status,
      },
      chainSummary: ownershipState.ownershipChain,
      historicalTransactionCount: historicalData.transactions.length,
      registrationRecordsCount: historicalData.registrations.length,
      mutationRecordsCount: historicalData.mutations.length,
    },
    disclaimer: LEGAL_DISCLAIMER,
  };
}
