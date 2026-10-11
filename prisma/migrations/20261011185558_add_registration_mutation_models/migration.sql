-- CreateTable
CREATE TABLE "RegistrationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationNumber" TEXT NOT NULL,
    "transactionId" TEXT,
    "parcelId" TEXT NOT NULL,
    "deedNumber" TEXT NOT NULL,
    "registeredDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registryOffice" TEXT NOT NULL,
    "recordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RegistrationRecord_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "LandRecord" ("parcelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MutationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mutationCaseNumber" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "transactionId" TEXT,
    "khatianNumber" TEXT,
    "mutatedOwnerName" TEXT NOT NULL,
    "mutatedOwnerNationalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedDate" DATETIME,
    "revenueOffice" TEXT NOT NULL,
    "recordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MutationRecord_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "LandRecord" ("parcelId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MutationRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionReference" TEXT,
    "parcelId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "recordHash" TEXT NOT NULL,
    "landRecordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_landRecordId_fkey" FOREIGN KEY ("landRecordId") REFERENCES "LandRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "buyerId", "buyerName", "createdAt", "id", "landRecordId", "parcelId", "recordHash", "sellerId", "sellerName", "status", "transactionDate") SELECT "amount", "buyerId", "buyerName", "createdAt", "id", "landRecordId", "parcelId", "recordHash", "sellerId", "sellerName", "status", "transactionDate" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_transactionReference_key" ON "Transaction"("transactionReference");
CREATE INDEX "Transaction_parcelId_idx" ON "Transaction"("parcelId");
CREATE INDEX "Transaction_landRecordId_idx" ON "Transaction"("landRecordId");
CREATE INDEX "Transaction_transactionReference_idx" ON "Transaction"("transactionReference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRecord_registrationNumber_key" ON "RegistrationRecord"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRecord_transactionId_key" ON "RegistrationRecord"("transactionId");

-- CreateIndex
CREATE INDEX "RegistrationRecord_parcelId_idx" ON "RegistrationRecord"("parcelId");

-- CreateIndex
CREATE INDEX "RegistrationRecord_deedNumber_idx" ON "RegistrationRecord"("deedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MutationRecord_mutationCaseNumber_key" ON "MutationRecord"("mutationCaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MutationRecord_transactionId_key" ON "MutationRecord"("transactionId");

-- CreateIndex
CREATE INDEX "MutationRecord_parcelId_idx" ON "MutationRecord"("parcelId");
