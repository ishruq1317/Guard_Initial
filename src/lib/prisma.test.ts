import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "./prisma";

describe("Prisma SQLite Database Connectivity & Operations", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should successfully connect, write, query, and clean up a LandRecord in SQLite", async () => {
    const testParcelId = "AUDIT-PARCEL-TEST-99";
    const testDeed = "AUDIT-DEED-TEST-99";

    // Clean up any stale record if exists
    await prisma.landRecord.deleteMany({
      where: { parcelId: testParcelId },
    });

    const created = await prisma.landRecord.create({
      data: {
        parcelId: testParcelId,
        deedNumber: testDeed,
        ownerName: "Audit Test Synthetic Citizen",
        ownerNationalId: "NID-0000-TEST",
        areaSqFt: 2500,
        recordHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
    });

    expect(created.id).toBeDefined();
    expect(created.parcelId).toBe(testParcelId);

    const fetched = await prisma.landRecord.findUnique({
      where: { parcelId: testParcelId },
    });

    expect(fetched?.deedNumber).toBe(testDeed);

    // Clean up
    await prisma.landRecord.delete({
      where: { parcelId: testParcelId },
    });

    const deleted = await prisma.landRecord.findUnique({
      where: { parcelId: testParcelId },
    });

    expect(deleted).toBeNull();
  });
});
