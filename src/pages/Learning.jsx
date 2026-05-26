import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DoneIcon from '@mui/icons-material/Done'
import QuizIcon from '@mui/icons-material/Quiz'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  listLearningModules,
  listLearningProgress,
  saveLearningProgress,
} from '../services/database'

export default function Learning() {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState([])
  const [savingModule, setSavingModule] = useState(null)

  useEffect(() => {
    async function loadData() {
      const loadedModules = await listLearningModules()
      const loadedProgress = user ? await listLearningProgress(user.id) : []
      setModules(loadedModules)
      setProgress(loadedProgress)
    }

    loadData()
  }, [user])

  const completedIds = useMemo(
    () => new Set(progress.filter((item) => item.status === 'completed').map((item) => item.module_id)),
    [progress],
  )

  async function markCompleted(moduleId) {
    if (!user) return
    setSavingModule(moduleId)
    const saved = await saveLearningProgress(user.id, moduleId)
    setProgress((current) => {
      const rest = current.filter((item) => item.module_id !== moduleId)
      return [...rest, saved]
    })
    setSavingModule(null)
  }

  return (
    <Layout activePage="/learning">
      <section className="grid gap-5 lg:grid-cols-[0.8fr_0.2fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#8c5b16]">
            database task 3
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">認識網路霸凌</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            這一頁不再把教材寫死在 React 裡，而是從 learning_modules 資料表讀出。
            每次按下「標記完成」都會在 learning_progress 表中 upsert 一筆使用者自己的紀錄。
          </p>
        </div>
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="text-sm">完成進度</p>
          <p className="mt-1 text-3xl font-bold">
            {completedIds.size}/{modules.length}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-5">
        {modules.map((module) => {
          const isCompleted = completedIds.has(module.id)
          const content = Array.isArray(module.content) ? module.content : []
          return (
            <article key={module.id} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#f3e8ff] px-2 py-1 text-xs font-semibold text-[#532675]">
                      {module.estimated_minutes || 5} min
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                        已完成
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">{module.title}</h2>
                  <p className="mt-2 leading-7 text-slate-600">{module.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => markCompleted(module.id)}
                  disabled={!user || savingModule === module.id || isCompleted}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#532675] px-4 py-2 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <DoneIcon fontSize="small" />
                  {isCompleted ? '已儲存' : '標記完成'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {content.map((section) => (
                  <div key={section.heading} className="rounded border border-slate-100 bg-[#fdfbf5] p-4">
                    <h3 className="font-semibold text-slate-900">{section.heading}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/quiz"
          className="inline-flex min-h-11 items-center gap-2 rounded bg-[#d89a2b] px-5 py-3 font-semibold text-white hover:bg-[#b77d18]"
        >
          <QuizIcon fontSize="small" />
          完成後前往小測驗
        </Link>
      </div>
    </Layout>
  )
}
