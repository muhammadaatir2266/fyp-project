'use client'

import { useEffect } from 'react'
import { getAuthToken, getCurrentUser, setAuthToken } from '@/lib/auth'

export default function AuthSync() {
  useEffect(() => {
    // Sync localStorage token → cookie so middleware can read it after a hard refresh
    const token = getAuthToken()
    const user = getCurrentUser()

    if (token && !document.cookie.includes('authToken=')) {
      setAuthToken(token) // writes encoded cookie matching middleware expectations
    }

    if (user && !document.cookie.includes('userRole=')) {
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [])

  return null
}
