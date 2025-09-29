import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "@hono/zod-validator";
import { dbMiddleware } from "@src/middleware/db";
import type { Variables } from "@src/index";
import {
  getUserResponseSchema,
  updateUserSchema,
  fieldSelectionSchema,
  pfpUploadResponseSchema,
  successResponseSchema,
} from "@src/validators/users";
import { userMiddleware } from "@src/middleware/user";
import { usersService } from "@src/services/users";
import { StorageService } from "@src/services/storage";

const app = new Hono<{ Variables: Variables }>()
  .get(
    "/me",
    describeRoute({
      summary: "Retrieve current user profile",
      description: "Returns the authenticated user's profile information.",
      tags: ["users"],
      responses: {
        200: {
          description: "Current user profile",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    userMiddleware,
    async (c) => {
      const db = c.get("db");
      const userId = c.get("userId") as string;
      const result = await usersService.getUserById(db, userId);
      return c.json(result);
    },
  )
  .get(
    "/:id",
    describeRoute({
      summary: "Retrieve user by ID",
      description:
        "Returns a user's information with optional field selection.",
      tags: ["users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "User ID",
        },
        {
          name: "fields",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Comma-separated list of fields to return (e.g., id,name,pfpUrl)",
        },
      ],
      responses: {
        200: {
          description: "User information",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    zValidator("query", fieldSelectionSchema),
    async (c) => {
      const db = c.get("db");
      const userId = c.req.param("id");
      const { fields } = c.req.valid("query");
      const result = await usersService.getUserById(db, userId, fields);
      return c.json(result);
    },
  )
  .put(
    "/me",
    describeRoute({
      summary: "Update current user profile",
      description: "Updates the authenticated user's profile information.",
      tags: ["users"],
      requestBody: {
        content: {
          "application/json": {
            schema: resolver(updateUserSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Updated user profile",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    userMiddleware,
    zValidator("json", updateUserSchema),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("userId") as string;
      const updateData = c.req.valid("json");
      const result = await usersService.updateUser(db, userId, updateData);
      return c.json(result);
    },
  )
  .put(
    "/:id",
    describeRoute({
      summary: "Update user by ID",
      description: "Updates a user's profile information by ID.",
      tags: ["users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "User ID",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: resolver(updateUserSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Updated user profile",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(getUserResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    zValidator("json", updateUserSchema),
    async (c) => {
      const db = c.get("db");
      const userId = c.req.param("id");
      const updateData = c.req.valid("json");
      const result = await usersService.updateUser(db, userId, updateData);
      return c.json(result);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      summary: "Delete user by ID",
      description:
        "Soft deletes a user by marking them as deleted (for data retention).",
      tags: ["users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "User ID",
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: resolver(successResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(successResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    async (c) => {
      const db = c.get("db");
      const userId = c.req.param("id");
      const result = await usersService.softDeleteUser(db, userId);
      return c.json(result);
    },
  )
  .post(
    "/pfp",
    describeRoute({
      summary: "Upload profile picture",
      description: "Uploads or replaces the current user's profile picture.",
      tags: ["users"],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Profile picture uploaded successfully",
          content: {
            "application/json": { schema: resolver(pfpUploadResponseSchema) },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: resolver(pfpUploadResponseSchema) },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": { schema: resolver(pfpUploadResponseSchema) },
          },
        },
      },
    }),
    dbMiddleware,
    userMiddleware,
    async (c) => {
      const db = c.get("db");
      const userId = c.get("userId") as string;
      const storageService = await c.get("container").getAsync(StorageService);

      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;

      // Delegate everything to the service
      const result = await usersService.updatePfp(
        db,
        userId,
        storageService,
        file as File,
      );
      return c.json(result, 200);
    },
  )
  .delete(
    "/pfp",
    describeRoute({
      summary: "Remove profile picture",
      description: "Removes the current user's profile picture.",
      tags: ["users"],
      responses: {
        200: {
          description: "Profile picture removed successfully",
          content: {
            "application/json": {
              schema: resolver(successResponseSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(successResponseSchema),
            },
          },
        },
      },
    }),
    dbMiddleware,
    userMiddleware,
    async (c) => {
      const db = c.get("db");
      const userId = c.get("userId") as string;
      const storageService = await c.get("container").getAsync(StorageService);
      const result = await usersService.removePfp(db, userId, storageService);
      return c.json(result);
    },
  );

export default app;
