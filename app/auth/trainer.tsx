import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function TrainerAuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, registerTrainer } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    const u = username.trim();
    const p = password.trim();
    const n = name.trim();
    if (!u || !p || (mode === 'register' && !n)) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (p.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      console.log('[TrainerAuth] Attempting', mode, 'for username:', u);
      if (mode === 'login') {
        await login(u, p);
      } else {
        await registerTrainer(u, p, n);
      }
      console.log('[TrainerAuth] Success! Redirecting to /trainer');
      router.replace('/trainer' as any);
    } catch (e: any) {
      console.error('[TrainerAuth] Error:', e);
      const message = e?.message || e?.toString() || 'No se pudo completar la acción';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}> 
      <Text style={styles.title}>Entrenador</Text>
      <View style={styles.switchRow}>
        <TouchableOpacity onPress={() => setMode('login')} style={[styles.switchBtn, mode === 'login' && styles.switchBtnActive]} testID="trainer-login-tab">
          <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('register')} style={[styles.switchBtn, mode === 'register' && styles.switchBtnActive]} testID="trainer-register-tab">
          <Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>Registrarse</Text>
        </TouchableOpacity>
      </View>

      {mode === 'register' && (
        <View>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            testID="trainer-name"
          />
        </View>
      )}

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="usuario"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        testID="trainer-username"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        testID="trainer-password"
      />

      <TouchableOpacity 
        style={[styles.primaryBtn, loading && { opacity: 0.5 }]} 
        onPress={onSubmit} 
        disabled={loading} 
        testID="trainer-submit"
        activeOpacity={0.8}
      >
        <Text style={styles.primaryText}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
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
  switchRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  switchBtnActive: {
    backgroundColor: colors.cardLight,
  },
  switchText: {
    color: colors.textSecondary,
    fontWeight: '700' as const,
  },
  switchTextActive: {
    color: colors.white,
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
