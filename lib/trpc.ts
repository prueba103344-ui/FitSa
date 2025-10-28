import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const explicit =
    process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (explicit) {
    console.log("[TRPC] Using explicit EXPO_PUBLIC_API_URL:", explicit);
    return explicit;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const url = window.location.origin;
    console.log("[TRPC] Using window origin as base URL:", url);
    return url;
  }

  console.error("[TRPC] No base URL found");
  throw new Error(
    "No base URL found. Set EXPO_PUBLIC_API_URL to your backend origin (e.g. https://api.example.com)"
  );
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
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
