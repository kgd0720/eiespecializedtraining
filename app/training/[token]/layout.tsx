import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ token: string }>
}

export default async function TrainingLayout({ children, params }: LayoutProps) {
  const { token } = await params
  const supabase = await createClient()

  const { data: application } = await supabase
    .from('applications')
    .select('*, sessions(*, courses(*))')
    .eq('token', token)
    .single()

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">유효하지 않은 링크</h1>
          <p className="text-muted-foreground">접근 권한이 없거나 만료된 링크입니다.</p>
        </div>
      </div>
    )
  }

  // Check if training period is active
  const now = new Date()
  const trainStart = new Date(application.sessions.train_start)
  const trainEnd = new Date(application.sessions.train_end)

  if (now < trainStart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">교육 기간 안내</h1>
          <p className="text-muted-foreground">교육 시작일은 {trainStart.toLocaleString('ko-KR')} 입니다.</p>
        </div>
      </div>
    )
  }

  if (now > trainEnd) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">교육 기간 종료</h1>
          <p className="text-muted-foreground">본 회차의 교육 기간이 종료되었습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">EiE 연수: {application.sessions.courses?.title}</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {application.name} ({application.campus})
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
