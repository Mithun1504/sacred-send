import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type } from '@/src/theme';
import { loadSession } from '@/src/session';
import { useI18n } from '@/src/i18n';

export default function Landing() {
  const router = useRouter();
  const { t } = useI18n();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    loadSession().then((s) => setHasSession(!!s && !!s.place_of_death && !!s.location));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.topBlock}>
        <View style={styles.mark} testID="landing-mark">
          <Feather name="feather" size={28} color={colors.brand} />
        </View>
        <Text style={styles.appName} testID="landing-app-name">
          {t('appName')}
        </Text>
      </View>

      <View style={styles.middleBlock}>
        <Text style={styles.subtext} testID="landing-subtext">
          {t('landingSub')}
        </Text>
        <Text style={styles.privacyLine} testID="landing-privacy">
          {t('privacyLine')}
        </Text>
      </View>

      <View style={styles.bottomBlock}>
        <Pressable
          testID="landing-start-button"
          onPress={() => router.push('/setup/location')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('startButton')}
        >
          <Text style={styles.primaryButtonText}>{t('startButton')}</Text>
        </Pressable>

        {hasSession ? (
          <Pressable
            testID="landing-continue-link"
            onPress={() => router.push('/checklist')}
            style={styles.continueLink}
          >
            <Text style={styles.continueLinkText}>{t('continueLink')}</Text>
          </Pressable>
        ) : (
          <View style={styles.continuePlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  topBlock: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: type.xl,
    color: colors.onSurface,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  middleBlock: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  subtext: {
    fontSize: type.lg,
    lineHeight: 28,
    color: colors.onSurfaceSecondary,
    textAlign: 'center',
  },
  privacyLine: {
    marginTop: spacing.md,
    fontSize: type.sm,
    color: colors.onSurfaceTertiary,
    textAlign: 'center',
  },
  bottomBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: colors.onBrandPrimary,
    fontSize: type.lg,
    fontWeight: '600',
  },
  continueLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  continueLinkText: {
    color: colors.onSurfaceSecondary,
    fontSize: type.base,
    textDecorationLine: 'underline',
  },
  continuePlaceholder: {
    marginTop: spacing.md,
    height: 40,
  },
});
