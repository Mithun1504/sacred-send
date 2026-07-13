# Emergency Cremation & Funeral Planner ("A Gentle Guide")

A React Native Expo mobile app for grieving families in India who need immediate, guided help with post-death formalities. Guest-mode by default (no signup), gentle emotional tone, one-thumb usable.

## MVP Feature Scope (as delivered)

### Setup (under 20 seconds, 3 taps)
- Landing screen with privacy assurance line
- Step 1: Location (GPS auto-detect + manual override)
- Step 2: Place of death (Hospital / Home / Other) + optional unexpected/accidental question
- Step 3: Religion (Hindu / Muslim / Christian / Sikh / Secular / Skip)

### Core Guidance
- Dynamic checklist branched by (place, religion, unexpected)
- 5 phases: Right Now / Today / Next Few Days / Next Few Weeks / In the Coming Months
- Right Now auto-expanded; all others collapsed by default (accordion)
- 3-state task tracking: Not started / Done / Skipped (all reversible)
- Urgency notes attached per-religion (e.g., Muslim 24-hour burial expectation)
- "Why this is needed" plain-language explainer per task (collapsible)

### Correct, verified content
- Only pan-India verified national helplines are hardcoded (112, 108, 102, 100, 101, 14567, 1091, IRDAI 155255, LIC 1800-227-717)
- All hyper-local needs (crematorium, mosque, gurudwara, church, municipal registrar, hearse) use Google Maps search links based on user's stored location — no invented phone numbers
- Death certificate flow correctly split into: MCCD (hospital only) → Register (21-day window, mentions crsorgi.gov.in) → Collect (5–8 originals, 7–15 days)
- Home-death path adds mandatory doctor-confirmation step
- Unexpected/accidental path adds police-report step with post-mortem note
- Insurance step correctly guides to insurer directly (LIC helpline shown) with IRDAI positioned as grievance-only

### Companion features
- Contacts Hub: verified helplines + location-aware maps searches
- Document Vault: mock OTP (code 123456) → base64 photo upload for Aadhaar/ID/Insurance/Hospital papers
- Family Share Sheet: auto-generates warm WhatsApp message via wa.me deep link, editable in English/Hindi/Tamil
- Local reminders via expo-notifications (quiet, no sound)
- Settings: language toggle (en/hi/ta), reminders toggle, clear-all with "cannot be undone" confirmation
- Session persistence via AsyncStorage; "Continue where I left off" surfaces on landing

## Backend
- FastAPI + MongoDB
- `POST /api/checklist` — task templates branched by (place, religion, unexpected)
- `GET  /api/contacts` — verified national numbers + local search terms
- `POST /api/otp/{send,verify}` — mocked (fixed code 123456)
- `POST /api/vault/upload`, `GET /api/vault/{session_id}`, `DELETE /api/vault/{doc_id}`
- `POST /api/share/message` — multilingual auto-generated WhatsApp text

## Design system
- Warm neutral palette: cream/sand base, muted sage green accent
- 16px min body text, 48pt min tap targets, generous line height
- One-column, thumb-zone-first layout
- No gamification, no celebratory animation, no dark theme, no death/coffin imagery

## Explicitly out of scope
- No signup / login / email
- No in-app payments or vendor bookings
- No AI chat interface
- No push notifications (only local, quiet reminders)
- No Kannada / Telugu translation yet (planned)
