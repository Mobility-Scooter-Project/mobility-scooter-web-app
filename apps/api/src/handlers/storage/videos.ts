import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@src/index";
import { dbMiddleware } from "@src/middleware/db";
import { userMiddleware } from "@src/middleware/user";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { storageService } from "@src/services/storage";
import {
  presignedUrlResponseSchema,
  presignedUrlSchema,
  transcriptSchema,
  videoMetadataSchema,
  taskSchema,
  keypointSchema,
  videoIdSchema,
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

    const videoPutUrl = await storageService.generatePresignedPutUrl(
      filename,
      patientId,
      "Video",
      userId,
      date,
    );
    return c.json({
      data: {
        videoPutUrl,
      },
      error: null,
    });
  },
);

app.post(
  "/send-to-queue",
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
    const db = c.get("db");

    const videoGetUrl = await storageService.generatePresignedGetUrl(
      filename,
      patientId,
      "Video",
      userId,
      date,
    );

    const transcriptName = `${filename.split(".", 2)[0]}.vtt`
    
    const transcriptPutUrl = await storageService.generatePresignedPutUrl(
      transcriptName,
      patientId,
      "Trancript",
      userId,
      date,
    )

    pub.send("videos", {videoGetUrl, transcriptPutUrl, filename})
    
    return c.json({
      data: {
        videoGetUrl, 
        transcriptPutUrl,
        filename,
        transcriptName,
      },
      error: null,
    });
  }
)

app.post("/store-video",   
  describeRoute({
    summary: "Store video",
    description:
      "Store video",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(videoMetadataSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Video stored successfully",
        content: {
          "application/json": {
            schema: resolver(videoMetadataSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", videoMetadataSchema),
  async (c) => {
    const { patientId, path, date } = c.req.valid("json");
    const db = c.get("db");

    await storageService.storeVideoMetadata(
      db,
      patientId,
      path,
      date,
    );
    
    return c.json({
      data: {
        path,
      },
      error: null,
    });
  },
)

app.post("/store-transcript",   
  describeRoute({
    summary: "Store video transcript",
    description:
      "Store video transcript",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(transcriptSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Video stored successfully",
        content: {
          "application/json": {
            schema: resolver(transcriptSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", transcriptSchema),
  async (c) => {
    const { videoId, transcriptPath } = c.req.valid("json");
    const db = c.get("db");

    await storageService.storeTranscript(
      db,
      videoId,
      transcriptPath,
    );

    return c.json({
      data: {
        transcriptPath,
      },
      error: null,
    });

  }
)

app.post("/store-task", 
  describeRoute({
    summary: "Store video task",
    description:
      "Store video transcript",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(taskSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Task stored successfully",
        content: {
          "application/json": {
            schema: resolver(taskSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", taskSchema),
  async (c) => {
    const { videoId, taskId, task } = c.req.valid("json");
    const db = c.get("db");

    await storageService.storeTask(
      db,
      videoId,
      taskId,
      task,
    );

    return c.json({
      data: {
        task,
      },
      error: null,
    });
  }
)  

app.post("/store-keypoints", 
  describeRoute({
    summary: "Store video keypoints",
    description:
      "Store video keypoints",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(keypointSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Keypoints stored successfully",
        content: {
          "application/json": {
            schema: resolver(keypointSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", keypointSchema),
  async (c) => {
    const { videoId, timestamp, angle, keypoints } = c.req.valid("json");
    const db = c.get("db");

    await storageService.storeKeypoint(
      db,
      videoId,
      timestamp,
      angle,
      keypoints,
    );

    return c.json({
      data: {
        timestamp,
      },
      error: null,
    });
  }
)

app.post("/find-video-id",
  describeRoute({
    summary: "Find video ID by video path",
    description:
      "Find video ID by video path",
    tags: ["video-worker"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(videoIdSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Video ID found successfully",
        content: {
          "application/json": {
            schema: resolver(videoIdSchema),
          },
        },
      },
    },
  }),
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator("json", videoIdSchema),
  async (c) => {
    const { videoPath } = c.req.valid("json");
    const db = c.get("db");

    const videoId = await storageService.findVideoId(
      db,
      videoPath,
    );

    return c.json({
      data: {
        videoId,
      },
      error: null,
    });
  }
)

export default app;
