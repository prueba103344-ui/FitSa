import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { AppRouter } from '@/backend/trpc/app-router';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

export const runtime = 'edge';

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter as unknown as AppRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
