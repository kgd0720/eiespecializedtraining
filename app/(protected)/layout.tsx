import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import type { Profile } from '@/lib/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 인증 해제: 모의 프로필 제공
  const profile: Profile = {
    id: 'admin-mock-id',
    full_name: 'EiE 관리자',
    email: 'admin@eie.com',
    role: 'admin',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profile as Profile | null} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
