import { z } from "zod";

export const LandRecordInputSchema = z.object({
  parcelId: z
    .string()
    .min(3, "Parcel ID must be at least 3 characters")
    .max(50, "Parcel ID cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Parcel ID must be alphanumeric and may contain hyphens/underscores"),
  deedNumber: z
    .string()
    .min(3, "Deed number must be at least 3 characters")
    .max(50, "Deed number cannot exceed 50 characters"),
  ownerName: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name cannot exceed 100 characters"),
  ownerNationalId: z
    .string()
    .min(4, "National ID must be at least 4 characters")
    .max(30, "National ID cannot exceed 30 characters"),
  areaSqFt: z
    .number()
    .positive("Area in square feet must be greater than zero"),
  boundaryGeoJson: z.string().optional(),
});

export const TransactionInputSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  sellerName: z.string().min(2, "Seller name must be at least 2 characters"),
  sellerId: z.string().min(4, "Seller national ID is required"),
  buyerName: z.string().min(2, "Buyer name must be at least 2 characters"),
  buyerId: z.string().min(4, "Buyer national ID is required"),
  amount: z.number().positive("Transaction amount must be positive"),
});

export const ProposedTransactionRequestSchema = z.object({
  transactionReference: z
    .string()
    .min(3, "Transaction reference must be at least 3 characters")
    .max(64, "Transaction reference cannot exceed 64 characters"),
  parcelId: z
    .string()
    .min(3, "Parcel ID must be at least 3 characters")
    .max(50, "Parcel ID cannot exceed 50 characters"),
  sellerName: z
    .string()
    .min(2, "Seller name must be at least 2 characters")
    .max(100, "Seller name cannot exceed 100 characters"),
  sellerId: z
    .string()
    .min(4, "Seller national ID must be at least 4 characters")
    .max(30, "Seller national ID cannot exceed 30 characters"),
  buyerName: z
    .string()
    .min(2, "Buyer name must be at least 2 characters")
    .max(100, "Buyer name cannot exceed 100 characters"),
  buyerId: z
    .string()
    .min(4, "Buyer national ID must be at least 4 characters")
    .max(30, "Buyer national ID cannot exceed 30 characters"),
  amount: z
    .number()
    .positive("Transaction amount must be positive"),
  transactionDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .transform((val) => new Date(val)),
  deedNumber: z.string().optional(),
});

export type LandRecordInput = z.infer<typeof LandRecordInputSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type ProposedTransactionRequest = z.infer<typeof ProposedTransactionRequestSchema>;
