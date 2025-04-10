import { Form, type ActionFunctionArgs } from "react-router";
import { FileUpload, parseFormData } from "@mjackson/form-data-parser";
import * as crypto from "node:crypto"
import { exit } from "node:process";

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

    const fileStream = fileUpload.stream();

    const encryptionStream = new TransformStream<Buffer, Buffer>({
        start() {},
        async transform(chunk, controller){
            const encryptedChunk = cipher.update(chunk);
            controller.enqueue(encryptedChunk);
        },
        flush() {
            cipher.final();
        }
    })

    const putStream = new WritableStream<Buffer>({
        write(chunk) {
            
        }
    });

    fileStream.pipeThrough(encryptionStream).pipeTo(putStream)
}

export async function action({ request }: ActionFunctionArgs) {
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