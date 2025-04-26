import { z } from "zod";

export const presignedUrlSchema = z.object({
  filename: z.string(),
  date: z.coerce.date(),
  patientId: z.string(),
});

export const presignedUrlResponseSchema = z.object({
  data: z.object({
    url: z.string().nonempty(),
  }),
});

export const videoMetadataSchema = z.object({
  patientId: z.string(),  
  path: z.string(),
  date: z.coerce.date(),
})

export const transcriptSchema = z.object({
  videoId: z.string(),
  transcriptPath: z.string(),
})

export const taskSchema = z.object({
  videoId: z.string(),
  taskId: z.number(),
  task: z.object({
    task: z.string(),
    start: z.string(),
    end: z.string(),
  })
  
})

export const keypointSchema = z.object({
  videoId: z.string(),
  timestamp: z.string(),
  angle: z.number(),
  keypoints: z.record(
    z.tuple([z.number(), z.number()])
  ),
})

export const videoIdSchema = z.object({
  videoPath: z.string(),
})
