const KEY_ALGORITHM: EcKeyGenParams = {
    name: "ECDSA",
    namedCurve: "P-256",
};

const SIGNATURE_ALGORITHM: EcdsaParams = {
    name: "ECDSA",
    hash: "SHA-256",
};

const MAX_MESSAGE_BYTES = 64 * 1024;
const P256_SIGNATURE_BYTES = 64;
const encoder = new TextEncoder();

function encodeMessage(message: string): Uint8Array<ArrayBuffer> {
    const bytes = encoder.encode(message);
    if (bytes.byteLength > MAX_MESSAGE_BYTES) {
        throw new Error("The message is too long. This demo is limited to 64 KiB of UTF-8 text.");
    }
    return bytes;
}

export async function createSigningKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(KEY_ALGORITHM, false, ["sign", "verify"]);
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<JsonWebKey> {
    return crypto.subtle.exportKey("jwk", publicKey);
}

export async function signMessage(message: string, privateKey: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
    const signature = await crypto.subtle.sign(SIGNATURE_ALGORITHM, privateKey, encodeMessage(message));
    return new Uint8Array(signature);
}

export async function verifyMessage(
    message: string,
    signature: Uint8Array<ArrayBuffer>,
    publicKey: CryptoKey,
): Promise<boolean> {
    if (signature.byteLength !== P256_SIGNATURE_BYTES) return false;
    return crypto.subtle.verify(SIGNATURE_ALGORITHM, publicKey, signature, encodeMessage(message));
}
