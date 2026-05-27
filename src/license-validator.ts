import nacl from "tweetnacl";

// ─── PUBLIC KEY ───────────────────────────────────────────────────
// tweetnacl public key — derived from seed d91511a76533b960b3a84f3fa804cd11eddb552cd47e401d35b94ebf8b3a0991
const PUBLIC_KEY_HEX = "3d784076b39d7444be604da1d4eb07de544c25b4ce34d4a0b87678f49768377f";
// ─── REVOKED LICENSES ─────────────────────────────────────────────
const REVOKED_LICENSES: string[] = [];

export interface LicensePayload {
  email: string;
  purchaseId: string;
  purchaseDate: string;
  tier: "pro";
  productId: string;
}

export interface LicenseValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function validateLicense(
  licenseKey: string,
  email: string
): Promise<LicenseValidationResult> {
  try {
    if (!licenseKey || !email) {
      return { valid: false, error: "License key and email are required." };
    }

    let decoded: string;
    try {
      decoded = atob(licenseKey.trim());
    } catch {
      return { valid: false, error: "Invalid license key format." };
    }

    let licenseData: { payload: LicensePayload; signature: string };
    try {
      licenseData = JSON.parse(decoded);
    } catch {
      return { valid: false, error: "Invalid license key structure." };
    }

    const { payload, signature } = licenseData;

    if (!payload || !signature) {
      return { valid: false, error: "Malformed license key." };
    }

    if (payload.productId !== "literature-review-synthesizer") {
      return { valid: false, error: "This license is for a different product." };
    }

    if (payload.email.toLowerCase() !== email.toLowerCase().trim()) {
      return {
        valid: false,
        error: "Email address does not match this license key.",
      };
    }

    if (REVOKED_LICENSES.includes(payload.purchaseId)) {
      return { valid: false, error: "This license has been revoked." };
    }

    // Verify using tweetnacl detached signature verification
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(PUBLIC_KEY_HEX);

    const isValid = nacl.sign.detached.verify(
      payloadBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return { valid: false, error: "License signature is invalid." };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return {
      valid: false,
      error: `Validation error: ${err?.message || "Unknown error"}`,
    };
  }
}