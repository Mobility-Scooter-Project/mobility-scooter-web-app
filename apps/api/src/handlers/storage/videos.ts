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
import { stream, streamText, streamSSE } from 'hono/streaming'
import Stream from "stream";

const app = new Hono<{ Variables: Variables }>().post(
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
    const { filename, patientId } = c.req.valid("json");
    const userId = c.get("userId")!;

    const data = await storageService.generatePresignedVideoPutUrl(
      filename,
      userId,
      patientId,
    );

    return c.json({
      data: { ...data },
      error: null,
    });
  },
).get(
  ":patientId/:filename",
  describeRoute({
    summary: "Get a presigned URL for uploading a video",
    description:
      "Get a presigned URL for uploading a video to the storage bucket",
    tags: ["storage"],
    parameters: [
      {
        patientId: {
          description: "The ID of the patient",
          required: true,
          type: "string",
        }
      },
      {
        filename: {
          description: "The name of the file to upload",
          required: true,
          type: "string",
        }
      }
    ],
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
  dbMiddleware,
  async (c) => {
    const filename = c.req.param("filename");
    const patientId = c.req.param("patientId");

    const data = await storageService.getObjectStream(
      filename,
      patientId,
    );

    // Assuming data is a ReadableStream<Uint8Array> or similar
    if (!data) {
      return c.notFound();
    }

    c.header('Content-Type', 'video/mp4');
    c.header('Accept-Ranges', 'bytes');

    const nodeReadable = data.stream as Stream.Readable;
    // Convert Node.js Readable to Web ReadableStream
    const webReadableStream = Stream.Readable.toWeb(nodeReadable);

    return stream(c, async (stream) => {
      // Pipe the Web ReadableStream
      await stream.pipe(webReadableStream as ReadableStream<any>);
    })
  },
);

export default app;
