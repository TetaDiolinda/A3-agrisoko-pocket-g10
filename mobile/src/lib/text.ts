export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const FILLER = new Set([
  'who', 'what', 'tell', 'me', 'about', 'is', 'are', 'the', 'a', 'an', 'built', 'build', 'made',
  'did', 'does', 'do', 'show', 'of', 'for', 'in', 'on', 'to', 'how', 'member', 'person', 'team',
  'please', 'can', 'you', 'give', 'profile', 'introduce', 'i', 'want', 'know', 'my', 'us', 'it',
  'this', 'that', 'with', 'was', 'were', 'has', 'have', 'by', 'from', 'find', 'get',
]);

export function validateQuestion(q: string, max: number): string | null {
  const t = q.trim();
  if (!t) return 'Please type a question first, for example "Tell me about Member One".';
  if (t.length > max) return `Your question is ${t.length} characters long. Please keep it under ${max}.`;
  return null;
}

export function isPlaceholderUrl(url: string): boolean {
  return !url || /REPLACE/i.test(url);
}
