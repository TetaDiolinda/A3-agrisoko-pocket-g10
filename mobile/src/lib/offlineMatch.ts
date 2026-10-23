import { Member, AskResult } from '../types';
import { normalize, FILLER } from './text';

/**
 * Offline lookup rule (documented in README):
 *   1. exact full name or alias appears as whole words in the question  -> match
 *   2. exact role (or one ';' separated part of the role) appears in the question,
 *      or the question without filler words equals that role               -> match
 * Anything else is NOT guessed offline; the user is told to reconnect or use the directory.
 */
export function offlineLookup(question: string, members: Member[]): { member: Member; how: string } | null {
  const q = normalize(question);
  if (!q) return null;
  const padded = ` ${q} `;
  let best: { member: Member; how: string; len: number } | null = null;

  for (const m of members) {
    for (const name of [m.fullName, ...m.aliases]) {
      const n = normalize(name);
      if (n && padded.includes(` ${n} `) && (!best || n.length > best.len)) {
        best = { member: m, how: `exact name or alias "${name}"`, len: n.length };
      }
    }
  }
  if (best) return { member: best.member, how: best.how };

  const cleaned = q.split(' ').filter((t) => !FILLER.has(t)).join(' ');
  for (const m of members) {
    const roleParts = [m.role, ...m.role.split(';')].map(normalize).filter(Boolean);
    for (const r of roleParts) {
      if (padded.includes(` ${r} `) || cleaned === r) {
        if (!best || r.length > best.len) best = { member: m, how: `exact role "${r}"`, len: r.length };
      }
    }
  }
  return best ? { member: best.member, how: best.how } : null;
}

export function introductionFor(m: Member): string {
  let intro = m.introductionDraft?.trim() || `My name is ${m.fullName}. I am the ${m.role}. ${m.contribution}`;
  const metric = (m.outcomeMetric ?? '').trim();
  if (metric) {
    if (!intro.toLowerCase().includes(metric.toLowerCase())) intro += ` Verified outcome: ${metric}`;
  } else {
    intro += ' No verified outcome metric has been recorded yet.';
  }
  return intro;
}

export function toOfflineResult(
  question: string,
  hit: { member: Member; how: string },
  groupCode: string,
): AskResult {
  const m = hit.member;
  return {
    query: question,
    source: 'offline',
    matched: true,
    memberId: m.id,
    memberName: m.fullName,
    role: m.role,
    confidence: 1,
    threshold: null,
    matchedTerms: [],
    reason: `Offline match: ${hit.how} found in the bundled directory.`,
    introduction: introductionFor(m),
    evidenceLinks: m.evidenceLinks,
    message: null,
    suggestions: [],
    modelVersion: 'offline-exact-lookup',
    groupCode,
    savedAt: new Date().toISOString(),
  };
}
