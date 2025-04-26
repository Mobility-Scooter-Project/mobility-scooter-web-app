export const TESTING_BASE_URL = process.env.TESTING_BASE_URL || "http://localhost:3000";
export const TESTING_API_KEY = process.env.TESTING_API_KEY || "Missing TESTING_API_KEY";

export const SHARED_DATA = {
    EMAIL: "users@example.com",
    PASSWORD: "password1358",
    FIRST_NAME: "John",
    LAST_NAME: "Doe",
    TESTING_UNIT_ID: process.env.TESTING_UNIT_ID!,
};

export const SHARED_LOGIN = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
}