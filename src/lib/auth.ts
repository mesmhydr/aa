import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function normalizeBaseUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  // better-auth requires a valid URL (with scheme); prepend https:// when missing.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const baseURL = normalizeBaseUrl(process.env.BETTER_AUTH_URL);

// Trust the origin the request actually came from. The static list below only
// ever contained localhost + whatever BETTER_AUTH_URL resolved to, so in
// production every sign-in from the real domain was rejected with
// INVALID_ORIGIN (403). Deriving the origin from the request covers the custom
// domain, vercel.app previews, and local dev automatically.
const trustedOrigins: (request?: Request) => Promise<Array<string | null | undefined>> = async (request) => {
  if (!request) return [];
  try {
    return [new URL(request.url).origin];
  } catch {
    return [];
  }
};

export const auth = betterAuth({
  appName: "Academic Atelier",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  // Extra origins (e.g. a staging domain) can be added via the
  // BETTER_AUTH_TRUSTED_ORIGINS env var (comma-separated) — better-auth
  // merges that in natively.
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
});
