import { prisma } from "../prisma";
import { HistoricalParcelData } from "./types";

/**
 * Data access layer separating database queries from pure domain evaluation.
 */
export async function fetchHistoricalParcelData(
  parcelId: string
): Promise<HistoricalParcelData | null> {
  const parcel = await prisma.landRecord.findUnique({
    where: { parcelId },
    include: {
      transactions: {
        include: {
          registrationRecord: true,
          mutationRecord: true,
        },
      },
      registrations: true,
      mutations: true,
    },
  });

  if (!parcel) {
    return null;
  }

  return {
    parcel: {
      id: parcel.id,
      parcelId: parcel.parcelId,
      deedNumber: parcel.deedNumber,
      ownerName: parcel.ownerName,
      ownerNationalId: parcel.ownerNationalId,
      areaSqFt: parcel.areaSqFt,
      boundaryGeoJson: parcel.boundaryGeoJson,
      status: parcel.status,
      recordHash: parcel.recordHash,
      previousHash: parcel.previousHash,
      createdAt: parcel.createdAt,
    },
    transactions: parcel.transactions.map((tx) => ({
      id: tx.id,
      transactionReference: tx.transactionReference,
      parcelId: tx.parcelId,
      sellerName: tx.sellerName,
      sellerId: tx.sellerId,
      buyerName: tx.buyerName,
      buyerId: tx.buyerId,
      transactionDate: tx.transactionDate,
      amount: tx.amount,
      status: tx.status,
      recordHash: tx.recordHash,
      registrationRecord: tx.registrationRecord,
      mutationRecord: tx.mutationRecord,
    })),
    registrations: parcel.registrations,
    mutations: parcel.mutations,
  };
}

/**
 * Records an append-only verification audit event in the database without logging sensitive citizen personal data.
 */
export async function recordVerificationAuditEvent(params: {
  parcelId: string;
  transactionReference: string;
  outcomeStatus: string;
  findingsCount: number;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: "TRANSACTION_VERIFICATION_EVALUATED",
      details: JSON.stringify({
        parcelId: params.parcelId,
        transactionReference: params.transactionReference,
        outcomeStatus: params.outcomeStatus,
        findingsCount: params.findingsCount,
      }),
      performedBy: "FRAUD_DETECTION_ENGINE",
    },
  });
}
