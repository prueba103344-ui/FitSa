import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export type LinePoint = { x: string; y: number };

interface LineChartProps {
  data: LinePoint[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  gradientFill?: string;
  testID?: string;
}

export default function LineChart({
  data,
  width,
  height,
  color = '#4ADE80',
  strokeWidth = 2,
  showDots = true,
  gradientFill,
  testID,
}: LineChartProps) {
  const { pathD, dots, areaD } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathD: '', dots: [] as { cx: number; cy: number }[], areaD: '' };
    }

    const ys = data.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yRange = maxY - minY || 1;

    const xStep = data.length > 1 ? width / (data.length - 1) : 0;

    const points = data.map((p, i) => {
      const x = i * xStep;
      const y = height - ((p.y - minY) / yRange) * height;
      return { x, y };
    });

    let d = '';
    points.forEach((pt, i) => {
      d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    });

    const area = gradientFill
      ? `M 0 ${height} L ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ') +
        ` L ${points[points.length - 1].x} ${height} Z`
      : '';

    const ds = points.map(pt => ({ cx: pt.x, cy: pt.y }));

    return { pathD: d, dots: ds, areaD: area };
  }, [data, width, height, gradientFill]);

  return (
    <View style={styles.container} testID={testID}>
      <Svg width={width} height={height}>
        {gradientFill && (
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradientFill} stopOpacity={0.35} />
              <Stop offset="1" stopColor={gradientFill} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
        )}
        {gradientFill && areaD ? (
          <Path d={areaD} fill="url(#grad)" />
        ) : null}
        {pathD ? (
          <Path d={pathD} stroke={color} strokeWidth={strokeWidth} fill="none" />
        ) : null}
        {showDots && dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={3} fill={color} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
