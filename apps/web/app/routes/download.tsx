import { useLoaderData } from "react-router";
import { getApiClient } from "~/lib/api";

export async function loader() {
    const client = getApiClient({ "X-User": process.env.TESTING_USER_JWT });
    const res = await client.api.v1.storage["presigned-url"].$post({
        json: {
            filePath: "videos/Test.mp4",
            patientId: "12345678",
        },
    });

    return await res.json();
}


export default function Download() {
    const { data, error } = useLoaderData<typeof loader>();

    return <div>
        <video src={data.url} controls id="video" />
    </div>
}
