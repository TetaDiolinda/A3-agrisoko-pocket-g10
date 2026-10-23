# AI_USE.md: AI tool usage (Group G10)

## 1. Group-level statement

| Item | Detail |
|---|---|
| Tool | Claude (Anthropic) |
| Purpose | Generated the first working version of the project from the assignment brief: FastAPI service, TF-IDF matching engine, evaluation script, API tests, the Expo / React Native app, README, run guide and evidence templates |
 threshold tuning using the evaluation sweep; fixing setup errors (Python `py` command, port 8000 already in use, invalid eas.json, member data copy) |
| What the AI tool checked | pytest (25 tests passing), evaluate.py (88% top-1 accuracy, 100% no-match rejection at threshold 0.25), TypeScript type check, Android bundle export |
| What the group did | Installed and ran the service and app on a physical Android phone, replaced the sample member records with the real names, registration numbers and GitHub usernames, built the APK with EAS, and tested it on a phone |
| Not invented | No metric, tester or testimonial was created by the AI tool. `outcomeMetric` and `testerFeedback` stay empty until real, consented evidence exists |

## 2. Individual statements

Each member must read their own section, **correct anything that is not true**, and fill in the "I personally" lines in their own words. A signature in CONTRIBUTIONS confirms that this is accurate. Do not sign for another member.

### Member 1: Kiir Kiir Deng Kur (24/24671, GitHub: Ug2424671-collab). Product and GitHub lead
- **AI-generated code in my area:** `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/AboutScreen.tsx`, `mobile/src/config.ts`, `README.md`, `RUN_GUIDE.md`, the templates in `evidence/` and `docs/`.
- **I personally** worked on some codes in homescreen.tsx and removed errrors
- **Checks I did** I opened the screen on my phone, read the code, changed text
- Files I changed myself:

### Member 2: MANZI Prince Peter (25/28149, GitHub: 2528149-cell). AI and data engineer
- **AI-generated code in my area:** `ai-api/app/engine.py` (TF-IDF matching, name boost, confidence threshold), `ai-api/build_index.py`, `ai-api/evaluate.py`, the schema of `ai-api/data/members.json`, `ai-api/app/config.py` (threshold 0.25).
- **I personally** removed errors and worked a littlebit on ai-api/app/engine.py
- **Checks I did** ran `py evaluate.py`, read the threshold sweep, tried my own test questions.
- Files I changed myself:

### Member 3: UMUTONI Liliane (25/28965, GitHub: lilianeumutoni302). API and integration engineer
- **AI-generated code in my area:** `ai-api/app/main.py` (endpoints /health, /members, /members/{id}, /ask, /model-info), `ai-api/app/schemas.py`, `ai-api/tests/test_engine_and_api.py`, `ai-api/requirements.txt`, `render.yaml`.
- **I personally** checked of they were wworking and running without errors and changed some errors by correcting them 
- **Checks I did**  ran `py -m pytest -q`, opened `/docs`, tested an empty question
- Files I changed myself:

### Member 4: SHYAKA Guy Peter (24/26559, GitHub: peternickson4-max). Mobile UI and navigation engineer
- **AI-generated code in my area:** `mobile/App.tsx`, `mobile/src/screens/AskScreen.tsx`, `ResultScreen.tsx`, `DirectoryScreen.tsx`, `ProfileScreen.tsx`, `mobile/src/components/ui.tsx`, `mobile/src/types.ts`.
- **I personally** checked no error occured and kinda worked on my profilescreen.tsx.
- **Checks I did** example used each screen on my phone, tested large text, checked the no-match screen 
- Files I changed myself: changed and edited some 

### Member 5: TETA Diolinda UWASE (25/26870, GitHub: TetaDiolinda). Offline and quality engineer, release
- **AI-generated code in my area:** `mobile/src/lib/offlineMatch.ts`, `storage.ts`, `api.ts`, `askFlow.ts`, `mobile/src/context/AppContext.tsx`, `mobile/eas.json`, `mobile/app.json`.
- **I personally** built the apk on the mobile and installed the app on the mobile and checked that it is relly running with no errors.
- **Checks I did**  tested Airplane mode, built the APK, installed it on a second phone
- Files I changed myself:AI_USE

## 3. Responsible use

- The AI tool supported building, explanation and debugging. Each member remains responsible for understanding their own part and for checking the truth and privacy of their own record in `members.json`.
- The profile engine only rearranges approved facts from `members.json`. It does not create new facts, metrics, links or testimonials.
