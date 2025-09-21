import { validatePassword } from "@src/lib/password";
import { z } from "zod";

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

export const createUserWithPasswordSchema = z
  .object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(8).max(64),
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    unitId: z.string().nonempty(),
  })
  .superRefine((data, ctx) => validatePassword(data, ctx));

export const sessionBodySchema = z.object({
  data: z.object({
    token: z.string().nonempty(),
    refreshToken: z.string().nonempty(),
  }),
});

export const signInWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().nonempty(),
});

export const resetPasswordTokenSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().nonempty(),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(8).max(64),
  })
  .superRefine((data, ctx) => validatePassword(data, ctx));

export const refreshTokenSchema = z.object({
  token: z.string().nonempty(),
});

export const verifyTOTPSchema = z.object({
  token: z.string().nonempty(),
});

export const OTPResponseSchema = z.object({
  data: z.object({
    secret: z.string().nonempty(),
    qrCode: z.string().nonempty(),
  }),
  error: z.nullable(z.string()),
});

/**
 * Schema for /users Route
 * Represents API responses when requesting a user profile.
 *
 * Fields for a Response:
 * - status: number
 *    - always presents (e.g. 200, 404)
 * - data: userProfileSchema | null
 *    - The actual user profile object if the request succeeded.
 *    - null if no data is found or an error occurred.
 *
 * - error:
 *    - null if no error occurred
 *    - otherwise, contains:
 *        - code: string → Error code (e.g., "NOT_FOUND", "UNAUTHORIZED")
 *        - message: string → Human-readable error description
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  permissions: z.record(z.any()).default({}),
  lastSignedInAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().nullable().optional(),
  email: z.string().email(),
  city: z.string().nullable().optional(),
  mobileNumber: z.string().nullable().optional(),
  pfpUrl: z.string().url().nullable().optional(),
});

export const getUserResponseSchema = z.object({
  status: z.number(),
  data: userProfileSchema.nullable(),
  error: z
    .object({
      message: z.string(),
    })
    .nullable(),
});

/**
 * Schema for updating user profile information
 * Represents the request body for updating user profile fields.
 *
 * Fields for a Request:
 * - firstName: string (optional)
 *    - Minimum 1 character, maximum 255 characters
 * - lastName: string (optional)
 *    - Minimum 1 character, maximum 255 characters
 * - title: string (optional)
 *    - Maximum 32 characters (e.g., "Dr.", "Mr.", "Ms.")
 * - email: string (optional)
 *    - Valid email address format
 * - city: string (optional)
 *    - Maximum 32 characters
 * - mobileNumber: string (optional)
 *    - Maximum 32 characters
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  title: z.string().max(32).optional(),
  email: z.string().email().optional(),
  city: z.string().max(32).optional(),
  mobileNumber: z.string().max(32).optional(),
});

/**
 * Schema for field selection in GET requests
 * Represents the query parameters for selecting specific user fields in responses.
 *
 * Fields for a Query Parameter:
 * - fields: string (optional)
 *    - Comma-separated list of field names to include in response
 *    - Automatically transformed to array of trimmed strings
 *    - Example: "id,name,pfpUrl" → ["id", "name", "pfpUrl"]
 */
export const fieldSelectionSchema = z.object({
  fields: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(",").map((field) => field.trim());
    }),
});

/**
 * Schema for profile picture upload response
 * Represents the response structure for profile picture upload operations.
 *
 * Fields for a Response:
 * - status: number
 *    - HTTP status code (e.g., 200, 400, 404)
 * - data: object | null
 *    - Contains upload result if successful
 *    - pfpUrl: string → URL of the uploaded profile picture (valid URL format)
 *    - null if upload failed
 * - error: object | null
 *    - null if no error occurred
 *    - otherwise, contains:
 *        - code: string → Error code (e.g., "BAD_REQUEST", "NOT_FOUND")
 *        - message: string → Human-readable error description
 */
export const pfpUploadResponseSchema = z.object({
  status: z.number(),
  data: z
    .object({
      pfpUrl: z.string().url(),
    })
    .nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable(),
});

/**
 * Schema for success response
 * Represents the standardized response structure for successful operations.
 *
 * Fields for a Response:
 * - status: number
 *    - HTTP status code (e.g., 200, 404)
 * - data: object | null
 *    - Contains operation result if successful
 *    - success: boolean → Indicates operation success
 *    - null if operation failed
 * - error: object | null
 *    - null if no error occurred
 *    - otherwise, contains:
 *        - code: string → Error code (e.g., "NOT_FOUND", "BAD_REQUEST")
 *        - message: string → Human-readable error description
 */
export const successResponseSchema = z.object({
  status: z.number(),
  data: z
    .object({
      success: z.boolean(),
    })
    .nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable(),
});
