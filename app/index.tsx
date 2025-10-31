import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import colors from '@/constants/colors';
import { Dumbbell, User } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const handleTrainerPress = () => {
    router.push('/auth/trainer' as any);
  };

  const handleStudentPress = () => {
    router.push('/auth/student' as any);
  };

  const handleAdminPress = () => {
    router.push('/auth/admin' as any);
  };



  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=2000&fit=crop' }}
        style={styles.background}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(10, 10, 10, 0.85)', 'rgba(10, 10, 10, 0.95)', colors.background]}
          style={styles.gradient}
        >
          <View style={[styles.content, { paddingTop: 80 + insets.top, paddingBottom: 60 + insets.bottom }]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Dumbbell size={48} color={colors.neon} strokeWidth={2.5} />
              </View>
              <Text style={styles.logo}>FitSa</Text>
              <Text style={styles.tagline}>Entrena, come y progresa con precisión 💪</Text>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.trainerButton]}
                onPress={handleTrainerPress}
                activeOpacity={0.8}
                testID="login-trainer"
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8C42']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Dumbbell size={32} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.buttonText}>Soy Entrenador</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.studentButton]}
                onPress={handleStudentPress}
                activeOpacity={0.8}
                testID="login-student"
              >
                <LinearGradient
                  colors={[colors.neon, colors.neonDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <User size={32} color={colors.background} strokeWidth={2.5} />
                  <Text style={[styles.buttonText, styles.studentButtonText]}>Soy Alumno</Text>
                </LinearGradient>
              </TouchableOpacity>


            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Inicia sesión o regístrate para continuar</Text>
              <TouchableOpacity onPress={handleAdminPress} activeOpacity={0.8} testID="go-admin" style={styles.adminLink}>
                <Text style={styles.adminText}>Entrar como admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: -2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    gap: 20,
  },
  button: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  trainerButton: {
    shadowColor: '#FF6B35',
  },
  studentButton: {
    shadowColor: colors.neon,
  },

  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    letterSpacing: 0.5,
  },
  studentButtonText: {
    color: colors.background,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  adminLink: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminText: {
    color: colors.neon,
    fontWeight: '800' as const,
  },
});
