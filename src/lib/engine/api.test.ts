import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "@/app/api/verify/route";
import { GET as getParcels } from "@/app/api/parcels/route";
import { NextRequest } from "next/server";
import { prisma } from "../prisma";
import { createSyntheticDemonstrationScenarios } from "./seed-data";

describe("Verification API Endpoint (/api/verify)", () => {
  const scenarios = createSyntheticDemonstrationScenarios();

  beforeAll(async () => {
    // Ensure synthetic demonstration dataset is seeded
    const { seedDatabase } = await import("../../../prisma/seed");
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return HTTP 200 with status CLEAR for a legitimate transaction", async () => {
    const payload = scenarios.A.proposedTransaction;
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CLEAR");
    expect(json.data.findings).toHaveLength(0);
    expect(json.data.parcelId).toBe("SYN-PARCEL-101-CLEAN");
  });

  it("should return HTTP 200 with status CONFLICT_DETECTED for a double-selling attempt", async () => {
    const payload = scenarios.B.proposedTransaction;
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CONFLICT_DETECTED");
    expect(
      json.data.findings.some(
        (f: { ruleCode: string }) => f.ruleCode === "LG-RULE-001-DOUBLE-SELLING"
      )
    ).toBe(true);
  });

  it("should return HTTP 404 if parcel identifier is unknown in the registry", async () => {
    const payload = {
      transactionReference: "TXN-UNKNOWN-999",
      parcelId: "SYN-PARCEL-NONEXISTENT",
      sellerName: "Ghost Seller",
      sellerId: "SYN-NID-0000",
      buyerName: "Eager Buyer",
      buyerId: "SYN-NID-1111",
      amount: 1000000,
      transactionDate: "2026-06-01T00:00:00Z",
    };

    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("PARCEL_NOT_FOUND");
    expect(json.message).toContain("SYN-PARCEL-NONEXISTENT");
  });

  it("should return HTTP 400 for invalid request payload violating Zod constraints", async () => {
    const invalidPayload = {
      transactionReference: "X", // Too short (< 3)
      parcelId: "P", // Too short (< 3)
      sellerName: "", // Empty
      sellerId: "1", // Too short
      buyerName: "",
      buyerId: "",
      amount: -500, // Negative amount
      transactionDate: "invalid-date",
    };

    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INVALID_REQUEST_PAYLOAD");
    expect(json.details).toBeDefined();
  });

  it("should return HTTP 200 with list of seeded synthetic parcels from /api/parcels", async () => {
    const res = await getParcels();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(6);
    expect(
      json.data.some((p: { parcelId: string }) => p.parcelId === "SYN-PARCEL-101-CLEAN")
    ).toBe(true);
  });
});
