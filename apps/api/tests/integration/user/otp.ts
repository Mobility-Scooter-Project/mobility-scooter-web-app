import { HTTP_CODES } from "@src/config/http-codes";
import container, { KVSymbol } from "@src/lib/container";
import { SHARED_DATA, TESTING_API_KEY } from "@tests/config/constants";
import { client } from "@tests/lib/client";
import Redis from "ioredis";


export default () =>
    describe("OTP", () => {
        beforeEach(async () => {
            const kv = await container.getAsync<Redis>(KVSymbol);
            await kv.flushall();
        });

        it("should generate an OTP secret", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: SHARED_DATA.PASSWORD,
            };

            const response = await client.api.v1.auth.emailpass.$post({
                json,
            });
            const { data, error } = await response.json();
            expect(response.status).toBe(HTTP_CODES.OK);
            expect(data).toBeDefined();
            expect(data.refreshToken).toBeDefined();
            expect(error).toBeNull();

            const { token } = data;

            const getOtpResponse = await client.api.v1.auth.otp.$get(
                {},
                {
                    init: {
                        headers: {
                            "X-User": token,
                        },
                    },
                },
            );
        });

        it("should return 429 when rate limit is exceeded", async () => {
            const json = {
                email: SHARED_DATA.EMAIL,
                password: SHARED_DATA.PASSWORD,
            };

            const response = await client.api.v1.auth.emailpass.$post({
                json,
            });
            const { data, error } = await response.json();
            expect(response.status).toBe(HTTP_CODES.OK);
            expect(data).toBeDefined();
            expect(error).toBeNull();

            const verifyJson = {
                token: "123456",
            };

            const statuses = await Promise.all(
                Array.from({ length: 50 }).map(() =>
                    client.api.v1.auth.otp.verify
                        .$post(
                            {
                                json: verifyJson,
                            },
                            {
                                init: {
                                    headers: {
                                        "Authorization": `Bearer ${TESTING_API_KEY}`,
                                        "X-User": data.token,
                                    },
                                },
                            },
                        )
                        .then((r) => r.status),
                ),
            );

            expect(statuses.includes(HTTP_CODES.RATE_LIMIT_EXCEEDED)).toBe(true);
        });
    });
