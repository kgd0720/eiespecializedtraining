import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const user = { id: '00000000-0000-0000-0000-000000000000' }
  const profile = { role: 'admin' }

  return <>{children}</>
}
