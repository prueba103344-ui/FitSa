import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { getAccessToken } from "@/lib/supabase";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const candidates = [
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_RORK_URL,
  ].filter((v): v is string => Boolean(v && typeof v === 'string' && v.length > 0));

  if (candidates.length > 0) {
    const chosen = candidates[0]!;
    console.log('[TRPC] Using base URL from env:', chosen);
    return chosen;
  }

  if (Platform.OS !== 'web') {
    console.log('[TRPC] Using default dev URL for native');
    return 'http://127.0.0.1:3000';
  }

  console.warn('[TRPC] No backend URL env set. Avoiding same-origin fallback on web to prevent 404 HTML. Using default dev URL.');
  return 'http://127.0.0.1:3000';
};

const getUrlSafe = () => `${getBaseUrl()}/api/trpc`;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getUrlSafe(),
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          const token = await getAccessToken();
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('text/html') || contentType.includes('text/plain')) {
            const preview = await response.clone().text();
            console.error('[TRPC] Received non-JSON response. Status:', response.status);
            console.error('[TRPC] Response body (first 500):', preview.slice(0, 500));
            console.error('[TRPC] URL:', url);
            throw new Error('Backend no disponible. Verifica la URL del backend o que esté ejecutándose.');
          }

          if (!response.ok) {
            console.error('[TRPC] HTTP error', response.status, response.statusText);
            throw new Error('Backend no disponible. Por favor, reinicia la aplicación o contacta soporte.');
          }

          return response;
        } catch (error) {
          const err = error as Error;
          if (err.name === 'TypeError') {
            console.error('[TRPC] Network/Fetch error:', err.message);
          }
          throw err;
        }
      },
    }),
  ],
});
