import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, updateSession, type Session } from '@/src/session';
import { api, mapsSearchUrl, type Task } from '@/src/api';
import { BackButton, PrimaryButton, GhostButton } from '@/src/components/Buttons';

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
  const [whyOpen, setWhyOpen] = useState(true);
  const [toast, setToast] = useState<'done' | 'skipped' | null>(null);

  const load = useCallback(async () => {
    const s = await loadSession();
    if (!s) {
      router.replace('/');
      return;
    }
    setSession(s);
    try {
      const res = await api.getChecklist(s.place_of_death, s.religion, s.location, s.unexpected);
      const found = res.tasks.find((tk) => tk.id === id);
      setTask(found ?? null);
    } catch (e) {
      console.warn(e);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isDone = session && task ? (session.doneTaskIds || []).includes(task.id) : false;
  const isSkipped = session && task ? (session.skippedTaskIds || []).includes(task.id) : false;

  const setState = async (target: 'done' | 'skipped' | 'reset') => {
    if (!task || !session) return;
    const done = new Set(session.doneTaskIds || []);
    const skipped = new Set(session.skippedTaskIds || []);
    done.delete(task.id);
    skipped.delete(task.id);
    if (target === 'done') {
      done.add(task.id);
      setToast('done');
    } else if (target === 'skipped') {
      skipped.add(task.id);
      setToast('skipped');
    } else {
      setToast(null);
    }
    const next = await updateSession({
      doneTaskIds: Array.from(done),
      skippedTaskIds: Array.from(skipped),
    });
    setSession(next);
  };

  const call = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[\s-]/g, '')}`);
  };

  const openMaps = () => {
    if (!task?.maps_search) return;
    Linking.openURL(mapsSearchUrl(task.maps_search, session?.location));
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

        {task.urgency_note ? (
          <View style={styles.urgencyBox} testID="task-urgency-note">
            <Feather name="alert-circle" size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.urgencyLabel}>{t('urgencyNote')}</Text>
              <Text style={styles.urgencyText}>{task.urgency_note}</Text>
            </View>
          </View>
        ) : null}

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

        {task.maps_search ? (
          <View style={styles.section}>
            <Pressable
              onPress={openMaps}
              style={({ pressed }) => [styles.mapsBtn, pressed && { opacity: 0.9 }]}
              testID="task-open-maps"
            >
              <Feather name="map-pin" size={20} color={colors.brand} />
              <Text style={styles.mapsBtnText}>{t('openInMaps')}</Text>
            </Pressable>
          </View>
        ) : null}

        {task.phones && task.phones.length > 0 && (
          <View style={styles.section}>
            {task.phones.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => call(p.number)}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.9 }]}
                testID={`task-call-${i}`}
              >
                <Feather name="phone" size={20} color={colors.onBrandPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.callBtnLabel}>{p.label}</Text>
                  <Text style={styles.callBtnSub}>{p.number}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {toast === 'done' && isDone && (
          <View style={styles.doneToast} testID="task-done-toast">
            <Feather name="check-circle" size={20} color={colors.brand} />
            <Text style={styles.doneToastText}>{t('taskDoneCaption')}</Text>
          </View>
        )}
        {toast === 'skipped' && isSkipped && (
          <View style={styles.skippedToast} testID="task-skipped-toast">
            <Feather name="minus-circle" size={20} color={colors.onSurfaceSecondary} />
            <Text style={styles.doneToastText}>{t('taskSkippedCaption')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isDone ? (
          <PrimaryButton label={t('markUndone')} onPress={() => setState('reset')} testID="task-mark-done" />
        ) : isSkipped ? (
          <PrimaryButton label={t('undoSkip')} onPress={() => setState('reset')} testID="task-mark-done" />
        ) : (
          <>
            <PrimaryButton label={t('markDone')} onPress={() => setState('done')} testID="task-mark-done" />
            <GhostButton label={t('skipTask')} onPress={() => setState('skipped')} testID="task-skip" />
          </>
        )}
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
  urgencyBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FBF1E4',
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  urgencyLabel: {
    fontSize: type.sm,
    color: colors.warning,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  urgencyText: {
    fontSize: type.base,
    color: colors.onSurface,
    lineHeight: 22,
    marginTop: 2,
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
  mapsBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.brandTertiary,
  },
  mapsBtnText: { color: colors.onBrandTertiary, fontSize: type.base, fontWeight: '600' },
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
  skippedToast: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  doneToastText: { color: colors.onBrandTertiary, fontSize: type.base, fontWeight: '500', flex: 1 },
  footer: { padding: spacing.lg, gap: 4 },
});
