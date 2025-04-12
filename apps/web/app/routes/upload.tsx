import { Form, type ActionFunctionArgs } from "react-router";
import { FileUpload, parseFormData } from "@mjackson/form-data-parser";
import { getApiClient } from "~/lib/api";
import * as crypto from "node:crypto"

const uploadHandler = async (fileUpload: FileUpload) => {
    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT });
    const presignedURL = await client.api.v1.storage.videos["presigned-url"].$post({
        json: {
            date: new Date(),
            patientId: "1234",
            filename: `Test.mp4`
        }
    })
    const { data, error } = await presignedURL.json();

    const algorithm = "aes-256-cbc"
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(data.encryptionKey, 'hex'), Buffer.from(data.encryptionIv, 'hex'));

    const encryptionTransform = new TransformStream<Buffer, Buffer>({
        async transform(chunk, controller) {
            //const encryptedChunk = cipher.update(chunk);
            controller.enqueue(chunk);
        },
        flush() {
        }
    })

    let partNumber = 1;
    const fetchWriteStream = new WritableStream<Buffer>({
        async write(chunk) {
            const url = `${data.url}&partNumber=${partNumber}`
            const res = await fetch(url, {
                method: "PUT",
                body: chunk
            })
            if (partNumber == 1) {
                console.log(url)
                console.log(await res.text())
            }
            partNumber += 1
        }
    })

    const fileStream = fileUpload.stream();
    await fileStream.pipeThrough(encryptionTransform).pipeTo(fetchWriteStream);
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