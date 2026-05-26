import React, { useEffect, useMemo, useState } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { listQuizAttempts, listQuizQuestions, saveQuizAttempt } from '../services/database'

export default function Quiz() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submittedAttempt, setSubmittedAttempt] = useState(null)
  const [recentAttempts, setRecentAttempts] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      setQuestions(await listQuizQuestions())
      if (user) setRecentAttempts(await listQuizAttempts(user.id))
    }
    loadData()
  }, [user])

  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return answers[question.id] === question.correct_option ? total + 1 : total
    }, 0)
  }, [answers, questions])

  const answeredCount = Object.keys(answers).length
  const isReadyToSubmit = questions.length > 0 && answeredCount === questions.length

  function selectAnswer(questionId, optionIndex) {
    if (submittedAttempt) return
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }))
  }

  async function submitQuiz() {
    if (!user || !isReadyToSubmit) return
    setSaving(true)
    const answerRows = questions.map((question) => ({
      question_id: question.id,
      prompt: question.prompt,
      selected_option: answers[question.id],
      correct_option: question.correct_option,
      is_correct: answers[question.id] === question.correct_option,
    }))
    const saved = await saveQuizAttempt(user.id, score, questions.length, answerRows)
    setSubmittedAttempt(saved)
    setRecentAttempts(await listQuizAttempts(user.id))
    setSaving(false)
  }

  function restart() {
    setAnswers({})
    setSubmittedAttempt(null)
  }

  return (
    <Layout activePage="/quiz">
      <section className="grid gap-5 lg:grid-cols-[0.72fr_0.28fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#8c5b16]">
            database task 4
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">知識小測驗</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            題目從 quiz_questions 讀取，提交後會把分數和每題答案存入 quiz_attempts。
            這正是線上培訓考試需要的資料庫流程。
          </p>
        </div>

        <aside className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">目前作答</p>
          <p className="mt-1 text-3xl font-bold text-[#532675]">
            {answeredCount}/{questions.length}
          </p>
          {submittedAttempt && (
            <p className="mt-2 rounded bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-800">
              已儲存：{score}/{questions.length}
            </p>
          )}
        </aside>
      </section>

      <section className="mt-8 grid gap-5">
        {questions.map((question, index) => {
          const selected = answers[question.id]
          return (
            <article key={question.id} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#f3e8ff] px-2 py-1 text-xs font-semibold text-[#532675]">
                  Question {index + 1}
                </span>
                {submittedAttempt && selected === question.correct_option && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                    正確
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-slate-950">{question.prompt}</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex
                  const isCorrect = submittedAttempt && question.correct_option === optionIndex
                  const isWrong = submittedAttempt && isSelected && !isCorrect
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectAnswer(question.id, optionIndex)}
                      className={`min-h-16 rounded border px-4 py-3 text-left text-sm font-medium leading-6 transition ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : isWrong
                            ? 'border-rose-400 bg-rose-50 text-rose-900'
                            : isSelected
                              ? 'border-[#532675] bg-[#fbf7ff] text-[#532675]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-[#d89a2b]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {submittedAttempt && (
                <p className="mt-4 rounded bg-[#fdfbf5] p-3 text-sm leading-6 text-slate-700">
                  {question.explanation}
                </p>
              )}
            </article>
          )
        })}
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submitQuiz}
          disabled={!isReadyToSubmit || saving || submittedAttempt}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-[#532675] px-5 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
        >
          <SaveIcon fontSize="small" />
          {saving ? '儲存中' : '提交並儲存分數'}
        </button>
        <button
          type="button"
          onClick={restart}
          className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:border-[#532675]"
        >
          <RestartAltIcon fontSize="small" />
          重新作答
        </button>
      </section>

      {recentAttempts.length > 0 && (
        <section className="mt-8 rounded border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">最近測驗紀錄</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recentAttempts.slice(0, 6).map((attempt) => (
              <div key={attempt.id} className="rounded border border-slate-100 bg-[#fdfbf5] p-4">
                <p className="text-sm text-slate-500">
                  {new Date(attempt.created_at).toLocaleString()}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#532675]">
                  {attempt.score}/{attempt.total}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}

