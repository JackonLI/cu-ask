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

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at text not null,
  expires_at text not null
);

create table if not exists learning_modules (
  id text primary key,
  title text not null,
  description text not null,
  estimated_minutes integer not null default 5,
  display_order integer not null default 0,
  content_json text not null default '[]',
  is_published integer not null default 1,
  created_at text not null
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

create table if not exists quiz_questions (
  id text primary key,
  prompt text not null,
  options_json text not null,
  correct_option integer not null,
  explanation text not null,
  display_order integer not null default 0,
  is_active integer not null default 1,
  created_at text not null
);

create table if not exists quiz_attempts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  score integer not null,
  total integer not null,
  answers_json text not null default '[]',
  created_at text not null
);

create table if not exists chat_sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  dify_conversation_id text,
  title text not null default '新的聊天',
  created_at text not null,
  updated_at text not null
);

create table if not exists chat_messages (
  id text primary key,
  session_id text not null references chat_sessions(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  dify_message_id text,
  created_at text not null
);

create index if not exists idx_learning_progress_user on learning_progress(user_id);
create index if not exists idx_quiz_attempts_user_created on quiz_attempts(user_id, created_at desc);
create index if not exists idx_chat_sessions_user_updated on chat_sessions(user_id, updated_at desc);
create index if not exists idx_chat_messages_session_created on chat_messages(session_id, created_at);
