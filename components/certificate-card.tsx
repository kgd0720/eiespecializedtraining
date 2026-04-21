'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download } from 'lucide-react'
import { CertificatePDF } from '@/components/certificate-pdf'
import type { Certificate, Profile } from '@/lib/types'

interface CertificateCardProps {
  certificate: Certificate
  profile: Profile | null
  courseTitle: string
}

export function CertificateCard({ certificate, profile, courseTitle }: CertificateCardProps) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    const blob = await pdf(
      <CertificatePDF
        recipientName={profile?.full_name ?? '수강생'}
        courseTitle={courseTitle}
        certificateNumber={certificate.certificate_number}
        issuedAt={certificate.issued_at}
      />
    ).toBlob()

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EiE_Certificate_${certificate.certificate_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
  }

  return (
    <Card className="shadow-sm border-accent/20 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground leading-snug text-balance">{courseTitle}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">수료증 번호</span>
              <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                {certificate.certificate_number}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              발급일: {new Date(certificate.issued_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full gap-2"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </Button>
      </CardContent>
    </Card>
  )
}
