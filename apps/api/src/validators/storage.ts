import { z } from 'zod'

export const presignedUrlSchema = z.object({
  filename: z.string(),
  date: z.coerce.date(),
  patientId: z.string(),
})

export const presignedUrlResponseSchema = z.object({
  data: z.object({
    url: z.string().nonempty(),
  }),
})
