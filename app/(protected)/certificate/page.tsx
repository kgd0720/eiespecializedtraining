import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Award } from 'lucide-react'
import { CertificateCard } from '@/components/certificate-card'

export default async function CertificatePage() {
  const supabase = await createClient()
  const user = { id: '00000000-0000-0000-0000-000000000000' }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, courses(title, description)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">내 수료증</h1>
        <p className="text-muted-foreground mt-1">수료한 강좌의 수료증을 PDF로 다운로드할 수 있습니다.</p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <Award className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">아직 수료증이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">강좌를 완료하고 테스트에 합격하면 수료증이 발급됩니다.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {certificates.map(cert => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              profile={profile}
              courseTitle={(cert.courses as { title: string } | null)?.title ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}
