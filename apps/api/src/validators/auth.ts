import { z } from "zod";
import { validatePassword } from "@src/lib/password";

/*
* Password requirements are based on NIST Special Publication 800-63B
* https://pages.nist.gov/800-63-3/sp800-63b.html#reqauthtype
* https://pages.nist.gov/800-63-3/sp800-63b.html#sec10
* 
* 1. Passwords shall be at least 8 characters in length, and should support atleast 64 characters in length
* 2. Passwords cannot be a common word
* 3. Passwords cannot be the same as the user identifier (email)
* 4. Passwords
* 4. TODO: Passwords cannot contain any context specific words (eg name of service) 
*/


export const createUserWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8).max(64),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  unitId: z.string().nonempty(),
}).superRefine((data, ctx) => validatePassword(data, ctx));

export const signInWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().nonempty(),
});

export const resetPasswordTokenSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().nonempty(),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8).max(64)
}).superRefine((data, ctx) => validatePassword(data, ctx));

export const refreshTokenSchema = z.object({
  token: z.string().nonempty(),
});

export const verifyTOTPSchema = z.object({
  token: z.string().nonempty(),
})