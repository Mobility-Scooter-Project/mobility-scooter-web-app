import { Form, type ActionFunctionArgs } from "react-router";
import { FileUpload, parseFormData } from "@mjackson/form-data-parser";
import { getApiClient } from "~/lib/api";
import * as crypto from "node:crypto";

const uploadHandler = async (fileUpload: FileUpload) => {
    const fileStream = fileUpload.stream()
    const blob = await new Response(fileStream).blob();

    return new File([blob], fileUpload.name, {
        type: fileUpload.type,
    });
};


export async function action({ request }: ActionFunctionArgs) {
    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT });

    const presignedURL = await client.api.v1.storage.videos["presigned-url"].$post({
        json: {
            patientId: '12345678',
            filename: 'Test.mp4',
        }
    })

    const { data, error } = await presignedURL.json();

    const formData = await parseFormData(request, uploadHandler);
    const file = formData.get("file");

    const algorithm = "AES256";
    const { encryptionKey, encryptionKeyMd5, url } = data;


    const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
            "X-Amz-Server-Side-Encryption-Customer-Algorithm": algorithm,
            "X-Amz-Server-Side-Encryption-Customer-Key": encryptionKey,
            "X-Amz-Server-Side-Encryption-Customer-Key-MD5": encryptionKeyMd5,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to upload file: ${errorText}`);
        return;
    }
    console.info("File uploaded successfully!");
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