import { HTTP_CODES } from "@src/config/http-codes";
import { SHARED_DATA } from "@tests/config/constants";
import { client } from "@tests/lib/client";

// login-user-emailpass.http
export default () => describe("Login", () => {
    let refreshToken: string = "";

    it("should login the user", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
        };

        const response = await client.api.v1.auth.emailpass.$post({
            json,
        });

        expect(response.status).toBe(HTTP_CODES.OK);
        refreshToken = (await response.json()).data.refreshToken;
    });

    it("should return 401 when the password is incorrect", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: "wrongpassword",
        };

        const response = await client.api.v1.auth.emailpass.$post({
            json,
        });

        expect(response.status).toBe(HTTP_CODES.UNAUTHORIZED);
    });

    it("should return 401 when the email is incorrect", async () => {
        const json = {
            email: "wrong@example.com",
            password: SHARED_DATA.PASSWORD,
        };

        const response = await client.api.v1.auth.emailpass.$post({
            json,
        });

        expect(response.status).toBe(HTTP_CODES.UNAUTHORIZED);
    });

});
