import { describe, it, expect } from "vitest";
import { LandRecordInputSchema, TransactionInputSchema } from "./land-record";

describe("Zod Land Record & Transaction Input Schemas", () => {
  it("should validate well-formed synthetic land parcel records", () => {
    const validParcel = {
      parcelId: "PLOT-2026-901",
      deedNumber: "DEED-2026-TX-01",
      ownerName: "Rahim Chowdhury",
      ownerNationalId: "NID-99887766",
      areaSqFt: 3500.5,
    };

    const result = LandRecordInputSchema.safeParse(validParcel);
    expect(result.success).toBe(true);
  });

  it("should reject invalid parcel records with negative area or malformed IDs", () => {
    const invalidParcel = {
      parcelId: "PL", // Too short (min 3)
      deedNumber: "D1", // Too short (min 3)
      ownerName: "A", // Too short (min 2)
      ownerNationalId: "123", // Too short (min 4)
      areaSqFt: -500, // Negative area
    };

    const result = LandRecordInputSchema.safeParse(invalidParcel);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("should validate and reject transactions according to schema rules", () => {
    const validTransaction = {
      parcelId: "PLOT-2026-901",
      sellerName: "Rahim Chowdhury",
      sellerId: "NID-99887766",
      buyerName: "Karim Ahmed",
      buyerId: "NID-11223344",
      amount: 450000,
    };

    expect(TransactionInputSchema.safeParse(validTransaction).success).toBe(true);

    const invalidTransaction = {
      ...validTransaction,
      amount: -100, // Negative amount
    };
    expect(TransactionInputSchema.safeParse(invalidTransaction).success).toBe(false);
  });
});
