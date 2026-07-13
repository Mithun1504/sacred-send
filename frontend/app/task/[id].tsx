import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, updateSession, type Session } from '@/src/session';
import { api, type Task, type Contact } from '@/src/api';
import { BackButton, PrimaryButton } from '@/src/components/Buttons';

const DOC_LABELS: Record<string, string> = {
  aadhaar: 'docAadhaar',
  id_proof: 'docId',
  insurance: 'docInsurance',
  hospital: 'docHospital',
};

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [whyOpen, setWhyOpen] = useState(true);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const s = await loadSession();
    if (!s) {
      router.replace('/');
      return;
    }
    setSession(s);
    try {
      const res = await api.getChecklist(s.place_of_death, s.religion, s.location);
      const found = res.tasks.find((tk) => tk.id === id);
      setTask(found ?? null);
      if (found?.contacts.length) {
        const c = await api.getContacts(s.religion, 99);
        setContacts(c.contacts.filter((cc) => found.contacts.includes(cc.id) || found.contacts.includes(cc.category)));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isDone = session && task ? session.doneTaskIds.includes(task.id) : false;

  const toggleDone = async () => {
    if (!task || !session) return;
    const done = new Set(session.doneTaskIds);
    if (done.has(task.id)) {
      done.delete(task.id);
      setShowDone(false);
    } else {
      done.add(task.id);
      setShowDone(true);
    }
    const inProg = new Set(session.inProgressTaskIds);
    inProg.delete(task.id);
    const next = await updateSession({
      doneTaskIds: Array.from(done),
      inProgressTaskIds: Array.from(inProg),
    });
    setSession(next);
  };

  const call = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (!task) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.taskIconBig}>
          <Feather name={task.icon as any} size={28} color={colors.brand} />
        </View>
        <Text style={styles.title} testID="task-detail-title">
          {task.title}
        </Text>

        <Pressable
          onPress={() => setWhyOpen((v) => !v)}
          style={styles.whyToggle}
          testID="task-why-toggle"
        >
          <Text style={styles.whyToggleText}>{t('whyThisIsNeeded')}</Text>
          <Feather
            name={whyOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.onSurfaceSecondary}
          />
        </Pressable>
        {whyOpen && (
          <Text style={styles.whyBody} testID="task-why-body">
            {task.why}
          </Text>
        )}

        {task.documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('documentsNeeded')}</Text>
            {task.documents.map((d) => (
              <View key={d} style={styles.docRow} testID={`task-doc-${d}`}>
                <Feather name="file-text" size={18} color={colors.brand} />
                <Text style={styles.docText}>{t(DOC_LABELS[d] || d)}</Text>
              </View>
            ))}
          </View>
        )}

        {contacts.length > 0 && (
          <View style={styles.section}>
            {contacts.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => call(c.phone)}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.9 }]}
                testID={`task-call-${c.id}`}
              >
                <Feather name="phone" size={20} color={colors.onBrandPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.callBtnLabel}>{t('callNow')} — {c.name}</Text>
                  <Text style={styles.callBtnSub}>{c.phone}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {showDone && isDone && (
          <View style={styles.doneToast} testID="task-done-toast">
            <Feather name="check-circle" size={20} color={colors.brand} />
            <Text style={styles.doneToastText}>{t('taskDoneCaption')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isDone ? t('markUndone') : t('markDone')}
          onPress={toggleDone}
          testID="task-mark-done"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  body: { padding: spacing.lg, paddingTop: 0 },
  taskIconBig: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: type.xxl,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.lg,
    lineHeight: 34,
  },
  whyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  whyToggleText: {
    fontSize: type.base,
    color: colors.onSurface,
    fontWeight: '600',
  },
  whyBody: {
    fontSize: type.base,
    lineHeight: 26,
    color: colors.onSurfaceSecondary,
    paddingVertical: spacing.md,
  },
  section: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: type.base,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  docText: { fontSize: type.base, color: colors.onSurface },
  callBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  callBtnLabel: { color: colors.onBrandPrimary, fontSize: type.base, fontWeight: '600' },
  callBtnSub: { color: colors.onBrandPrimary, fontSize: type.sm, opacity: 0.85, marginTop: 2 },
  doneToast: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  doneToastText: { color: colors.onBrandTertiary, fontSize: type.base, fontWeight: '500' },
  footer: { padding: spacing.lg },
});
