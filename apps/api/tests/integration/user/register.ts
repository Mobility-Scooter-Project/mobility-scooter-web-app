import { HTTP_CODES } from "@src/config/http-codes";
import { SHARED_DATA } from "@tests/config/constants";
import { client } from "@tests/lib/client";

const NEW_USER_BODY = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
    firstName: SHARED_DATA.FIRST_NAME,
    lastName: SHARED_DATA.LAST_NAME,
    unitId: SHARED_DATA.TESTING_UNIT_ID,
}

// create-user-emailpass.http
export default () => describe("Register User", () => {
    it("should create a new user", async () => {

        const response = await client.api.v1.auth.emailpass.register.$post(
            {
                json: NEW_USER_BODY,
            }
        )

        expect(response.status).toBe(HTTP_CODES.OK);
    });

    it("should return 409 when an existing email is used", async () => {
        const response = await client.api.v1.auth.emailpass.register.$post(
            {
                json: NEW_USER_BODY,
            }
        );

        expect(response.status).toBe(HTTP_CODES.CONFLICT);
    });

    it("should return 409 when the rate limit is exceeded", async () => {
        const statuses = await Promise.all(
            Array.from({ length: 51 }).map(() =>
                client.api.v1.auth.emailpass.register.$post({
                    json: NEW_USER_BODY,
                }).then((r) => r.status),
            ),
        );

        expect(statuses.includes(HTTP_CODES.CONFLICT)).toBe(true);
    });

    it("should return 400 when the email is invalid", async () => {
        const json = {
            email: "invalidemail",
            password: SHARED_DATA.PASSWORD,
            firstName: SHARED_DATA.FIRST_NAME,
            lastName: SHARED_DATA.LAST_NAME,
            unitId: SHARED_DATA.TESTING_UNIT_ID,
        };

        const response = await client.api.v1.auth.emailpass.register.$post(
            {
                json,
            });

        expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
    });

    describe("Password", () => {
        it("should return 400 when password is too short", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: "abc",
                firstName: SHARED_DATA.FIRST_NAME,
                lastName: SHARED_DATA.LAST_NAME,
                unitId: SHARED_DATA.TESTING_UNIT_ID,
            };

            const response = await client.api.v1.auth.emailpass.register.$post(
                {
                    json,
                });

            expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
        });

        it("should return 400 when password is too long", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: "a".repeat(65),
                firstName: SHARED_DATA.FIRST_NAME,
                lastName: SHARED_DATA.LAST_NAME,
                unitId: SHARED_DATA.TESTING_UNIT_ID,
            };

            const response = await client.api.v1.auth.emailpass.register.$post(
                {
                    json,
                });

            expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
        });

        it("should return 400 when password contains sequential characters", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: "abcd1234",
                firstName: SHARED_DATA.FIRST_NAME,
                lastName: SHARED_DATA.LAST_NAME,
                unitId: SHARED_DATA.TESTING_UNIT_ID,
            };

            const response = await client.api.v1.auth.emailpass.register.$post(
                {
                    json,
                });

            expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
        });

        it("should return 400 when password contains repeated characters", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: "aaaaaaaa",
                firstName: SHARED_DATA.FIRST_NAME,
                lastName: SHARED_DATA.LAST_NAME,
                unitId: SHARED_DATA.TESTING_UNIT_ID,
            };

            const response = await client.api.v1.auth.emailpass.register.$post(
                {
                    json,
                });

            expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
        });

        it("should return 400 when password is a common dictionary word", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: "cheeseburger",
                firstName: SHARED_DATA.FIRST_NAME,
                lastName: SHARED_DATA.LAST_NAME,
                unitId: process.env.TESTING_UNIT_ID!,
            };

            const response = await client.api.v1.auth.emailpass.register.$post(
                {
                    json,
                });

            expect(response.status).toBe(HTTP_CODES.BAD_REQUEST);
        });
    });
});
