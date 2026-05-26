import React, { useEffect, useState } from 'react'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import SaveIcon from '@mui/icons-material/Save'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  listChatSessions,
  listLearningModules,
  listLearningProgress,
  listQuizAttempts,
} from '../services/database'

export default function User() {
  const {
    user,
    profile,
    signIn,
    signOut,
    signUp,
    updateProfile,
  } = useAuth()
  const [mode, setMode] = useState('signIn')
  const [form, setForm] = useState({
    email: 'demo@student.cuhk.edu.hk',
    password: 'password123',
    displayName: profile?.display_name || 'Demo Student',
    schoolLevel: profile?.school_level || 'Secondary 4',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [summary, setSummary] = useState({
    modules: [],
    progress: [],
    attempts: [],
    chats: [],
  })

  useEffect(() => {
    setForm((current) => ({
      ...current,
      displayName: profile?.display_name || current.displayName,
      schoolLevel: profile?.school_level || current.schoolLevel,
    }))
  }, [profile])

  useEffect(() => {
    if (!user) {
      setSummary({ modules: [], progress: [], attempts: [], chats: [] })
      return
    }
    async function loadSummary() {
      const [modules, progress, attempts, chats] = await Promise.all([
        listLearningModules(),
        listLearningProgress(user.id),
        listQuizAttempts(user.id),
        listChatSessions(user.id),
      ])
      setSummary({ modules, progress, attempts, chats })
    }
    loadSummary()
  }, [user])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (mode === 'signUp') {
        const result = await signUp({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          schoolLevel: form.schoolLevel,
        })
        setMessage(result.message)
      } else {
        await signIn({ email: form.email, password: form.password })
        setMessage('已登入。')
      }
    } catch (err) {
      setError(err.message || '登入或註冊失敗。')
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await updateProfile({
        display_name: form.displayName,
        school_level: form.schoolLevel,
      })
      setMessage('個人資料已儲存。')
    } catch (err) {
      setError(err.message || '未能儲存個人資料。')
    }
  }

  const completedCount = summary.progress.filter((item) => item.status === 'completed').length

  return (
    <Layout activePage="/user">
      <section>
        <p className="text-sm font-semibold uppercase tracking-normal text-[#8c5b16]">
          database tasks 1-2
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">用戶與個人紀錄</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">
          這一頁示範 users、sessions 表，以及如何由 FastAPI 只讀寫目前登入使用者自己的
          學習進度、測驗分數和聊天 session。
        </p>
      </section>

      <div className="mt-6 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        目前資料會寫入本機 SQLite 檔案 backend/cuask.sqlite3。這是課堂和 starter project 的預設資料庫。
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="rounded border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950">
              {user ? '目前帳戶' : mode === 'signUp' ? '建立帳戶' : '登入'}
            </h2>
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex min-h-10 items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#532675]"
              >
                <LogoutIcon fontSize="small" />
                登出
              </button>
            )}
          </div>

          {!user ? (
            <form onSubmit={handleAuthSubmit} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                />
              </label>
              {mode === 'signUp' && (
                <>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    顯示名稱
                    <input
                      value={form.displayName}
                      onChange={(event) => updateField('displayName', event.target.value)}
                      className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    年級
                    <input
                      value={form.schoolLevel}
                      onChange={(event) => updateField('schoolLevel', event.target.value)}
                      className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                    />
                  </label>
                </>
              )}
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#532675] px-5 py-3 font-semibold text-white"
              >
                <LoginIcon fontSize="small" />
                {mode === 'signUp' ? '註冊' : '登入'}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                className="text-sm font-semibold text-[#532675] underline"
              >
                {mode === 'signIn' ? '改為建立新帳戶' : '已有帳戶，改為登入'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProfileSave} className="mt-5 grid gap-4">
              <p className="rounded bg-[#fdfbf5] p-3 text-sm text-slate-600">{user.email}</p>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                顯示名稱
                <input
                  value={form.displayName}
                  onChange={(event) => updateField('displayName', event.target.value)}
                  className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                年級
                <input
                  value={form.schoolLevel}
                  onChange={(event) => updateField('schoolLevel', event.target.value)}
                  className="min-h-11 rounded border border-slate-300 px-3 outline-none focus:border-[#532675]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#532675] px-5 py-3 font-semibold text-white"
              >
                <SaveIcon fontSize="small" />
                儲存個人資料
              </button>
            </form>
          )}

          {message && <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        </div>

        <div className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">我的紀錄</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded border border-slate-100 bg-[#fdfbf5] p-4">
              <p className="text-sm text-slate-500">學習進度</p>
              <p className="mt-1 text-3xl font-bold text-[#532675]">
                {completedCount}/{summary.modules.length}
              </p>
            </div>
            <div className="rounded border border-slate-100 bg-[#fdfbf5] p-4">
              <p className="text-sm text-slate-500">測驗提交</p>
              <p className="mt-1 text-3xl font-bold text-[#532675]">{summary.attempts.length}</p>
            </div>
            <div className="rounded border border-slate-100 bg-[#fdfbf5] p-4">
              <p className="text-sm text-slate-500">聊天 session</p>
              <p className="mt-1 text-3xl font-bold text-[#532675]">{summary.chats.length}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-slate-900">最近測驗</h3>
              <div className="mt-3 grid gap-2">
                {summary.attempts.slice(0, 4).map((attempt) => (
                  <div key={attempt.id} className="rounded border border-slate-100 px-3 py-2 text-sm">
                    {attempt.score}/{attempt.total} · {new Date(attempt.created_at).toLocaleString()}
                  </div>
                ))}
                {summary.attempts.length === 0 && (
                  <p className="rounded bg-slate-50 p-3 text-sm text-slate-500">尚未提交測驗。</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">最近聊天</h3>
              <div className="mt-3 grid gap-2">
                {summary.chats.slice(0, 4).map((chat) => (
                  <div key={chat.id} className="rounded border border-slate-100 px-3 py-2 text-sm">
                    {chat.title || '新的聊天'} · {new Date(chat.updated_at).toLocaleString()}
                  </div>
                ))}
                {summary.chats.length === 0 && (
                  <p className="rounded bg-slate-50 p-3 text-sm text-slate-500">尚未開始聊天。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
