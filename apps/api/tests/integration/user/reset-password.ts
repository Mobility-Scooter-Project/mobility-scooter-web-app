import { HTTP_CODES } from "@src/config/http-codes";
import { SHARED_DATA } from "@tests/config/constants";
import { client } from "@tests/lib/client";

export default () => describe("Reset Password", () => {
    let resetToken: string;

    it("should send a reset password email", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
        }

        const response = await client.api.v1.auth.emailpass["reset-password"].token.$post({
            json
        });

        expect(response.status).toBe(HTTP_CODES.OK);
        resetToken = (await response.json()).data.token;
    });

    it("should return 404 when the email is incorrect", async () => {
        const response = await client.api.v1.auth.emailpass["reset-password"].token.$post({
            json: {
                email: "wrongemail@example.com",
            }
        });

        expect(response.status).toBe(HTTP_CODES.NOT_FOUND);
    });

    it("should reset the password", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            token: resetToken,
        }

        const response = await client.api.v1.auth.emailpass["reset-password"].$post({
            json
        });

        expect(response.status).toBe(HTTP_CODES.OK);
    });

    it("should return 401 when the token is invalid", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            token: "invalidtoken",
        }

        const response = await client.api.v1.auth.emailpass["reset-password"].$post({
            json
        });

        expect(response.status).toBe(HTTP_CODES.UNAUTHORIZED);
    });

    it("should return 400 when the password is invalid", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: "short",
            token: resetToken,
        }
        const response = await client.api.v1.auth.emailpass["reset-password"].$post({
            json
        });

        expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
    });

    it("should return 429 when the rate limit is exceeded", async () => {
        const json = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            token: resetToken,
        }

        const statuses = await Promise.all(
            Array.from({ length: 4 }).map(() =>
                client.api.v1.auth.emailpass["reset-password"].$post({
                    json
                }).then((r) => r.status),
            ),
        );

        expect(statuses.includes(HTTP_CODES.RATE_LIMIT_EXCEEDED)).toBe(true);
    });
});