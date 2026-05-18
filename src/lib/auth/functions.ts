import { createServerFn } from "@tanstack/react-start";
import { clearAuthCookies } from "./session";
import { redirect } from "@tanstack/react-router";

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
    clearAuthCookies();
    throw redirect({ to: "/login" });
  });