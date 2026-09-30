import type { Express } from "express";

/**
 * Lightweight OpenAPI 3.0 spec + self-hosted Swagger UI.
 * Served in non-production to document the API without adding
 * heavyweight dependencies. See docs/API_DOCUMENTATION.md for prose docs.
 */
export function serveDocs(app: Express): void {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Lost & Found Management System API",
      version: "1.0.0",
      description:
        "REST API for reporting lost/found items, searching, submitting ownership claims and administering the platform.",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: { code: { type: "string" }, message: { type: "string" } },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"], summary: "Create an account",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string" }, password: { type: "string", format: "password" } } } } } },
          responses: { "201": { description: "Registered" }, "409": { description: "Email exists" }, "422": { description: "Validation error" }, "429": { description: "Rate limited" } },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"], summary: "Log in",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } } },
          responses: { "200": { description: "Tokens + user" }, "401": { description: "Invalid credentials" } },
        },
      },
      "/auth/refresh": { post: { tags: ["Auth"], summary: "Rotate refresh token", responses: { "200": { description: "New token pair" }, "401": { description: "Invalid session" } } } },
      "/auth/logout": { post: { tags: ["Auth"], summary: "Revoke a session", responses: { "200": { description: "Logged out" } } } },
      "/users": { get: { tags: ["Users"], summary: "List users (admin)", responses: { "200": { description: "Paginated users" }, "403": { description: "Admin only" } } } },
      "/users/{id}": { get: { tags: ["Users"], summary: "Get user profile (self or admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "User" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } } } },
      "/lost-items": {
        get: { tags: ["Lost items"], summary: "Search / list lost items", parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "location", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "RECOVERED"] } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
          { name: "mine", in: "query", schema: { type: "boolean" } },
          { name: "sort_by", in: "query", schema: { type: "string" } },
          { name: "sort_order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ], responses: { "200": { description: "Paginated items" } } },
        post: { tags: ["Lost items"], summary: "Report a lost item (multipart, optional image)", responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } } },
      },
      "/lost-items/{id}": {
        put: { tags: ["Lost items"], summary: "Update a lost item", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
        delete: { tags: ["Lost items"], summary: "Delete a lost item", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
      },
      "/lost-items/{id}/matches": { get: { tags: ["Lost items"], summary: "Suggest matching found items", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Match suggestions" } } } },
      "/found-items": {
        get: { tags: ["Found items"], summary: "Search / list found items", responses: { "200": { description: "Paginated items" } } },
        post: { tags: ["Found items"], summary: "Report a found item (multipart, optional image)", responses: { "201": { description: "Created" } } },
      },
      "/found-items/{id}": {
        put: { tags: ["Found items"], summary: "Update a found item", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
        delete: { tags: ["Found items"], summary: "Delete a found item", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
      },
      "/claims": {
        get: { tags: ["Claims"], summary: "List claims (scoped by role)", responses: { "200": { description: "Paginated claims" } } },
        post: { tags: ["Claims"], summary: "Submit a claim (multipart, optional proof image)", responses: { "201": { description: "Created" }, "409": { description: "Duplicate claim" } } },
      },
      "/claims/{id}": {
        get: { tags: ["Claims"], summary: "Claim detail", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Claim" } } },
        put: { tags: ["Claims"], summary: "Admin review (approve/reject) or user withdraw", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Reviewed" } } },
      },
      "/stats/public": { get: { tags: ["Stats"], summary: "Public homepage stats", responses: { "200": { description: "Stats" } } } },
      "/stats/dashboard": { get: { tags: ["Stats"], summary: "Personal dashboard stats", responses: { "200": { description: "Stats" } } } },
      "/stats/admin": { get: { tags: ["Stats"], summary: "Admin stats", responses: { "200": { description: "Stats" } } } },
    },
  };

  app.get("/api-docs/swagger.json", (_req, res) => res.json(spec));
  app.get("/api-docs", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Lost &amp; Found API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api-docs/swagger.json", dom_id: "#swagger" });
    </script>
  </body>
</html>`);
  });
}
