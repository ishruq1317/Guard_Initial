import { NextRequest, NextResponse } from "next/server";
import { ProposedTransactionRequestSchema } from "@/lib/validations/land-record";
import { fetchHistoricalParcelData, recordVerificationAuditEvent } from "@/lib/engine/repository";
import { evaluateProposedTransaction } from "@/lib/engine/evaluate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Strict Zod input validation
    const parseResult = ProposedTransactionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST_PAYLOAD",
          message: "The proposed transaction payload failed validation constraints.",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const proposedTxn = parseResult.data;

    // 2. Fetch recorded parcel history (isolated repository query)
    const historicalData = await fetchHistoricalParcelData(proposedTxn.parcelId);
    if (!historicalData) {
      return NextResponse.json(
        {
          success: false,
          error: "PARCEL_NOT_FOUND",
          message: `Parcel identifier "${proposedTxn.parcelId}" does not exist in the LandGuard registry.`,
          parcelId: proposedTxn.parcelId,
        },
        { status: 404 }
      );
    }

    // 3. Pure domain evaluation (no DB writes or mutations to authoritative parcel records)
    const result = evaluateProposedTransaction(proposedTxn, historicalData);

    // 4. Record non-sensitive verification audit event
    try {
      await recordVerificationAuditEvent({
        parcelId: proposedTxn.parcelId,
        transactionReference: proposedTxn.transactionReference,
        outcomeStatus: result.status,
        findingsCount: result.findings.length,
      });
    } catch (auditErr) {
      console.error("Failed to append verification audit log:", auditErr);
      // Non-fatal: do not block verification result
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unhandled error in /api/verify:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while evaluating the transaction.",
      },
      { status: 500 }
    );
  }
}
