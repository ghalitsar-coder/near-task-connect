import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import type { StartAuthJSConfig } from "start-authjs";

/**
 * Auth.js (OAuth) — Google & GitHub.
 * Env vars mirror backend/.env.example (server-only, not VITE_ prefixed).
 */
export const authConfig: StartAuthJSConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as { provider?: string }).provider = token.provider as string | undefined;
        (session as { subject?: string }).subject =
          (token.providerAccountId as string | undefined) ?? token.sub;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/auth/complete`;
    },
  },
};
