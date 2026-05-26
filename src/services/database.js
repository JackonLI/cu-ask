import { API_BASE } from '../apiBase.js'

const TOKEN_KEY = 'cuAskSessionToken'

function authHeaders() {
  const token = window.localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.detail || 'Database API request failed')
  }
  return response.json()
}

export async function listLearningModules() {
  return apiJson('/api/learning/modules')
}

export async function listLearningProgress() {
  return apiJson('/api/learning/progress')
}

export async function saveLearningProgress(_userId, moduleId, status = 'completed') {
  return apiJson(`/api/learning/progress/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function listQuizQuestions() {
  return apiJson('/api/quiz/questions')
}

export async function saveQuizAttempt(_userId, score, total, answers) {
  return apiJson('/api/quiz/attempts', {
    method: 'POST',
    body: JSON.stringify({ score, total, answers }),
  })
}

export async function listQuizAttempts() {
  return apiJson('/api/quiz/attempts')
}

export async function listChatSessions() {
  return apiJson('/api/chat/sessions')
}

export async function createChatSession(_userId, title = '新的聊天') {
  return apiJson('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export async function updateChatSession(sessionId, values) {
  return apiJson(`/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  })
}

export async function listChatMessages(sessionId) {
  if (!sessionId) return []
  return apiJson(`/api/chat/sessions/${sessionId}/messages`)
}

export async function saveChatMessage({ sessionId, role, content, difyMessageId = null }) {
  return apiJson('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      role,
      content,
      dify_message_id: difyMessageId,
    }),
  })
}
