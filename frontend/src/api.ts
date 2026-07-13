const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Task {
  id: string;
  phase: 'right_now' | 'today' | 'next_few_days' | 'next_few_weeks';
  title: string;
  short_label: string;
  icon: string;
  why: string;
  documents: string[];
  contacts: string[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  category: string;
  phone: string;
  day_one_only: boolean;
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  async getChecklist(place_of_death: string, religion: string | null, location?: string) {
    return post<{ tasks: Task[] }>('/checklist', { place_of_death, religion, location });
  },
  async getContacts(religion: string | null, day: number = 0) {
    const q = new URLSearchParams();
    if (religion) q.set('religion', religion);
    q.set('day', String(day));
    return get<{ contacts: Contact[] }>(`/contacts?${q.toString()}`);
  },
  async sendOtp(phone: string) {
    return post<{ success: boolean; mock_code: string }>('/otp/send', { phone });
  },
  async verifyOtp(phone: string, code: string) {
    return post<{ success: boolean; session_id: string }>('/otp/verify', { phone, code });
  },
  async vaultUpload(session_id: string, doc_type: string, filename: string, data_base64: string) {
    return post<{ success: boolean; id: string }>('/vault/upload', {
      session_id,
      doc_type,
      filename,
      data_base64,
    });
  },
  async vaultList(session_id: string) {
    return get<{ documents: { id: string; doc_type: string; filename: string; created_at: string }[] }>(
      `/vault/${session_id}`
    );
  },
  async vaultDelete(doc_id: string) {
    const res = await fetch(`${BASE}/api/vault/${doc_id}`, { method: 'DELETE' });
    return res.ok;
  },
  async shareMessage(payload: { name?: string; time?: string; place?: string; language: string }) {
    return post<{ message: string }>('/share/message', payload);
  },
};
