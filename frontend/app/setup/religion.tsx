import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, saveSession, emptySession, type Religion } from '@/src/session';
import { ProgressDots } from '@/src/components/ProgressDots';
import { BackButton, OptionCard, PrimaryButton, GhostButton } from '@/src/components/Buttons';

const OPTIONS: { key: NonNullable<Religion>; label: string }[] = [
  { key: 'hindu', label: 'hindu' },
  { key: 'muslim', label: 'muslim' },
  { key: 'christian', label: 'christian' },
  { key: 'sikh', label: 'sikh' },
  { key: 'secular', label: 'secular' },
];

export default function ReligionSetup() {
  const router = useRouter();
  const { t } = useI18n();
  const [religion, setReligion] = useState<Religion>(null);

  const finish = async (skipped: boolean) => {
    const existing = (await loadSession()) ?? emptySession();
    const finalReligion: Religion = skipped ? null : religion;
    await saveSession({
      ...existing,
      religion: finalReligion,
      createdAt: existing.createdAt || new Date().toISOString(),
    });
    router.replace('/checklist');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <ProgressDots total={3} current={2} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} testID="setup-religion-title">
          {t('religionTitle')}
        </Text>
        <Text style={styles.help}>{t('religionHelp')}</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionCard
              key={o.key}
              label={t(o.label)}
              selected={religion === o.key}
              onPress={() => setReligion(o.key)}
              testID={`setup-religion-${o.key}`}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('next')}
          onPress={() => finish(false)}
          disabled={!religion}
          testID="setup-religion-next"
        />
        <GhostButton label={t('skip')} onPress={() => finish(true)} testID="setup-religion-skip" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  body: { padding: spacing.lg, paddingTop: spacing.xl },
  title: {
    fontSize: type.xxl,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  help: {
    fontSize: type.base,
    color: colors.onSurfaceSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  options: { gap: spacing.xs },
  footer: { padding: spacing.lg },
});
