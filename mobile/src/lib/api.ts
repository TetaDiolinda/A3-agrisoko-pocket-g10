import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config';
import { AskApiResponse, DirectoryItem, Member } from '../types';

export type ApiErrorKind = 'timeout' | 'network' | 'server' | 'client';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

function toApiError(e: unknown): ApiError {
  const err = e as AxiosError<{ detail?: unknown }>;
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new ApiError('timeout', 'The server took too long to answer.');
  }
  if (err.response) {
    const status = err.response.status;
    if (status >= 500) return new ApiError('server', 'The server is unavailable right now.', status);
    const detail = err.response.data?.detail;
    return new ApiError('client', typeof detail === 'string' ? detail : 'The request was rejected.', status);
  }
  return new ApiError('network', 'Could not reach the server.');
}

async function call<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await fn()).data;
  } catch (e) {
    throw toApiError(e);
  }
}

export const api = {
  health: () => call<{ status: string; version: string; groupCode: string; members: number }>(() => http.get('/health')),
  members: () => call<DirectoryItem[]>(() => http.get('/members')),
  member: (id: string) => call<Member>(() => http.get(`/members/${encodeURIComponent(id)}`)),
  ask: (question: string) => call<AskApiResponse>(() => http.post('/ask', { question })),
  modelInfo: () =>
    call<{
      modelVersion: string; vectorizer: string; threshold: number; datasetFingerprint: string;
      buildCommit: string; limitations: string[]; groupCode: string; memberCount: number;
    }>(() => http.get('/model-info')),
};

export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.kind) {
      case 'timeout': return 'The server took too long to answer.';
      case 'network': return 'Could not reach the server. Check your connection.';
      case 'server': return 'The server is unavailable right now.';
      default: return e.message;
    }
  }
  return 'Something went wrong.';
}
