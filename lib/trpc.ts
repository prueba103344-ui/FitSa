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

let isBackendReady = false;
let backendCheckPromise: Promise<void> | null = null;

const checkBackendHealth = async (): Promise<void> => {
  if (isBackendReady) return;
  if (backendCheckPromise) return backendCheckPromise;

  backendCheckPromise = (async () => {
    const baseUrl = getBaseUrl();
    const healthUrl = `${baseUrl}/api/health`;
    const maxAttempts = 10;
    const delayMs = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[TRPC] Checking backend health (attempt ${attempt}/${maxAttempts}):`, healthUrl);
        const response = await fetch(healthUrl, { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          console.log('[TRPC] Backend is ready:', data);
          isBackendReady = true;
          return;
        }
        console.log(`[TRPC] Backend not ready yet, status: ${response.status}`);
      } catch (error) {
        console.log(`[TRPC] Backend check failed (attempt ${attempt}):`, error instanceof Error ? error.message : String(error));
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.warn('[TRPC] Backend health check failed after all attempts');
  })();

  return backendCheckPromise;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        await checkBackendHealth();
        
        console.log('[TRPC] Fetching:', url);
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          });
          console.log('[TRPC] Response status:', response.status);
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              console.error('[TRPC] Received HTML response (likely 404). Check your backend URL.');
              const text = await response.text();
              console.error('[TRPC] Response body (first 500 chars):', text.substring(0, 500));
              throw new Error(`Backend returned ${response.status}: The endpoint may not exist or the URL is incorrect`);
            }
          }
          
          return response;
        } catch (error) {
          console.error('[TRPC] Fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
