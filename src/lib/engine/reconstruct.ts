import {
  HistoricalParcelData,
  OwnershipChainLink,
  PartyReference,
  ReconstructedOwnershipState,
  TransactionStatus,
} from "./types";

const LEGAL_DISCLAIMER =
  "Synthetic Demonstration Notice: This ownership reconstruction is a deterministic consistency analysis of synthetic recorded records for the LandTech 2026 Hackathon. It does not establish legally binding ownership or constitute a certified government title search.";

/**
 * Reconstructs the ownership timeline of a land parcel by chronologically
 * replaying recorded baseline deeds, transactions, registrations, and mutation events.
 *
 * Adheres to strict domain principles:
 * - Pure function (no DB side effects).
 * - Chronological event replay.
 * - Does NOT pick the latest DB row.
 * - Does NOT treat pending or proposed transactions as completed transfers.
 * - Flags breaks in title chain and unsupported transitions.
 */
export function reconstructOwnershipHistory(
  historicalData: HistoricalParcelData,
  asOfDate?: Date
): ReconstructedOwnershipState {
  const { parcel, transactions } = historicalData;
  const cutoffDate = asOfDate ?? new Date();

  const baselineOwner: PartyReference = {
    name: parcel.ownerName,
    nationalId: parcel.ownerNationalId,
  };

  const historyAnomalies: string[] = [];
  const unresolvedOrPendingTransfers: Array<{
    transactionReference: string;
    buyerName: string;
    buyerId: string;
    sellerName: string;
    sellerId: string;
    date: Date;
    status: TransactionStatus;
  }> = [];

  const ownershipChain: OwnershipChainLink[] = [
    {
      ownerName: baselineOwner.name,
      ownerNationalId: baselineOwner.nationalId,
      effectiveFrom: new Date(parcel.createdAt),
      deedNumber: parcel.deedNumber,
      supportingEvidence: [`BASELINE_DEED:${parcel.deedNumber}`, `PARCEL_RECORD:${parcel.parcelId}`],
    },
  ];

  let currentRecordedOwner: PartyReference | null = { ...baselineOwner };

  // Filter events up to cutoffDate and sort in strictly ascending chronological order
  const filteredTxns = transactions
    .filter((tx) => new Date(tx.transactionDate) <= cutoffDate)
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  for (const tx of filteredTxns) {
    const txRef = tx.transactionReference || tx.id;
    const txStatus = tx.status as TransactionStatus;

    if (txStatus === "CANCELLED" || txStatus === "REJECTED") {
      // Cancelled or rejected transactions never transfer title
      continue;
    }

    if (txStatus === "PROPOSED") {
      unresolvedOrPendingTransfers.push({
        transactionReference: txRef,
        buyerName: tx.buyerName,
        buyerId: tx.buyerId,
        sellerName: tx.sellerName,
        sellerId: tx.sellerId,
        date: new Date(tx.transactionDate),
        status: txStatus,
      });
      continue;
    }

    if (txStatus === "REGISTERED" || txStatus === "COMPLETED") {
      // Validate recorded seller against the then-current reconstructed owner
      if (
        !currentRecordedOwner ||
        currentRecordedOwner.nationalId !== tx.sellerId ||
        currentRecordedOwner.name.trim().toLowerCase() !== tx.sellerName.trim().toLowerCase()
      ) {
        historyAnomalies.push(
          `Historical title transition anomaly at transaction ${txRef}: Seller "${tx.sellerName}" (${tx.sellerId}) did not match then-recorded owner "${currentRecordedOwner?.name ?? "NONE"}" (${currentRecordedOwner?.nationalId ?? "NONE"}).`
        );
      }

      // Record transfer of ownership
      currentRecordedOwner = {
        name: tx.buyerName,
        nationalId: tx.buyerId,
      };

      const supportingEvidence: string[] = [`TRANSACTION:${txRef}`];
      if (tx.registrationRecord) {
        supportingEvidence.push(`REGISTRATION:${tx.registrationRecord.registrationNumber}`);
      }
      if (tx.mutationRecord) {
        supportingEvidence.push(`MUTATION:${tx.mutationRecord.mutationCaseNumber}`);
      }

      ownershipChain.push({
        ownerName: tx.buyerName,
        ownerNationalId: tx.buyerId,
        effectiveFrom: new Date(tx.transactionDate),
        deedNumber: tx.registrationRecord?.deedNumber,
        registrationNumber: tx.registrationRecord?.registrationNumber,
        mutationCaseNumber: tx.mutationRecord?.mutationCaseNumber,
        supportingEvidence,
      });
    }
  }

  const isContestedOrFlagged =
    parcel.status === "FLAGGED" ||
    parcel.status === "DISPUTED" ||
    historyAnomalies.length > 0;

  return {
    parcelId: parcel.parcelId,
    currentRecordedOwner,
    baselineOwner,
    ownershipChain,
    unresolvedOrPendingTransfers,
    isContestedOrFlagged,
    historyAnomalies,
    evaluatedAsOfDate: cutoffDate,
    disclaimer: LEGAL_DISCLAIMER,
  };
}
