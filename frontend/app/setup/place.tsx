import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, saveSession, emptySession, type Place } from '@/src/session';
import { ProgressDots } from '@/src/components/ProgressDots';
import { BackButton, OptionCard, PrimaryButton } from '@/src/components/Buttons';

export default function PlaceSetup() {
  const router = useRouter();
  const { t } = useI18n();
  const [place, setPlace] = useState<Place | null>(null);

  const next = async () => {
    if (!place) return;
    const existing = (await loadSession()) ?? emptySession();
    await saveSession({ ...existing, place_of_death: place });
    router.push('/setup/religion');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <ProgressDots total={3} current={1} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} testID="setup-place-title">
          {t('placeTitle')}
        </Text>

        <View style={styles.options}>
          <OptionCard
            label={t('placeHospital')}
            icon="plus-square"
            selected={place === 'hospital'}
            onPress={() => setPlace('hospital')}
            testID="setup-place-hospital"
          />
          <OptionCard
            label={t('placeHome')}
            icon="home"
            selected={place === 'home'}
            onPress={() => setPlace('home')}
            testID="setup-place-home"
          />
          <OptionCard
            label={t('placeOther')}
            icon="map-pin"
            selected={place === 'other'}
            onPress={() => setPlace('other')}
            testID="setup-place-other"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={t('next')} onPress={next} disabled={!place} testID="setup-place-next" />
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
  body: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: type.xxl,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  options: {
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
  },
});
