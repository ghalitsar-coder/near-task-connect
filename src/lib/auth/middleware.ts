import { createMiddleware } from "@tanstack/react-start";

type AuthContext = {
  accessToken?: string;
  request?: Request;
};

type AuthInput = {
  accessToken?: string;
};

export const authMiddleware = createMiddleware()
  .server(async ({ next, context, data }) => {
    const tokenFromInput = (data as AuthInput | undefined)?.accessToken;
    const headerToken = context?.request?.headers
      ?.get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    const accessToken = tokenFromInput || headerToken || "";

    return next({
      context: {
        ...(context as AuthContext),
        accessToken,
      },
    });
  });
