import hashlib
import json
import os
import secrets
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")

DB_PATH = Path(os.getenv("CUASK_DB_PATH", PROJECT_ROOT / "backend" / "cuask.sqlite3"))
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "").strip()
DIFY_API_BASE = os.getenv("DIFY_API_BASE", "https://api.dify.ai/v1").strip().rstrip("/")
PASSWORD_ITERATIONS = 260_000

app = FastAPI(title="CU-ASK API", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    display_name: Optional[str] = None
    school_level: Optional[str] = None


class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=1)
    school_level: str = Field(min_length=1)


class ProgressRequest(BaseModel):
    status: str = "completed"


class QuizAttemptRequest(BaseModel):
    score: int
    total: int
    answers: list[dict[str, Any]]


class ChatSessionRequest(BaseModel):
    title: str = "新的聊天"


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    dify_conversation_id: Optional[str] = None


class ChatMessageRequest(BaseModel):
    session_id: str
    role: str
    content: str
    dify_message_id: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: Optional[str] = None
    inputs: dict[str, Any] = Field(default_factory=dict)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row else None


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("pragma foreign_keys = on")
    return connection


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        expected = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        ).hex()
        return secrets.compare_digest(expected, digest_hex)
    except (ValueError, TypeError):
        return False


def parse_json_column(row: dict[str, Any], source: str, target: str) -> dict[str, Any]:
    row[target] = json.loads(row.pop(source) or "[]")
    return row


def seed_database(connection: sqlite3.Connection) -> None:
    demo_user_id = "00000000-0000-0000-0000-000000000001"
    connection.execute(
        """
        insert or ignore into users
        (id, email, password_hash, display_name, school_level, role, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            demo_user_id,
            "demo@student.cuhk.edu.hk",
            hash_password("password123"),
            "Demo Student",
            "Secondary 4",
            "student",
            now_iso(),
            now_iso(),
        ),
    )

    modules = [
        (
            "recognise-cyberbullying",
            "辨認網路霸凌",
            "分辨玩笑、衝突與持續性的網路傷害。",
            6,
            1,
            [
                {
                    "heading": "核心定義",
                    "body": "網路霸凌通常包括重複、帶有傷害意圖、並利用網路平台擴散壓力或羞辱的行為。",
                },
                {
                    "heading": "常見形式",
                    "body": "辱罵留言、散播截圖、冒認帳戶、排擠群組、公開個人資料，以及持續私訊騷擾。",
                },
            ],
        ),
        (
            "respond-safely",
            "安全回應與保存證據",
            "學習遇到網路霸凌時的第一步。",
            8,
            2,
            [
                {
                    "heading": "先照顧安全",
                    "body": "如果感到害怕或有即時危險，先離開對話、找可信任成年人，必要時尋求學校或緊急支援。",
                },
                {
                    "heading": "保存資料",
                    "body": "截圖、記錄時間、保留連結和帳戶名稱。不要為了反擊而轉發羞辱內容。",
                },
            ],
        ),
        (
            "support-others",
            "成為旁觀者支援者",
            "旁觀者可以降低傷害，而不是讓攻擊擴散。",
            7,
            3,
            [
                {
                    "heading": "不要推高熱度",
                    "body": "不讚好、不轉發、不加入嘲笑，避免讓傷害變得更大。",
                },
                {
                    "heading": "提供低壓支援",
                    "body": "私下問候同學、陪他保存證據、鼓勵他找可信任成年人或專業支援。",
                },
            ],
        ),
    ]
    connection.executemany(
        """
        insert or ignore into learning_modules
        (id, title, description, estimated_minutes, display_order, content_json, is_published, created_at)
        values (?, ?, ?, ?, ?, ?, 1, ?)
        """,
        [(id_, title, desc, minutes, order, json.dumps(content, ensure_ascii=False), now_iso()) for id_, title, desc, minutes, order, content in modules],
    )

    questions = [
        (
            "q-evidence",
            "如果同學在群組被持續辱罵，以下哪一項通常是較安全的第一步？",
            ["立即公開反擊", "保存截圖並尋找可信任成年人協助", "把對方的個人資料貼出來", "刪除所有訊息，當作沒有發生"],
            1,
            "保存證據和尋找可信任支援，比公開反擊或人肉搜尋更安全。",
            1,
        ),
        (
            "q-bystander",
            "作為旁觀者，哪一種做法最能減少傷害？",
            ["轉發給更多朋友看", "在留言區加入嘲笑", "私下關心受影響同學並停止擴散內容", "只看不做任何事"],
            2,
            "旁觀者可以透過不擴散、私下支援和鼓勵求助來降低傷害。",
            2,
        ),
        (
            "q-account",
            "為什麼 CU-ASK 需要使用者帳戶？",
            ["讓每位使用者都看到其他人的聊天", "保存個人的學習進度、測驗紀錄和聊天 session", "讓測驗不能重做", "取代老師和社工的支援"],
            1,
            "帳戶讓資料可以和正確使用者連在一起，後端會用 session token 保護每位使用者自己的資料。",
            3,
        ),
        (
            "q-chat-history",
            "在 Dify 聊天整合中，conversation_id 的主要用途是什麼？",
            ["儲存 SQLite 密碼", "讓同一段聊天可以延續上下文", "刪除所有聊天記錄", "顯示網頁顏色"],
            1,
            "後端把 conversation_id 傳回前端並存入資料庫，下次同一 session 可以延續對話。",
            4,
        ),
    ]
    connection.executemany(
        """
        insert or ignore into quiz_questions
        (id, prompt, options_json, correct_option, explanation, display_order, is_active, created_at)
        values (?, ?, ?, ?, ?, ?, 1, ?)
        """,
        [(id_, prompt, json.dumps(options, ensure_ascii=False), correct, explanation, order, now_iso()) for id_, prompt, options, correct, explanation, order in questions],
    )
    connection.commit()


def init_database() -> None:
    with connect() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        seed_database(connection)


def create_session(connection: sqlite3.Connection, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    connection.execute(
        "insert into sessions (token, user_id, created_at, expires_at) values (?, ?, ?, ?)",
        (token, user_id, now_iso(), (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()),
    )
    connection.commit()
    return token


def public_user(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    data = dict(row)
    return {
        "id": data["id"],
        "email": data["email"],
        "display_name": data["display_name"],
        "school_level": data["school_level"],
        "role": data["role"],
    }


def auth_payload(connection: sqlite3.Connection, user: sqlite3.Row, token: str) -> dict[str, Any]:
    user_data = public_user(user)
    return {"token": token, "user": {"id": user_data["id"], "email": user_data["email"]}, "profile": user_data}


def bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip()


def current_user(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    token = bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing session token")

    with connect() as connection:
        row = connection.execute(
            """
            select users.*
            from sessions
            join users on users.id = sessions.user_id
            where sessions.token = ?
            """,
            (token,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return public_user(row)


def require_owned_session(connection: sqlite3.Connection, session_id: str, user_id: str) -> sqlite3.Row:
    session = connection.execute(
        "select * from chat_sessions where id = ? and user_id = ?",
        (session_id, user_id),
    ).fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "CU-ASK-FastAPI/0.4",
            **headers,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=exc.code, detail=detail) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc


def parse_dify_error(detail: Any) -> tuple[str, str]:
    if isinstance(detail, dict):
        return str(detail.get("code") or "dify_error"), str(detail.get("message") or detail)
    if not isinstance(detail, str):
        return "dify_error", str(detail)
    try:
        parsed = json.loads(detail)
        if isinstance(parsed, dict):
            return str(parsed.get("code") or "dify_error"), str(parsed.get("message") or detail)
    except json.JSONDecodeError:
        pass
    return "dify_error", detail.strip() or "Dify request failed"


def demo_chat_answer(message: str) -> dict[str, str]:
    preview = message.strip()[:40] + ("..." if len(message.strip()) > 40 else "")
    return {
        "answer": (
            "（Demo 回覆）我聽到你提到：「"
            f"{preview}"
            "」。目前沒有設定 DIFY_API_KEY；設定後，FastAPI 會把訊息送到 Dify，"
            "並把 Dify 的 conversation_id 存入 SQLite，讓同一段聊天可以延續上下文。"
        ),
        "conversation_id": "demo-conversation",
        "message_id": "demo-message",
    }


@app.on_event("startup")
def startup() -> None:
    init_database()


@app.get("/")
def read_root():
    return {
        "message": "Welcome to CU-ASK API!",
        "database": str(DB_PATH),
        "database_ready": DB_PATH.exists(),
        "dify_configured": bool(DIFY_API_KEY),
    }


@app.get("/api/config")
def get_api_config():
    return {
        "database": "sqlite",
        "database_path": str(DB_PATH),
        "dify_configured": bool(DIFY_API_KEY),
        "chat_endpoint": "/api/chat/send",
    }


@app.post("/api/auth/signup")
def sign_up(request: AuthRequest):
    with connect() as connection:
        existing = connection.execute("select id from users where email = ?", (request.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid4())
        connection.execute(
            """
            insert into users
            (id, email, password_hash, display_name, school_level, role, created_at, updated_at)
            values (?, ?, ?, ?, ?, 'student', ?, ?)
            """,
            (
                user_id,
                request.email,
                hash_password(request.password),
                request.display_name or request.email.split("@")[0],
                request.school_level or "未設定",
                now_iso(),
                now_iso(),
            ),
        )
        user = connection.execute("select * from users where id = ?", (user_id,)).fetchone()
        token = create_session(connection, user_id)
        return {**auth_payload(connection, user, token), "message": "帳戶已建立。"}


@app.post("/api/auth/signin")
def sign_in(request: AuthRequest):
    with connect() as connection:
        user = connection.execute("select * from users where email = ?", (request.email,)).fetchone()
        if not user or not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_session(connection, user["id"])
        return auth_payload(connection, user, token)


@app.post("/api/auth/signout")
def sign_out(authorization: Optional[str] = Header(default=None)):
    token = bearer_token(authorization)
    if token:
        with connect() as connection:
            connection.execute("delete from sessions where token = ?", (token,))
            connection.commit()
    return {"message": "signed out"}


@app.get("/api/me")
def me(user: dict[str, Any] = Depends(current_user)):
    return {"user": {"id": user["id"], "email": user["email"]}, "profile": user}


@app.patch("/api/profile")
def update_profile(request: ProfileUpdate, user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        connection.execute(
            "update users set display_name = ?, school_level = ?, updated_at = ? where id = ?",
            (request.display_name, request.school_level, now_iso(), user["id"]),
        )
        connection.commit()
        updated = connection.execute("select * from users where id = ?", (user["id"],)).fetchone()
        return public_user(updated)


@app.get("/api/learning/modules")
def learning_modules():
    with connect() as connection:
        rows = connection.execute(
            "select * from learning_modules where is_published = 1 order by display_order"
        ).fetchall()
    return [parse_json_column(dict(row), "content_json", "content") for row in rows]


@app.get("/api/learning/progress")
def learning_progress(user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        rows = connection.execute(
            "select * from learning_progress where user_id = ?",
            (user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


@app.put("/api/learning/progress/{module_id}")
def save_learning_progress(module_id: str, request: ProgressRequest, user: dict[str, Any] = Depends(current_user)):
    row_id = str(uuid4())
    completed_at = now_iso() if request.status == "completed" else None
    with connect() as connection:
        connection.execute(
            """
            insert into learning_progress
            (id, user_id, module_id, status, completed_at, updated_at)
            values (?, ?, ?, ?, ?, ?)
            on conflict(user_id, module_id) do update set
              status = excluded.status,
              completed_at = excluded.completed_at,
              updated_at = excluded.updated_at
            """,
            (row_id, user["id"], module_id, request.status, completed_at, now_iso()),
        )
        connection.commit()
        saved = connection.execute(
            "select * from learning_progress where user_id = ? and module_id = ?",
            (user["id"], module_id),
        ).fetchone()
        return dict(saved)


@app.get("/api/quiz/questions")
def quiz_questions():
    with connect() as connection:
        rows = connection.execute(
            "select * from quiz_questions where is_active = 1 order by display_order"
        ).fetchall()
    return [parse_json_column(dict(row), "options_json", "options") for row in rows]


@app.get("/api/quiz/attempts")
def quiz_attempts(user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        rows = connection.execute(
            "select * from quiz_attempts where user_id = ? order by created_at desc",
            (user["id"],),
        ).fetchall()
    return [parse_json_column(dict(row), "answers_json", "answers") for row in rows]


@app.post("/api/quiz/attempts")
def save_quiz_attempt(request: QuizAttemptRequest, user: dict[str, Any] = Depends(current_user)):
    attempt_id = str(uuid4())
    with connect() as connection:
        connection.execute(
            """
            insert into quiz_attempts (id, user_id, score, total, answers_json, created_at)
            values (?, ?, ?, ?, ?, ?)
            """,
            (
                attempt_id,
                user["id"],
                request.score,
                request.total,
                json.dumps(request.answers, ensure_ascii=False),
                now_iso(),
            ),
        )
        connection.commit()
        saved = connection.execute("select * from quiz_attempts where id = ?", (attempt_id,)).fetchone()
        return parse_json_column(dict(saved), "answers_json", "answers")


@app.get("/api/chat/sessions")
def chat_sessions(user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        rows = connection.execute(
            "select * from chat_sessions where user_id = ? order by updated_at desc",
            (user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/chat/sessions")
def create_chat_session(request: ChatSessionRequest, user: dict[str, Any] = Depends(current_user)):
    session_id = str(uuid4())
    with connect() as connection:
        connection.execute(
            """
            insert into chat_sessions
            (id, user_id, dify_conversation_id, title, created_at, updated_at)
            values (?, ?, null, ?, ?, ?)
            """,
            (session_id, user["id"], request.title, now_iso(), now_iso()),
        )
        connection.commit()
        saved = connection.execute("select * from chat_sessions where id = ?", (session_id,)).fetchone()
        return dict(saved)


@app.patch("/api/chat/sessions/{session_id}")
def update_chat_session(session_id: str, request: ChatSessionUpdate, user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        require_owned_session(connection, session_id, user["id"])
        current = connection.execute("select * from chat_sessions where id = ?", (session_id,)).fetchone()
        title = request.title if request.title is not None else current["title"]
        dify_conversation_id = (
            request.dify_conversation_id
            if request.dify_conversation_id is not None
            else current["dify_conversation_id"]
        )
        connection.execute(
            """
            update chat_sessions
            set title = ?, dify_conversation_id = ?, updated_at = ?
            where id = ? and user_id = ?
            """,
            (title, dify_conversation_id, now_iso(), session_id, user["id"]),
        )
        connection.commit()
        saved = connection.execute("select * from chat_sessions where id = ?", (session_id,)).fetchone()
        return dict(saved)


@app.get("/api/chat/sessions/{session_id}/messages")
def chat_messages(session_id: str, user: dict[str, Any] = Depends(current_user)):
    with connect() as connection:
        require_owned_session(connection, session_id, user["id"])
        rows = connection.execute(
            "select * from chat_messages where session_id = ? and user_id = ? order by created_at",
            (session_id, user["id"]),
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/chat/messages")
def save_chat_message(request: ChatMessageRequest, user: dict[str, Any] = Depends(current_user)):
    if request.role not in {"user", "assistant"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    message_id = str(uuid4())
    with connect() as connection:
        require_owned_session(connection, request.session_id, user["id"])
        connection.execute(
            """
            insert into chat_messages
            (id, session_id, user_id, role, content, dify_message_id, created_at)
            values (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message_id,
                request.session_id,
                user["id"],
                request.role,
                request.content,
                request.dify_message_id,
                now_iso(),
            ),
        )
        connection.execute(
            "update chat_sessions set updated_at = ? where id = ? and user_id = ?",
            (now_iso(), request.session_id, user["id"]),
        )
        connection.commit()
        saved = connection.execute("select * from chat_messages where id = ?", (message_id,)).fetchone()
        return dict(saved)


@app.post("/api/chat/send")
def send_chat_message(request: ChatRequest, user: dict[str, Any] = Depends(current_user)):
    if not DIFY_API_KEY:
        return {"mode": "demo", "user_id": user["id"], **demo_chat_answer(request.message)}

    payload = {
        "inputs": request.inputs,
        "query": request.message,
        "response_mode": "blocking",
        "conversation_id": request.conversation_id or "",
        "user": user["id"],
    }
    try:
        data = post_json(
            f"{DIFY_API_BASE}/chat-messages",
            payload,
            {"Authorization": f"Bearer {DIFY_API_KEY}"},
        )
    except HTTPException as exc:
        code, message = parse_dify_error(exc.detail)
        return {
            "mode": "dify_error",
            "user_id": user["id"],
            "event": "error",
            "answer": (
                "Dify 已連接，但 Dify app 暫時未能回覆。"
                f"上游錯誤：{code} - {message}。"
                "請到 Dify 檢查 chatbot 是否已配置模型、模型 provider key、額度，並重新發布 app。"
            ),
            "conversation_id": request.conversation_id,
            "message_id": None,
            "metadata": {"dify_error": {"status": exc.status_code, "code": code, "message": message}},
            "workflow_run_id": None,
        }

    answer = data.get("answer") or ""
    if not answer and data.get("event") == "workflow_paused":
        answer = "Dify workflow 已暫停，正在等待人工輸入。"
    return {
        "mode": "dify",
        "user_id": user["id"],
        "event": data.get("event"),
        "answer": answer,
        "conversation_id": data.get("conversation_id"),
        "message_id": data.get("message_id") or data.get("id"),
        "metadata": data.get("metadata", {}),
        "workflow_run_id": data.get("workflow_run_id"),
    }
