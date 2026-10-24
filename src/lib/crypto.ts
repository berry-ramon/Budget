/* =========================================================
   PIN HASHING — PBKDF2 with 200,000 iterations
   ---------------------------------------------------------
   TS 5.7+ types: Uint8Array is generic over its buffer.
   crypto.subtle methods require a NON-SHARED ArrayBuffer.
   Always construct via `new Uint8Array(new ArrayBuffer(n))`.
   ========================================================= */

const ITERATIONS = 200_000;

/* Explicitly-typed random byte helper — guarantees ArrayBuffer */
function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)));
}

/* Base64 <-> Uint8Array — always backed by a concrete ArrayBuffer */
function bytesToB64(bytes: Uint8Array<ArrayBuffer> | ArrayBuffer): string {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let str = "";
  for (let i = 0; i < view.length; i++) str += String.fromCharCode(view[i]);
  return btoa(str);
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function hashPin(
  pin: string,
  salt?: Uint8Array<ArrayBuffer>,
): Promise<{ hash: string; salt: string }> {
  if (!crypto.subtle) {
    throw new Error(
      "PIN setup requires HTTPS. Please open the app over a secure connection.",
    );
  }

  /* Always allocate a concrete ArrayBuffer — never ArrayBufferLike */
  const saltBytes: Uint8Array<ArrayBuffer> = salt
    ? new Uint8Array(salt)
    : randomBytes(16);

  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin) as Uint8Array<ArrayBuffer>;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    pinBytes,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return {
    hash: bytesToB64(new Uint8Array(derivedBits)),
    salt: bytesToB64(saltBytes),
  };
}

export async function verifyPin(
  pin: string,
  expectedHash: string,
  saltB64: string,
): Promise<boolean> {
  try {
    const salt = b64ToBytes(saltB64);
    const { hash } = await hashPin(pin, salt);
    return hash === expectedHash;
  } catch {
    return false;
  }
}
