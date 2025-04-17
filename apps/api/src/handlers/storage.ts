import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@src/index";
import { dbMiddleware } from "@src/middleware/db";
import { userMiddleware } from "@src/middleware/user";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { storageService } from "@src/services/storage";
import {
  presignedQuerySchema,
  presignedUrlResponseSchema,
  presignedUrlSchema,
} from "@src/validators/storage";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { stream } from "hono/streaming";
import Stream from "stream";

const app = new Hono<{ Variables: Variables }>()
  .post(
    "/presigned-url/upload",
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
    validateApiKey,
    userMiddleware,
    dbMiddleware,
    zValidator("json", presignedUrlSchema),
    async (c) => {
      const { filePath, patientId } = c.req.valid("json");
      const userId = c.get("userId")!;

      const data = await storageService.generatePresignedVideoPutUrl(
        filePath,
        userId,
        patientId,
      );

      return c.json({
        data: { ...data },
        error: null,
      });
    },
  )
  .post(
    "/presigned-url",
    validateApiKey,
    userMiddleware,
    dbMiddleware,
    zValidator("json", presignedUrlSchema),
    async (c) => {
      const { filePath, patientId } = c.req.valid("json");
      const userId = c.get("userId")!;

      const data = await storageService.generatePresignedGetUrl(
        filePath,
        patientId,
        userId,
      );

      return c.json({
        data: { ...data },
        error: null,
      });
    },
  )
  .get(
    "/presigned-url",
    describeRoute({
      summary: "Get a presigned URL for uploading a video",
      description:
        "Get a presigned URL for uploading a video to the storage bucket",
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
    zValidator("query", presignedQuerySchema),
    async (c) => {
      const filePath = c.req.valid("query")["X-MSWA-FilePath"];
      const patientId = c.req.valid("query")["X-MSWA-Bucket"];
      const presignedUserId = c.req.valid("query")["X-MSWA-UserId"];
      const method = c.req.valid("query")["X-MSWA-Method"];
      const expires = c.req.valid("query")["X-MSWA-Expires"];
      const signature = c.req.valid("query")["X-MSWA-Signature"];

      await storageService.validatePresignedUrl(
        filePath,
        patientId,
        presignedUserId,
        method,
        expires,
        signature,
      );

      const data = await storageService.getObjectStream(filePath, patientId);

      // Assuming data is a ReadableStream<Uint8Array> or similar
      if (!data) {
        return c.notFound();
      }

      c.header("Content-Type", "video/mp4");
      c.header("Accept-Ranges", "bytes");

      const nodeReadable = data.stream as Stream.Readable;
      // Convert Node.js Readable to Web ReadableStream
      const webReadableStream = Stream.Readable.toWeb(nodeReadable);

      return stream(c, async (stream) => {
        // Pipe the Web ReadableStream
        await stream.pipe(webReadableStream as ReadableStream<any>);
      });
    },
  );

export default app;
