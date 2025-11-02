import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { Lock, LogOut, Plus, Trash2 } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

export default function AdminScreen() {

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [newExerciseImageUrl, setNewExerciseImageUrl] = useState<string>('');

  const loginMutation = trpc.admin.login.useMutation();
  const overviewQuery = trpc.admin.overview.useQuery({ adminKey: adminKey ?? '' }, { enabled: !!adminKey });
  const exercisesQuery = trpc.exercises.list.useQuery(undefined, { enabled: !!adminKey });
  const upsertExercise = trpc.exercises.upsert.useMutation({
    onSuccess: () => {
      exercisesQuery.refetch();
      setNewExerciseName('');
      setNewExerciseImageUrl('');
    },
  });
  const removeExercise = trpc.exercises.remove.useMutation({
    onSuccess: () => exercisesQuery.refetch(),
  });

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa usuario y contraseña');
      return;
    }
    console.log('Intentando login con:', username);
    try {
      const res = await loginMutation.mutateAsync({ username, password });
      console.log('Login exitoso:', res);
      setAdminKey(res.adminKey);
    } catch (e: any) {
      console.error('Error de login:', e);
      Alert.alert('Error', e?.message ?? 'Credenciales inválidas');
    }
  };

  const handleAddExercise = async () => {
    if (!newExerciseName.trim() || !newExerciseImageUrl.trim()) {
      Alert.alert('Falta información', 'Escribe nombre e URL de imagen');
      return;
    }
    try {
      await upsertExercise.mutateAsync({ adminKey: adminKey as string, name: newExerciseName.trim(), imageUrl: newExerciseImageUrl.trim() });
      Alert.alert('Guardado', 'Ejercicio añadido');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  };

  if (!adminKey) {
    return (
      <SafeAreaView style={styles.container} edges={['top','bottom']}>
        <Stack.Screen options={{ title: 'Panel Admin' }} />
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Lock color={colors.neon} size={28} />
            <Text style={styles.title}>Acceso Administrador</Text>
          </View>
          <Text style={styles.label}>Usuario</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="admin" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry placeholderTextColor={colors.textSecondary} />
          <TouchableOpacity 
            style={[styles.primaryButton, loginMutation.isPending && { opacity: 0.6 }]} 
            onPress={handleLogin} 
            testID="admin-login"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Panel Admin' }} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Entrenadores</Text></View>
        {overviewQuery.data?.trainers.map(t => (
          <View key={t.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.name}</Text>
              <Text style={styles.rowSub}>@{t.username}</Text>
            </View>
            <View style={styles.kpis}>
              <Text style={styles.kpi}><Text style={styles.kpiNumber}>{t.activeClients}</Text> alumnos</Text>
              <Text style={styles.kpi}><Text style={styles.kpiNumber}>{t.workouts}</Text> entrenos</Text>
              <Text style={styles.kpi}><Text style={styles.kpiNumber}>{t.diets}</Text> dietas</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Catálogo de Ejercicios</Text></View>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={newExerciseName} onChangeText={setNewExerciseName} placeholder="Press banca" placeholderTextColor={colors.textSecondary} />
          <Text style={styles.label}>URL de imagen</Text>
          <TextInput style={styles.input} value={newExerciseImageUrl} onChangeText={setNewExerciseImageUrl} placeholder="https://..." placeholderTextColor={colors.textSecondary} />
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise} testID="exercise-add">
            <Plus color={colors.background} size={18} />
            <Text style={styles.primaryButtonText}>Añadir ejercicio</Text>
          </TouchableOpacity>
        </View>

        {(exercisesQuery.data ?? []).map(ex => (
          <View key={ex.id} style={styles.row}>
            <Image source={{ uri: ex.imageUrl }} style={styles.thumb} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>{ex.name}</Text>
              <Text style={styles.rowSub}>{ex.imageUrl}</Text>
            </View>
            <TouchableOpacity onPress={() => removeExercise.mutate({ adminKey: adminKey as string, id: ex.id })}>
              <Trash2 color={colors.error} size={18} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 8 }]} onPress={() => setAdminKey(null)}>
        <LogOut color={colors.white} size={18} />
        <Text style={styles.secondaryButtonText}>Salir</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' as const, marginTop: 8 },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: '600' as const },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.white, borderWidth: 1, borderColor: colors.border },
  primaryButton: { marginTop: 16, backgroundColor: colors.neon, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: colors.background, fontWeight: '800' as const, fontSize: 16 },
  secondaryButton: { backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.white, fontWeight: '700' as const, fontSize: 16 },
  section: { marginTop: 16, gap: 12 },
  sectionHeader: { paddingHorizontal: 4, paddingVertical: 4 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '800' as const },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  rowTitle: { color: colors.white, fontSize: 16, fontWeight: '700' as const },
  rowSub: { color: colors.textSecondary, fontSize: 12 },
  kpis: { flexDirection: 'row', gap: 10 },
  kpi: { color: colors.textSecondary, fontSize: 12 },
  kpiNumber: { color: colors.neon, fontWeight: '800' as const },
  thumb: { width: 56, height: 56, borderRadius: 8 },
});