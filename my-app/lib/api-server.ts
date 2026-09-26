import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { BlogPost, Property, User } from "./types";

// Server-to-server URL for the backend (see next.config.ts for the matching
// browser-facing rewrite). Falls back to localhost for `npm run dev` outside Docker.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "token";

/**
 * The backend rate-limits per client IP. Server-side fetches come from this
 * server, so forward the visitor's address — otherwise every visitor would
 * share one limit.
 */
async function forwardedFor(): Promise<Record<string, string>> {
  const ip = (await headers()).get("x-forwarded-for");
  return ip ? { "X-Forwarded-For": ip } : {};
}

/**
 * Reads the auth cookie from the incoming request and asks the backend who it
 * belongs to. Used by Server Components (layout, dashboard) to render the
 * right UI and to gate protected routes without shipping a JWT verifier to
 * the frontend.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/auth/me`, {
      headers: { ...(await forwardedFor()), Cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const body = await res.json();
    return body?.data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches one public listing for the /properties/[id] page. Wrapped in
 * cache() so generateMetadata and the page share a single request.
 * Returns null when the listing doesn't exist (or its owner is suspended).
 */
export const getProperty = cache(async (id: string): Promise<Property | null> => {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/properties/${encodeURIComponent(id)}`, {
      headers: await forwardedFor(),
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const body = await res.json();
    return body?.data?.property ?? null;
  } catch {
    return null;
  }
});

/** Fetches one published blog post for the /blog/[slug] page. Null if missing or a draft. */
export const getBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/blog/${encodeURIComponent(slug)}`, {
      headers: await forwardedFor(),
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const body = await res.json();
    return body?.data?.post ?? null;
  } catch {
    return null;
  }
});
