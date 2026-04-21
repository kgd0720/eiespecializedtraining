import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, Clock, ArrowRight, PlayCircle } from 'lucide-react'
import type { Course } from '@/lib/types'

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, completed_at')
    .eq('user_id', user.id)

  const enrollmentMap = new Map(enrollments?.map(e => [e.course_id, e]) ?? [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">수강 목록</h1>
        <p className="text-muted-foreground mt-1">수강 가능한 모든 강좌입니다.</p>
      </div>

      {!courses || courses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">아직 개설된 강좌가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">관리자가 강좌를 추가하면 여기에 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: Course) => {
            const enrollment = enrollmentMap.get(course.id)
            const isEnrolled = !!enrollment
            const isCompleted = !!enrollment?.completed_at

            return (
              <Card key={course.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Thumbnail */}
                <div className="w-full aspect-video bg-secondary rounded-t-lg flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-primary/30" />
                  )}
                </div>
                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> 완료
                      </span>
                    ) : isEnrolled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        <Clock className="w-3 h-3" /> 수강 중
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                        미수강
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">합격 기준 {course.passing_score}점</span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-balance leading-snug">{course.title}</h3>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{course.description}</p>
                    )}
                  </div>

                  <Link href={`/courses/${course.id}`}>
                    <Button
                      size="sm"
                      className="w-full gap-1.5"
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {isCompleted ? '다시 보기' : isEnrolled ? '이어서 학습' : '수강 시작'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
