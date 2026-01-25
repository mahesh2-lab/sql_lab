import { z } from "zod";
import { exercises } from "./schema";

export const api = {
  exercises: {
    list: {
      method: "GET" as const,
      path: "/api/exercises",
      responses: {
        200: z.array(z.custom<typeof exercises.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/exercises/:id",
      responses: {
        200: z.custom<typeof exercises.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
