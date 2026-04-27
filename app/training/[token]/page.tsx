import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TrainingClient } from '@/components/training/training-client'
import type { Lesson, Quiz, Question } from '@/lib/types'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function TrainingPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  const { data: application } = await supabase
    .from('applications')
    .select('*, sessions(*, courses(*))')
    .eq('token', token)
    .single()

  if (!application) notFound()

  const courseId = application.sessions.course_id
  const course = application.sessions.courses

  // Load Lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order')

  // Load all questions for these lessons
  const lessonIds = lessons?.map(l => l.id) || []
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .in('lesson_id', lessonIds)
    .order('sort_order')

  // Load Progress using application.id as pseudo user_id
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', application.id)



  // Check if certificate already exists
  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', application.id)
    .maybeSingle()

  return (
    <TrainingClient
      application={application}
      course={course}
      lessons={(lessons ?? []) as Lesson[]}
      questions={(questions ?? []) as Question[]}
      initialProgress={progress ?? []}
      certificate={cert}
    />
  )
}
