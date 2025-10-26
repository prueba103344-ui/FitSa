import { Tabs } from 'expo-router';
import { Home, TrendingUp, Settings, Apple, Dumbbell } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Entrenamiento',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Dieta',
          tabBarIcon: ({ color, size }) => <Apple color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meal-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
