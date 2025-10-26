import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

type Props = {
  uri?: string;
  name: string;
  size: number;
  borderColor?: string;
  testID?: string;
};

export default function Avatar({ uri, name, size, borderColor, testID }: Props) {
  const initials = useMemo(() => {
    const parts = (name ?? '').split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last).toUpperCase() || 'U';
  }, [name]);

  const bg = useMemo(() => {
    const s = (name || 'user').toLowerCase();
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
    const palette = [
      '#2DD4BF', // teal
      '#F59E0B', // amber
      '#10B981', // emerald
      '#3B82F6', // blue
      '#EF4444', // red
      '#8B5CF6', // violet
      '#14B8A6', // teal-600
    ] as const;
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  }, [name]);

  const style = useMemo(() => [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor: borderColor ?? colors.neon,
    },
  ], [size, borderColor]);

  if (uri) {
    return (
      <Image
        testID={testID}
        source={{ uri }}
        style={[...style as any]}
      />
    );
  }

  return (
    <View testID={testID} style={[...style as any, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}> 
      <Text style={{ color: colors.background, fontWeight: '800', fontSize: Math.max(12, size * 0.36) }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    backgroundColor: colors.cardLight,
  },
});
