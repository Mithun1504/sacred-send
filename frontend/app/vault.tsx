import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors, spacing, radius, type } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { loadSession, updateSession } from '@/src/session';
import { api } from '@/src/api';
import { BackButton, PrimaryButton } from '@/src/components/Buttons';

type Stage = 'phone' | 'otp' | 'vault';

const DOC_TYPES = [
  { key: 'aadhaar', labelKey: 'docAadhaar' },
  { key: 'id_proof', labelKey: 'docId' },
  { key: 'insurance', labelKey: 'docInsurance' },
  { key: 'hospital', labelKey: 'docHospital' },
];

export default function Vault() {
  const router = useRouter();
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ id: string; doc_type: string; filename: string }[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await loadSession();
      if (s?.vaultSessionId) {
        setSessionId(s.vaultSessionId);
        setStage('vault');
      }
    })();
  }, []);

  useEffect(() => {
    if (stage === 'vault' && sessionId) {
      refresh();
    }
  }, [stage, sessionId]);

  const refresh = async () => {
    if (!sessionId) return;
    setLoadingDocs(true);
    try {
      const res = await api.vaultList(sessionId);
      setDocs(res.documents);
    } catch {}
    setLoadingDocs(false);
  };

  const sendOtp = async () => {
    setError('');
    if (phone.length < 6) {
      setError('Enter a valid mobile number');
      return;
    }
    setSending(true);
    try {
      await api.sendOtp(phone);
      setStage('otp');
    } catch {
      setError('Could not send code. Please try again.');
    }
    setSending(false);
  };

  const verify = async () => {
    setError('');
    try {
      const res = await api.verifyOtp(phone, code);
      setSessionId(res.session_id);
      await updateSession({ vaultSessionId: res.session_id });
      setStage('vault');
    } catch {
      setError('Invalid code. Try 123456.');
    }
  };

  const pickAndUpload = async (docType: string, fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.4 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.4 });
    if (result.canceled || !sessionId) return;
    const asset = result.assets?.[0];
    if (!asset?.base64) return;
    try {
      await api.vaultUpload(sessionId, docType, asset.fileName ?? `${docType}.jpg`, asset.base64);
      await refresh();
    } catch {}
  };

  const removeDoc = async (id: string) => {
    await api.vaultDelete(id);
    await refresh();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title} testID="vault-title">
            {t('vaultTitle')}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {stage === 'phone' && (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.helpText}>{t('vaultHelp')}</Text>
            <Text style={styles.label}>{t('enterPhone')}</Text>
            <TextInput
              testID="vault-phone-input"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98xxxxxxxx"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={15}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton
                label={sending ? '…' : t('sendOtp')}
                onPress={sendOtp}
                testID="vault-send-otp"
              />
            </View>
          </ScrollView>
        )}

        {stage === 'otp' && (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.label}>{t('enterOtp')}</Text>
            <TextInput
              testID="vault-otp-input"
              value={code}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, '').slice(0, 6);
                setCode(digits);
                if (digits.length === 6) {
                  setTimeout(() => verifyWith(digits), 100);
                }
              }}
              keyboardType="number-pad"
              placeholder="000000"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.otpInput]}
              maxLength={6}
            />
            <Text style={styles.hint}>{t('otpHint')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton label={t('verify')} onPress={verify} testID="vault-verify" />
            </View>
          </ScrollView>
        )}

        {stage === 'vault' && (
          <ScrollView contentContainerStyle={styles.body} testID="vault-list">
            <Text style={styles.helpText}>{t('vaultHelp')}</Text>
            {loadingDocs && <ActivityIndicator color={colors.brand} />}
            {DOC_TYPES.map((dt) => {
              const items = docs.filter((d) => d.doc_type === dt.key);
              return (
                <View key={dt.key} style={styles.docSection} testID={`vault-section-${dt.key}`}>
                  <Text style={styles.docSectionTitle}>{t(dt.labelKey)}</Text>
                  {items.map((doc) => (
                    <View key={doc.id} style={styles.docItem}>
                      <Feather name="file" size={18} color={colors.brand} />
                      <Text style={styles.docItemName} numberOfLines={1}>
                        {doc.filename}
                      </Text>
                      <Pressable
                        onPress={() => removeDoc(doc.id)}
                        hitSlop={10}
                        testID={`vault-remove-${doc.id}`}
                      >
                        <Feather name="x" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  ))}
                  <View style={styles.docActionsRow}>
                    <Pressable
                      onPress={() => pickAndUpload(dt.key, true)}
                      style={({ pressed }) => [styles.docAction, pressed && { opacity: 0.85 }]}
                      testID={`vault-camera-${dt.key}`}
                    >
                      <Feather name="camera" size={18} color={colors.brand} />
                      <Text style={styles.docActionText}>{t('takePhoto')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => pickAndUpload(dt.key, false)}
                      style={({ pressed }) => [styles.docAction, pressed && { opacity: 0.85 }]}
                      testID={`vault-gallery-${dt.key}`}
                    >
                      <Feather name="image" size={18} color={colors.brand} />
                      <Text style={styles.docActionText}>{t('chooseFromLibrary')}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  async function verifyWith(c: string) {
    try {
      const res = await api.verifyOtp(phone, c);
      setSessionId(res.session_id);
      await updateSession({ vaultSessionId: res.session_id });
      setStage('vault');
    } catch {
      setError('Invalid code. Try 123456.');
    }
  }
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
  body: { padding: spacing.lg, paddingBottom: spacing.xl },
  helpText: {
    fontSize: type.base,
    color: colors.onSurfaceSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: type.base,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.sm,
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
  otpInput: {
    fontSize: type.xxl,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: { fontSize: type.sm, color: colors.onSurfaceSecondary, marginTop: spacing.sm },
  error: { fontSize: type.sm, color: colors.error, marginTop: spacing.sm },
  docSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
  },
  docSectionTitle: {
    fontSize: type.base,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  docItemName: { flex: 1, fontSize: type.sm, color: colors.onSurface },
  docActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  docAction: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
  },
  docActionText: { color: colors.brand, fontSize: type.sm, fontWeight: '600' },
});
