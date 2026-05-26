# CU-ASK — Tutorial 5 Final Starter

This repository is the final teaching snapshot and the recommended starting point for actual CU-ASK development.

For a step-by-step classroom runbook with commands and expected output, see `DEMO_COMMANDS.md`.

## Quick Start For Students

Clone the repository:

```bash
git clone https://github.com/JackonLI/cu-ask.git
cd cu-ask
```

Install dependencies:

```bash
bash setup_env.sh
```

Start the backend:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Start the frontend in a second terminal:

```bash
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

Demo account:

```text
email: demo@student.cuhk.edu.hk
password: password123
```

The project has the five student-facing pages requested for the real product:

- `/` — 首頁 dashboard
- `/chat` — 聊天支援 with a custom chat UI
- `/learning` — 認識網路霸凌
- `/quiz` — 知識小測驗
- `/user` — 用戶 account, profile, progress, scores, and chat sessions

There is no separate test page. Database usage is demonstrated through actual product features.

## Stack

- Frontend: React, Vite, TailwindCSS, React Router, Material UI icons
- Backend: FastAPI
- Database and local accounts: SQLite through Python's built-in `sqlite3`
- AI chatbot: Dify Advanced Chat App API through `POST /api/chat/send`

SQLite is the default database because CU-ASK's starter needs to be easy to run and inspect. For a small team and tens of thousands of rows, a local SQLite file is enough for classroom development, pilot testing, and the first working prototype. If the project later needs multi-server deployment, admin dashboards, or heavy concurrent traffic, the same table design can be migrated to PostgreSQL.

## Database Setup

No hosted database account is required.

FastAPI automatically creates the SQLite file when the backend starts:

```bash
backend/cuask.sqlite3
```

The schema lives in:

```bash
database/schema.sql
```

The database file is ignored by git. The starter ships the schema and seed logic, not a machine-specific database file.

Seeded demo account:

```text
email: demo@student.cuhk.edu.hk
password: password123
```

## Dify Setup

1. Create or open a Dify Advanced Chat app.
2. Open the app's API access/API key area and create an API key.
3. Copy `.env.example` to `.env`.
4. Put the key only in `.env` as `DIFY_API_KEY`.
5. Keep `DIFY_API_BASE=https://api.dify.ai/v1` unless the team uses a self-hosted Dify instance.
6. Restart FastAPI and check `http://127.0.0.1:8000/api/config`.

Never put `DIFY_API_KEY` in a `VITE_` variable. Anything beginning with `VITE_` can be exposed to the browser.
Do not distribute `.env` to students or commit it to git; share `.env.example` instead.

If `DIFY_API_KEY` is not set, the backend returns a demo answer so students can still test the database flow.

If `DIFY_API_KEY` is set but the Dify app returns `Model is not configured`, the CU-ASK chat page will show a clear `dify_error` assistant message. Fix it inside Dify by selecting a model, configuring the model provider key/credential, checking quota, and publishing the app again.

## Run Locally

Install everything:

```bash
./setup_env.sh
```

Or run the setup manually:

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Start FastAPI:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Start React in another terminal:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

## Database Tables

Core tables in `database/schema.sql`:

- `users`: one row per local account
- `sessions`: login tokens created by FastAPI
- `learning_modules`: published learning content
- `learning_progress`: per-user module completion
- `quiz_questions`: active quiz questions
- `quiz_attempts`: per-user scores and answers
- `chat_sessions`: one row per chat conversation
- `chat_messages`: user and assistant messages for each session

SQLite does not provide database-side row-level security in this starter. Privacy is enforced by FastAPI: every user-owned endpoint reads the session token, finds the current user, and filters or writes rows by `user_id`.

## Dify Chat Flow

1. React saves the user's message to `chat_messages` through FastAPI.
2. React sends the message and current `conversation_id` to FastAPI.
3. FastAPI reads `DIFY_API_KEY` from `.env`.
4. FastAPI calls Dify `/chat-messages` with `response_mode: "blocking"`.
5. React stores the AI answer and returned Dify `conversation_id` in SQLite through FastAPI.

This keeps the final app extensible: the team can later add admin review, analytics, crisis escalation, or school-specific content without changing the whole architecture.
