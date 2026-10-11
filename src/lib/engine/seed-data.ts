import { HistoricalParcelData, ProposedTransactionPayload } from "./types";
import { generateSha256 } from "../crypto";
import { computeLandRecordHash } from "./integrity";

/**
 * Deterministic synthetic seed dataset covering Scenarios A through G for the LandTech 2026 Hackathon.
 *
 * ALL NAMES, NATIONAL IDS, DEED IDENTIFIERS, AND PLOT NUMBERS ARE COMPLETELY SYNTHETIC.
 * NO REAL PERSONAL DATA, GOVERNMENT RECORDS, OR CADASTRAL SYSTEMS ARE REFERENCED.
 */

export interface SyntheticDemonstrationScenario {
  id: string;
  code: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  title: string;
  description: string;
  historicalData: HistoricalParcelData;
  proposedTransaction: ProposedTransactionPayload;
  expectedStatus: "CLEAR" | "REVIEW_REQUIRED" | "CONFLICT_DETECTED";
  expectedRuleCodes: string[];
}

export function createSyntheticDemonstrationScenarios(): Record<string, SyntheticDemonstrationScenario> {
  // Scenario A: Consistent Ownership History
  const scenarioA_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-101",
      parcelId: "SYN-PARCEL-101-CLEAN",
      deedNumber: "SYN-DEED-2020-101",
      ownerName: "Anisur Rahman",
      ownerNationalId: "SYN-NID-1001",
      areaSqFt: 4500,
      boundaryGeoJson: JSON.stringify({ type: "Polygon", coordinates: [[[90.41, 23.81], [90.42, 23.81], [90.42, 23.82], [90.41, 23.82], [90.41, 23.81]]] }),
      status: "ACTIVE",
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-101-CLEAN",
        deedNumber: "SYN-DEED-2020-101",
        ownerName: "Anisur Rahman",
        ownerNationalId: "SYN-NID-1001",
        areaSqFt: 4500,
        boundaryGeoJson: JSON.stringify({ type: "Polygon", coordinates: [[[90.41, 23.81], [90.42, 23.81], [90.42, 23.82], [90.41, 23.82], [90.41, 23.81]]] }),
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2020-01-10T10:00:00Z"),
    },
    transactions: [
      {
        id: "cl-syn-tx-101-1",
        transactionReference: "TXN-SYN-2022-101-1",
        parcelId: "SYN-PARCEL-101-CLEAN",
        sellerName: "Anisur Rahman",
        sellerId: "SYN-NID-1001",
        buyerName: "Bina Chowdhury",
        buyerId: "SYN-NID-1002",
        transactionDate: new Date("2022-03-15T11:00:00Z"),
        amount: 850000,
        status: "REGISTERED",
        recordHash: generateSha256({ ref: "TXN-SYN-2022-101-1", amount: 850000 }),
        registrationRecord: {
          id: "cl-syn-reg-101-1",
          registrationNumber: "REG-SYN-2022-101-1",
          deedNumber: "SYN-DEED-2022-101",
          status: "REGISTERED",
          registeredDate: new Date("2022-03-15T12:00:00Z"),
          registryOffice: "Synthetic Sub-Registry Office 01",
        },
        mutationRecord: {
          id: "cl-syn-mut-101-1",
          mutationCaseNumber: "MUT-SYN-2022-101-1",
          status: "APPROVED",
          mutatedOwnerName: "Bina Chowdhury",
          mutatedOwnerNationalId: "SYN-NID-1002",
          approvedDate: new Date("2022-04-10T14:00:00Z"),
          revenueOffice: "Synthetic Circle Revenue Office 01",
        },
      },
    ],
    registrations: [
      {
        id: "cl-syn-reg-101-1",
        registrationNumber: "REG-SYN-2022-101-1",
        parcelId: "SYN-PARCEL-101-CLEAN",
        deedNumber: "SYN-DEED-2022-101",
        status: "REGISTERED",
        registeredDate: new Date("2022-03-15T12:00:00Z"),
        registryOffice: "Synthetic Sub-Registry Office 01",
        transactionId: "cl-syn-tx-101-1",
      },
    ],
    mutations: [
      {
        id: "cl-syn-mut-101-1",
        mutationCaseNumber: "MUT-SYN-2022-101-1",
        parcelId: "SYN-PARCEL-101-CLEAN",
        status: "APPROVED",
        mutatedOwnerName: "Bina Chowdhury",
        mutatedOwnerNationalId: "SYN-NID-1002",
        approvedDate: new Date("2022-04-10T14:00:00Z"),
        revenueOffice: "Synthetic Circle Revenue Office 01",
        transactionId: "cl-syn-tx-101-1",
      },
    ],
  };

  const scenarioA_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-A",
    parcelId: "SYN-PARCEL-101-CLEAN",
    sellerName: "Bina Chowdhury",
    sellerId: "SYN-NID-1002",
    buyerName: "Chandan Sen",
    buyerId: "SYN-NID-1003",
    amount: 1200000,
    transactionDate: new Date("2026-06-01T09:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-A",
  };

  // Scenario B: Double-Selling / Conflicting Sale
  const scenarioB_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-102",
      parcelId: "SYN-PARCEL-102-DBL",
      deedNumber: "SYN-DEED-2018-102",
      ownerName: "Farhan Kabir",
      ownerNationalId: "SYN-NID-2001",
      areaSqFt: 5200,
      status: "ACTIVE",
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-102-DBL",
        deedNumber: "SYN-DEED-2018-102",
        ownerName: "Farhan Kabir",
        ownerNationalId: "SYN-NID-2001",
        areaSqFt: 5200,
        boundaryGeoJson: null,
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2018-05-20T10:00:00Z"),
    },
    transactions: [
      {
        id: "cl-syn-tx-102-1",
        transactionReference: "TXN-SYN-2023-102-1",
        parcelId: "SYN-PARCEL-102-DBL",
        sellerName: "Farhan Kabir",
        sellerId: "SYN-NID-2001",
        buyerName: "Golam Mostafa",
        buyerId: "SYN-NID-2002",
        transactionDate: new Date("2023-08-10T11:00:00Z"),
        amount: 1500000,
        status: "REGISTERED",
        recordHash: generateSha256({ ref: "TXN-SYN-2023-102-1", amount: 1500000 }),
        registrationRecord: {
          id: "cl-syn-reg-102-1",
          registrationNumber: "REG-SYN-2023-102-1",
          deedNumber: "SYN-DEED-2023-102",
          status: "REGISTERED",
          registeredDate: new Date("2023-08-10T12:00:00Z"),
          registryOffice: "Synthetic Sub-Registry Office 02",
        },
        mutationRecord: {
          id: "cl-syn-mut-102-1",
          mutationCaseNumber: "MUT-SYN-2023-102-1",
          status: "APPROVED",
          mutatedOwnerName: "Golam Mostafa",
          mutatedOwnerNationalId: "SYN-NID-2002",
          approvedDate: new Date("2023-09-15T10:00:00Z"),
          revenueOffice: "Synthetic Circle Revenue Office 02",
        },
      },
    ],
    registrations: [
      {
        id: "cl-syn-reg-102-1",
        registrationNumber: "REG-SYN-2023-102-1",
        parcelId: "SYN-PARCEL-102-DBL",
        deedNumber: "SYN-DEED-2023-102",
        status: "REGISTERED",
        registeredDate: new Date("2023-08-10T12:00:00Z"),
        registryOffice: "Synthetic Sub-Registry Office 02",
        transactionId: "cl-syn-tx-102-1",
      },
    ],
    mutations: [
      {
        id: "cl-syn-mut-102-1",
        mutationCaseNumber: "MUT-SYN-2023-102-1",
        parcelId: "SYN-PARCEL-102-DBL",
        status: "APPROVED",
        mutatedOwnerName: "Golam Mostafa",
        mutatedOwnerNationalId: "SYN-NID-2002",
        approvedDate: new Date("2023-09-15T10:00:00Z"),
        revenueOffice: "Synthetic Circle Revenue Office 02",
        transactionId: "cl-syn-tx-102-1",
      },
    ],
  };

  const scenarioB_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-DBL",
    parcelId: "SYN-PARCEL-102-DBL",
    // Farhan Kabir already sold to Golam Mostafa, but is attempting a second sale to Habibur Rahman!
    sellerName: "Farhan Kabir",
    sellerId: "SYN-NID-2001",
    buyerName: "Habibur Rahman",
    buyerId: "SYN-NID-2003",
    amount: 1800000,
    transactionDate: new Date("2026-07-15T14:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-DBL",
  };

  // Scenario C: Seller–Recorded-Owner Mismatch
  const scenarioC_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-103",
      parcelId: "SYN-PARCEL-103-MISMATCH",
      deedNumber: "SYN-DEED-2019-103",
      ownerName: "Imran Hossain",
      ownerNationalId: "SYN-NID-3001",
      areaSqFt: 3800,
      status: "ACTIVE",
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-103-MISMATCH",
        deedNumber: "SYN-DEED-2019-103",
        ownerName: "Imran Hossain",
        ownerNationalId: "SYN-NID-3001",
        areaSqFt: 3800,
        boundaryGeoJson: null,
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2019-04-12T09:00:00Z"),
    },
    transactions: [],
    registrations: [],
    mutations: [],
  };

  const scenarioC_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-MISMATCH",
    parcelId: "SYN-PARCEL-103-MISMATCH",
    // Seller Jannatul Ferdous does not match recorded owner Imran Hossain
    sellerName: "Jannatul Ferdous",
    sellerId: "SYN-NID-3099",
    buyerName: "Kamal Haque",
    buyerId: "SYN-NID-3004",
    amount: 950000,
    transactionDate: new Date("2026-08-01T10:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-MISMATCH",
  };

  // Scenario D: Registration–Mutation Inconsistency
  const scenarioD_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-104",
      parcelId: "SYN-PARCEL-104-REGMUT",
      deedNumber: "SYN-DEED-2021-104",
      ownerName: "Latifur Rahman",
      ownerNationalId: "SYN-NID-4001",
      areaSqFt: 6100,
      status: "ACTIVE",
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-104-REGMUT",
        deedNumber: "SYN-DEED-2021-104",
        ownerName: "Latifur Rahman",
        ownerNationalId: "SYN-NID-4001",
        areaSqFt: 6100,
        boundaryGeoJson: null,
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2021-02-15T08:00:00Z"),
    },
    transactions: [
      {
        id: "cl-syn-tx-104-1",
        transactionReference: "TXN-SYN-2023-104-1",
        parcelId: "SYN-PARCEL-104-REGMUT",
        sellerName: "Latifur Rahman",
        sellerId: "SYN-NID-4001",
        buyerName: "Monira Begum",
        buyerId: "SYN-NID-4002",
        transactionDate: new Date("2023-06-20T10:00:00Z"),
        amount: 2100000,
        status: "REGISTERED",
        recordHash: generateSha256({ ref: "TXN-SYN-2023-104-1", amount: 2100000 }),
        registrationRecord: {
          id: "cl-syn-reg-104-1",
          registrationNumber: "REG-SYN-2023-104-1",
          deedNumber: "SYN-DEED-2023-104",
          status: "REGISTERED",
          registeredDate: new Date("2023-06-20T11:00:00Z"),
          registryOffice: "Synthetic Sub-Registry Office 04",
        },
        mutationRecord: {
          id: "cl-syn-mut-104-1",
          mutationCaseNumber: "MUT-SYN-2023-104-1",
          status: "REJECTED", // Rejected mutation!
          mutatedOwnerName: "Monira Begum",
          mutatedOwnerNationalId: "SYN-NID-4002",
          approvedDate: null,
          revenueOffice: "Synthetic Circle Revenue Office 04",
        },
      },
    ],
    registrations: [
      {
        id: "cl-syn-reg-104-1",
        registrationNumber: "REG-SYN-2023-104-1",
        parcelId: "SYN-PARCEL-104-REGMUT",
        deedNumber: "SYN-DEED-2023-104",
        status: "REGISTERED",
        registeredDate: new Date("2023-06-20T11:00:00Z"),
        registryOffice: "Synthetic Sub-Registry Office 04",
        transactionId: "cl-syn-tx-104-1",
      },
    ],
    mutations: [
      {
        id: "cl-syn-mut-104-1",
        mutationCaseNumber: "MUT-SYN-2023-104-1",
        parcelId: "SYN-PARCEL-104-REGMUT",
        status: "REJECTED",
        mutatedOwnerName: "Monira Begum",
        mutatedOwnerNationalId: "SYN-NID-4002",
        approvedDate: null,
        revenueOffice: "Synthetic Circle Revenue Office 04",
        transactionId: "cl-syn-tx-104-1",
      },
    ],
  };

  const scenarioD_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-REGMUT",
    parcelId: "SYN-PARCEL-104-REGMUT",
    sellerName: "Monira Begum",
    sellerId: "SYN-NID-4002",
    buyerName: "Nafis Iqbal",
    buyerId: "SYN-NID-4003",
    amount: 2500000,
    transactionDate: new Date("2026-08-10T11:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-REGMUT",
  };

  // Scenario E: Duplicate Transaction Reference
  const scenarioE_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-105",
      parcelId: "SYN-PARCEL-105-DUPREF",
      deedNumber: "SYN-DEED-2020-105",
      ownerName: "Nasir Uddin",
      ownerNationalId: "SYN-NID-5001",
      areaSqFt: 4000,
      status: "ACTIVE",
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-105-DUPREF",
        deedNumber: "SYN-DEED-2020-105",
        ownerName: "Nasir Uddin",
        ownerNationalId: "SYN-NID-5001",
        areaSqFt: 4000,
        boundaryGeoJson: null,
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2020-09-01T10:00:00Z"),
    },
    transactions: [
      {
        id: "cl-syn-tx-105-existing",
        transactionReference: "TXN-SYN-2024-DUP-999",
        parcelId: "SYN-PARCEL-105-DUPREF",
        sellerName: "Nasir Uddin",
        sellerId: "SYN-NID-5001",
        buyerName: "Opu Biswas",
        buyerId: "SYN-NID-5002",
        transactionDate: new Date("2024-01-15T10:00:00Z"),
        amount: 1100000,
        status: "REGISTERED",
        recordHash: generateSha256({ ref: "TXN-SYN-2024-DUP-999", amount: 1100000 }),
        registrationRecord: null,
        mutationRecord: null,
      },
    ],
    registrations: [],
    mutations: [],
  };

  const scenarioE_proposed: ProposedTransactionPayload = {
    // Re-uses existing transactionReference TXN-SYN-2024-DUP-999
    transactionReference: "TXN-SYN-2024-DUP-999",
    parcelId: "SYN-PARCEL-105-DUPREF",
    sellerName: "Nasir Uddin",
    sellerId: "SYN-NID-5001",
    buyerName: "Parvez Hasan",
    buyerId: "SYN-NID-5003",
    amount: 1300000,
    transactionDate: new Date("2026-09-01T10:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-DUPREF",
  };

  // Scenario F: Conflicting or Incomplete Historical Records Requiring Manual Review
  const scenarioF_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-106",
      parcelId: "SYN-PARCEL-106-FLAGGED",
      deedNumber: "SYN-DEED-2017-106",
      ownerName: "Omar Farooq",
      ownerNationalId: "SYN-NID-6001",
      areaSqFt: 7500,
      status: "FLAGGED", // Flagged parcel status!
      recordHash: computeLandRecordHash({
        parcelId: "SYN-PARCEL-106-FLAGGED",
        deedNumber: "SYN-DEED-2017-106",
        ownerName: "Omar Farooq",
        ownerNationalId: "SYN-NID-6001",
        areaSqFt: 7500,
        boundaryGeoJson: null,
        previousHash: null,
      }),
      previousHash: null,
      createdAt: new Date("2017-03-01T09:00:00Z"),
    },
    transactions: [],
    registrations: [],
    mutations: [],
  };

  const scenarioF_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-FLAGGED",
    parcelId: "SYN-PARCEL-106-FLAGGED",
    sellerName: "Omar Farooq",
    sellerId: "SYN-NID-6001",
    buyerName: "Quazi Rashed",
    buyerId: "SYN-NID-6002",
    amount: 3000000,
    transactionDate: new Date("2026-09-10T12:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-FLAGGED",
  };

  // Scenario G: Unindexed Legacy Record without Cryptographic Reference Hash
  const scenarioG_parcel: HistoricalParcelData = {
    parcel: {
      id: "cl-syn-parcel-107",
      parcelId: "SYN-PARCEL-107-NOHASH",
      deedNumber: "SYN-DEED-2015-107",
      ownerName: "Rashid Ahmed",
      ownerNationalId: "SYN-NID-7001",
      areaSqFt: 3200,
      boundaryGeoJson: null,
      status: "ACTIVE",
      recordHash: "", // Deliberately unassigned to demonstrate missing cryptographic reference hash
      previousHash: null,
      createdAt: new Date("2015-05-10T10:00:00Z"),
    },
    transactions: [],
    registrations: [],
    mutations: [],
  };

  const scenarioG_proposed: ProposedTransactionPayload = {
    transactionReference: "TXN-SYN-2026-PROP-NOHASH",
    parcelId: "SYN-PARCEL-107-NOHASH",
    sellerName: "Rashid Ahmed",
    sellerId: "SYN-NID-7001",
    buyerName: "Salma Khatun",
    buyerId: "SYN-NID-7002",
    amount: 1400000,
    transactionDate: new Date("2026-09-15T10:00:00Z"),
    deedNumber: "SYN-DEED-2026-PROP-NOHASH",
  };

  return {
    A: {
      id: "scenario-a",
      code: "A",
      title: "Consistent Ownership History",
      description: "Proposed transaction submitted by verified reconstructed titleholder with complete registered and mutated provenance.",
      historicalData: scenarioA_parcel,
      proposedTransaction: scenarioA_proposed,
      expectedStatus: "CLEAR",
      expectedRuleCodes: [],
    },
    B: {
      id: "scenario-b",
      code: "B",
      title: "Second Proposed Sale Conflicting with Existing Registered Transfer (Double-Selling)",
      description: "Previous owner already conveyed title via registered transfer, but attempts a duplicate subsequent conveyance.",
      historicalData: scenarioB_parcel,
      proposedTransaction: scenarioB_proposed,
      expectedStatus: "CONFLICT_DETECTED",
      expectedRuleCodes: ["LG-RULE-001-DOUBLE-SELLING", "LG-RULE-002-SELLER-MISMATCH"],
    },
    C: {
      id: "scenario-c",
      code: "C",
      title: "Seller–Recorded-Owner Mismatch",
      description: "Proposed seller has no recorded title chain connection to the parcel.",
      historicalData: scenarioC_parcel,
      proposedTransaction: scenarioC_proposed,
      expectedStatus: "CONFLICT_DETECTED",
      expectedRuleCodes: ["LG-RULE-002-SELLER-MISMATCH"],
    },
    D: {
      id: "scenario-d",
      code: "D",
      title: "Registration–Mutation Mismatch",
      description: "Deed was registered, but corresponding revenue mutation was rejected by the revenue office.",
      historicalData: scenarioD_parcel,
      proposedTransaction: scenarioD_proposed,
      expectedStatus: "REVIEW_REQUIRED",
      expectedRuleCodes: ["LG-RULE-004-REG-MUTATION-MISMATCH"],
    },
    E: {
      id: "scenario-e",
      code: "E",
      title: "Duplicate Transaction Reference",
      description: "Transaction reference is identical to an existing recorded transaction.",
      historicalData: scenarioE_parcel,
      proposedTransaction: scenarioE_proposed,
      expectedStatus: "CONFLICT_DETECTED",
      expectedRuleCodes: ["LG-RULE-003-DUPLICATE-TXN-REF"],
    },
    F: {
      id: "scenario-f",
      code: "F",
      title: "Conflicting or Incomplete Historical Records (Flagged Status)",
      description: "Parcel has an active flagged/disputed status in the registry.",
      historicalData: scenarioF_parcel,
      proposedTransaction: scenarioF_proposed,
      expectedStatus: "REVIEW_REQUIRED",
      expectedRuleCodes: ["LG-RULE-005-HISTORY-INCONSISTENCY"],
    },
    G: {
      id: "scenario-g",
      code: "G",
      title: "Unindexed Legacy Record (Missing Reference Hash)",
      description: "Synthetic record created without a cryptographic reference hash in the ledger, demonstrating tamper Scenario C.",
      historicalData: scenarioG_parcel,
      proposedTransaction: scenarioG_proposed,
      expectedStatus: "CLEAR",
      expectedRuleCodes: [],
    },
  };
}
