import React from 'react'
import { Link } from 'react-router-dom'

const CHAT_IFRAME_SRC = 'https://udify.app/chatbot/Z35Hnkuh8bNztPlH'

export default function Chat() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">CU-ASK</div>
          <div className="space-x-4">
            <Link to="/" className="hover:underline">返回</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-semibold mb-4">CU-ASK 聊天支援</h2>
          <div className="border rounded-lg overflow-hidden shadow" style={{height: '75vh'}}>
            <iframe
              title="CU-ASK Chatbot"
              src={CHAT_IFRAME_SRC}
              style={{ width: '100%', height: '100%' }}
              frameBorder="0"
              allow="microphone"
            />
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
