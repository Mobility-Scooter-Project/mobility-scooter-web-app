import { z } from "zod";
// @ts-expect-error - no types available
import { words } from 'popular-english-words'
import { checkRepeatedPassword, checkSequentialPassword } from "@src/utils/password";

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

const commonWords = words.getAll().map((word: string) => word.toLowerCase());

export const createUserWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8).max(64),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  unitId: z.string().nonempty(),
}).superRefine((data, ctx) => {
  if (commonWords.includes(data.password.toLowerCase())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password cannot be a common word",
    });
  }
  if (data.email === data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password cannot be the same as email",
    });
  }
  if (!checkSequentialPassword(data.password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password cannot contain sequential characters or numbers",
    });
  }
  if (!checkRepeatedPassword(data.password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password cannot contain repeated characters",
    });
  }
});

export const signInWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().nonempty(),
});

export const refreshTokenSchema = z.object({
  token: z.string().nonempty(),
});

export const verifyTOTPSchema = z.object({
  token: z.string().nonempty(),
  secret: z
    .string()
    .nonempty()
})