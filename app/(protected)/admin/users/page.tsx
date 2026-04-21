import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Award, BookOpen, CheckCircle2 } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: instructors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'instructor')
    .order('created_at', { ascending: false })

  // Get enrollment and cert counts per user
  const { data: enrollments } = await supabase.from('enrollments').select('user_id, completed_at')
  const { data: certificates } = await supabase.from('certificates').select('user_id')

  const enrollByUser = new Map<string, number>()
  const completedByUser = new Map<string, number>()
  const certByUser = new Map<string, number>()

  enrollments?.forEach(e => {
    enrollByUser.set(e.user_id, (enrollByUser.get(e.user_id) ?? 0) + 1)
    if (e.completed_at) completedByUser.set(e.user_id, (completedByUser.get(e.user_id) ?? 0) + 1)
  })
  certificates?.forEach(c => {
    certByUser.set(c.user_id, (certByUser.get(c.user_id) ?? 0) + 1)
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">수강생 관리</h1>
        <p className="text-muted-foreground mt-1">강사 계정의 수강 현황을 확인합니다. 총 {instructors?.length ?? 0}명</p>
      </div>

      {!instructors || instructors.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground">
            아직 등록된 강사가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {instructors.map(instructor => (
            <Card key={instructor.id} className="shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-secondary-foreground">
                    {instructor.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{instructor.full_name ?? '이름 없음'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{instructor.email}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    가입: {new Date(instructor.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-bold text-foreground">{enrollByUser.get(instructor.id) ?? 0}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">수강 등록</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm font-bold text-foreground">{completedByUser.get(instructor.id) ?? 0}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">완료</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-sm font-bold text-foreground">{certByUser.get(instructor.id) ?? 0}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">수료증</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
