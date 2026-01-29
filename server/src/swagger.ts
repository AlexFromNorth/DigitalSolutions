import swaggerUi from "swagger-ui-express";

const spec = {
  openapi: "3.0.0",
  info: { title: "Items List API", version: "1.0.0" },
  paths: {
    "/api/available": {
      get: {
        summary: "Get available items (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "filter", in: "query", schema: { type: "string" }, description: "Filter by ID" },
        ],
        responses: { 200: { description: "ids, total, page, limit" } },
      },
    },
    "/api/selected": {
      get: {
        summary: "Get selected items (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "filter", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "ids, total, page, limit" } },
      },
      post: {
        summary: "Add item(s) to selected",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { type: "object", properties: { id: { type: "integer" } } },
                  { type: "object", properties: { ids: { type: "array", items: { type: "integer" } } } },
                ],
              },
            },
          },
        },
        responses: { 200: { description: "ok" } },
      },
    },
    "/api/selected/order": {
      get: {
        summary: "Get full selected order",
        responses: { 200: { description: "order: number[]" } },
      },
    },
    "/api/selected/{id}": {
      delete: {
        summary: "Remove item from selected",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "ok" } },
      },
    },
    "/api/selected/reorder": {
      put: {
        summary: "Reorder: move one item or set order",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      moveId: { type: "integer" },
                      beforeId: { type: "integer", nullable: true },
                    },
                  },
                  { type: "object", properties: { order: { type: "array", items: { type: "integer" } } } },
                ],
              },
            },
          },
        },
        responses: { 200: { description: "ok" } },
      },
    },
    "/api/items": {
      post: {
        summary: "Add new custom item by ID",
        requestBody: {
          content: {
            "application/json": { schema: { type: "object", properties: { id: { type: "integer" } } } },
          },
        },
        responses: { 200: { description: "ok" } },
      },
    },
  },
};

export const swaggerMiddleware = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(spec as Parameters<typeof swaggerUi.setup>[0]);
