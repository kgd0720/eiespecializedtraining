import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LessonList } from '@/components/lesson-list'
import { EnrollButton } from '@/components/enroll-button'
import { CheckCircle2, BookOpen, FileQuestion, Award } from 'lucide-react'
import type { Lesson, Quiz } from '@/lib/types'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const user = { id: '00000000-0000-0000-0000-000000000000' }

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const [{ data: lessons }, { data: quiz }, { data: enrollment }, { data: progress }, { data: certificate }] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order'),
    supabase.from('quizzes').select('*').eq('course_id', courseId).single(),
    supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).single(),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id),
    supabase.from('certificates').select('*').eq('user_id', user.id).eq('course_id', courseId).single(),
  ])

  const isEnrolled = !!enrollment
  const completedLessonIds = new Set(progress?.filter(p => p.completed).map(p => p.lesson_id) ?? [])
  const totalLessons = lessons?.length ?? 0
  const completedCount = lessons?.filter(l => completedLessonIds.has(l.id)).length ?? 0
  const allLessonsCompleted = totalLessons > 0 && completedCount === totalLessons
  const hasCertificate = !!certificate

  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Course header */}
      <div className="mb-6">
        <Link href="/courses" className="text-xs text-muted-foreground hover:text-primary mb-3 inline-flex items-center gap-1">
          ← 수강 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-foreground text-balance">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mt-2 leading-relaxed">{course.description}</p>
        )}
      </div>

      {/* Progress + enroll */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="md:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">학습 진도</span>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">{completedCount} / {totalLessons} 강의 완료</div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            강의 {totalLessons}개
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileQuestion className="w-4 h-4" />
            합격 기준 {course.passing_score}점
          </div>
          {hasCertificate && (
            <div className="flex items-center gap-2 text-sm text-accent font-medium">
              <Award className="w-4 h-4" />
              수료 완료
            </div>
          )}
        </div>
      </div>

      {/* Enroll or Quiz CTA */}
      {!isEnrolled ? (
        <div className="mb-6">
          <EnrollButton courseId={courseId} />
        </div>
      ) : (
        <>
          {allLessonsCompleted && quiz && !hasCertificate && (
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">모든 강의를 완료했습니다!</p>
                <p className="text-xs text-muted-foreground mt-0.5">테스트를 통과하면 수료증을 발급받을 수 있습니다.</p>
              </div>
              <Link href={`/quiz/${quiz.id}`}>
                <Button size="sm" className="shrink-0">테스트 응시</Button>
              </Link>
            </div>
          )}
          {hasCertificate && (
            <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-foreground text-sm">수료증이 발급되었습니다</p>
                  <p className="text-xs text-muted-foreground mt-0.5">수료증 번호: {certificate?.certificate_number}</p>
                </div>
              </div>
              <Link href="/certificate">
                <Button size="sm" variant="outline" className="shrink-0">수료증 보기</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Lessons */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">강의 목록</h2>
        {lessons && lessons.length > 0 ? (
          <LessonList
            lessons={lessons as Lesson[]}
            completedLessonIds={completedLessonIds}
            isEnrolled={isEnrolled}
            courseId={courseId}
          />
        ) : (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              아직 강의가 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
