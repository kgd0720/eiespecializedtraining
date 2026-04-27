'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Session, Course } from '@/lib/types'

export default function ApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [sessions, setSessions] = useState<(Session & { courses: Course })[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [name, setName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [phone, setPhone] = useState('')
  const [campus, setCampus] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadSessions() {
      const now = new Date().toISOString()
      // 현재 신청 가능한 회차만 로드 (apply_start <= now <= apply_end)
      const { data, error } = await supabase
        .from('sessions')
        .select('*, courses(*)')
        .eq('is_active', true)
        .lte('apply_start', now)
        .gte('apply_end', now)
      
      if (data) {
        setSessions(data as any[])
        if (data.length > 0) setSelectedSessionId(data[0].id)
      }
    }
    loadSessions()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSessionId || !name || !phone || !campus) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('applications').insert({
      session_id: selectedSessionId,
      name,
      english_name: englishName || null,
      phone,
      campus,
    })

    if (insertError) {
      setError('신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-sm border-border text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">신청 완료!</h2>
            <p className="text-muted-foreground leading-relaxed">
              교육 신청이 성공적으로 접수되었습니다.<br/>
              본사 승인 후 입력하신 연락처로 <br/>
              <strong>개별 접속 링크(안내 문자)</strong>가 발송될 예정입니다.
            </p>
            <Button className="mt-4 w-full" onClick={() => router.push('/')}>
              메인으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-center">온라인 교육 수강 신청</h1>
        <p className="text-muted-foreground text-center mt-2">현재 신청 가능한 교육을 확인하고 정보를 입력해주세요.</p>
      </div>

      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader>
          <CardTitle>수강 신청서</CardTitle>
          <CardDescription>승인 알림을 받기 위해 정확한 정보를 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              현재 신청 가능한 교육이 없습니다.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="flex flex-col gap-1.5">
                <Label>신청할 교육 선택 *</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  required
                >
                  <option value="" disabled>교육을 선택하세요</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.courses?.title}] {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>캠퍼스명 *</Label>
                <Input value={campus} onChange={e => setCampus(e.target.value)} placeholder="예: EiE 강남어학원" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>이름 (실명) *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>영어이름</Label>
                  <Input value={englishName} onChange={e => setEnglishName(e.target.value)} placeholder="예: John" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>연락처 (휴대폰) *</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" required />
                <p className="text-[10px] text-muted-foreground">이 번호로 교육 접속 링크가 발송됩니다.</p>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? '신청 접수 중...' : '신청하기'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
