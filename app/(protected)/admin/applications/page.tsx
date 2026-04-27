'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, MessageSquare } from 'lucide-react'
import type { Application, Session } from '@/lib/types'

type AppWithSession = Application & { sessions: Session }

export default function ApplicationsAdminPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<AppWithSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*, sessions(*)')
      .order('created_at', { ascending: false })
    
    if (data) setApplications(data as any[])
    setLoading(false)
  }

  async function updateStatus(appId: string, status: 'approved' | 'rejected') {
    let token = null
    if (status === 'approved') {
      // Generate magic token
      token = crypto.randomUUID().replace(/-/g, '')
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status, token })
      .eq('id', appId)
      .select('*, sessions(*)')
      .single()

    if (data && !error) {
      setApplications(apps => apps.map(a => a.id === appId ? data as any : a))
      
      if (status === 'approved' && token) {
        // Simulate SMS sending by creating an sms_log
        const message = `[EiE Education] 교육 승인 안내\n아래 링크로 접속하여 교육을 진행해주세요.\nhttp://localhost:3000/training/${token}`
        await supabase.from('sms_logs').insert({
          application_id: appId,
          phone: data.phone,
          status: 'sent',
          message_content: message
        })
        alert(`승인 및 문자 발송 완료!\n(발송된 링크: /training/${token})`)
      }
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">회원 리스트</h1>
        <p className="text-muted-foreground mt-1">접수된 교육 신청자 목록을 확인하고 승인 상태를 설정합니다.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">신청 교육명</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">이름</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">연락처</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">영어이름</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">캠퍼스명</th>
                  <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">설정</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">불러오는 중...</td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">접수된 신청 내역이 없습니다.</td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-xs max-w-[200px] truncate" title={app.sessions?.title}>
                        {app.sessions?.title}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {app.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {app.phone}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {app.english_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {app.campus}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {app.status === 'approved' ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">승인 완료</Badge>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground underline" onClick={() => {
                              alert(`고유 접속 링크:\nhttp://localhost:3000/training/${app.token}`)
                            }}>
                              링크 확인
                            </Button>
                          </div>
                        ) : app.status === 'rejected' ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">미승인 (반려)</Badge>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" onClick={() => updateStatus(app.id, 'approved')} className="bg-green-600 hover:bg-green-700 px-3 h-8">
                              <Check className="w-3.5 h-3.5 mr-1" /> 승인
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'rejected')} className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3 h-8">
                              <X className="w-3.5 h-3.5 mr-1" /> 미승인
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
