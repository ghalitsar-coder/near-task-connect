import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createMiddleware().server(async ({ next, context }) => {
  if (context.handlerType === "serverFn") {
    // CSRF protection for server functions
    const origin = context.request.headers.get("origin");
    const host = context.request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
