import { z } from "zod";

export const presignedUrlSchema = z.object({
  filePath: z.string(),
  patientId: z.string(),
});

export const presignedUrlResponseSchema = z.object({
  data: z.object({
    url: z.string().nonempty(),
    encryptionKey: z.string().nonempty(),
    encryptionIv: z.string().nonempty(),
  }),
});

export const presignedQuerySchema = z.object({
  "X-MSWA-FilePath": z.string(),
  "X-MSWA-Bucket": z.string(),
  "X-MSWA-UserId": z.string(),
  "X-MSWA-Method": z.string(),
  "X-MSWA-Expires": z.string(),
  "X-MSWA-Signature": z.string()
})