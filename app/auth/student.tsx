import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function StudentAuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useApp();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (p.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      console.log('[StudentAuth] Attempting login for username:', u);
      await login(u, p);
      console.log('[StudentAuth] Success! Redirecting to /student');
      router.replace('/student' as any);
    } catch (e: any) {
      console.error('[StudentAuth] Error:', e);
      const message = e?.message || e?.toString() || 'No se pudo iniciar sesión';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}> 
      <Text style={styles.title}>Alumno</Text>

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="usuario"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        testID="student-username"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        testID="student-password"
      />

      <TouchableOpacity 
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]} 
        onPress={onSubmit} 
        disabled={loading} 
        testID="student-submit"
        activeOpacity={0.8}
      >
        <Text style={styles.primaryText}>
          {loading ? 'Cargando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 32,
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
});
