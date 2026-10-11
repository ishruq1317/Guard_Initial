import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  canonicalizeLandRecord,
  computeLandRecordHash,
  extractCanonicalLandRecord,
  verifyRecordIntegrity,
  TRUST_BOUNDARY_NOTICE,
} from "./integrity";
import { prisma } from "../prisma";

describe("Phase 4: Cryptographic Integrity & Canonicalization Engine", () => {
  beforeAll(async () => {
    // Seed test database
    const { seedDatabase } = await import("../../../prisma/seed");
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. Canonical Record Serialization & Determinism", () => {
    it("should produce identical canonical strings and SHA-256 digests regardless of object key order", () => {
      const recordKeyOrder1 = {
        parcelId: "SYN-PARCEL-CANON-01",
        deedNumber: "SYN-DEED-2026-CANON",
        ownerName: "Rahim Ullah",
        ownerNationalId: "SYN-NID-8888",
        areaSqFt: 5400.5,
        boundaryGeoJson: '{"type":"Polygon"}',
        previousHash: null,
      };

      const recordKeyOrder2 = {
        previousHash: null,
        ownerNationalId: "SYN-NID-8888",
        areaSqFt: 5400.5,
        parcelId: "SYN-PARCEL-CANON-01",
        boundaryGeoJson: '{"type":"Polygon"}',
        ownerName: "Rahim Ullah",
        deedNumber: "SYN-DEED-2026-CANON",
      };

      const { canonicalString: s1 } = canonicalizeLandRecord(recordKeyOrder1);
      const { canonicalString: s2 } = canonicalizeLandRecord(recordKeyOrder2);

      expect(s1).toBe(s2);

      const h1 = computeLandRecordHash(recordKeyOrder1);
      const h2 = computeLandRecordHash(recordKeyOrder2);

      expect(h1).toBe(h2);
      expect(h1).toHaveLength(64);
    });

    it("should strictly exclude non-record metadata (id, status, timestamps, UI state)", () => {
      const recordWithMetadata = {
        id: "cuid-12345-internal",
        parcelId: "SYN-PARCEL-CANON-02",
        deedNumber: "SYN-DEED-2026-CANON2",
        ownerName: "Farida Yasmin",
        ownerNationalId: "SYN-NID-8889",
        areaSqFt: 4200,
        boundaryGeoJson: null,
        previousHash: null,
        status: "ACTIVE",
        createdAt: new Date("2020-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        _uiSelectionState: "selected",
        verificationTimestamp: 1773000000,
      };

      const extracted = extractCanonicalLandRecord(recordWithMetadata);
      expect(extracted).not.toHaveProperty("id");
      expect(extracted).not.toHaveProperty("status");
      expect(extracted).not.toHaveProperty("createdAt");
      expect(extracted).not.toHaveProperty("updatedAt");
      expect(extracted).not.toHaveProperty("_uiSelectionState");
      expect(extracted).not.toHaveProperty("verificationTimestamp");

      const { canonicalString } = canonicalizeLandRecord(recordWithMetadata);
      expect(canonicalString).not.toContain("cuid-12345-internal");
      expect(canonicalString).not.toContain("_uiSelectionState");
    });

    it("should handle null and undefined consistently for optional fields", () => {
      const withNull = {
        parcelId: "SYN-PARCEL-CANON-03",
        deedNumber: "SYN-DEED-2026-03",
        ownerName: "Akter Hossain",
        ownerNationalId: "SYN-NID-8890",
        areaSqFt: 3000,
        boundaryGeoJson: null,
        previousHash: null,
      };

      const withUndefined = {
        parcelId: "SYN-PARCEL-CANON-03",
        deedNumber: "SYN-DEED-2026-03",
        ownerName: "Akter Hossain",
        ownerNationalId: "SYN-NID-8890",
        areaSqFt: 3000,
        boundaryGeoJson: undefined,
        previousHash: undefined,
      };

      const hashNull = computeLandRecordHash(withNull);
      const hashUndefined = computeLandRecordHash(withUndefined);

      expect(hashNull).toBe(hashUndefined);
    });

    it("should normalize floating-point area representation consistently", () => {
      const recordInt = {
        parcelId: "SYN-PARCEL-CANON-04",
        deedNumber: "SYN-DEED-2026-04",
        ownerName: "Test Owner",
        ownerNationalId: "SYN-NID-8891",
        areaSqFt: 4500,
      };

      const recordFloatZeros = {
        parcelId: "SYN-PARCEL-CANON-04",
        deedNumber: "SYN-DEED-2026-04",
        ownerName: "Test Owner",
        ownerNationalId: "SYN-NID-8891",
        areaSqFt: 4500.0,
      };

      expect(computeLandRecordHash(recordInt)).toBe(computeLandRecordHash(recordFloatZeros));
    });
  });

  describe("2. Verification Scenarios & Tamper Detection", () => {
    it("Scenario A: should verify an authentic unchanged record as INTEGRITY_VERIFIED", () => {
      const parcelData = {
        id: "test-p1",
        parcelId: "SYN-PARCEL-TEST-A",
        deedNumber: "SYN-DEED-TEST-A",
        ownerName: "Authentic Citizen",
        ownerNationalId: "SYN-NID-TEST-A",
        areaSqFt: 5000,
        boundaryGeoJson: null,
        previousHash: null,
      };

      const authenticHash = computeLandRecordHash(parcelData);
      const record = { ...parcelData, recordHash: authenticHash };

      const result = verifyRecordIntegrity(record);

      expect(result.status).toBe("INTEGRITY_VERIFIED");
      expect(result.isMatch).toBe(true);
      expect(result.storedReferenceHash).toBe(authenticHash);
      expect(result.recalculatedHash).toBe(authenticHash);
      expect(result.tamperedFields).toHaveLength(0);
      expect(result.explanation).toContain("Cryptographic integrity verified");
    });

    it("Scenario B: should detect unauthorized modification as INTEGRITY_MISMATCH", () => {
      const parcelData = {
        id: "test-p2",
        parcelId: "SYN-PARCEL-TEST-B",
        deedNumber: "SYN-DEED-TEST-B",
        ownerName: "Authentic Citizen",
        ownerNationalId: "SYN-NID-TEST-B",
        areaSqFt: 5000,
        boundaryGeoJson: null,
        previousHash: null,
      };

      const authenticHash = computeLandRecordHash(parcelData);
      const authenticRecord = { ...parcelData, recordHash: authenticHash };

      // Simulate tamper on ownerNationalId and areaSqFt
      const result = verifyRecordIntegrity(authenticRecord, {
        ownerNationalId: "SYN-NID-TAMPERED-9999",
        areaSqFt: 99999,
      });

      expect(result.status).toBe("INTEGRITY_MISMATCH");
      expect(result.isMatch).toBe(false);
      expect(result.storedReferenceHash).toBe(authenticHash);
      expect(result.recalculatedHash).not.toBe(authenticHash);
      expect(result.tamperedFields).toEqual(["ownerNationalId", "areaSqFt"]);
      expect(result.simulated).toBe(true);
      expect(result.explanation).toContain("Simulated unauthorized modification detected");
    });

    it("Scenario C: should return REFERENCE_MISSING when record has no reference hash", () => {
      const unindexedRecord = {
        id: "test-p3",
        parcelId: "SYN-PARCEL-TEST-C",
        deedNumber: "SYN-DEED-TEST-C",
        ownerName: "Unindexed Owner",
        ownerNationalId: "SYN-NID-TEST-C",
        areaSqFt: 3500,
        boundaryGeoJson: null,
        previousHash: null,
        recordHash: "", // Empty reference hash
      };

      const result = verifyRecordIntegrity(unindexedRecord);

      expect(result.status).toBe("REFERENCE_MISSING");
      expect(result.isMatch).toBe(false);
      expect(result.storedReferenceHash).toBeNull();
      expect(result.recalculatedHash).toHaveLength(64);
      expect(result.explanation).toContain("does not have a stored cryptographic reference hash");
    });
  });

  describe("3. Immutability & Persistence Isolation Guarantee", () => {
    it("should never mutate or overwrite the stored reference hash during verification", async () => {
      const testParcel = await prisma.landRecord.upsert({
        where: { parcelId: "SYN-PARCEL-IMMUTABLE-TEST" },
        update: {},
        create: {
          parcelId: "SYN-PARCEL-IMMUTABLE-TEST",
          deedNumber: "SYN-DEED-IMMUTABLE-001",
          ownerName: "Untouched Owner",
          ownerNationalId: "SYN-NID-UNTOUCHED",
          areaSqFt: 3000,
          recordHash: "authentic-ref-hash-12345",
        },
      });

      const originalRecordHash = testParcel.recordHash;
      const originalOwnerName = testParcel.ownerName;

      // Execute verification with simulated tamper
      const result = verifyRecordIntegrity(testParcel as unknown as Record<string, unknown>, {
        ownerName: "Tampered Malicious Actor",
      });
      expect(result.status).toBe("INTEGRITY_MISMATCH");

      // Verify the persistent DB row in SQLite was NOT touched
      const parcelAfter = await prisma.landRecord.findUnique({
        where: { parcelId: "SYN-PARCEL-IMMUTABLE-TEST" },
      });
      expect(parcelAfter!.recordHash).toBe(originalRecordHash);
      expect(parcelAfter!.ownerName).toBe(originalOwnerName);
      expect(parcelAfter!.updatedAt.getTime()).toBe(testParcel.updatedAt.getTime());
    });
  });

  describe("4. Trust Boundary Notice & Non-Sensitive Audit Logging", () => {
    it("should include explicit trust boundary disclosure in verification result", () => {
      const record = {
        parcelId: "SYN-PARCEL-101-CLEAN",
        deedNumber: "SYN-DEED-2020-101",
        ownerName: "Anisur Rahman",
        ownerNationalId: "SYN-NID-1001",
        areaSqFt: 4500,
        recordHash: "some-hash",
      };

      const result = verifyRecordIntegrity(record);
      expect(result.trustBoundaryNotice).toBe(TRUST_BOUNDARY_NOTICE);
      expect(result.trustBoundaryNotice).toContain("SHA-256 proves reference consistency");
      expect(result.trustBoundaryNotice).toContain("external trust mechanism");
    });

    it("should record non-sensitive audit event when verified via API endpoint", async () => {
      const { POST } = await import("@/app/api/integrity/verify/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/integrity/verify", {
        method: "POST",
        body: JSON.stringify({ parcelId: "SYN-PARCEL-101-CLEAN" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("INTEGRITY_VERIFIED");

      // Verify AuditLog entry was recorded
      const recentAudit = await prisma.auditLog.findFirst({
        where: { action: "RECORD_INTEGRITY_CHECK" },
        orderBy: { timestamp: "desc" },
      });

      expect(recentAudit).not.toBeNull();
      expect(recentAudit!.performedBy).toBe("SYSTEM_INTEGRITY_AUDITOR");

      const auditDetails = JSON.parse(recentAudit!.details);
      expect(auditDetails.parcelId).toBe("SYN-PARCEL-101-CLEAN");
      expect(auditDetails.status).toBe("INTEGRITY_VERIFIED");
      // Ensure no raw PII like citizen name or full address leaked into audit details
      expect(auditDetails).not.toHaveProperty("ownerName");
      expect(auditDetails).not.toHaveProperty("citizenAddress");
    });
  });
});
