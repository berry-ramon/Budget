/* =========================================================
   WEBAUTHN — platform authenticator (fingerprint / face)
   ---------------------------------------------------------
   Same TS 5.7+ rule as crypto.ts: every Uint8Array passed
   to navigator.credentials must be backed by a concrete
   ArrayBuffer, not ArrayBufferLike.
   ========================================================= */

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)));
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  if (!window.isSecureContext) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric(): Promise<string | null> {
  if (!(await isBiometricAvailable())) return null;

  const challenge = randomBytes(32);
  const userId = randomBytes(16);

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Pocket Plan" },
        user: {
          id: userId,
          name: "pocket-plan-user",
          displayName: "Pocket Plan",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) return null;
    return bufToB64(credential.rawId);
  } catch {
    return null;
  }
}

export async function verifyBiometric(
  credentialIdB64: string,
): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;

  const challenge = randomBytes(32);

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { id: b64ToBuf(credentialIdB64), type: "public-key" },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return assertion !== null;
  } catch {
    return false;
  }
}
