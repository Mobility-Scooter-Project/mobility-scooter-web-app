import { KEYSTONE_CLIENT_ID, KEYSTONE_CLIENT_SECRET, KEYSTONE_URL } from "@src/config/constants";
import logger from "@src/lib/logger";
import axios, { AxiosInstance } from "axios";
import { injectable } from "inversify";

@injectable()
export class KeystoneService {
    private _client: AxiosInstance;

    public constructor() {
        this._client = axios.create({
            baseURL: KEYSTONE_URL,
            headers: {
                "Content-Type": "application/json",
            }
        });
    }

    public async getAuthToken() {
        const body = {
            "auth": {
                "identity": {
                    "methods": [
                        "application_credential"
                    ],
                    "application_credential": {
                        "id": KEYSTONE_CLIENT_ID,
                        "secret": KEYSTONE_CLIENT_SECRET
                    }
                }
            }
        }

        logger.debug(`Request body: ${JSON.stringify(body)}`);

        try {
            const response = await this._client.post("auth/tokens", body);
            return response.headers["x-subject-token"];
        } catch (error) {
            throw new Error(`Failed to get auth token: ${error}`);
        }
    }
}