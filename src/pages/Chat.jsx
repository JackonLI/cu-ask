import React, { useEffect, useRef, useState } from 'react'
import AddCommentIcon from '@mui/icons-material/AddComment'
import SendIcon from '@mui/icons-material/Send'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../apiBase.js'
import {
  createChatSession,
  listChatMessages,
  listChatSessions,
  saveChatMessage,
  updateChatSession,
} from '../services/database'

export default function Chat() {
  const { user, getAccessToken } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!user) return
    listChatSessions(user.id).then((rows) => {
      setSessions(rows)
      if (rows.length > 0) setActiveSession(rows[0])
    })
  }, [user])

  useEffect(() => {
    if (!activeSession) {
      setMessages([])
      return
    }
    listChatMessages(activeSession.id).then(setMessages)
  }, [activeSession])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function startNewChat() {
    if (!user) return
    const session = await createChatSession(user.id)
    setSessions((current) => [session, ...current])
    setActiveSession(session)
    setMessages([])
  }

  async function ensureSessionForMessage(text) {
    if (activeSession) return activeSession
    const title = text.length > 18 ? `${text.slice(0, 18)}...` : text
    const session = await createChatSession(user.id, title || '新的聊天')
    setSessions((current) => [session, ...current])
    setActiveSession(session)
    return session
  }

  async function refreshSessions(nextActive) {
    const rows = await listChatSessions(user.id)
    setSessions(rows)
    if (nextActive) setActiveSession(nextActive)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || !user || sending) return

    setError('')
    setSending(true)
    setInput('')

    try {
      const session = await ensureSessionForMessage(text)
      const userMessage = await saveChatMessage({
        sessionId: session.id,
        userId: user.id,
        role: 'user',
        content: text,
      })
      setMessages((current) => [...current, userMessage])

      const token = await getAccessToken()
      const response = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversation_id: session.dify_conversation_id,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail.detail || 'chat proxy failed')
      }
      const data = await response.json()
      const nextSession =
        data.conversation_id && data.conversation_id !== session.dify_conversation_id
          ? await updateChatSession(session.id, {
              dify_conversation_id: data.conversation_id,
              title: session.title === '新的聊天' ? text.slice(0, 24) || session.title : session.title,
            })
          : await updateChatSession(session.id, { title: session.title })

      const assistantMessage = await saveChatMessage({
        sessionId: session.id,
        userId: user.id,
        role: 'assistant',
        content: data.answer || '抱歉，我暫時未能產生回覆。',
        difyMessageId: data.message_id,
      })

      setMessages((current) => [...current, assistantMessage])
      await refreshSessions(nextSession || session)
    } catch (err) {
      setError(
        err.message
          ? `未能完成聊天請求：${err.message}`
          : '未能連接聊天後端。請確認 FastAPI 已啟動；若要連接真實 AI，還需要設定 DIFY_API_KEY。',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout activePage="/chat">
      <section className="grid gap-5 lg:grid-cols-[0.3fr_0.7fr]">
        <aside className="rounded border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-[#8c5b16]">
                database task 5
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950">聊天 session</h1>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="grid h-10 w-10 place-items-center rounded bg-[#532675] text-white"
              aria-label="新增聊天"
              title="新增聊天"
            >
              <AddCommentIcon fontSize="small" />
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {sessions.length === 0 && (
              <p className="rounded bg-[#fdfbf5] p-3 text-sm leading-6 text-slate-600">
                尚未有聊天紀錄。送出第一句後會建立 chat_sessions row。
              </p>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSession(session)}
                className={`rounded border px-3 py-3 text-left text-sm ${
                  activeSession?.id === session.id
                    ? 'border-[#532675] bg-[#fbf7ff] text-[#532675]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#d89a2b]'
                }`}
              >
                <span className="block font-semibold">{session.title || '新的聊天'}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {session.dify_conversation_id ? '已連接 Dify conversation' : '等待第一則 AI 回覆'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-2xl font-semibold text-slate-950">CU-ASK 聊天支援</h2>
            <p className="mt-2 leading-7 text-slate-600">
              前端保存使用者訊息與 AI 回覆；FastAPI 負責把訊息送到 Dify，避免 Dify API key 暴露在瀏覽器。
            </p>
          </div>

          <div className="h-[56vh] overflow-y-auto bg-[#f8faf9] p-5">
            {messages.length === 0 && (
              <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-slate-600">
                可以先試著輸入：「我看到同學在群組被取笑，應該怎樣幫他？」
              </div>
            )}

            <div className="grid gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[82%] rounded px-4 py-3 leading-7 ${
                    message.role === 'user'
                      ? 'ml-auto bg-[#532675] text-white'
                      : 'mr-auto border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {sending && (
                <div className="mr-auto rounded border border-slate-200 bg-white px-4 py-3 text-slate-500">
                  正在回覆...
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {error && <p className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</p>}

          <div className="border-t border-slate-100 p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="輸入想說的事..."
                className="min-h-24 flex-1 resize-none rounded border border-slate-300 px-4 py-3 outline-none focus:border-[#532675] focus:ring-2 focus:ring-[#eadcf4]"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || sending || !user}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#532675] px-5 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600 md:w-36"
              >
                <SendIcon fontSize="small" />
                送出
              </button>
            </div>
          </div>
        </section>
      </section>
    </Layout>
  )
}
