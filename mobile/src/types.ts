export interface EvidenceLink { label: string; url: string }

export interface Member {
  id: string;
  fullName: string;
  registrationNumber: string;
  aliases: string[];
  githubUsername: string;
  role: string;
  skills: string[];
  targetUser: string;
  problem: string;
  contribution: string;
  feature: string;
  outcomeMetric: string;
  evidenceLinks: EvidenceLink[];
  testerFeedback: string[];
  introductionDraft: string;
}

export interface DirectoryItem {
  id: string;
  fullName: string;
  aliases: string[];
  githubUsername: string;
  role: string;
  feature: string;
}

/** live = fresh from the API, cached = saved earlier answer, offline = matched on the phone */
export type Source = 'live' | 'cached' | 'offline';

export interface AskApiResponse {
  query: string;
  matched: boolean;
  match: DirectoryItem | null;
  confidence: number;
  threshold: number;
  matchedTerms: string[];
  reason: string;
  introduction: string | null;
  evidenceLinks: EvidenceLink[];
  message: string | null;
  suggestions: string[];
  modelVersion: string;
  groupCode: string;
}

export interface AskResult {
  query: string;
  source: Source;
  matched: boolean;
  memberId: string | null;
  memberName: string | null;
  role: string | null;
  confidence: number;
  threshold: number | null;
  matchedTerms: string[];
  reason: string;
  introduction: string | null;
  evidenceLinks: EvidenceLink[];
  message: string | null;
  suggestions: string[];
  modelVersion: string;
  groupCode: string;
  savedAt: string;
}

export type RootStackParamList = {
  Home: undefined;
  Ask: undefined;
  Result: { result: AskResult; notice?: string | null };
  Directory: undefined;
  Profile: { memberId: string; name?: string };
  About: undefined;
};
