'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Users, Award, MessageSquare } from 'lucide-react'

export default function StatsAdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalApplications: 0,
    approvedApplications: 0,
    totalCertificates: 0,
    totalSmsSent: 0
  })
  const [smsLogs, setSmsLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    
    const { count: totalApps } = await supabase.from('applications').select('*', { count: 'exact', head: true })
    const { count: approvedApps } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'approved')
    const { count: totalCerts } = await supabase.from('certificates').select('*', { count: 'exact', head: true })
    const { count: totalSms } = await supabase.from('sms_logs').select('*', { count: 'exact', head: true })
    
    const { data: logs } = await supabase.from('sms_logs').select('*, applications(name)').order('sent_at', { ascending: false }).limit(20)

    setStats({
      totalApplications: totalApps || 0,
      approvedApplications: approvedApps || 0,
      totalCertificates: totalCerts || 0,
      totalSmsSent: totalSms || 0
    })
    
    if (logs) setSmsLogs(logs)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">통계 및 로그</h1>
        <p className="text-muted-foreground mt-1">교육 진행 현황과 시스템 로그를 확인합니다.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">전체 신청자</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">승인 완료 (교육중)</span>
              <BarChart className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{loading ? '-' : stats.approvedApplications}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">수료자 수</span>
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalCertificates}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">문자 발송 건수</span>
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalSmsSent}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm mt-4">
        <CardHeader>
          <CardTitle className="text-lg">최근 문자 발송 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">불러오는 중...</p>
          ) : smsLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">발송 내역이 없습니다.</p>
          ) : (
            <div className="border rounded-md divide-y divide-border">
              {smsLogs.map(log => (
                <div key={log.id} className="p-4 flex flex-col gap-1 text-sm hover:bg-muted/30">
                  <div className="flex items-center justify-between font-medium">
                    <span>{log.applications?.name} ({log.phone})</span>
                    <span className="text-xs text-muted-foreground">{new Date(log.sent_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded whitespace-pre-wrap mt-1">
                    {log.message_content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
