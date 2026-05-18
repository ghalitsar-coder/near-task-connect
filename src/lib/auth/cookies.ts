/** HttpOnly cookie names for Passenger Service JWTs */
export const AUTH_COOKIES = {
    accessToken: "skyline_access_token",
    refreshToken: "skyline_refresh_token",
    passengerId: "skyline_passenger_id",
  } as const;
  
  export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  
  export function accessTokenMaxAge(expiresAt: string): number {
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(60, Math.floor(ms / 1000));
  }
  
  export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
  