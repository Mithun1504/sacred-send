import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'session:v1';

export type Religion = 'hindu' | 'muslim' | 'christian' | 'sikh' | 'secular' | null;
export type Place = 'hospital' | 'home' | 'other';

export interface Session {
  location: string;
  place_of_death: Place;
  religion: Religion;
  createdAt: string;
  doneTaskIds: string[];
  inProgressTaskIds: string[];
  vaultSessionId?: string;
  remindersEnabled?: boolean;
  familyName?: string;
  cremationTime?: string;
  cremationPlace?: string;
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveSession(s: Session) {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function updateSession(patch: Partial<Session>) {
  const cur = (await loadSession()) ?? emptySession();
  const next = { ...cur, ...patch };
  await saveSession(next);
  return next;
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEY);
}

export function emptySession(): Session {
  return {
    location: '',
    place_of_death: 'hospital',
    religion: null,
    createdAt: new Date().toISOString(),
    doneTaskIds: [],
    inProgressTaskIds: [],
  };
}

export function daysSinceStart(s: Session): number {
  const start = new Date(s.createdAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}
