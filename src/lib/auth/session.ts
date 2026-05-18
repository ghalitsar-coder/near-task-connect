import { setCookie, deleteCookie } from "@tanstack/react-start/server";
// import type { LoginResult } from "@/lib/api/types";
import {
  AUTH_COOKIES,
  AUTH_COOKIE_OPTIONS,
  accessTokenMaxAge,
  REFRESH_TOKEN_MAX_AGE,
} from "./cookies.ts";

export function setAuthCookies(tokens: any) {
  setCookie(AUTH_COOKIES.accessToken, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: accessTokenMaxAge(tokens.expires_at),
  });
  setCookie(AUTH_COOKIES.refreshToken, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  // Store passenger_id separately so server functions can look up the correct profile
  if (tokens.user.passenger_id) {
    setCookie(AUTH_COOKIES.passengerId, tokens.user.passenger_id, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}

export function clearAuthCookies() {
  deleteCookie(AUTH_COOKIES.accessToken, { path: "/" });
  deleteCookie(AUTH_COOKIES.refreshToken, { path: "/" });
  deleteCookie(AUTH_COOKIES.passengerId, { path: "/" });
}

