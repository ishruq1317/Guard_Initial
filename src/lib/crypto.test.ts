import { describe, it, expect } from "vitest";
import { generateSha256, verifySha256, canonicalStringify } from "./crypto";

describe("Cryptographic SHA-256 Integrity Verification", () => {
  it("should generate deterministic SHA-256 hashes regardless of object key ordering", () => {
    const payloadA = {
      parcelId: "PLOT-2026-001",
      owner: "Alice Johnson",
      areaSqFt: 5400,
    };

    const payloadB = {
      areaSqFt: 5400,
      owner: "Alice Johnson",
      parcelId: "PLOT-2026-001",
    };

    const hashA = generateSha256(payloadA);
    const hashB = generateSha256(payloadB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64); // Valid SHA-256 hex string length
  });

  it("should verify matching hashes correctly and reject altered data", () => {
    const originalRecord = {
      parcelId: "PLOT-2026-888",
      deedNumber: "DEED-XYZ-99",
      amount: 150000,
    };

    const validHash = generateSha256(originalRecord);
    expect(verifySha256(originalRecord, validHash)).toBe(true);

    const tamperedRecord = {
      ...originalRecord,
      amount: 250000, // Altered amount
    };

    expect(verifySha256(tamperedRecord, validHash)).toBe(false);
  });

  it("should canonically stringify primitives and nested objects", () => {
    const serialized = canonicalStringify({ b: 2, a: 1 });
    expect(serialized).toBe('{"a":1,"b":2}');
  });
});
