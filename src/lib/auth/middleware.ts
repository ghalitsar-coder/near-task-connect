import { createMiddleware } from "@tanstack/react-start";
import { useSessionStore } from "@/stores/useSessionStore";

type AuthContext = {
  accessToken?: string;
  request?: Request;
};

type AuthInput = {
  accessToken?: string;
};

/**
 * Injects Bearer token on server functions (client → server) and resolves token on the server.
 * See docs/middleware.md — session must not be trusted from client sendContext alone.
 */
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { accessToken } = useSessionStore.getState();
    return next({
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  })
  .server(async ({ next, request, context, data }) => {
    const tokenFromInput = (data as AuthInput | undefined)?.accessToken;
    const headerToken = request?.headers?.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const accessToken = tokenFromInput || headerToken || (context as AuthContext)?.accessToken || "";

    return next({
      context: {
        ...(context as AuthContext),
        accessToken,
      },
    });
  });
