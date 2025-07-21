import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@src/index";
import { dbMiddleware } from "@src/middleware/db";
import { userMiddleware } from "@src/middleware/user";
import { StorageService } from "@src/services/storage";
import {
  presignedQuerySchema,
  presignedUrlResponseSchema,
  presignedUrlSchema,
} from "@src/validators/storage";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { stream } from "hono/streaming";

const app = new Hono<{ Variables: Variables }>()
  .put(
    "/:bucketName/:filePath",
    describeRoute({
      summary: "Upload a file to storage",
      tags: ["storage"],
      description: "Upload a file to the storage bucket",
    }),
    userMiddleware,
    dbMiddleware,
    async (c) => {
      const storageService = await c.get("container").getAsync(StorageService);

      const uploadedAt = new Date();
      const bucketName = c.req.param("bucketName");
      const filePath = decodeURIComponent(c.req.param("filePath"));
      const uploadStream = c.req.raw.body!;
      c.header("Content-Type", "video/mp4");

      const userId = c.get("userId")!;

      await storageService.putObjectStream(
        filePath,
        userId,
        bucketName,
        uploadStream,
        uploadedAt,
      );

      return c.json({
        data: {
          success: true,
        },
        error: null,
      });
    },
  )
  .post(
    "/presigned-url",
    userMiddleware,
    dbMiddleware,
    zValidator("json", presignedUrlSchema),
    async (c) => {
      const storageService = await c.get("container").getAsync(StorageService);

      const { filePath, bucketName } = c.req.valid("json");
      const userId = c.get("userId")!;

      const data = await storageService.generatePresignedGetUrl(
        filePath,
        bucketName,
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
      summary: "Get a presigned URL for downloading a video",
      tags: ["storage"],
      description:
        "Get a presigned URL for downloading a video to the storage bucket",
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
      const storageService = await c.get("container").getAsync(StorageService);
      
      const filePath = c.req.valid("query")["X-MSWA-FilePath"];
      const bucketName = c.req.valid("query")["X-MSWA-Bucket"];
      const method = c.req.valid("query")["X-MSWA-Method"];
      const expires = c.req.valid("query")["X-MSWA-Expires"];
      const signature = c.req.valid("query")["X-MSWA-Signature"];

      await storageService.validatePresignedUrl(
        filePath,
        bucketName,
        method,
        expires,
        signature,
      );

      const data = await storageService.getObjectStream(bucketName, filePath);

      // Assuming data is a ReadableStream<Uint8Array> or similar
      if (!data || !data.stream) {
        return c.notFound();
      }

      c.header("Content-Type", "video/mp4");
      c.header("Accept-Ranges", "bytes");

      return stream(c, async (stream) => {
        // Pipe the Web ReadableStream
        await stream.pipe(data.stream!);
      });
    },
  );

export default app;
