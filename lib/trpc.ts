import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { getAccessToken } from "@/lib/supabase";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
    console.log('[TRPC] Using base URL:', envUrl);
    return envUrl;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    console.log('[TRPC] Falling back to same-origin base URL on web:', origin);
    return origin;
  }
  console.warn("[TRPC] No base URL configured. tRPC calls will be disabled until backend is available.");
  return "";
};

const getUrlSafe = () => {
  const base = getBaseUrl();
  if (!base) {
    return "http://127.0.0.1:3000/api/trpc";
  }
  return `${base}/api/trpc`;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getUrlSafe(),
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          const baseUrl = getBaseUrl();
          if (!baseUrl) {
            console.warn('[TRPC] Skipping request because backend base URL is not set');
            throw new Error('Backend no disponible.');
          }

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
          if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
            console.error('[TRPC] Network error - cannot connect to backend:', error);
            throw new Error('No se pudo conectar al servidor. Por favor, verifica que hayas iniciado la aplicación con "bun start".');
          }
          throw error as Error;
        }
      },
    }),
  ],
});
