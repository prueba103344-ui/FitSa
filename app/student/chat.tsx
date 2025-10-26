import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { MessageCircle } from 'lucide-react-native';

export default function StudentChatScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.placeholderContainer}>
            <MessageCircle size={64} color={colors.textSecondary} />
            <Text style={styles.placeholderTitle}>Chat con tu Entrenador</Text>
            <Text style={styles.placeholderText}>
              Esta funcionalidad estará disponible próximamente.{'\n'}
              Podrás comunicarte directamente con tu entrenador.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.white,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
