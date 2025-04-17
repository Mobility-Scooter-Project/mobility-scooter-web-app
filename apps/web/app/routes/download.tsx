import { API_BASE_URL } from "~/config/constants";


export default function Download() {
    return <div>
        <video src={`${API_BASE_URL}/api/v1/storage/videos/12345678/Test.mp4`} controls id="video" />
    </div>
}
