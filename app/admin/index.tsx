import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import colors from '@/constants/colors';
import { Users, Dumbbell, UtensilsCrossed, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const query = trpc.admin.listTrainersWithCounts.useQuery(undefined, { refetchOnMount: false, refetchOnWindowFocus: false });
  const [search, setSearch] = useState<string>('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return query.data?.items ?? [];
    return (query.data?.items ?? []).filter(t =>
      t.name.toLowerCase().includes(term) || t.username.toLowerCase().includes(term) || t.id.toLowerCase().includes(term)
    );
  }, [query.data, search]);

  const onRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }] }>
      <Stack.Screen options={{ headerShown: true, title: 'Admin · Entrenadores', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar por nombre, usuario o ID"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            testID="admin-search"
          />
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} testID="admin-refresh" activeOpacity={0.8}>
          <RefreshCw color={colors.background} size={18} />
          <Text style={styles.refreshTxt}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.neon} />
        </View>
      ) : query.error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error al cargar: {String(query.error.message ?? query.error)}</Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { marginTop: 12 }]}>
            <Text style={styles.refreshTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card} testID={`trainer-${item.id}`}>
              <View style={styles.row}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>{item.username} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Users color={colors.neon} size={18} />
                  <Text style={styles.metricNum}>{item.counts.students}</Text>
                  <Text style={styles.metricLabel}>Alumnos</Text>
                </View>
                <View style={styles.metric}>
                  <Dumbbell color={colors.neon} size={18} />
                  <Text style={styles.metricNum}>{item.counts.workouts}</Text>
                  <Text style={styles.metricLabel}>Entrenos</Text>
                </View>
                <View style={styles.metric}>
                  <UtensilsCrossed color={colors.neon} size={18} />
                  <Text style={styles.metricNum}>{item.counts.diets}</Text>
                  <Text style={styles.metricLabel}>Dietas</Text>
                </View>
              </View>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.headerSummary}>
              <Text style={styles.headerTitle}>Total entrenadores: {query.data?.totalTrainers ?? 0}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.error },
  toolbar: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  searchBox: { flex: 1 },
  input: { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: colors.white, borderWidth: 1, borderColor: colors.border },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.neon, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  refreshTxt: { color: colors.background, fontWeight: '800' as const },
  headerSummary: { paddingVertical: 8 },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '800' as const },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.white, fontWeight: '900' as const, fontSize: 16 },
  sub: { color: colors.textSecondary, marginTop: 2 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metric: { flex: 1, alignItems: 'center', gap: 4 },
  metricNum: { color: colors.white, fontWeight: '900' as const, fontSize: 18 },
  metricLabel: { color: colors.textSecondary, fontSize: 12 },
});
