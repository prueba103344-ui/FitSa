import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from '@/contexts/AppContext';
import { trpc, getBaseUrl } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { View, ActivityIndicator } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/trainer" options={{ headerShown: false }} />
      <Stack.Screen name="auth/student" options={{ headerShown: false }} />

      <Stack.Screen name="trainer" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="demo" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [trpcReactClient] = useState(() =>
    trpc.createClient({
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
    })
  );



  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcReactClient} queryClient={queryClient}>
        <AppProvider>
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
