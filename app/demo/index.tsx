import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Lock, UserCircle2 } from 'lucide-react-native';

export default function DemoAuthScreen() {
  const router = useRouter();
  const { registerOrLoginDemo } = useApp();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Introduce usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      await registerOrLoginDemo(username, password);
      router.replace('/trainer/' as any);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      Alert.alert('No se pudo iniciar sesión', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modo demo (Entrenador)</Text>
        <Text style={styles.subtitle}>Crea una cuenta demo o inicia sesión para probar FitSa sin riesgos.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <UserCircle2 color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Usuario"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            testID="demo-username"
          />
        </View>

        <View style={styles.inputRow}>
          <Lock color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            testID="demo-password"
          />
        </View>

        <TouchableOpacity style={styles.submit} onPress={onSubmit} disabled={loading} testID="demo-submit">
          <Text style={styles.submitText}>{loading ? 'Entrando...' : 'Entrar en modo demo'}</Text>
        </TouchableOpacity>

        <Text style={styles.helper}>Tus datos demo son privados y se borrarán al cerrar sesión o tras 24h de inactividad.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
  },
  submit: {
    backgroundColor: colors.neon,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: colors.background,
    fontWeight: '800' as const,
    fontSize: 16,
  },
  helper: {
    color: colors.textTertiary,
    textAlign: 'center' as const,
    marginTop: 8,
  },
});
