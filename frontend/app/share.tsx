import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, updateSession } from '@/src/session';
import { api } from '@/src/api';
import { BackButton, PrimaryButton } from '@/src/components/Buttons';

export default function Share() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const s = await loadSession();
      if (s) {
        setName(s.familyName ?? '');
        setTime(s.cremationTime ?? '');
        setPlace(s.cremationPlace ?? s.location ?? '');
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.shareMessage({
          name: name.trim() || undefined,
          time: time.trim() || undefined,
          place: place.trim() || undefined,
          language: lang,
        });
        setMsg(res.message);
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [name, time, place, lang]);

  const openWhatsapp = async () => {
    await updateSession({ familyName: name, cremationTime: time, cremationPlace: place });
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title} testID="share-title">
            {t('shareTitle')}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.helpText}>{t('shareHelp')}</Text>

          <Text style={styles.label}>{t('nameLabel')}</Text>
          <TextInput
            testID="share-name"
            value={name}
            onChangeText={setName}
            placeholder="The Rao family"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>{t('timeLabel')}</Text>
          <TextInput
            testID="share-time"
            value={time}
            onChangeText={setTime}
            placeholder="Tomorrow, 4 pm"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>{t('placeLabel')}</Text>
          <TextInput
            testID="share-place"
            value={place}
            onChangeText={setPlace}
            placeholder="Local cremation ground"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <View style={styles.preview} testID="share-preview">
            <Text style={styles.previewText}>{msg}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('openWhatsApp')}
            onPress={openWhatsapp}
            testID="share-open-whatsapp"
          />
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
  title: {
    flex: 1,
    fontSize: type.lg,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },
  body: { padding: spacing.lg },
  helpText: {
    fontSize: type.base,
    color: colors.onSurfaceSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: type.sm,
    fontWeight: '600',
    color: colors.onSurfaceSecondary,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: type.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 48,
  },
  preview: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    borderWidth: 1,
    borderColor: colors.brandSecondary,
  },
  previewText: {
    fontSize: type.base,
    lineHeight: 24,
    color: colors.onBrandTertiary,
  },
  footer: { padding: spacing.lg },
});
