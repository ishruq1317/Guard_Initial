-- CreateTable
CREATE TABLE "LandRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "deedNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerNationalId" TEXT NOT NULL,
    "areaSqFt" REAL NOT NULL,
    "boundaryGeoJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "recordHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recordHash" TEXT NOT NULL,
    "landRecordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_landRecordId_fkey" FOREIGN KEY ("landRecordId") REFERENCES "LandRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "LandRecord_parcelId_key" ON "LandRecord"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "LandRecord_deedNumber_key" ON "LandRecord"("deedNumber");

-- CreateIndex
CREATE INDEX "LandRecord_parcelId_idx" ON "LandRecord"("parcelId");

-- CreateIndex
CREATE INDEX "LandRecord_deedNumber_idx" ON "LandRecord"("deedNumber");

-- CreateIndex
CREATE INDEX "Transaction_parcelId_idx" ON "Transaction"("parcelId");

-- CreateIndex
CREATE INDEX "Transaction_landRecordId_idx" ON "Transaction"("landRecordId");
