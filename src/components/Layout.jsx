import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ForumIcon from '@mui/icons-material/Forum'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import QuizIcon from '@mui/icons-material/Quiz'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: '首頁', icon: HomeIcon },
  { to: '/chat', label: '聊天支援', icon: ForumIcon },
  { to: '/learning', label: '認識網路霸凌', icon: MenuBookIcon },
  { to: '/quiz', label: '知識小測驗', icon: QuizIcon },
  { to: '/user', label: '用戶', icon: AccountCircleIcon },
]

export default function Layout({ children, activePage }) {
  const location = useLocation()
  const { profile, databaseLabel } = useAuth()

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-900">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-[#532675] text-lg font-bold text-white">
              C
            </div>
            <div>
              <div className="text-lg font-semibold tracking-normal">CU-ASK</div>
              <div className="text-xs text-slate-500">Anti-cyberbullying support</div>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage ? activePage === item.to : location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex min-h-10 items-center gap-2 rounded border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-[#532675] bg-[#532675] text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#d89a2b] hover:text-[#532675]'
                  }`}
                >
                  <Icon fontSize="small" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 bg-[#fdfbf5]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs text-slate-600">
            <span>
              {profile?.display_name ? `目前用戶：${profile.display_name}` : '登入後可保存個人進度'}
            </span>
            <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">
              {databaseLabel || 'SQLite'} 本地資料庫
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} CU-ASK · 支援安全、清晰、可延續的線上求助與學習流程
        </div>
      </footer>
    </div>
  )
}
