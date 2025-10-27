import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
    console.log('[TRPC] Using base URL:', envUrl);
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
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              throw new Error(`Backend no disponible. Por favor, reinicia la aplicación o contacta soporte.`);
            }
          }
          
          return response;
        } catch (error) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
          }
          throw error;
        }
      },
    }),
  ],
});
