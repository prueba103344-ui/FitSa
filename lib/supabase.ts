import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer' | string;
  expires_in?: number;
  expires_at?: number;
  user?: any;
};

const STORAGE_KEYS = {
  SESSION: '@supabase_session',
} as const;

const DEFAULT_URL = 'https://bodfawufyjcplkxgyqzb.supabase.co';
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZGZhd3VmeWpjcGxreGd5cXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDYyNTIsImV4cCI6MjA3NzEyMjI1Mn0.-joelNsNO1DIGmH5CYSoxlqoDTgKcFoX-En5HTX89S8';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_ANON;

function assertEnv() {
  if (!url || !anon) {
    console.error('[Supabase] Missing Supabase credentials');
    throw new Error('Supabase not configured');
  }
}

export async function getSession(): Promise<SupabaseSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as SupabaseSession;
    return session ?? null;
  } catch (e) {
    console.error('[Supabase] getSession error', e);
    return null;
  }
}

async function setSession(session: SupabaseSession | null) {
  if (!session) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export async function signInWithPassword(params: { email: string; password: string }) {
  assertEnv();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Supabase] signIn failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as SupabaseSession;
  await setSession(data);
  return data;
}

export async function signUp(params: { email: string; password: string; data?: Record<string, any> }) {
  assertEnv();
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      data: params.data ?? {},
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Supabase] signUp failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  return data;
}

export async function signOut() {
  assertEnv();
  const session = await getSession();
  try {
    await fetch(`${url}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: session ? `${session.token_type} ${session.access_token}` : '',
      },
    });
  } finally {
    await setSession(null);
  }
}

export async function getAccessToken(): Promise<string | null> {
  const s = await getSession();
  return s?.access_token ?? null;
}

export async function uploadToStorage(params: { bucket: string; path: string; uri: string; contentType?: string }) {
  assertEnv();
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  let body: any;
  let contentType = params.contentType ?? 'application/octet-stream';

  if (Platform.OS === 'web') {
    const resp = await fetch(params.uri);
    body = await resp.blob();
    contentType = body.type || contentType;
  } else {
    body = { uri: params.uri, name: params.path.split('/').pop() ?? 'file', type: contentType } as any;
  }

  const endpoint = `${url}/storage/v1/object/${encodeURIComponent(params.bucket)}/${params.path}`;

  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', body as Blob);
  } else {
    form.append('file', body);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `${session.token_type} ${session.access_token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Supabase] upload failed: ${res.status} ${text}`);
  }

  const publicUrl = `${url}/storage/v1/object/public/${encodeURIComponent(params.bucket)}/${params.path}`;
  return { publicUrl };
}
