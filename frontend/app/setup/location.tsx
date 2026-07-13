import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { emptySession, saveSession, loadSession } from '@/src/session';
import { ProgressDots } from '@/src/components/ProgressDots';
import { BackButton, PrimaryButton } from '@/src/components/Buttons';

export default function LocationSetup() {
  const router = useRouter();
  const { t } = useI18n();
  const [location, setLocation] = useState('');
  const [detecting, setDetecting] = useState(false);

  const detect = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const rev = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const first = rev[0];
        if (first) {
          const label = [first.city, first.region].filter(Boolean).join(', ');
          setLocation(label || 'Detected location');
        }
      }
    } catch {}
    setDetecting(false);
  };

  const next = async () => {
    const existing = (await loadSession()) ?? emptySession();
    await saveSession({ ...existing, location: location.trim() || 'Not specified' });
    router.push('/setup/place');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} testID="setup-back" />
          <ProgressDots total={3} current={0} />
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} testID="setup-location-title">
            {t('locationTitle')}
          </Text>
          <Text style={styles.help}>{t('locationHelp')}</Text>

          <TextInput
            testID="setup-location-input"
            value={location}
            onChangeText={setLocation}
            placeholder={t('locationPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="done"
          />

          <Pressable
            testID="setup-location-detect"
            onPress={detect}
            style={({ pressed }) => [styles.detectRow, pressed && { opacity: 0.7 }]}
          >
            <Feather name="map-pin" size={18} color={colors.brand} />
            <Text style={styles.detectText}>{detecting ? t('detecting') : t('useMyLocation')}</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={t('next')} onPress={next} testID="setup-location-next" />
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: spacing.sm,
  },
  help: {
    fontSize: type.base,
    color: colors.onSurfaceSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: type.lg,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 56,
  },
  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  detectText: {
    color: colors.brand,
    fontSize: type.base,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
  },
});
