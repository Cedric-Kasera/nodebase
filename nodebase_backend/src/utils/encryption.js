import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key as a Buffer (32 bytes for AES-256).
 */
const getKey = () => {
  const hex = env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a compact string: iv:authTag:ciphertext  (all hex-encoded).
 */
export const encrypt = (plaintext) => {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypt a value previously encrypted with `encrypt()`.
 * Expects input format: iv:authTag:ciphertext  (all hex-encoded).
 */
export const decrypt = (encryptedString) => {
  const key = getKey();
  const [ivHex, authTagHex, ciphertext] = encryptedString.split(":");

  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error("Invalid encrypted value format.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
