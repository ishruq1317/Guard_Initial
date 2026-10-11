import crypto from "crypto";

/**
 * Deterministically serialize data to a string representation for consistent cryptographic hashing.
 */
export function canonicalStringify(data: unknown): string {
  if (data === null || typeof data !== "object") {
    return JSON.stringify(data);
  }

  if (data instanceof Date) {
    return JSON.stringify(data.toISOString());
  }

  if (Array.isArray(data)) {
    return `[${data.map(canonicalStringify).join(",")}]`;
  }

  const keys = Object.keys(data as Record<string, unknown>).sort();
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify((data as Record<string, unknown>)[key])}`
  );
  return `{${entries.join(",")}}`;
}

/**
 * Generates a SHA-256 hex digest for arbitrary input string or structured object data.
 */
export function generateSha256(data: unknown): string {
  const serialized = typeof data === "string" ? data : canonicalStringify(data);
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
}

/**
 * Verifies whether input data matches an expected SHA-256 hash digest.
 */
export function verifySha256(data: unknown, expectedHash: string): boolean {
  const calculatedHash = generateSha256(data);
  // Constant-time comparison to prevent timing attacks
  if (calculatedHash.length !== expectedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash, "utf8"),
    Buffer.from(expectedHash, "utf8")
  );
}
