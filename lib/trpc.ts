import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const getBaseUrl = () => {
  const explicit =
    process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (explicit) {
    const baseUrl = explicit.replace(/\/api\/trpc$/, '').replace(/\/$/, '');
    console.log("[TRPC] Using explicit API URL:", baseUrl);
    return baseUrl;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const url = window.location.origin;
    console.log("[TRPC] Using window origin as base URL:", url);
    return url;
  }

  console.error("[TRPC] No base URL found - defaulting to window origin");
  return typeof window !== "undefined" ? window.location.origin : "";
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});
