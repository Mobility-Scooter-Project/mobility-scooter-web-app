import { z } from "zod";

export const presignedUrlSchema = z.object({
  filename: z.string(),
  patientId: z.string(),
});

export const presignedUrlResponseSchema = z.object({
  data: z.object({
    url: z.string().nonempty(),
    encryptionKey: z.string().nonempty(),
    encryptionIv: z.string().nonempty(),
  }),
});
