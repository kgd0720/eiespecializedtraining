import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { QuizClient } from '@/components/quiz-client'
import type { Question } from '@/lib/types'

interface PageProps {
  params: Promise<{ quizId: string }>
}

export default async function QuizPage({ params }: PageProps) {
  const { quizId } = await params
  const supabase = await createClient()
  const user = { id: '00000000-0000-0000-0000-000000000000' }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, courses(*)')
    .eq('id', quizId)
    .single()

  if (!quiz) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order')

  // Check previous attempts
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false })

  const latestPassed = attempts?.find(a => a.passed === true)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <QuizClient
        quiz={quiz}
        questions={(questions ?? []) as Question[]}
        userId={user.id}
        previousAttempts={attempts ?? []}
        alreadyPassed={!!latestPassed}
      />
    </div>
  )
}
