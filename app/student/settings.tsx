import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { 
  User, 
  Bell, 
  Moon, 
  Globe, 
  HelpCircle, 
  Shield, 
  LogOut,
  ChevronRight,
  Target
} from 'lucide-react-native';
import { Student } from '@/types';

export default function StudentSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, logout } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState<boolean>(true);

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajustes</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No hay usuario activo</Text>
        </View>
      </View>
    );
  }

  const student = currentUser as Student;

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{student.name}</Text>
            {student.goal && (
              <View style={styles.goalContainer}>
                <Target size={14} color={colors.neon} />
                <Text style={styles.goalText} numberOfLines={1}>{student.goal}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {(student.weight || student.height || student.age) && (
          <View style={styles.statsCard}>
            {student.age && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Edad</Text>
                <Text style={styles.statValue}>{student.age} años</Text>
              </View>
            )}
            {student.weight && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Peso</Text>
                <Text style={styles.statValue}>{student.weight} kg</Text>
              </View>
            )}
            {student.height && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Altura</Text>
                <Text style={styles.statValue}>{student.height} cm</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Bell size={20} color={colors.neon} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Notificaciones</Text>
                <Text style={styles.settingSubtitle}>Recibir alertas y recordatorios</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.cardLight, true: colors.neon }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Moon size={20} color={colors.neon} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Modo Oscuro</Text>
                <Text style={styles.settingSubtitle}>Tema oscuro activado</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.cardLight, true: colors.neon }}
              thumbColor={colors.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.neon} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Idioma</Text>
                <Text style={styles.settingSubtitle}>Español</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <User size={20} color={colors.neon} />
              </View>
              <Text style={styles.settingTitle}>Información Personal</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Shield size={20} color={colors.neon} />
              </View>
              <Text style={styles.settingTitle}>Privacidad y Seguridad</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <HelpCircle size={20} color={colors.neon} />
              </View>
              <Text style={styles.settingTitle}>Ayuda y Soporte</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versión 1.0.0 (Demo)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    flex: 1,
  },
  editButton: {
    backgroundColor: colors.neon,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.background,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.neon,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.error,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
