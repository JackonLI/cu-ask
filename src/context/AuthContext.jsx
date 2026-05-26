import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../apiBase.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'cuAskSessionToken'

async function apiRequest(path, options = {}) {
  const token = window.localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.detail || 'API request failed')
  }
  return response.json()
}

function saveAuthPayload(payload) {
  window.localStorage.setItem(TOKEN_KEY, payload.token)
  return {
    user: payload.user,
    profile: payload.profile,
    session: { token: payload.token },
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCurrentUser() {
      const token = window.localStorage.getItem(TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const payload = await apiRequest('/api/me')
        setUser(payload.user)
        setProfile(payload.profile)
        setSession({ token })
      } catch (_err) {
        window.localStorage.removeItem(TOKEN_KEY)
        setUser(null)
        setProfile(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentUser()
  }, [])

  async function signUp({ email, password, displayName, schoolLevel }) {
    const payload = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
        school_level: schoolLevel,
      }),
    })
    const next = saveAuthPayload(payload)
    setUser(next.user)
    setProfile(next.profile)
    setSession(next.session)
    return { message: payload.message || '帳戶已建立。' }
  }

  async function signIn({ email, password }) {
    const payload = await apiRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const next = saveAuthPayload(payload)
    setUser(next.user)
    setProfile(next.profile)
    setSession(next.session)
  }

  async function signOut() {
    try {
      await apiRequest('/api/auth/signout', { method: 'POST' })
    } finally {
      window.localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      setProfile(null)
      setSession(null)
    }
  }

  async function updateProfile(values) {
    if (!user) return null
    const nextProfile = await apiRequest('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: values.display_name,
        school_level: values.school_level,
      }),
    })
    setProfile(nextProfile)
    return nextProfile
  }

  async function getAccessToken() {
    return window.localStorage.getItem(TOKEN_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      databaseLabel: 'SQLite',
      signUp,
      signIn,
      signOut,
      updateProfile,
      getAccessToken,
    }),
    [user, profile, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
