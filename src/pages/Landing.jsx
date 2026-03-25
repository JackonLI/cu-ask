import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">CU-ASK</div>
          <div className="space-x-4">
            <a href="#about" className="hover:underline">About</a>
            <a href="#resources" className="hover:underline">Resources</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100">
            你很重要，你並不孤單。
          </h1>
          <p className="mt-6 text-lg text-slate-700 dark:text-slate-300">
            CU-ASK 提供支援遭遇網路霸凌的同學：訓練有素的聆聽者、資源與即時協助。
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Chat Now
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} CU-ASK — 支援安全的線上社群。
        </div>
      </footer>
    </div>
  )
}
