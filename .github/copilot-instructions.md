<!-- Copilot / AI agent instructions for PSYKAT repo -->
# PSYKAT — Copilot Instructions (concise)

Goal: Help AI coding agents become productive quickly in this repo by documenting the architecture, key workflows, conventions, and integration points with concrete file examples.

- Big picture:
  - Frontend: `react/` — Expo React Native app (TypeScript). App UI, contexts, screens and game logic live here.
  - IA integration: `ai-integration.js` provides a client-side shim and a local fallback for AI responses and an n8n webhook mode. Production should move API keys to server-side functions (Supabase/Edge Functions).
  - Config: `config.js` centralizes game/clinical/AI settings (`PSYKAT_CONFIG`, `ConfigUtils`). Use it to find game rules (e.g., `questionsPerSession = 5`).

- How to run (developer commands):
  - Install: `cd react && npm install`
  - Start dev: `npx expo start` (or `npm run start`)
  - Platform shortcuts: `npm run android`, `npm run ios`, `npm run web`
  - Builds: uses EAS: `npm run build:android` / `npm run build:ios`.
  - Type check: `npx tsc --noEmit`.

- Important files to inspect first (examples):
  - `react/src/screens/ChatScreen.tsx` — main chat UX and session limits (5 questions/session), new-session flow, side panel (patient record) and tools modal.
  - `ai-integration.js` — how the app calls AI: `AIIntegration` (local responses) and `PSYKATAI` global helper (`window.psykatAI`). Shows payload shape sent to n8n webhook and fallback logic.
  - `config.js` — central config: AI timeouts, disorders, batteries, game modes, storage keys.
  - `react/package.json` — scripts, Expo/EAS config, and key dependencies (React Native, Expo, vector icons).
  - `react/src/contexts/AIContext.tsx` and `NotificationContext.tsx` — site of IA prompts, user API key usage, and notification patterns.

- Project-specific conventions & patterns:
  - UI text is in Spanish; variable names mix Spanish for UX and English for code patterns.
  - State: Context API + `useReducer` is the global state pattern (see `AppContext.tsx`). Follow existing actions (e.g., `UPDATE_CASE`, `CANCEL_CASE`).
  - Sessions: 5 therapist questions per session enforced in UI; search for `questionsPerSession` in `config.js`.
  - AI modes: `local` (use deterministic/randomized local responses) vs `n8n` (calls webhook). Switch via `config.js` or runtime localStorage overrides.
  - Avoid introducing global side effects; prefer Context providers and dispatch actions.

- Integration & external dependencies to watch:
  - Groq / LLM provider: used in production via server-side functions. Do NOT embed API keys in frontend files — there are TODOs noting migration to Supabase Edge Functions.
  - n8n webhook: `ai-integration.js` expects an endpoint (default `http://localhost:5678/webhook/ask`). Use `AIIntegration.testConnection()` to validate.
  - Storage: AsyncStorage keys are defined in `config.js.technical.storageKeys` (e.g., `psykat_cases`).

- Debugging and dev shortcuts:
  - To simulate AI locally, set `ai.mode = 'local'` in `config.js` or open browser dev console and call `window.psykatAI.configure(...)`.
  - To test n8n flow, run n8n locally and set `ai.mode = 'n8n'` with `n8nEndpoint` pointing to your webhook.
  - Look for `DEV_MODE` or `DEV` flags in screens (e.g., ChatScreen) — these change behaviour (fast timers, dev helpers).

- Small actionable rules for the agent when editing code:
  - Never add secrets to `react/` — if you need API keys, add an instruction to create server-side Edge Functions and reference `react/.env` for local dev only.
  - Keep UI strings in Spanish; follow current naming and UX tone.
  - If modifying AI prompts, update both `config.js.prompts` and `react/src/contexts/AIContext.tsx` for consistency.
  - When touching state reducers, search for existing action names in `react/src/contexts/AppContext.tsx` to avoid breaking dispatch calls.

- Typical change examples the repo expects:
  - Adding a new test battery: add metadata in `config.js.clinical.batteries`, update `DiagnosticToolScreen.tsx` to surface it and wire result generation in `ai-integration.js`.
  - Adjusting session rules: change `questionsPerSession` in `config.js` and update UI counters in `ChatScreen.tsx`.

- Where to add tests & type checks:
  - Run `npx tsc --noEmit` after TypeScript edits.
  - No automated test suite exists yet — add unit tests under `react/src/__tests__` and suggest `jest` if adding CI.

- When making AI changes:
  - Prefer adding server-side wrappers (Supabase Edge Functions) rather than client keys.
  - Keep the `ai-integration.js` payload shape consistent: `doctorQuestion`, `patientName`, `disorder`, `symptoms`, `conversationHistory`, `sessionId`, `questionCount`.

If anything above is unclear or you'd like snippets (example webhook payloads, reducer action list, or a quick-start for n8n), tell me which part to expand.
