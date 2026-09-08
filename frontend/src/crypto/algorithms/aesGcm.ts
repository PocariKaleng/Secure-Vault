import {
    DEFAULT_PBKDF2_ITERATIONS,
    deriveAesGcmKeyFromPassword,
} from "../kdf/pbkdf2";

export const AES_GCM_SALT_SIZE = 16;
export const AES_GCM_NONCE_SIZE = 12;

function randomBytes(size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    window.crypto.getRandomValues(bytes);
    return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
}

export type AesGcmEncryptResult = {
    ciphertext: Uint8Array;
    salt: Uint8Array;
    nonce: Uint8Array;
    iterations: number;
};

export async function encryptAesGcm(
    plaintext: ArrayBuffer,
    password: string
): Promise<AesGcmEncryptResult> {
    const salt = randomBytes(AES_GCM_SALT_SIZE);
    const nonce = randomBytes(AES_GCM_NONCE_SIZE);
    const iterations = DEFAULT_PBKDF2_ITERATIONS;

    const key = await deriveAesGcmKeyFromPassword(password, salt, iterations);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: toArrayBuffer(nonce),
        },
        key,
        plaintext
    );

    return {
        ciphertext: new Uint8Array(ciphertext),
        salt,
        nonce,
        iterations,
    };
}

export async function decryptAesGcm(
    ciphertext: Uint8Array,
    password: string,
    salt: Uint8Array,
    nonce: Uint8Array,
    iterations: number,
    additionalData?: Uint8Array
): Promise<ArrayBuffer> {
    const key = await deriveAesGcmKeyFromPassword(password, salt, iterations);

    return window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: toArrayBuffer(nonce),
            ...(additionalData ? { additionalData: toArrayBuffer(additionalData) } : {}),
            tagLength: 128,
        },
        key,
        toArrayBuffer(ciphertext)
    );
}
