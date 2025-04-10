import { Form } from "react-router";
import type { Route } from "../+types/root";
import { parseFormData, type FileUpload } from "@mjackson/form-data-parser";
import * as crypto from "node:crypto"

enum ENCRYPTION {
    ALGORITHM = "aes-256-cbc", // mandated for HIPPA compliance
    ITERATIONS = 100000,
    KEY_LENGTH = 32,
    IV_LENGTH = 16,
    DIGEST = "sha256"
}

const uploadHandler = async (fileUpload: FileUpload) => {
    // cryptography
    const secret = crypto.randomBytes(ENCRYPTION.KEY_LENGTH).toString('hex');
    const salt = crypto.randomBytes(32).toString('hex');

    const keyBuffer = crypto.pbkdf2Sync(secret, salt, ENCRYPTION.ITERATIONS, ENCRYPTION.KEY_LENGTH, ENCRYPTION.DIGEST);
    const key = keyBuffer.toString('hex');
    const iv = keyBuffer.subarray(0, ENCRYPTION.IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION.ALGORITHM, keyBuffer, iv);

    // TODO: upload key to vault
    // TODO: encryption


}

export async function action({ request }: Route.ActionArgs) {
    await parseFormData(request, uploadHandler);
}

export default function Upload() {
    return (
        <div className="h-screen flex items-center justify-center">
            <Form encType="multipart/form-data" method="post" className="w-full max-w-md">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold">Upload File</h1>
                    <input type="file" name="file" accept="video/mp4" className="border p-2 rounded" />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded">Upload</button>
                </div>
            </Form>
        </div>
    );
}