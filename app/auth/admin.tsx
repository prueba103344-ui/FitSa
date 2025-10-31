import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { Shield } from 'lucide-react-native';

export default function AdminAuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { adminLogin } = useApp();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Introduce usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      console.log('[AdminAuth] Attempting admin login for:', username);
      await adminLogin(username, password);
      router.replace('/admin' as any);
    } catch (e: any) {
      console.error('[AdminAuth] Error:', e);
      const message = e?.message || 'No se pudo iniciar sesión';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}> 
      <View style={styles.iconWrap}>
        <Shield color={colors.neon} size={36} />
      </View>
      <Text style={styles.title}>Panel Admin</Text>

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="admin"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        testID="admin-username"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        testID="admin-password"
      />

      <TouchableOpacity 
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]} 
        onPress={onSubmit} 
        disabled={loading} 
        testID="admin-submit"
        activeOpacity={0.8}
      >
        <Text style={styles.primaryText}>
          {loading ? 'Cargando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Por defecto: admin / admin123 (puedes cambiarlo con variables EXPO_PUBLIC_ADMIN_USER y EXPO_PUBLIC_ADMIN_PASS)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 8,
  },
  label: {
    color: colors.white,
    fontWeight: '700' as const,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.neon,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: {
    color: colors.background,
    fontWeight: '800' as const,
    fontSize: 16,
  },
  hint: {
    marginTop: 12,
    color: colors.textTertiary,
    fontSize: 12,
  }
});
