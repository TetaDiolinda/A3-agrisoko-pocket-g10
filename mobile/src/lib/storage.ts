import AsyncStorage from '@react-native-async-storage/async-storage';
import { AskResult, DirectoryItem, Member } from '../types';

const K = {
  directory: 'agrisoko:directory',
  lastResult: 'agrisoko:lastResult',
  profile: (id: string) => `agrisoko:profile:${id}`,
  queries: 'agrisoko:queries',
};

async function read<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // a broken cache must never crash the app
  }
}
async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage errors */
  }
}

export const cache = {
  getDirectory: () => read<DirectoryItem[]>(K.directory),
  setDirectory: (d: DirectoryItem[]) => write(K.directory, d),
  getLastResult: () => read<AskResult>(K.lastResult),
  setLastResult: (r: AskResult) => write(K.lastResult, r),
  getProfile: (id: string) => read<Member>(K.profile(id)),
  setProfile: (m: Member) => write(K.profile(m.id), m),
  async getQuery(q: string): Promise<AskResult | null> {
    const map = (await read<Record<string, AskResult>>(K.queries)) ?? {};
    return map[q.trim().toLowerCase()] ?? null;
  },
  async setQuery(q: string, r: AskResult) {
    const map = (await read<Record<string, AskResult>>(K.queries)) ?? {};
    map[q.trim().toLowerCase()] = r;
    const keys = Object.keys(map);
    if (keys.length > 30) delete map[keys[0]];
    await write(K.queries, map);
  },
};
