import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Award, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import type { Course, Enrollment, Certificate } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  // 인증 체크 삭제, 모의 사용자 주입
  const user = { id: '00000000-0000-0000-0000-000000000000' }
  const profile = { full_name: 'EiE 사용자' }

  // Enrollments with course info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)

  const totalCourses = enrollments?.length ?? 0
  const completedCourses = enrollments?.filter(e => e.completed_at !== null).length ?? 0
  const inProgressCourses = totalCourses - completedCourses
  const totalCerts = certificates?.length ?? 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground text-balance">
          안녕하세요, {profile?.full_name ?? '강사'}님
        </h1>
        <p className="text-muted-foreground mt-1">오늘도 연수를 이어가세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '수강 중인 강좌', value: inProgressCourses, icon: Clock, color: 'text-primary' },
          { label: '완료한 강좌', value: completedCourses, icon: CheckCircle2, color: 'text-accent' },
          { label: '전체 수강 강좌', value: totalCourses, icon: BookOpen, color: 'text-muted-foreground' },
          { label: '발급 수료증', value: totalCerts, icon: Award, color: 'text-yellow-600' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* In-progress courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">수강 중인 강좌</h2>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              전체 보기 <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        {inProgressCourses === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-foreground">수강 중인 강좌가 없습니다</p>
                <p className="text-sm text-muted-foreground mt-1">강좌 목록에서 새 강좌를 시작해 보세요.</p>
              </div>
              <Link href="/courses">
                <Button size="sm">강좌 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {enrollments
              ?.filter(e => !e.completed_at)
              .slice(0, 4)
              .map(enrollment => {
                const course = enrollment.courses as Course
                return (
                  <Card key={enrollment.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold mb-2">
                            수강 중
                          </div>
                          <h3 className="font-semibold text-foreground truncate">{course?.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course?.description}</p>
                        </div>
                      </div>
                      <Link href={`/courses/${course?.id}`} className="mt-4 block">
                        <Button size="sm" className="w-full">이어서 학습하기</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

      {/* Recent certificates */}
      {totalCerts > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">최근 발급 수료증</h2>
            <Link href="/certificate">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                전체 보기 <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {certificates?.slice(0, 2).map(cert => (
              <Card key={cert.id} className="shadow-sm border-accent/20 bg-accent/5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">수료증 번호</div>
                    <div className="font-mono text-sm font-bold text-foreground">{cert.certificate_number}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(cert.issued_at).toLocaleDateString('ko-KR')} 발급
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
