import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ForumIcon from '@mui/icons-material/Forum'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import QuizIcon from '@mui/icons-material/Quiz'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  listChatSessions,
  listLearningModules,
  listLearningProgress,
  listQuizAttempts,
} from '../services/database'

export default function Landing() {
  const { user, profile } = useAuth()
  const [dashboard, setDashboard] = useState({
    moduleCount: 0,
    completedCount: 0,
    quizCount: 0,
    chatCount: 0,
  })

  useEffect(() => {
    async function loadDashboard() {
      const modules = await listLearningModules()
      if (!user) {
        setDashboard((current) => ({ ...current, moduleCount: modules.length }))
        return
      }

      const [progress, attempts, chats] = await Promise.all([
        listLearningProgress(user.id),
        listQuizAttempts(user.id),
        listChatSessions(user.id),
      ])
      setDashboard({
        moduleCount: modules.length,
        completedCount: progress.filter((item) => item.status === 'completed').length,
        quizCount: attempts.length,
        chatCount: chats.length,
      })
    }

    loadDashboard()
  }, [user])

  const tiles = [
    {
      title: '學習進度',
      value: `${dashboard.completedCount}/${dashboard.moduleCount}`,
      caption: '已完成單元',
      icon: MenuBookIcon,
      to: '/learning',
    },
    {
      title: '測驗紀錄',
      value: dashboard.quizCount,
      caption: '次提交',
      icon: QuizIcon,
      to: '/quiz',
    },
    {
      title: '聊天紀錄',
      value: dashboard.chatCount,
      caption: '段 session',
      icon: ForumIcon,
      to: '/chat',
    },
  ]

  return (
    <Layout activePage="/">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#8c5b16]">
            CU-ASK final starter
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            一個可保存學習、測驗與聊天歷史的網路霸凌支援平台
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            這個起點專案把前四次的 React、FastAPI、Dify 串起來，並加入 SQLite
            本地資料庫與用戶帳戶。學生可以先理解產品流程，再用 AI 小步擴充功能。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/learning"
              className="inline-flex min-h-11 items-center gap-2 rounded bg-[#532675] px-5 py-3 font-semibold text-white hover:bg-[#3f1d59]"
            >
              <MenuBookIcon fontSize="small" />
              開始學習
            </Link>
            <Link
              to="/chat"
              className="inline-flex min-h-11 items-center gap-2 rounded border border-[#d89a2b] bg-white px-5 py-3 font-semibold text-[#532675] hover:bg-[#fff8e8]"
            >
              <ForumIcon fontSize="small" />
              開始聊天
            </Link>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm text-slate-500">目前登入</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {profile?.display_name || '未登入使用者'}
              </h2>
            </div>
            <CheckCircleIcon className="text-emerald-600" />
          </div>
          <div className="mt-4 grid gap-3">
            {tiles.map((tile) => {
              const Icon = tile.icon
              return (
                <Link
                  key={tile.title}
                  to={tile.to}
                  className="flex items-center justify-between rounded border border-slate-200 px-4 py-3 hover:border-[#532675] hover:bg-[#fbf7ff]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded bg-[#eef7f2] text-emerald-700">
                      <Icon fontSize="small" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{tile.title}</p>
                      <p className="text-sm text-slate-500">{tile.caption}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-[#532675]">
                    {tile.value}
                    <ArrowForwardIcon fontSize="small" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">1. 用戶帳戶</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            FastAPI 管理登入 session，SQLite 用 user_id 把進度、測驗和聊天 session 連回同一位使用者。
          </p>
        </article>
        <article className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">2. SQLite 資料表</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            learning_modules、quiz_attempts、chat_sessions 等表讓內容和紀錄可以查詢、更新和統計。
          </p>
        </article>
        <article className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">3. Dify 連接</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            FastAPI 保護 Dify API key，前端只保存 conversation_id 和聊天摘要，避免把 secret 放到瀏覽器。
          </p>
        </article>
      </section>
    </Layout>
  )
}
