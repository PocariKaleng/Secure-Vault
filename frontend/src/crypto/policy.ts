export const MAX_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_METADATA_BYTES = 64 * 1024;
export const MAX_SECURE_FILE_BYTES = MAX_FILE_BYTES + 2 * MAX_METADATA_BYTES + 64;
export const PASSWORD_HINT = "Use at least 15 characters with a unique passphrase or a random password from a password manager.";

export function assertNewPassword(password: string): void {
    const characters = Array.from(password);
    const normalized = password.toLowerCase().replace(/[\s\p{P}\p{S}\d]/gu, "");
    const common = ["password", "passwordpassword", "qwerty", "qwertyuiop", "admin", "administrator", "letmein", "iloveyou", "securevault"];
    if (characters.length < 15 || new Set(characters).size < 5 ||
        /^(.{1,4})\1+$/u.test(password) || common.includes(normalized)) {
        throw new Error(PASSWORD_HINT);
    }
    if (new TextEncoder().encode(password).length > 1024) {
        throw new Error("Passwords are limited to 1,024 UTF-8 bytes.");
    }
}

export function assertFileSize(file: Blob, encrypted = false): void {
    if (file.size > (encrypted ? MAX_SECURE_FILE_BYTES : MAX_FILE_BYTES)) {
        throw new Error("The file is too large. Original files are limited to 32 MiB; .secure archives include a small metadata allowance.");
    }
}
