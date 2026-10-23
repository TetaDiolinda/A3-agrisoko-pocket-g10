import { api, ApiError, describeError } from './api';
import { cache } from './storage';
import { offlineLookup, toOfflineResult } from './offlineMatch';
import { AskApiResponse, AskResult, Member, Source } from '../types';

export interface AskOutcome {
  result: AskResult | null;
  notice: string | null; // shown as a warning banner next to a useful result
  error: string | null; // shown as an error banner with retry
}

export function fromApi(r: AskApiResponse, source: Source): AskResult {
  return {
    query: r.query,
    source,
    matched: r.matched,
    memberId: r.match?.id ?? null,
    memberName: r.match?.fullName ?? null,
    role: r.match?.role ?? null,
    confidence: r.confidence,
    threshold: r.threshold,
    matchedTerms: r.matchedTerms,
    reason: r.reason,
    introduction: r.introduction,
    evidenceLinks: r.evidenceLinks,
    message: r.message,
    suggestions: r.suggestions,
    modelVersion: r.modelVersion,
    groupCode: r.groupCode,
    savedAt: new Date().toISOString(),
  };
}

export async function runAsk(question: string, online: boolean, bundled: Member[], groupCode: string): Promise<AskOutcome> {
  const q = question.trim();

  if (!online) {
    const hit = offlineLookup(q, bundled);
    if (hit) {
      return { result: toOfflineResult(q, hit, groupCode), notice: 'You are offline. This is a local exact match.', error: null };
    }
    return {
      result: null,
      notice: null,
      error:
        'You are offline. Offline search only understands an exact name, nickname or role. Try one of those, or open the Directory.',
    };
  }

  try {
    const data = await api.ask(q);
    const result = fromApi(data, 'live');
    if (result.matched) {
      await cache.setLastResult(result);
      await cache.setQuery(q, result);
    }
    return { result, notice: null, error: null };
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'client') {
      return { result: null, notice: null, error: describeError(e) };
    }
    const why = describeError(e);
    const saved = await cache.getQuery(q);
    if (saved) {
      return { result: { ...saved, source: 'cached' }, notice: `${why} Showing the answer saved earlier on this phone.`, error: null };
    }
    const hit = offlineLookup(q, bundled);
    if (hit) {
      return { result: toOfflineResult(q, hit, groupCode), notice: `${why} Showing a local exact match instead.`, error: null };
    }
    return { result: null, notice: null, error: `${why} Tap Retry, or try an exact name or role.` };
  }
}
