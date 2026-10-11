import { PrismaClient } from "@prisma/client";
import { createSyntheticDemonstrationScenarios } from "../src/lib/engine/seed-data";

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("🌱 Starting LandGuard deterministic synthetic seed procedure...");
  const scenarios = createSyntheticDemonstrationScenarios();

  for (const [key, scenario] of Object.entries(scenarios)) {
    const { parcel, transactions, registrations, mutations } = scenario.historicalData;

    // 1. Upsert LandRecord
    const landRecord = await prisma.landRecord.upsert({
      where: { parcelId: parcel.parcelId },
      update: {
        deedNumber: parcel.deedNumber,
        ownerName: parcel.ownerName,
        ownerNationalId: parcel.ownerNationalId,
        areaSqFt: parcel.areaSqFt,
        boundaryGeoJson: parcel.boundaryGeoJson,
        status: parcel.status,
        recordHash: parcel.recordHash,
      },
      create: {
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
    });

    console.log(`  ✓ Parcel seeded: [${parcel.parcelId}] (${scenario.title})`);

    // 2. Seed Transactions
    for (const tx of transactions) {
      const createdTx = await prisma.transaction.upsert({
        where: { id: tx.id },
        update: {
          transactionReference: tx.transactionReference,
          status: tx.status,
          amount: tx.amount,
        },
        create: {
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
          landRecordId: landRecord.id,
        },
      });

      // 3. Seed Registration if attached
      if (tx.registrationRecord) {
        await prisma.registrationRecord.upsert({
          where: { registrationNumber: tx.registrationRecord.registrationNumber },
          update: {
            status: tx.registrationRecord.status,
          },
          create: {
            id: tx.registrationRecord.id,
            registrationNumber: tx.registrationRecord.registrationNumber,
            transactionId: createdTx.id,
            parcelId: tx.parcelId,
            deedNumber: tx.registrationRecord.deedNumber,
            registeredDate: tx.registrationRecord.registeredDate,
            status: tx.registrationRecord.status,
            registryOffice: tx.registrationRecord.registryOffice,
            recordHash: tx.recordHash,
          },
        });
      }

      // 4. Seed Mutation if attached
      if (tx.mutationRecord) {
        await prisma.mutationRecord.upsert({
          where: { mutationCaseNumber: tx.mutationRecord.mutationCaseNumber },
          update: {
            status: tx.mutationRecord.status,
          },
          create: {
            id: tx.mutationRecord.id,
            mutationCaseNumber: tx.mutationRecord.mutationCaseNumber,
            parcelId: tx.parcelId,
            transactionId: createdTx.id,
            status: tx.mutationRecord.status,
            mutatedOwnerName: tx.mutationRecord.mutatedOwnerName,
            mutatedOwnerNationalId: tx.mutationRecord.mutatedOwnerNationalId,
            approvedDate: tx.mutationRecord.approvedDate,
            revenueOffice: tx.mutationRecord.revenueOffice,
            recordHash: tx.recordHash,
          },
        });
      }
    }
  }

  // 5. Append Seed Audit Log
  await prisma.auditLog.create({
    data: {
      action: "SEED_DATA_INITIALIZED",
      details: "Deterministic synthetic seed dataset (Scenarios A through F) loaded into database.",
      performedBy: "SYSTEM_SEED_RUNNER",
    },
  });

  console.log("✅ LandGuard synthetic demonstration dataset seeded successfully.");
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error("Seed error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
