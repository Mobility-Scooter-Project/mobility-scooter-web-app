import { VAULT_ADDR, VAULT_TOKEN } from '@src/config/constants';
import { HTTPException } from 'hono/http-exception';
import VaultClient from 'node-vault-client';

export const vault = VaultClient.boot("main", {
    api: {
        url: VAULT_ADDR,
    },
    auth: {
        type: "token",
        config: {
            token: VAULT_TOKEN,
        }
    }
});

export const createOtpSecret = async (userId: string, secret: string) => {
    await vault.write(`kv/auth/otp/${userId}`, { secret });
}

export const getOtpSecretByUserId = async (userId: string) => {
    try {
        const secret = await vault.read(`kv/auth/otp/${userId}`);
        return secret.getData().secret as string;
    } catch (e) {
        throw new HTTPException(404, { res: new Response(JSON.stringify({ data: null, error: "TOTP does not exist" })) });
    }
}