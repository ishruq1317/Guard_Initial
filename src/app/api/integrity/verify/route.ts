import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRecordIntegrity } from "@/lib/engine/integrity";

const IntegrityVerifyRequestSchema = z.object({
  parcelId: z
    .string()
    .min(1, "Parcel identifier is required")
    .regex(/^[A-Za-z0-9-_]+$/, "Parcel identifier format is invalid"),
  simulateTamper: z
    .object({
      ownerName: z.string().optional(),
      ownerNationalId: z.string().optional(),
      deedNumber: z.string().optional(),
      areaSqFt: z.number().positive().optional(),
      boundaryGeoJson: z.string().nullable().optional(),
    })
    .optional(),
});

/**
 * POST /api/integrity/verify
 *
 * Evaluates the cryptographic SHA-256 integrity of an authoritative land record
 * against its stored reference hash without altering persistent database records.
 *
 * Supports non-destructive tamper simulation for hackathon demonstration.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
        { status: 400 }
      );
    }

    const parseResult = IntegrityVerifyRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Request parameters failed schema validation.",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { parcelId, simulateTamper } = parseResult.data;

    // Load authoritative land record from persistence
    const parcelRecord = await prisma.landRecord.findUnique({
      where: { parcelId },
    });

    if (!parcelRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "RECORD_NOT_FOUND",
          message: `Parcel identifier [${parcelId}] does not exist in the authoritative registry.`,
        },
        { status: 404 }
      );
    }

    // Execute read-only cryptographic integrity verification
    const verificationResult = verifyRecordIntegrity(
      parcelRecord as unknown as Record<string, unknown>,
      simulateTamper
    );

    // Record non-sensitive audit event
    // IMMUTABILITY GUARANTEE: Only the audit trail is appended; LandRecord is never mutated.
    try {
      await prisma.auditLog.create({
        data: {
          action: "RECORD_INTEGRITY_CHECK",
          performedBy: "SYSTEM_INTEGRITY_AUDITOR",
          details: JSON.stringify({
            parcelId: verificationResult.parcelId,
            status: verificationResult.status,
            storedReferenceHash: verificationResult.storedReferenceHash
              ? `${verificationResult.storedReferenceHash.substring(0, 16)}...`
              : null,
            recalculatedHash: `${verificationResult.recalculatedHash.substring(0, 16)}...`,
            tamperedFields: verificationResult.tamperedFields,
            simulated: verificationResult.simulated,
            timestamp: verificationResult.verifiedAt.toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.error("Failed to append audit log for integrity check:", auditErr);
      // Non-fatal for read-only response, but logged
    }

    return NextResponse.json(
      {
        success: true,
        data: verificationResult,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unhandled error in /api/integrity/verify:", err);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred while verifying record integrity.",
      },
      { status: 500 }
    );
  }
}
