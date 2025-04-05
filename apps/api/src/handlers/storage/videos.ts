import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@src/index";
import { dbMiddleware } from "@src/middleware/db";
import { userMiddleware } from "@src/middleware/user";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { storageService } from "@src/services/storage";
import {
  presignedUrlResponseSchema,
  presignedUrlSchema,
} from "@src/validators/storage";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { pub } from "@src/integrations/queue";

const app = new Hono<{ Variables: Variables }>()
app.post(
  "/presigned-url",
  describeRoute({
    summary: "Generate a presigned URL for uploading a video",
    description:
      "Generate a presigned URL for uploading a video to the storage bucket",
    tags: ["storage"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(presignedUrlSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Presigned URL generated successfully",
        content: {
          "application/json": {
            schema: resolver(presignedUrlResponseSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", presignedUrlSchema),
  async (c) => {
    const { filename, patientId, date } = c.req.valid("json");
    const userId = c.get("userId")!;

    const url = await storageService.generatePresignedVideoPutUrl(
      filename,
      userId,
      patientId,
      date,
    );
    return c.json({
      data: {
        url,
      },
      error: null,
    });
  },
);

app.post(
  "/send-video",
  describeRoute({
    summary: "Generate a presigned URL and send a video to the video worker queue",
    description:
      "Generate a presigned URL and send a video to the video worker queue",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(presignedUrlSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Video sent to queue successfully",
        content: {
          "application/json": {
            schema: resolver(presignedUrlResponseSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", presignedUrlSchema),
  async (c) => {
    const { filename, patientId, date } = c.req.valid("json");
    const userId = c.get("userId")!;

    const videoUrl = await storageService.generatePresignedVideoGetUrl(
      filename,
      userId,
      patientId,
      date,
    );

    pub.send("videos", {videoUrl, filename, patientId, date})
    
    return c.json({
      data: {
        videoUrl,
        filename,
        patientId,
        date,
      },
      error: null,
    });
  }
)

export default app;
