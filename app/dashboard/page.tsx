'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UploadForm } from '@/components/upload-form'
import { ReleasesList } from '@/components/releases-list'
import { StorageMetrics } from '@/components/storage-metrics'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleDelete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Release Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-foreground/60">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-9xl mx-auto px-4 py-8">
        <div className="mb-8">
          <StorageMetrics refreshTrigger={refreshTrigger} />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>
          <div className="md:col-span-2">
            <ReleasesList refreshTrigger={refreshTrigger} onDelete={handleDelete} />
          </div>
        </div>
      </main>
    </div>
  )
}
