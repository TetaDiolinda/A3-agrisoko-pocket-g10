# AgriSoko Pocket G10

Ask about any team member (name, nickname, role, skill or feature) and get an evidence-based professional profile.
React Native (Expo, TypeScript) Android app + Python FastAPI / scikit-learn TF-IDF matching service.

- **Group code:** G10  ·  **App:** AgriSoko Pocket G10  ·  **Repository:** agrisoko-pocket-g10  ·  **APK:** AgriSokoPocket_G10.apk
- **Run it:** see [RUN_GUIDE.md](RUN_GUIDE.md)

## Members and roles (5 members: roles 1–5)
| # | Member | Primary role |
|---|---|---|
| 1 | kiir kiir deng kur | Product and GitHub lead (+ evidence) |
| 2 | MANZI Prince Peter | AI and data engineer |
| 3 | UMUTONI Liliane| API and integration engineer |
| 4 | SHYAKA Guy Peter| Mobile UI and navigation engineer |
| 5 | TETA Diolinda UWASE| Offline and quality engineer (+ release) |

## Architecture
```
Phone (APK)  --POST /ask-->  FastAPI (ai-api)  -->  TF-IDF index over data/members.json
   |  validate text, NetInfo                          cosine similarity + name boost + threshold
   |  offline: bundled members.json exact name/alias/role lookup
   |  cache: AsyncStorage (directory, last result, profiles, answered questions)
```
- `ai-api/` — FastAPI, Pydantic, pandas, scikit-learn, pytest. `app/engine.py` is the whole AI model.
- `mobile/` — Expo SDK 58, React Navigation, axios, AsyncStorage, NetInfo.
- `docs/`, `evidence/`, `build/` — report outline, evidence templates, APK location.

### AI matching rules
1. One document per member: name, teta, role, skills, feature, problem, contribution, evidence summary.
2. TF-IDF word (1–2 grams) and character (3–5 grams, `char_wb`) vectors, cosine similarity, averaged 50/50.
3. **Name boost:** if a member's full name or teta appears as whole words in the question, confidence = min(1, cosine + 0.5).
4. **Threshold 0.25** (assignment suggests starting at 0.45). The sweep in `evaluate.py` showed 0.45 wrongly rejected 9 of 25 valid questions; 0.25 is the lowest value that still rejects all 10 no-match questions. Wrong members were never returned. Details: `evidence/AI_EVALUATION_OUTPUT.txt`.
5. Output uses only stored fields. No metric appears unless `outcomeMetric` is filled; otherwise the introduction says no verified metric is recorded.

### Offline rule (phone)
Exact full name, alias, or role (or a `;`-separated part of the role) found as whole words in the question. Nothing is guessed; labelled **OFFLINE MATCH**. Results are labelled **LIVE**, **CACHED** or **OFFLINE MATCH**.

### API
`GET /health` · `GET /members` · `GET /members/{id}` (404 if unknown) · `POST /ask {"question": "..."}` (1–200 chars, else 422) · `GET /model-info`. Interactive docs at `/docs`.

## Setup and run (short)
```
cd ai-api && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
python build_index.py && python -m pytest -q && python evaluate.py --write
uvicorn app.main:app --host 0.0.0.0 --port 8000

cd mobile && npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://<PC-IP>:8000"; npx expo start
```
API URL for builds: `EXPO_PUBLIC_API_BASE_URL` (set in `mobile/eas.json` for the APK) or `mobile/app.json -> extra.apiBaseUrl`. No secrets are stored in the repo or APK.

**EAS build:** `cd mobile && eas build -p android --profile preview`

## Status table (fill before submission)
| Item | Value |
|---|---|
| Repository URL | |
| v1.0.0 release URL | |
| Final commit hash | |
| APK path | build/AgriSokoPocket_G10.apk |
| Tested devices | |
| Deployed API URL | |

## Known limitations
Lexical (word/character) matching only — synonyms may not match; offline mode is exact lookups only; single-skill questions (e.g. "Who knows Python?") can score below the threshold and are safely rejected; sample data must be replaced with verified member records.

## Where the evidence files are
`evidence/AI_USE.md`, `evidence/AI_EVALUATION_OUTPUT.txt`, `evidence/TEST_LOG.md`, `evidence/FEEDBACK.md`, `evidence/CONTRIBUTIONS.md` (export the last three to PDF), demo video `evidence/COMBO_A3_G10_DEMO.mp4` (record), report `docs/COMBO_A3_G10_REPORT.pdf` (write from `docs/REPORT_OUTLINE.md`).
