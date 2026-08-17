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

const trustedOrigins = ["http://localhost:3000"];
if (baseURL) trustedOrigins.push(baseURL);

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
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
});
