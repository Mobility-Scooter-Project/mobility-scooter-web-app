
import * as OTPAuth from "otpauth";

export const generateTOTP = (identifier: string) => {
    const totp = new OTPAuth.TOTP({
        issuer: "MSWA",
        label: `${identifier}`,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
    });

    return totp;
}

export const verifyTOTP = (identifier: string, token: string, secret: string) => {
    const totp = new OTPAuth.TOTP({
        issuer: "MSWA",
        label: `${identifier}`,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
    });

    return totp.validate({ token });
}

