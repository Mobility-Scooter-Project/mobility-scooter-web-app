// @ts-expect-error - no types available
import { words } from "popular-english-words";
import { z } from "zod";

const commonWords = words.getAll().map((word: string) => word.toLowerCase());

/**
 * Checks if a password contains more than 2 sequential characters in a row.
 * Sequential characters are defined as characters whose ASCII values differ by 1.
 * For example: "123" or "abc" would return false, while "12" or "ab" would return true.
 *
 * @param password - The password string to check for sequential characters
 * @returns {boolean} Returns false if password contains more than 2 sequential characters,
 *                    true otherwise
 *
 * @example
 * ```typescript
 * checkSequentialPassword("abc123"); // returns false
 * checkSequentialPassword("a1b2c3"); // returns true
 * ```
 */
export const checkSequentialPassword = (password: string): boolean => {
  let sequentialCount = 0;
  for (let i = 0; i < password.length; i++) {
    if (i > 0) {
      if (password.charCodeAt(i - 1) + 1 === password.charCodeAt(i)) {
        sequentialCount++;
        console.log(password.charCodeAt(i - 1), password.charCodeAt(i));
      } else {
        sequentialCount = 0;
      }
      // allows for 2 sequential characters, eg 12
      if (sequentialCount >= 3) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Checks if a password contains more than 3 consecutive repeated characters.
 *
 * @param password - The password string to check.
 * @returns `false` if the password contains more than 3 consecutive repeated characters, `true` otherwise.
 *
 * @example
 * ```typescript
 * checkRepeatedPassword('hello123'); // returns true
 * checkRepeatedPassword('heeello123'); // returns false
 * ```
 */
export const checkRepeatedPassword = (password: string): boolean => {
  const passwordArray = password.split("");
  let repeatedCount = 0;
  for (let i = 0; i < passwordArray.length; i++) {
    if (i > 0) {
      if (passwordArray[i - 1] === passwordArray[i]) {
        repeatedCount++;
      } else {
        repeatedCount = 0;
      }
      if (repeatedCount >= 3) {
        return false;
      }
    }
  }
  return true;
};

export const validatePassword = (
  data: { password: string; email: string },
  ctx: z.RefinementCtx,
) => {
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
};
