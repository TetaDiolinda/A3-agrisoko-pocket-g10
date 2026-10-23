# COMBO_A3_G10_REPORT — outline (write the final 1–10 page PDF from this)

| Page | Section | What to put (facts already available from the project) |
|---|---|---|
| 1 | Problem and users | Musanze potato cooperatives, employers, partners; promise: ask about any member, get evidence-based profile; members and roles |
| 2 | Information architecture | Screens: Home, Ask, Result, Directory, Profile, About. Flow: question -> validate -> online? POST /ask : offline exact lookup |
| 3–4 | Annotated interface | Screenshots from the phone: Home, Ask, Result, no-match, Directory, Profile, error banner, offline label |
| 5 | AI design | members.json schema; one document per member (name, aliases, role, skills, feature, problem, contribution, evidence); TF-IDF word 1–2 + char_wb 3–5, cosine, 50/50; name boost +0.5; threshold 0.25 (tested, see AI_EVALUATION_OUTPUT.txt); grounding: only stored fields |
| 6 | API and integration | GET /health, /members, /members/{id}, POST /ask, GET /model-info; request/response examples; 8 s timeout; fallback cached -> offline exact match |
| 7 | Testing evidence | evaluation numbers, pytest result, device matrix, tester findings, fixed issues |
| 8 | GitHub collaboration | issues, branches, PRs, reviews, v1.0.0 tag, contribution map |
| 9–10 | Results and responsible AI | final screenshots, limitations (lexical matching, offline = exact only), privacy (no phones/addresses), truthful claims, AI_USE.md, next steps |
