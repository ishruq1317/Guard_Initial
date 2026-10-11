/**
 * Cryptographic Record Integrity & Canonicalization Engine
 * LandTech 2026 Hackathon Track P3: Fraud & Double-Selling Detection
 *
 * Implements deterministic canonical serialization and SHA-256 integrity verification
 * for synthetic land records, with explicit trust boundaries and tamper detection.
 */

import { generateSha256, verifySha256, canonicalStringify } from "../crypto";

export interface CanonicalLandRecord {
  areaSqFt: number;
  boundaryGeoJson: string | null;
  deedNumber: string;
  ownerName: string;
  ownerNationalId: string;
  parcelId: string;
  previousHash: string | null;
}

export type IntegrityStatus =
  | "INTEGRITY_VERIFIED"
  | "INTEGRITY_MISMATCH"
  | "REFERENCE_MISSING";

export interface IntegrityVerificationResult {
  recordId: string;
  parcelId: string;
  recordType: "LAND_RECORD";
  status: IntegrityStatus;
  storedReferenceHash: string | null;
  recalculatedHash: string;
  isMatch: boolean;
  verifiedAt: Date;
  canonicalObject: CanonicalLandRecord;
  canonicalString: string;
  explanation: string;
  tamperedFields: string[];
  simulated: boolean;
  trustBoundaryNotice: string;
}

export const TRUST_BOUNDARY_NOTICE =
  "TRUST BOUNDARY DISCLOSURE: SHA-256 proves reference consistency against the baseline record, " +
  "not legal title validity or ground-truth ownership. In standalone SQLite deployments, stored reference hashes " +
  "can be altered by a privileged attacker with direct database write access unless anchored by an external " +
  "trust mechanism (e.g., KMS digital signatures or immutable append-only transparency logs).";

/**
 * Extracts and normalizes the authoritative canonical fields of a land record.
 * Non-record metadata (DB internal UUID, mutable operational status, timestamps, UI state)
 * are strictly excluded from the canonical payload.
 */
export function extractCanonicalLandRecord(
  input: Record<string, unknown>
): CanonicalLandRecord {
  const rawArea = Number(input.areaSqFt);
  const normalizedArea = Number.isFinite(rawArea)
    ? Math.round(rawArea * 100) / 100
    : 0;

  return {
    areaSqFt: normalizedArea,
    boundaryGeoJson:
      input.boundaryGeoJson !== undefined && input.boundaryGeoJson !== null
        ? String(input.boundaryGeoJson).trim()
        : null,
    deedNumber: String(input.deedNumber ?? "").trim(),
    ownerName: String(input.ownerName ?? "").trim(),
    ownerNationalId: String(input.ownerNationalId ?? "").trim(),
    parcelId: String(input.parcelId ?? "").trim(),
    previousHash:
      input.previousHash !== undefined && input.previousHash !== null
        ? String(input.previousHash).trim()
        : null,
  };
}

/**
 * Deterministically serializes a land record into its canonical string representation
 * with lexicographically sorted keys, normalized dates, numbers, and explicit nulls.
 */
export function canonicalizeLandRecord(
  record: Record<string, unknown>
): { canonicalObject: CanonicalLandRecord; canonicalString: string } {
  const canonicalObject = extractCanonicalLandRecord(record);
  const canonicalString = canonicalStringify(canonicalObject);
  return { canonicalObject, canonicalString };
}

/**
 * Computes the authoritative SHA-256 reference hash for a synthetic land record.
 */
export function computeLandRecordHash(record: Record<string, unknown>): string {
  const { canonicalString } = canonicalizeLandRecord(record);
  return generateSha256(canonicalString);
}

/**
 * Verifies record integrity against its stored cryptographic reference hash.
 *
 * IMMUTABILITY GUARANTEE: This verification is strictly read-only and will NEVER
 * update, overwrite, or mutate the stored reference hash or database rows.
 *
 * @param record Authoritative land record loaded from persistence.
 * @param simulateTamper Optional non-destructive field overrides to simulate tampering without mutating storage.
 */
export function verifyRecordIntegrity(
  record: Record<string, unknown>,
  simulateTamper?: Partial<Record<keyof CanonicalLandRecord, unknown>>
): IntegrityVerificationResult {
  const parcelId = String(record.parcelId ?? "UNKNOWN");
  const recordId = String(record.id ?? parcelId);
  const rawStoredHash =
    typeof record.recordHash === "string" ? record.recordHash.trim() : null;
  const storedReferenceHash =
    rawStoredHash && rawStoredHash.length > 0 ? rawStoredHash : null;

  const isSimulation = Boolean(
    simulateTamper && Object.keys(simulateTamper).length > 0
  );

  const tamperedFields: string[] = [];
  const targetRecord: Record<string, unknown> = { ...record };

  if (isSimulation && simulateTamper) {
    for (const [key, val] of Object.entries(simulateTamper)) {
      if (val !== undefined && record[key] !== val) {
        tamperedFields.push(key);
        targetRecord[key] = val;
      }
    }
  }

  const { canonicalObject, canonicalString } = canonicalizeLandRecord(targetRecord);
  const recalculatedHash = generateSha256(canonicalString);

  // Status Case 1: Missing Reference Hash
  if (!storedReferenceHash) {
    return {
      recordId,
      parcelId,
      recordType: "LAND_RECORD",
      status: "REFERENCE_MISSING",
      storedReferenceHash: null,
      recalculatedHash,
      isMatch: false,
      verifiedAt: new Date(),
      canonicalObject,
      canonicalString,
      explanation: `Record for parcel [${parcelId}] does not have a stored cryptographic reference hash in the registry. Integrity cannot be verified.`,
      tamperedFields,
      simulated: isSimulation,
      trustBoundaryNotice: TRUST_BOUNDARY_NOTICE,
    };
  }

  // Status Case 2 & 3: Compare Recalculated Hash against Stored Reference
  const isMatch = verifySha256(canonicalString, storedReferenceHash);

  if (isMatch) {
    return {
      recordId,
      parcelId,
      recordType: "LAND_RECORD",
      status: "INTEGRITY_VERIFIED",
      storedReferenceHash,
      recalculatedHash,
      isMatch: true,
      verifiedAt: new Date(),
      canonicalObject,
      canonicalString,
      explanation: `Cryptographic integrity verified. Recalculated SHA-256 digest matches stored reference digest [${storedReferenceHash.substring(0, 16)}...]. No unauthorized field alterations detected.`,
      tamperedFields: [],
      simulated: isSimulation,
      trustBoundaryNotice: TRUST_BOUNDARY_NOTICE,
    };
  } else {
    const explanation = isSimulation
      ? `Simulated unauthorized modification detected on field(s): [${tamperedFields.join(", ")}]. Recalculated SHA-256 digest [${recalculatedHash.substring(0, 16)}...] diverges from authoritative stored reference [${storedReferenceHash.substring(0, 16)}...].`
      : `CRYPTOGRAPHIC MISMATCH DETECTED: Recalculated SHA-256 digest [${recalculatedHash.substring(0, 16)}...] does not match the stored reference digest [${storedReferenceHash.substring(0, 16)}...]. One or more authoritative fields have been altered since reference creation.`;

    return {
      recordId,
      parcelId,
      recordType: "LAND_RECORD",
      status: "INTEGRITY_MISMATCH",
      storedReferenceHash,
      recalculatedHash,
      isMatch: false,
      verifiedAt: new Date(),
      canonicalObject,
      canonicalString,
      explanation,
      tamperedFields: isSimulation ? tamperedFields : ["RECORD_DATA_MODIFIED"],
      simulated: isSimulation,
      trustBoundaryNotice: TRUST_BOUNDARY_NOTICE,
    };
  }
}
