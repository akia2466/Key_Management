'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function RootPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (session) router.replace('/dashboard')
    else router.replace('/login')
  }, [session, loading, router])

  return null
}
