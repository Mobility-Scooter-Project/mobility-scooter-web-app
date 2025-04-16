import { Form, type ActionFunctionArgs } from "react-router";
import { FileUpload, parseFormData } from "@mjackson/form-data-parser";
import { getApiClient } from "~/lib/api";
import * as crypto from "node:crypto"

export async function action({ request }: ActionFunctionArgs) {
    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT });

    const presignedURL = await client.api.v1.storage.videos["presigned-url"].$post({
        json: {
            date: new Date(),
            patientId: '1234567',
            filename: `Test.mp4`
        }
    })

    const { data, error } = await presignedURL.json();

    const algorithm = "aes-256-cbc"
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(data.encryptionKey, 'hex'), Buffer.from(data.encryptionIv, 'hex'));

    const formData = await parseFormData(request, async (fileUpload: FileUpload) => {
        const fileStream = fileUpload.stream();

        const encryptionTransform = new TransformStream<Buffer, Buffer>({
            start() {
                console.log("Beginning encryption...")
            },
            async transform(chunk, controller) {
                if (!chunk) {
                    controller.terminate();
                }
                const encryptedChunk = cipher.update(chunk);
                controller.enqueue(encryptedChunk);
            },
            flush() {
                cipher.final();
                console.log('Encryption complete')
            }
        });

        // convert stream to a File object
        const encryptedStream = fileStream.pipeThrough(encryptionTransform);
        const blob = await new Response(encryptedStream).blob();

        return new File([blob], fileUpload.name, {
            type: fileUpload.type,
        });
    });

    const encryptedFile = formData.get("file");
    const res = await fetch(data.url, {
        method: "PUT",
        body: encryptedFile,
    });
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