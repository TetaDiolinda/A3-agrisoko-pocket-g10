import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

/** API base URL: EXPO_PUBLIC_API_BASE_URL (build time) > app.json extra > emulator default. No credentials anywhere. */
export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  extra.apiBaseUrl ||
  'http://10.0.2.2:8000'
).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 8000;
export const MAX_QUESTION_LENGTH = 200;
export const GROUP_CODE = extra.groupCode ?? 'G10';
export const APP_NAME = `AgriSoko Pocket ${GROUP_CODE}`;
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const GITHUB_URL = extra.githubUrl ?? '';
export const GROUP_VERIFICATION_CODE = `${GROUP_CODE}-AGRISOKO-POCKET-v${APP_VERSION}`;

export const COLORS = {
  primary: '#1B5E20',
  primaryDark: '#0D3F12',
  accent: '#F9A825',
  bg: '#F4F7F2',
  card: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#4A4A4A',
  border: '#C9D3C5',
  danger: '#B3261E',
  warn: '#8A5A00',
  info: '#0B57A4',
};
