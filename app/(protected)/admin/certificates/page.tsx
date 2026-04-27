'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CertificatesAdminPage() {
  const supabase = createClient()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCertificates()
  }, [])

  async function fetchCertificates() {
    setLoading(true)
    // Join with applications and courses to get names
    const { data } = await supabase
      .from('certificates')
      .select('*, courses(title)')
      .order('issued_at', { ascending: false })
      
    // Since certificates point to user_id (which we map to applications.id), we fetch applications separately to match
    // A proper join would require FK on user_id -> applications.id, but since we used application.id as pseudo user_id:
    
    if (data && data.length > 0) {
      const appIds = data.map(c => c.user_id)
      const { data: apps } = await supabase.from('applications').select('id, name, campus, phone').in('id', appIds)
      
      const enriched = data.map(cert => {
        const app = apps?.find(a => a.id === cert.user_id)
        return {
          ...cert,
          user_name: app?.name || '알 수 없음',
          campus: app?.campus || '-',
          phone: app?.phone || '-'
        }
      })
      setCertificates(enriched)
    } else {
      setCertificates([])
    }
    
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">수료증 관리</h1>
        <p className="text-muted-foreground mt-1">교육 과정을 최종 이수한 수강생들에게 발급된 수료증 내역입니다.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">발급 번호</th>
                  <th className="px-6 py-4 font-semibold">수료자 이름</th>
                  <th className="px-6 py-4 font-semibold">소속 캠퍼스</th>
                  <th className="px-6 py-4 font-semibold">교육명</th>
                  <th className="px-6 py-4 font-semibold">발급 일자</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">불러오는 중...</td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">발급된 수료증 내역이 없습니다.</td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary">{cert.certificate_number}</td>
                      <td className="px-6 py-4 font-medium">{cert.user_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{cert.campus}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{cert.courses?.title?.replace('[자동생성] ', '')}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(cert.issued_at).toLocaleDateString('ko-KR')}</td>
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
