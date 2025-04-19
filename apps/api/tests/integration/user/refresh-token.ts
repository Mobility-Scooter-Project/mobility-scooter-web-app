import { HTTP_CODES } from "@src/config/http-codes";
import { SHARED_DATA } from "@tests/config/constants";
import { client } from "@tests/lib/client";

export default () => describe("Refresh Token", () => {
    // refresh-token.http
    it("should refresh the token", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
        }

        const response = await client.api.v1.auth.emailpass.$post({
            json,
        });

        const { data, error } = await response.json();
        expect(response.status).toBe(HTTP_CODES.OK);
        expect(data).toBeDefined();
        expect(data.refreshToken).toBeDefined();
        expect(error).toBeNull();

        const { refreshToken } = data;

        const refreshJson = {
            token: refreshToken,
        }

        const refreshResponse = await client.api.v1.auth.refresh.$post({
            json: refreshJson,
        });

        expect(refreshResponse.status).toBe(HTTP_CODES.OK);
    });

    it("should return 401 when the token is invalid", async () => {
        const json = {
            token: "invalidtoken",
        };

        const response = await client.api.v1.auth.refresh.$post({
            json,
        });

        expect(response.status).toBe(HTTP_CODES.UNAUTHORIZED);
    });
});