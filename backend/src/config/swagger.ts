import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { env } from "./env";
import { SOMALI_CITIES } from "../utils/somaliCities";

const isTsRuntime = __filename.endsWith(".ts");

function toPosixGlob(p: string): string {
  return p.split(path.sep).join("/");
}

const apiGlobs = isTsRuntime
  ? [toPosixGlob(path.join(__dirname, "../routes/*.ts"))]
  : [toPosixGlob(path.join(__dirname, "../routes/*.js"))];

const definition: swaggerJSDoc.OAS3Definition = {
  openapi: "3.0.3",
  info: {
    title: "Home Rental Platform API — Phase 1 (Auth & Users)",
    version: "1.0.0",
    description:
      "Authentication and user-role management for the Home Rental Platform. " +
      "The JWT session is stored in an HTTP-only cookie — log in via `POST /api/auth/login` " +
      "using this UI ('Try it out') and the cookie is set automatically for subsequent requests " +
      "made from this page.",
  },
  servers: [
    {
      url: `http://localhost:${env.port}/api`,
      description: "Local server",
    },
  ],
  tags: [
    { name: "Auth", description: "Registration, login, session, verification and password reset" },
    { name: "Users", description: "Super-admin-only user management" },
    { name: "Properties", description: "Property listings posted by approved businesses" },
    { name: "Billing", description: "Free listing allowance, monthly subscriptions and WaafiPay payments" },
    { name: "Contact", description: "Public contact form" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: env.cookieName,
        description: "HTTP-only JWT cookie set by POST /auth/login",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f1a2b3c4d5e6f7a8b9c0d1" },
          firstName: { type: "string", example: "Tina" },
          lastName: { type: "string", example: "Tenant" },
          email: { type: "string", format: "email", example: "tenant1@example.com" },
          phone: { type: "string", example: "+15551234567" },
          city: { type: "string", enum: [...SOMALI_CITIES], example: "Mogadishu" },
          role: { type: "string", enum: ["SUPER_ADMIN", "BUSINESS", "TENANT"], example: "TENANT" },
          isEmailVerified: { type: "boolean", example: false },
          isActive: { type: "boolean", example: true },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["firstName", "lastName", "email", "phone", "city", "password", "role"],
        properties: {
          firstName: { type: "string", example: "Tina" },
          lastName: { type: "string", example: "Tenant" },
          email: { type: "string", format: "email", example: "tenant1@example.com" },
          phone: { type: "string", example: "+15551234567" },
          city: { type: "string", enum: [...SOMALI_CITIES], example: "Mogadishu" },
          password: {
            type: "string",
            format: "password",
            example: "Passw0rd!",
            description: "Min 8 chars, at least one uppercase, one lowercase, one number",
          },
          role: {
            type: "string",
            enum: ["BUSINESS", "TENANT"],
            example: "TENANT",
            description: "Public registration cannot create SUPER_ADMIN",
          },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "tenant1@example.com" },
          password: { type: "string", format: "password", example: "Passw0rd!" },
        },
      },
      ForgotPasswordInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "tenant1@example.com" },
        },
      },
      ResetPasswordInput: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", description: "Raw token from the reset-password email link" },
          password: { type: "string", format: "password", example: "NewPassw0rd1!" },
        },
      },
      VerifyEmailInput: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", description: "Raw token from the verify-email email link" },
        },
      },
      ResendVerificationInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "tenant1@example.com" },
        },
      },
      UpdateStatusInput: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: false },
        },
      },
      UpdateRoleInput: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["SUPER_ADMIN", "BUSINESS", "TENANT"], example: "BUSINESS" },
        },
      },
      SuccessMessage: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 3 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          pages: { type: "integer", example: 1 },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing, invalid, or expired authentication cookie",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      Forbidden: {
        description: "Authenticated but not permitted to perform this action",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      ValidationError: {
        description: "Request failed Zod validation",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      TooManyRequests: {
        description: "Rate limit exceeded",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: apiGlobs,
});
