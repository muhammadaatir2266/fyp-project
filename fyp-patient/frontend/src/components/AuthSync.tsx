'use client'

import { useEffect } from 'react'
import { getAuthToken, getCurrentUser } from '@/lib/auth'

export default function AuthSync() {
  useEffect(() => {
    // Sync localStorage to cookies for middleware
    const token = getAuthToken()
    const user = getCurrentUser()

    if (token && !document.cookie.includes('authToken=')) {
      document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`
    }

    if (user && !document.cookie.includes('userRole=')) {
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [])

  return null
}
