import * as crypto from "node:crypto"

/**
 * Generates encryption headers based on the provided hexadecimal encryption key.
 *
 * The function performs the following operations:
 * - Computes the MD5 hash of the input encryption key.
 * - Encodes the original encryption key into Base64.
 * - Encodes the MD5 hash of the encryption key into Base64.
 *
 * @param encryptionKey - The encryption key as a hexadecimal string.
 * @returns An object containing:
 * - encryptionKeyBase64: The original encryption key encoded in Base64.
 * - encryptionKeyMd5Base64: The MD5 hash of the encryption key encoded in Base64.
 */
const getEncryptionHeaders = (encryptionKey: string) => {
    const encryptionKeyMd5 = crypto.hash(
        "md5",
        Buffer.from(encryptionKey, "hex"),
    );
    const encryptionKeyBase64 = Buffer.from(encryptionKey, "hex").toString(
        "base64",
    );
    const encryptionKeyMd5Base64 = Buffer.from(
        encryptionKeyMd5,
        "hex",
    ).toString("base64");

    return {
        encryptionKeyBase64,
        encryptionKeyMd5Base64,
    }

}

export const cryptoUtils = {
    getEncryptionHeaders,
}