import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
    return envUrl;
  }
  console.error(
    "[TRPC] No base URL found in EXPO_PUBLIC_RORK_API_BASE_URL; API calls will fail. Please start with the provided dev script."
  );
  throw new Error("Missing EXPO_PUBLIC_RORK_API_BASE_URL");
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
