import { resetPasswordTokens } from "@src/db/schema/auth";
import { vault } from "@src/integrations/vault";
import { DB } from "@src/middleware/db";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const createPasswordResetToken = async (token: string, userId: string) => {
    try {
        await vault.write(`kv/auth/password-reset/${userId}`, { token, used: false });
    } catch (e) {
        console.error(`Failed to create password reset token: ${e}`);
        throw new Error("Failed to create password reset token");
    }
}


const markPasswordResetTokenUsed = async (token: string, userId: string) => {

    const data = (await vault.read(`kv/auth/password-reset/${userId}`)).getData();
    if (!data || data.token !== token) {
        throw new HTTPException(404, { res: new Response(JSON.stringify({ error: "Token not found" }), { status: 404 }) });
    }
    if (data.used) {
        throw new HTTPException(400, { res: new Response(JSON.stringify({ error: "Token already used" }), { status: 400 }) });
    }

    try {
        await vault.write(`kv/auth/password-reset/${userId}`, { token, used: true });
    } catch (e) {
        console.error(`Failed to mark password reset token as used: ${e}`);
        throw new Error("Failed to mark password reset token as used");
    }
};

export const resetPasswordTokensRepository = {
    createPasswordResetToken,
    markPasswordResetTokenUsed,
};