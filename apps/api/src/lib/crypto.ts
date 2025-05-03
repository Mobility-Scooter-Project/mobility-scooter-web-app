import * as crypto from "node:crypto"

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