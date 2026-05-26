import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import Learning from './pages/Learning'
import Quiz from './pages/Quiz'
import User from './pages/User'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/user" element={<User />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
