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

    /**
     * Retrieves an authentication token from the Keystone service using application credentials.
     * 
     * This method authenticates with the Keystone identity service by sending application
     * credentials (client ID and secret) and returns the X-Subject-Token from the response
     * headers which can be used for subsequent API calls.
     * 
     * @returns {Promise<string>} A promise that resolves to the authentication token string
     * @throws {Error} Throws an error if the authentication request fails or if the token
     *                 cannot be retrieved from the response headers
     * 
     * @example
     * ```typescript
     * const authService = new KeystoneAuthService();
     * try {
     *   const token = await authService.getAuthToken();
     *   console.log('Auth token:', token);
     * } catch (error) {
     *   console.error('Authentication failed:', error.message);
     * }
     * ```
     */
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