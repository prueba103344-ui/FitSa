import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from 'react-native';
import { AppProvider } from '@/contexts/AppContext';
import { trpc, trpcClient } from '@/lib/trpc';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
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
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={styles.flex}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
