import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { colors, spacing, radius, type } from '@/src/theme';
import { LANG_LABELS, useI18n, type Lang } from '@/src/i18n';
import { clearSession, loadSession, updateSession } from '@/src/session';
import { BackButton, PrimaryButton, GhostButton } from '@/src/components/Buttons';

const LANGS: Lang[] = ['en', 'hi', 'ta', 'kn', 'te'];

export default function Settings() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remOn, setRemOn] = useState(false);

  useEffect(() => {
    loadSession().then((s) => setRemOn(!!s?.remindersEnabled));
  }, []);

  const doClear = async () => {
    await clearSession();
    setConfirmOpen(false);
    router.replace('/');
  };

  const toggleReminders = async (val: boolean) => {
    if (val) {
      const perm = await Notifications.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setRemOn(false);
        return;
      }
      // Schedule a gentle reminder in 24 hours
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'A gentle reminder',
          body: 'When you have a moment, check the "Today" list.',
          sound: undefined,
        },
        trigger: { seconds: 60 * 60 * 24, repeats: false } as any,
      });
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setRemOn(val);
    await updateSession({ remindersEnabled: val });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title} testID="settings-title">
          {t('settingsTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>{t('changeLanguage')}</Text>
        <View style={styles.langGroup}>
          {LANGS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={({ pressed }) => [
                styles.langRow,
                lang === l && styles.langRowActive,
                pressed && { opacity: 0.85 },
              ]}
              testID={`settings-lang-${l}`}
            >
              <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                {LANG_LABELS[l]}
              </Text>
              {lang === l && <Feather name="check" size={20} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t('reminders')}</Text>
        <Text style={styles.helpText}>{t('remindersHelp')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            {remOn ? t('remindersOn') : t('enableReminders')}
          </Text>
          <Switch
            testID="settings-reminders-switch"
            value={remOn}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.brandSecondary, false: colors.borderStrong }}
            thumbColor={remOn ? colors.brand : colors.surface}
          />
        </View>

        <View style={{ height: spacing.xl }} />

        <Pressable
          onPress={() => router.replace('/setup/location')}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.85 }]}
          testID="settings-change-location"
        >
          <Feather name="map-pin" size={18} color={colors.onSurface} />
          <Text style={styles.actionText}>{t('changeLocation')}</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await clearSession();
            router.replace('/');
          }}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.85 }]}
          testID="settings-start-over"
        >
          <Feather name="refresh-cw" size={18} color={colors.onSurface} />
          <Text style={styles.actionText}>{t('startOver')}</Text>
        </Pressable>

        <Pressable
          onPress={() => setConfirmOpen(true)}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.85 }]}
          testID="settings-clear-all"
        >
          <Feather name="trash-2" size={18} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>{t('clearAll')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet} testID="settings-clear-confirm">
            <Text style={styles.modalTitle}>{t('clearConfirm')}</Text>
            <Text style={styles.modalSubtitle}>This cannot be undone.</Text>
            <PrimaryButton label={t('yesClear')} onPress={doClear} testID="settings-clear-yes" />
            <GhostButton
              label={t('cancel')}
              onPress={() => setConfirmOpen(false)}
              testID="settings-clear-cancel"
            />
          </View>
        </View>
      </Modal>
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
  section: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  langGroup: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  langRowActive: {
    backgroundColor: colors.brandTertiary,
  },
  langText: { fontSize: type.base, color: colors.onSurface },
  langTextActive: { fontWeight: '600', color: colors.onBrandTertiary },
  helpText: { fontSize: type.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    minHeight: 56,
  },
  switchLabel: { fontSize: type.base, color: colors.onSurface, flex: 1 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: { fontSize: type.base, color: colors.onSurface, fontWeight: '500' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44,48,46,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: type.lg,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
