import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, Pencil, Eye, EyeOff } from 'lucide-react'
import { TogglePublishButton } from '@/components/admin/toggle-publish-button'
import type { Course } from '@/lib/types'

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">강좌 관리</h1>
          <p className="text-muted-foreground mt-1">강좌를 생성하고 강의 및 퀴즈를 관리합니다.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            새 강좌 추가
          </Button>
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">강좌가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">새 강좌를 추가해 보세요.</p>
            </div>
            <Link href="/admin/courses/new">
              <Button size="sm">강좌 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course: Course) => (
            <Card key={course.id} className="shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {course.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                        <Eye className="w-2.5 h-2.5" /> 게시됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                        <EyeOff className="w-2.5 h-2.5" /> 비공개
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">합격 기준 {course.passing_score}%</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(course.created_at).toLocaleDateString('ko-KR')} 생성
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TogglePublishButton courseId={course.id} isPublished={course.is_published} />
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      편집
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
