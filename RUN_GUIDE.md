# RUN GUIDE — AgriSoko Pocket G10 (step by step)

Commands are for Windows (PowerShell). Mac/Linux differences are noted.
You need: **Python 3.10+**, **Node.js 20+**, an **Android phone**, and (for the APK) a free **Expo account** (https://expo.dev).

---
## PART 1 — Start the AI service (on your computer)

1. Open PowerShell and go into the project:
   ```
   cd COMBO_A3_G10\ai-api
   ```
2. Create and activate a virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate          # Mac/Linux: source .venv/bin/activate
   ```
3. Install packages:
   ```
   pip install -r requirements.txt
   ```
4. Validate the data and build the index (writes the SHA-256 fingerprint):
   ```
   python build_index.py
   ```
   Expected: `OK: 5 members validated` and a fingerprint.
5. Run the automatic tests — expected `25 passed`:
   ```
   python -m pytest -q
   ```
6. Run the AI evaluation (top-1 accuracy, no-match rejection, confusion table):
   ```
   python evaluate.py --write
   ```
7. Start the server:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
8. Check it in the browser: http://localhost:8000/docs (try `/health`, `/members`, `POST /ask`, `/model-info`).
   Leave this window open.

---
## PART 2 — Run the app on your phone (quick test with Expo Go)

Expo Go is only for development testing. The final submission is the APK (Part 4).

1. Phone and computer must be on the **same Wi-Fi**.
2. Find your computer's IP: run `ipconfig` and read **IPv4 Address** (example `192.168.1.25`).
3. Allow port 8000 through the Windows firewall the first time Windows asks (choose "Private networks").
4. In a **second** PowerShell window:
   ```
   cd COMBO_A3_G10\mobile
   npm install
   $env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.25:8000"     # use YOUR IP
   npx expo start
   ```
   (Command Prompt: `set EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8000`; Mac/Linux: `export EXPO_PUBLIC_API_BASE_URL=...`)
5. Install **Expo Go** from the Play Store, open it and scan the QR code.
6. Try: Ask the team -> "Who built offline mode?" (LIVE badge), then "How do I cook rice?" (no-match screen).
7. Test offline: turn on Airplane mode -> ask "Tell me about Member One" -> you get an **OFFLINE MATCH** label.
   Turn Airplane mode off and tap Retry.

Using an Android emulator instead? The default URL `http://10.0.2.2:8000` already points to your computer.

---
## PART 3 — Put the API online (needed for the demo APK)

The APK on a phone cannot reach `localhost`. Pick one:

**A. Temporary (good for a quick demo):** install ngrok, run `ngrok http 8000`, copy the `https://....ngrok-free.app` address.

**B. Proper (after GitHub is ready):** push the repo to GitHub, create a free Web Service on https://render.com,
connect the repo; `render.yaml` in the project root already holds the settings
(root `ai-api`, build `pip install -r requirements.txt && python build_index.py`,
start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Open `https://YOUR-SERVICE.onrender.com/health` to check.
(Free plans sleep when idle; the first request can take ~30 s — the app's timeout/retry handles that, but open /health before your demo.)

---
## PART 4 — Build the installable APK (no Expo Go)

1. Open `mobile/eas.json` and replace `https://REPLACE-WITH-YOUR-DEPLOYED-API-URL` with your real API URL from Part 3.
2. Install the EAS tool and log in:
   ```
   npm install -g eas-cli
   eas login
   ```
3. In `mobile/` link the project once, then build:
   ```
   cd COMBO_A3_G10\mobile
   eas init
   eas build -p android --profile preview
   ```
4. Wait for the cloud build (can queue 10–40 min on the free plan). When done, EAS prints a link — download the `.apk`.
5. Rename it **AgriSokoPocket_G10.apk**, copy it into `COMBO_A3_G10/build/`, and send it to your phone (WhatsApp/USB/Drive).
6. On the phone: open the file -> allow "Install unknown apps" -> install -> open **AgriSoko Pocket G10**.
7. Test online, offline (Airplane mode) and reconnect on **two different phones**.

---
## PART 5 — Replace the sample members with your REAL team (important!)

The project ships with 5 **sample** records (`Member One` ... `Member Five`) so everything runs now.
Before you submit:

1. Edit `ai-api/data/members.json`. For each of the 5 members fill in real: `fullName`, `registrationNumber`, `aliases` (nicknames), `githubUsername`, and check `role`, `skills`, `contribution`, `feature`, `introductionDraft` match what that person REALLY built.
2. `outcomeMetric`: leave it `""` unless you have a real, measured result (for example from your test log). `testerFeedback`: only real, consented feedback. Never invent.
3. `evidenceLinks`: replace `REPLACE_WITH_GITHUB_ORG` with your real GitHub repo address; add real PR / commit / demo links when they exist. Links that still contain `REPLACE` appear greyed out in the app.
4. Sync and rebuild:
   ```
   cd ai-api
   python build_index.py
   python -m pytest -q
   python evaluate.py --write       # re-check accuracy and the threshold
   cd ..\mobile
   npm run sync-data                # copies members.json into the app (offline directory)
   ```
5. In `mobile/app.json` set `extra.githubUrl` to your repo URL; in `mobile/src/screens/AskScreen.tsx` change the `EXAMPLES` names to a real member.
6. Each member signs their own record (see the assignment).

If the AI threshold needs changing, edit `CONFIDENCE_THRESHOLD` in `ai-api/app/config.py` and write the reason (use the sweep table printed by `evaluate.py`) in your report.

---
## PART 6 — What is still left for you (we do these next)

- GitHub: repo `agrisoko-pocket-g10`, issues, branches, PRs, reviews, tag `v1.0.0`, release with the APK
- Tests with 4 real testers (2 outside the group), 2 devices, 2 fixed issues
- Demo video (<= 3 min, unedited), report PDF, CONTRIBUTIONS / TEST_LOG / FEEDBACK as PDFs (templates are in `evidence/` and `docs/`)
- Update `evidence/AI_USE.md` honestly, then zip WITHOUT `node_modules`, `.venv`, caches

## Troubleshooting
| Problem | Fix |
|---|---|
| App shows "Could not reach the server" | API not running, wrong IP, different Wi-Fi, or firewall blocking port 8000 |
| `pip` / `python` not found | Install Python and tick "Add to PATH"; try `py` instead of `python` |
| Phone can open `http://IP:8000/health` in its browser but app can't | Restart `expo start` after changing the environment variable |
| EAS build fails on first try | Read the log link; run `eas init` first; make sure `package` in `app.json` is unique |
| `npm install` slow/fails | Retry; use a stable connection |
