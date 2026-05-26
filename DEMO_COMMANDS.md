# CU-ASK Tutorial 5 Demo Commands

This memo records the full classroom demo flow for Tutorial 5 after the database stack was simplified to SQLite.

Assumption: every terminal starts in:

```bash
tut/tut5/cu-ask/
```

The demo uses three terminals:

- Terminal A: backend FastAPI server
- Terminal B: frontend Vite server
- Terminal C: quick checks and inspection commands

The project now uses:

```text
React -> FastAPI -> SQLite
React -> FastAPI -> Dify
```

Teaching point: the browser never talks directly to SQLite and never receives the Dify API key.

## 0. Confirm The Starting Folder

Run this in any terminal.

```bash
pwd
```

Expected output should end with:

```text
.../CU-ASK/tut/tut5/cu-ask
```

Check the project files:

```bash
ls
```

Expected output includes:

```text
README.md
backend
database
index.html
package-lock.json
package.json
src
vite.config.js
```

Check the key teaching files:

```bash
ls database src/context src/services src/pages backend
```

Expected output includes these groups:

```text
backend:
main.py
requirements.txt

database:
schema.sql

src/context:
AuthContext.jsx

src/pages:
Chat.jsx
Landing.jsx
Learning.jsx
Quiz.jsx
User.jsx

src/services:
database.js
```

## 1. Explain The Local Stack

Show the environment template:

```bash
sed -n '1,120p' .env.example
```

Expected output:

```text
# Frontend: FastAPI server used by the React app.
VITE_API_BASE=http://127.0.0.1:8000

# Backend: SQLite database file. Leave this as-is for local teaching.
CUASK_DB_PATH=backend/cuask.sqlite3

# Backend: Dify Advanced Chat App API.
# The backend never exposes DIFY_API_KEY to the browser.
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-api-key
```

For classroom database teaching, no cloud database account is needed. FastAPI creates `backend/cuask.sqlite3` automatically when the backend starts.

For real Dify mode, copy the template:

```bash
cp .env.example .env
```

Expected output:

```text
# No output means success.
```

Then edit `.env` and replace only:

```text
DIFY_API_KEY=app-your-real-dify-api-key
```

Important: after editing `.env`, restart the backend. FastAPI reads backend secrets at startup.

## 2. Inspect The SQLite Schema

Show the schema file:

```bash
sed -n '1,220p' database/schema.sql
```

Expected output includes table definitions like:

```sql
create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  school_level text not null default '未設定',
  role text not null default 'student',
  created_at text not null,
  updated_at text not null
);

create table if not exists learning_progress (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  module_id text not null references learning_modules(id) on delete cascade,
  status text not null default 'started',
  completed_at text,
  updated_at text not null,
  unique (user_id, module_id)
);
```

Show the project tables:

```bash
rg -n "create table if not exists" database/schema.sql
```

Expected output includes:

```text
users
sessions
learning_modules
learning_progress
quiz_questions
quiz_attempts
chat_sessions
chat_messages
```

Show user-owned tables:

```bash
rg -n "user_id|references users" database/schema.sql
```

Expected output includes matches in:

```text
sessions
learning_progress
quiz_attempts
chat_sessions
chat_messages
```

Teaching point: SQLite stores rows locally. FastAPI protects user-owned rows by checking the session token and using `user_id`.

## 3. Install Frontend Dependencies

Run in Terminal B.

```bash
npm install
```

Expected output after the first install:

```text
added ... packages in ...

... packages are looking for funding
```

If dependencies were already installed, expected output may instead be:

```text
up to date, audited ... packages in ...

... packages are looking for funding
```

If npm reports audit warnings, they do not block the classroom demo.

## 4. Install Backend Dependencies

Recommended classroom approach: use a local virtual environment inside the project.

Run in Terminal A.

```bash
python3 -m venv .venv
```

Expected output:

```text
# No output means success.
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Expected prompt change:

```text
(.venv) ...
```

Install FastAPI, uvicorn, and dotenv support:

```bash
python -m pip install -r backend/requirements.txt
```

Expected output includes:

```text
Collecting fastapi
Collecting uvicorn
Collecting python-dotenv
...
Successfully installed ... fastapi ... python-dotenv ... uvicorn ...
```

If the packages are already installed, expected output may include:

```text
Requirement already satisfied: fastapi
Requirement already satisfied: python-dotenv
Requirement already satisfied: uvicorn
```

Check that uvicorn is available:

```bash
python -m uvicorn --version
```

Expected output looks like:

```text
Running uvicorn 0.xx.x with CPython 3.xx.x on Darwin
```

## 5. Start The Backend Server

Run in Terminal A.

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Expected output:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started server process [...]
INFO:     Application startup complete.
```

Keep this terminal running. Do not type more commands into Terminal A while the backend server is running.

Backend startup creates:

```text
backend/cuask.sqlite3
```

## 6. Inspect The Created SQLite Database

Run in Terminal C while Terminal A is still running.

```bash
ls backend
```

Expected output includes:

```text
cuask.sqlite3
main.py
requirements.txt
```

Inspect tables with the SQLite CLI:

```bash
sqlite3 backend/cuask.sqlite3 ".tables"
```

Expected output includes:

```text
chat_messages      chat_sessions      learning_modules
learning_progress  quiz_attempts      quiz_questions
sessions           users
```

Inspect the seeded demo account:

```bash
sqlite3 backend/cuask.sqlite3 "select email, display_name, school_level from users;"
```

Expected output:

```text
demo@student.cuhk.edu.hk|Demo Student|Secondary 4
```

Inspect learning modules:

```bash
sqlite3 backend/cuask.sqlite3 "select id, title from learning_modules order by display_order;"
```

Expected output:

```text
recognise-cyberbullying|辨認網路霸凌
respond-safely|安全回應與保存證據
support-others|成為旁觀者支援者
```

If `sqlite3` is not available, use Python:

```bash
python3 - <<'PY'
import sqlite3
conn = sqlite3.connect("backend/cuask.sqlite3")
for row in conn.execute("select name from sqlite_master where type='table' order by name"):
    print(row[0])
PY
```

Expected output lists the table names.

## 7. Check The Backend API

Run in Terminal C.

```bash
curl -s http://127.0.0.1:8000/ | python3 -m json.tool
```

Expected output:

```json
{
    "message": "Welcome to CU-ASK API!",
    "database": ".../backend/cuask.sqlite3",
    "database_ready": true,
    "dify_configured": false
}
```

If `.env` contains a real Dify key, `dify_configured` should be `true`.

Check backend config:

```bash
curl -s http://127.0.0.1:8000/api/config | python3 -m json.tool
```

Expected output:

```json
{
    "database": "sqlite",
    "database_path": ".../backend/cuask.sqlite3",
    "dify_configured": false,
    "chat_endpoint": "/api/chat/send"
}
```

## 8. Task 1 Demo: User Accounts And Session Tokens

Sign in with the seeded demo account and save the token in a shell variable:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@student.cuhk.edu.hk","password":"password123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
echo "$TOKEN"
```

Expected output:

```text
# A long random token, for example:
Kxq...random...value
```

Use the token to read the current user:

```bash
curl -s http://127.0.0.1:8000/api/me \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool --no-ensure-ascii
```

Expected output:

```json
{
    "user": {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "demo@student.cuhk.edu.hk"
    },
    "profile": {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "demo@student.cuhk.edu.hk",
        "display_name": "Demo Student",
        "school_level": "Secondary 4",
        "role": "student"
    }
}
```

Inspect where the session was stored:

```bash
sqlite3 backend/cuask.sqlite3 "select user_id, length(token) from sessions;"
```

Expected output:

```text
00000000-0000-0000-0000-000000000001|43
```

Teaching point: the browser stores only a session token. FastAPI uses that token to identify the current SQLite user.

## 9. Start The Frontend Server

Run in Terminal B.

```bash
npm run dev -- --host 127.0.0.1
```

Expected output:

```text
> cu-ask-tut5-starter@0.0.0 dev
> vite --host 127.0.0.1

  VITE v7.x.x  ready in ... ms

  ➜  Local:   http://127.0.0.1:5173/
```

Keep this terminal running. Use the printed URL in the browser.

## 10. Open The App

Open this URL:

```text
http://127.0.0.1:5173/
```

Expected page:

- The CU-ASK home dashboard loads.
- Navigation shows `首頁`, `聊天支援`, `認識網路霸凌`, `知識小測驗`, `用戶`.
- Header shows `SQLite 本地資料庫`.
- If you are not logged in yet, the header says `登入後可保存個人進度`.

## 11. Browser Task 1: Login And Profile

Inspect the auth code:

```bash
sed -n '1,220p' src/context/AuthContext.jsx
```

Expected output includes:

```js
const TOKEN_KEY = 'cuAskSessionToken'
```

Expected output also includes:

```js
async function signUp(...)
async function signIn(...)
async function signOut()
async function updateProfile(...)
```

Browser steps:

1. Click `用戶`.
2. Confirm page title is `用戶與個人紀錄`.
3. Confirm the login form is prefilled with:

```text
demo@student.cuhk.edu.hk
password123
```

4. Click `登入`.
5. Edit `顯示名稱` or `年級`.
6. Click `儲存個人資料`.

Expected browser output:

```text
已登入。
個人資料已儲存。
```

Expected teaching point:

`users` stores the account/profile. `sessions` stores the login token. User-owned records use `user_id`.

## 12. Task 2 Demo: Database Service Functions

Inspect database service functions:

```bash
sed -n '1,260p' src/services/database.js
```

Expected output includes function names:

```js
listLearningProgress
saveLearningProgress
listQuizAttempts
saveQuizAttempt
listChatSessions
createChatSession
listChatMessages
saveChatMessage
```

Expected teaching point:

React does not import SQLite. It calls FastAPI endpoints, and FastAPI reads/writes SQLite.

Find user-owned API routes:

```bash
rg -n "Depends\\(current_user\\)|user_id" backend/main.py
```

Expected output includes:

```text
learning_progress
quiz_attempts
chat_sessions
chat_messages
Depends(current_user)
```

## 13. Task 3 Demo: Learning Modules And Progress

Inspect the learning page:

```bash
sed -n '1,240p' src/pages/Learning.jsx
```

Expected output includes:

```js
listLearningModules
listLearningProgress
saveLearningProgress
```

Find the database table and frontend call:

```bash
rg -n "learning_modules|learning_progress|saveLearningProgress|listLearningModules" database/schema.sql src/services/database.js src/pages/Learning.jsx backend/main.py
```

Expected output includes:

```text
database/schema.sql: create table if not exists learning_modules
database/schema.sql: create table if not exists learning_progress
src/services/database.js: export async function listLearningModules()
src/services/database.js: export async function saveLearningProgress(...)
backend/main.py: @app.put("/api/learning/progress/{module_id}")
```

Browser steps:

1. Click `認識網路霸凌`.
2. Confirm page title is `認識網路霸凌`.
3. Click the first `標記完成` button.

Expected browser output:

```text
完成進度 1/3
已完成
```

Confirm the row in SQLite:

```bash
sqlite3 backend/cuask.sqlite3 "select module_id, status from learning_progress;"
```

Expected output includes:

```text
recognise-cyberbullying|completed
```

## 14. Task 4 Demo: Quiz Questions And Attempts

Inspect the quiz page:

```bash
sed -n '1,260p' src/pages/Quiz.jsx
```

Expected output includes:

```js
listQuizAttempts
listQuizQuestions
saveQuizAttempt
```

Find quiz database code:

```bash
rg -n "quiz_questions|quiz_attempts|saveQuizAttempt|listQuizQuestions" database/schema.sql src/services/database.js src/pages/Quiz.jsx backend/main.py
```

Expected output includes:

```text
database/schema.sql: create table if not exists quiz_questions
database/schema.sql: create table if not exists quiz_attempts
src/services/database.js: export async function listQuizQuestions()
src/services/database.js: export async function saveQuizAttempt(...)
backend/main.py: @app.post("/api/quiz/attempts")
```

Browser steps:

1. Click `知識小測驗`.
2. Select the correct answers:
   - `保存截圖並尋找可信任成年人協助`
   - `私下關心受影響同學並停止擴散內容`
   - `保存個人的學習進度、測驗紀錄和聊天 session`
   - `讓同一段聊天可以延續上下文`
3. Confirm the sidebar says:

```text
目前作答 4/4
```

4. Click `提交並儲存分數`.

Expected browser output:

```text
已儲存：4/4
最近測驗紀錄
4/4
```

Confirm the row in SQLite:

```bash
sqlite3 backend/cuask.sqlite3 "select score, total from quiz_attempts;"
```

Expected output:

```text
4|4
```

## 15. Task 5 Demo: Custom Chat UI And Dify Proxy

Inspect backend proxy code:

```bash
sed -n '1,320p' backend/main.py
```

Expected output includes:

```py
@app.post("/api/chat/send")
def send_chat_message(...)
```

Expected output also includes:

```py
"response_mode": "blocking"
"Authorization": f"Bearer {DIFY_API_KEY}"
```

Inspect frontend chat code:

```bash
sed -n '1,280p' src/pages/Chat.jsx
```

Expected output includes:

```js
createChatSession
listChatMessages
listChatSessions
saveChatMessage
updateChatSession
```

Expected output also includes:

```js
fetch(`${API_BASE}/api/chat/send`, ...)
```

Find chat tables and service functions:

```bash
rg -n "chat_sessions|chat_messages|dify_conversation_id|saveChatMessage|createChatSession" database/schema.sql src/services/database.js src/pages/Chat.jsx backend/main.py
```

Expected output includes:

```text
database/schema.sql: create table if not exists chat_sessions
database/schema.sql: create table if not exists chat_messages
src/services/database.js: export async function createChatSession(...)
src/services/database.js: export async function saveChatMessage(...)
backend/main.py: DIFY_API_KEY
backend/main.py: conversation_id
```

Browser steps:

1. Click `聊天支援`.
2. Type:

```text
我看到同學在群組被取笑，應該怎樣幫他？
```

3. Click `送出`.

Expected browser output if `DIFY_API_KEY` is configured:

```text
# A real Dify answer appears.
```

Expected browser output if the Dify key is present but the Dify app has no configured model:

```text
Dify 已連接，但 Dify app 暫時未能回覆。上游錯誤：invalid_param - Model is not configured...
```

Fix this in Dify by selecting a model, configuring the model provider credential/key, checking quota, and publishing the app again.

Expected browser output if `DIFY_API_KEY` is not configured:

```text
（Demo 回覆）...
```

Expected left sidebar output after the reply:

```text
已連接 Dify conversation
```

Confirm the rows in SQLite:

```bash
sqlite3 backend/cuask.sqlite3 "select title, dify_conversation_id is not null from chat_sessions;"
sqlite3 backend/cuask.sqlite3 "select role, substr(content, 1, 20) from chat_messages;"
```

Expected output includes:

```text
user|我看到同學在群組被取笑
assistant|...
```

## 16. Final Flow Check On User Page

Browser steps:

1. Click `用戶`.
2. Check `我的紀錄`.

Expected browser output after one full fresh demo run:

```text
學習進度 1/3
測驗提交 1
聊天 session 1
```

Expected lower-page output:

```text
最近測驗
4/4

最近聊天
已連接 Dify conversation
```

If the numbers are larger, the SQLite database already contains previous demo rows. That is not a bug.

## 17. Optional: Reset Local SQLite Data

Use this only when you want a fresh classroom demo.

Stop the backend first, then run:

```bash
rm -f backend/cuask.sqlite3
```

Expected output:

```text
# No output means the database file was deleted.
```

Restart the backend:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Expected result:

```text
backend/cuask.sqlite3 is recreated with seed data.
```

## 18. Production Build Check

Run in Terminal C.

```bash
npm run build
```

Expected output:

```text
> cu-ask-tut5-starter@0.0.0 build
> vite build

vite v7.x.x building client environment for production...
✓ ... modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  ...
dist/assets/index-....css        ...
dist/assets/index-....js         ...
✓ built in ...s
```

The large chunk warning may appear because Material UI is bundled into the starter. It does not block the classroom demo.

## 19. Backend Syntax Check

Run in Terminal C.

```bash
source .venv/bin/activate
PYTHONPYCACHEPREFIX=/private/tmp/cuask_pycache python -m py_compile backend/main.py
```

Expected output:

```text
# No output means the Python file compiled successfully.
```

If you did not create `.venv`, use:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/cuask_pycache python3 -m py_compile backend/main.py
```

Expected output:

```text
# No output means success.
```

## 20. Stop The Servers

In Terminal A, press:

```text
Control + C
```

Expected backend output:

```text
^C
INFO:     Shutting down
INFO:     Application shutdown complete.
```

In Terminal B, press:

```text
Control + C
```

Confirm no local server is still listening:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Expected output:

```text
# No output means those ports are free.
```

## 21. Common Error Outputs And Fixes

### `No module named uvicorn`

Cause: backend dependencies are not installed in the active Python environment.

Fix:

```bash
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

### `Address already in use`

Cause: Vite or FastAPI is already running on the same port.

Check:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Then stop the old server with `Control + C` in its terminal.

### Login fails

Expected browser error may look like:

```text
Invalid email or password
```

Fix: use the seeded demo account:

```text
demo@student.cuhk.edu.hk
password123
```

If the database was edited manually, reset it:

```bash
rm -f backend/cuask.sqlite3
```

Then restart the backend.

### Chat page says backend cannot connect

Expected browser error:

```text
未能連接聊天後端。請確認 FastAPI 已啟動；若要連接真實 AI，還需要設定 DIFY_API_KEY。
```

Fix:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Then reload the browser page.

### Dify returns demo answer

Cause: `DIFY_API_KEY` is missing from `.env` or still has the placeholder value.

This is expected if you are teaching database only.

For real Dify mode, edit `.env`:

```text
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=app-your-real-dify-api-key
```

Then stop and restart the backend server.

Check:

```bash
curl -s http://127.0.0.1:8000/api/config | python3 -m json.tool
```

Expected output when Dify is configured:

```json
{
    "database": "sqlite",
    "database_path": ".../backend/cuask.sqlite3",
    "dify_configured": true,
    "chat_endpoint": "/api/chat/send"
}
```

### Dify returns `Model is not configured`

Expected browser output:

```text
Dify 已連接，但 Dify app 暫時未能回覆。上游錯誤：invalid_param - Model is not configured...
```

Cause: FastAPI reached Dify successfully, but the Dify app does not yet have a usable model setup.

Fix in Dify:

```text
Open the chatbot app -> choose/configure a model -> configure provider credential/API key -> publish the app again.
```

Then retry the CU-ASK chat page.

## 22. Clean Demo Artifacts Before Handing To Students

Optional cleanup after testing:

```bash
rm -rf dist
rm -rf backend/__pycache__
rm -rf /private/tmp/cuask_pycache
```

If you want students to start from a fresh database, remove:

```bash
rm -f backend/cuask.sqlite3
```

If you are packaging the starter project, you may also remove local dependencies and virtual environments:

```bash
rm -rf node_modules
rm -rf .venv
```

Students can recreate them with `npm install` and `python3 -m venv .venv`.

Do not delete:

```text
package.json
package-lock.json
backend/main.py
backend/requirements.txt
database/schema.sql
src/
```

Those files are part of the final starter.
