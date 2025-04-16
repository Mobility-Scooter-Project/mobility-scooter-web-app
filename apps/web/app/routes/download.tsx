import { useLoaderData } from "react-router";
import { getApiClient } from "~/lib/api";
import * as crypto from "node:crypto";
import { useRef } from "react";
import useHasMounted from "~/hooks/useHasMounted";

export async function loader() {
    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT });
    const presignedURL = await client.api.v1.storage.videos["presigned-url"][":patientId"][":filename"].$get({
        param: {
            patientId: '1234567',
            filename: `Test.mp4`
        }
    });

    const { data, error } = await presignedURL.json();

    if (error) {
        throw new Error(error);
    }
    if (!data) {
        throw new Error("No data");
    }
    const algorithm = "aes-256-cbc";
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(data.encryptionKey, 'hex'), Buffer.from(data.encryptionIv, 'hex'));

    const decryptionTransform = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            // Convert Uint8Array chunk to Buffer for decipher
            const bufferChunk = Buffer.from(chunk);
            const decryptedChunk = decipher.update(bufferChunk);
            // Enqueue the decrypted chunk as Uint8Array
            controller.enqueue(new Uint8Array(decryptedChunk));
        },
        flush(controller) {
            try {
                controller.terminate();
            } catch (e) {
                // Handle potential error during finalization (e.g., bad padding)
                console.error("Decryption finalization error:", e);
                controller.error(e);
            }
        }
    });


    const encryptedStream = (await fetch(data.url)).body;
    if (!encryptedStream) {
        throw new Error("No stream");
    }

    const fileStream = encryptedStream.pipeThrough(decryptionTransform);
    const blob = await new Response(fileStream).blob();
    const url = URL.createObjectURL(new File([blob], "Test.mp4", { type: "video/mp4" }));
    console.log("URL", url);

    return {
        data: {
            url
        },
        error: null,
    }
}

export default function Download() {
    const { data, error } = useLoaderData<typeof loader>();

    return <div>
        <a href={data.url} download>Download</a>
    </div>
}
