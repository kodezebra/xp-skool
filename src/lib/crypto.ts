/**
 * Cryptographic utilities for password hashing and verification.
 * Uses PBKDF2 with random salt via the Web Crypto API.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const HASH_ALGORITHM = "SHA-256";

function getSubtleCrypto(): SubtleCrypto {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API is not available");
  }
  return window.crypto.subtle;
}

function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const encoder = new TextEncoder();

  const keyMaterial = await getSubtleCrypto().importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await getSubtleCrypto().deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(salt.buffer),
  };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const saltBuffer = hexToBuffer(salt);

  const keyMaterial = await getSubtleCrypto().importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await getSubtleCrypto().deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const computedHash = bufferToHex(derivedBits);
  return computedHash === hash;
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}
