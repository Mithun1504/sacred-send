import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/src/theme';

export function BackButton({ onPress, testID }: { onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID ?? 'back-button'}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      hitSlop={12}
    >
      <Feather name="chevron-left" size={22} color={colors.onSurface} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function OptionCard({
  label,
  icon,
  selected,
  onPress,
  testID,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && { opacity: 0.9 },
      ]}
    >
      {icon ? (
        <View style={styles.optionIcon}>
          <Feather name={icon} size={22} color={selected ? colors.onBrandTertiary : colors.brand} />
        </View>
      ) : null}
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected ? <Feather name="check" size={20} color={colors.brand} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  primary: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: colors.borderStrong,
  },
  primaryText: {
    color: colors.onBrandPrimary,
    fontSize: type.lg,
    fontWeight: '600',
  },
  ghost: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ghostText: {
    color: colors.onSurfaceSecondary,
    fontSize: type.base,
    textDecorationLine: 'underline',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brand,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: type.lg,
    color: colors.onSurface,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.onBrandTertiary,
    fontWeight: '600',
  },
});
