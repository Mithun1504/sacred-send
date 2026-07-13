import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, daysSinceStart } from '@/src/session';
import { api, type Contact } from '@/src/api';
import { BackButton } from '@/src/components/Buttons';

export default function Contacts() {
  const router = useRouter();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await loadSession();
      if (!s) {
        router.replace('/');
        return;
      }
      const day = daysSinceStart(s);
      try {
        const res = await api.getContacts(s.religion, day);
        setContacts(res.contacts);
      } catch {}
      setLoading(false);
    })();
  }, [router]);

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title} testID="contacts-title">
          {t('contactsTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {contacts.map((c) => (
            <View key={c.id} style={styles.card} testID={`contact-card-${c.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.role}>{c.role}</Text>
                <Text style={styles.phone}>{c.phone}</Text>
              </View>
              <Pressable
                onPress={() => call(c.phone)}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.9 }]}
                testID={`contact-call-${c.id}`}
              >
                <Feather name="phone" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.callText}>{t('call')}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
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
  body: { padding: spacing.lg, gap: spacing.sm },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 88,
    marginBottom: spacing.sm,
  },
  name: { fontSize: type.base, fontWeight: '600', color: colors.onSurface },
  role: { fontSize: type.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  phone: { fontSize: type.sm, color: colors.onSurfaceTertiary, marginTop: 4 },
  callBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    minWidth: 92,
    justifyContent: 'center',
  },
  callText: { color: colors.onBrandPrimary, fontSize: type.base, fontWeight: '600' },
});
