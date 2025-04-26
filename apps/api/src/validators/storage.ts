import { z } from "zod";

export const videoStatusSchema = z.enum([
  "pending",
  "processing",
  "processed",
  "failed",
  "annotation approved",
  "annotation created",
]);

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

export const videoPathSchema = z.object({
  videoPath: z.string(),
})

export const videoIdResponseSchema = z.object({
  data: z.object({
    videoId: z.string(),
  }),
})

export const videoEventSchema = z.object({
  status: videoStatusSchema,
  videoId: z.string(),
})