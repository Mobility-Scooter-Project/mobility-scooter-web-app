import { Form, type ActionFunctionArgs } from "react-router";
import { parseFormData } from "@mjackson/form-data-parser";
import { getApiClient } from "~/lib/api";
import { uploadHandler } from "~/lib/upload";

export async function action({ request }: ActionFunctionArgs) {

    const formData = await parseFormData(request, uploadHandler);
    const object = formData.get("file") as File;

    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT, "Content-Length": object.size.toString() });
    const bucketName = "web-bucket";
    const filePath = encodeURIComponent(`videos/Test.mp4`);

    const res = await client.api.v1.storage[":bucketName"][":filePath"].$put({
        param: {
            bucketName,
            filePath
        },
    }, {
        init: {
            body: object,
        }
    })

    console.log("Response from upload:", await res.json());

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