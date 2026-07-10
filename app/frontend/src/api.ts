"// Axios-lite fetch wrapper for the SafeStreet AI backend.
import { storage } from \"@/src/utils/storage\";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? \"\";
const API = `${BASE}/api`;

export const TOKEN_KEY = \"safestreet_token\";

async function getToken(): Promise<string | null> {
  return storage.secureGet<string>(TOKEN_KEY, \"\");
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = \"GET\", body, auth = true } = opts;
  const headers: Record<string, string> = { \"Content-Type\": \"application/json\" };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(typeof message === \"string\" ? message : JSON.stringify(message));
  }
  return data as T;
}

export const api = {
  get: <T>(p: string, auth = true) => request<T>(p, { auth }),
  post: <T>(p: string, body?: unknown, auth = true) =>
    request<T>(p, { method: \"POST\", body, auth }),
  put: <T>(p: string, body?: unknown, auth = true) =>
    request<T>(p, { method: \"PUT\", body, auth }),
  del: <T>(p: string, auth = true) =>
    request<T>(p, { method: \"DELETE\", auth }),
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: \"user\" | \"admin\";
  photo?: string | null;
  blood_group?: string | null;
  medical_info?: string | null;
  language?: string;
  address?: string | null;
  provider: string;
};

export const auth = {
  async setToken(token: string) {
    await storage.secureSet(TOKEN_KEY, token);
  },
  async clearToken() {
    await storage.secureRemove(TOKEN_KEY);
  },
  async getToken() {
    return getToken();
  },
};
"
