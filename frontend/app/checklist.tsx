import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, spacing, radius, type, shadow } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, daysSinceStart, type Session } from '@/src/session';
import { api, type Task } from '@/src/api';

const PHASES: { key: Task['phase']; labelKey: string; defaultOpen: boolean }[] = [
  { key: 'right_now', labelKey: 'phaseRightNow', defaultOpen: true },
  { key: 'today', labelKey: 'phaseToday', defaultOpen: false },
  { key: 'next_few_days', labelKey: 'phaseNextFewDays', defaultOpen: false },
  { key: 'next_few_weeks', labelKey: 'phaseNextFewWeeks', defaultOpen: false },
];

export default function Checklist() {
  const router = useRouter();
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({
    right_now: true,
    today: false,
    next_few_days: false,
    next_few_weeks: false,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const s = await loadSession();
    if (!s || !s.place_of_death) {
      router.replace('/');
      return;
    }
    setSession(s);
    try {
      const res = await api.getChecklist(s.place_of_death, s.religion, s.location);
      setTasks(res.tasks);
    } catch (e) {
      console.warn('checklist load failed', e);
    }
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const doneCount = session ? tasks.filter((t) => session.doneTaskIds.includes(t.id)).length : 0;
  const totalCount = tasks.length;
  const daysIn = session ? daysSinceStart(session) : 0;

  const visiblePhases = PHASES.filter((p) => p.key !== 'next_few_weeks' || daysIn >= 1 || totalCount > 0);

  const grouped: Record<string, Task[]> = { right_now: [], today: [], next_few_days: [], next_few_weeks: [] };
  tasks.forEach((tk) => grouped[tk.phase].push(tk));

  const status = (task: Task) => {
    if (!session) return t('taskNotStarted');
    if (session.doneTaskIds.includes(task.id)) return t('taskDone');
    if (session.inProgressTaskIds.includes(task.id)) return t('taskInProgress');
    return t('taskNotStarted');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="checklist-title">
            {t('checklistTitle')}
          </Text>
          {!loading && (
            <Text style={styles.progressText} testID="checklist-progress">
              {doneCount} / {totalCount} {t('progressSuffix')}
            </Text>
          )}
        </View>
        <Pressable
          testID="checklist-settings"
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="settings" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.progressBarWrap}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              { width: totalCount ? `${(doneCount / totalCount) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          testID="checklist-scroll"
          showsVerticalScrollIndicator={false}
        >
          {visiblePhases.map((phase) => {
            const items = grouped[phase.key];
            if (!items.length) return null;
            const isOpen = open[phase.key];
            const phaseDone = session
              ? items.filter((tk) => session.doneTaskIds.includes(tk.id)).length
              : 0;
            return (
              <View key={phase.key} style={styles.section} testID={`section-${phase.key}`}>
                <Pressable
                  onPress={() => toggle(phase.key)}
                  style={styles.sectionHeader}
                  testID={`section-toggle-${phase.key}`}
                >
                  <Text style={styles.sectionTitle}>{t(phase.labelKey)}</Text>
                  <View style={styles.sectionMeta}>
                    <Text style={styles.sectionCount}>
                      {phaseDone}/{items.length}
                    </Text>
                    <Feather
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.onSurfaceSecondary}
                    />
                  </View>
                </Pressable>

                {isOpen && (
                  <View style={styles.taskList}>
                    {items.map((task) => {
                      const isDone = session?.doneTaskIds.includes(task.id);
                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => router.push(`/task/${task.id}`)}
                          style={({ pressed }) => [
                            styles.taskRow,
                            pressed && { opacity: 0.9 },
                            isDone && styles.taskRowDone,
                          ]}
                          testID={`task-row-${task.id}`}
                        >
                          <View style={styles.taskIcon}>
                            <Feather
                              name={task.icon as any}
                              size={20}
                              color={isDone ? colors.brand : colors.onSurfaceSecondary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.taskLabel, isDone && styles.taskLabelDone]}
                              numberOfLines={2}
                            >
                              {task.short_label}
                            </Text>
                            <Text style={styles.taskStatus}>{status(task)}</Text>
                          </View>
                          {isDone ? (
                            <Feather name="check-circle" size={22} color={colors.brand} />
                          ) : (
                            <Feather name="chevron-right" size={22} color={colors.borderStrong} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <View style={styles.quickBar}>
        <Pressable
          testID="checklist-open-share"
          onPress={() => router.push('/share')}
          style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="message-circle" size={18} color={colors.brand} />
          <Text style={styles.quickBtnText}>Share</Text>
        </Pressable>
        <Pressable
          testID="checklist-open-vault"
          onPress={() => router.push('/vault')}
          style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="folder" size={18} color={colors.brand} />
          <Text style={styles.quickBtnText}>Documents</Text>
        </Pressable>
      </View>

      <Pressable
        testID="checklist-call-help"
        onPress={() => router.push('/contacts')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
      >
        <Feather name="phone" size={20} color={colors.onBrandPrimary} />
        <Text style={styles.fabText}>{t('callForHelp')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: type.xl,
    color: colors.onSurface,
    fontWeight: '600',
  },
  progressText: {
    fontSize: type.base,
    color: colors.onSurfaceSecondary,
    marginTop: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  progressBarWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceTertiary,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.brand,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingTop: spacing.md },
  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    minHeight: 56,
  },
  sectionTitle: {
    fontSize: type.lg,
    color: colors.onSurface,
    fontWeight: '600',
  },
  sectionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionCount: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  taskList: { marginTop: spacing.xs, gap: spacing.xs },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
  },
  taskRowDone: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandSecondary,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  taskLabel: {
    fontSize: type.base,
    color: colors.onSurface,
    fontWeight: '500',
    marginBottom: 2,
  },
  taskLabelDone: {
    color: colors.onBrandTertiary,
  },
  taskStatus: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadow.card,
  },
  fabText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: '600',
  },
  quickBar: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    ...shadow.card,
  },
  quickBtnText: {
    color: colors.brand,
    fontSize: type.sm,
    fontWeight: '600',
  },
});
