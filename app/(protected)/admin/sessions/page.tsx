'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Session, Course } from '@/lib/types'
import { Calendar, Clock, Trash2, BookOpen, Plus } from 'lucide-react'

export default function EducationsAdminPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<(Session & { courses: Course })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('sessions').select('*, courses(*)').order('created_at', { ascending: false })
    if (data) setSessions(data as any[])
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const { data } = await supabase.from('sessions').update({ is_active: !current }).eq('id', id).select('*, courses(*)').single()
    if (data) {
      setSessions(sessions.map(s => s.id === id ? data as any : s))
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('정말 삭제하시겠습니까? 관련 신청 내역도 함께 삭제됩니다.')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(sessions.filter(s => s.id !== id))
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8 mb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">교육 관리</h1>
          <p className="text-muted-foreground mt-1">등록된 교육 목록을 확인하고 활성화 상태를 관리합니다.</p>
        </div>
        <Link href="/admin/sessions/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> 교육 신규 생성
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">불러오는 중...</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center bg-muted/20 rounded-lg border border-dashed">등록된 교육이 없습니다.</p>
        ) : (
          sessions.map(session => {
            const now = new Date()
            const applyEndDt = new Date(session.apply_end)
            const trainEndDt = new Date(session.train_end)
            
            let statusText = '신청 진행중'
            let statusStyle = 'bg-blue-100 text-blue-700'
            
            if (now > trainEndDt) {
              statusText = '교육 종료됨'
              statusStyle = 'bg-gray-100 text-gray-600'
            } else if (now > applyEndDt) {
              statusText = '신청 마감 (교육중)'
              statusStyle = 'bg-amber-100 text-amber-700'
            }

            return (
              <Card key={session.id} className="shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${session.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {session.is_active ? '활성 (노출중)' : '비활성'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${statusStyle}`}>
                        {statusText}
                      </span>
                      <h3 className="font-bold text-lg text-foreground truncate">{session.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>신청: {formatDate(session.apply_start)} ~ {formatDate(session.apply_end)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>교육: {formatDate(session.train_start)} ~ {formatDate(session.train_end)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => toggleActive(session.id, session.is_active)}>
                      {session.is_active ? '비활성화' : '활성화'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive flex-1 sm:flex-none" onClick={() => deleteSession(session.id)}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> 삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
