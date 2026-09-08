export const DEFAULT_PBKDF2_ITERATIONS = 600_000;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
}

export async function deriveAesGcmKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
    if (!window.crypto?.subtle) {
        throw new Error("The Web Crypto API is not available in this browser.");
    }

    const encoder = new TextEncoder();

    const passwordKey = await window.crypto.subtle.importKey(
        "raw",
        toArrayBuffer(encoder.encode(password)),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: toArrayBuffer(salt),
            iterations,
            hash: "SHA-256",
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        ["encrypt", "decrypt"]
    );
}
