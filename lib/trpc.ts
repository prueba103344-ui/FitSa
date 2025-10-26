import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    console.log('📍 Using relative URL for API routes');
    return "";
  }

  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0 && !envUrl.includes('rorktest.dev')) {
    console.log('📍 Using EXPO_PUBLIC_RORK_API_BASE_URL:', envUrl);
    return envUrl.replace(/\/$/, "");
  }

  console.log('📍 Using relative URL for API routes (native)');
  return "";
};

const createHttpLink = () => httpBatchLink({
  url: `${getBaseUrl()}/api/trpc`,
  transformer: superjson,
  maxURLLength: 2083,
  fetch: async (url, options) => {
    try {
      console.log('🔄 Fetching from:', url);
      const response = await fetch(url, options);
      
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        console.error('❌ Backend returned non-JSON response:', contentType);
        const text = await response.text();
        console.error('Response preview:', text.substring(0, 200));
        console.error('Full URL attempted:', url);
        console.error('Base URL:', getBaseUrl());
        throw new Error(`Backend returned ${contentType || 'unknown'} instead of JSON. Is the backend running at /api?`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ tRPC fetch error:', error);
      throw error;
    }
  },
});

export const trpcReactClient = trpc.createClient({
  links: [createHttpLink()],
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createHttpLink()],
});
