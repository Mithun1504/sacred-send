import { View, StyleSheet } from 'react-native';
import { colors } from '@/src/theme';

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row} testID="progress-dots">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.dotActive : i < current ? styles.dotDone : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.brand,
    width: 24,
  },
  dotDone: {
    backgroundColor: colors.brandSecondary,
  },
});
