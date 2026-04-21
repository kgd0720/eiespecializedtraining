import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminCourseEditor } from '@/components/admin/course-editor'
import type { Lesson, Quiz, Question } from '@/lib/types'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function AdminCourseEditPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()

  const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single()
  if (!course) notFound()

  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order')
  const { data: quiz } = await supabase.from('quizzes').select('*').eq('course_id', courseId).maybeSingle()
  const { data: questions } = quiz
    ? await supabase.from('questions').select('*').eq('quiz_id', quiz.id).order('sort_order')
    : { data: [] }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/courses" className="text-xs text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> 강좌 목록으로
      </Link>
      <AdminCourseEditor
        course={course}
        lessons={(lessons ?? []) as Lesson[]}
        quiz={quiz ?? null}
        questions={(questions ?? []) as Question[]}
      />
    </div>
  )
}
