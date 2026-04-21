'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Award, RotateCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Question, QuizAttempt } from '@/lib/types'

interface QuizClientProps {
  quiz: {
    id: string
    title: string
    description: string | null
    passing_score: number
    time_limit_minutes: number | null
    course_id: string
    courses?: { title: string } | null
  }
  questions: Question[]
  userId: string
  previousAttempts: QuizAttempt[]
  alreadyPassed: boolean
}

type QuizState = 'intro' | 'taking' | 'result'

export function QuizClient({ quiz, questions, userId, previousAttempts, alreadyPassed }: QuizClientProps) {
  const router = useRouter()
  const [state, setState] = useState<QuizState>(alreadyPassed ? 'result' : 'intro')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean; attemptId: string } | null>(
    alreadyPassed
      ? (() => {
          const best = previousAttempts.find(a => a.passed)
          return best ? { score: best.score!, maxScore: best.max_score!, passed: true, attemptId: best.id } : null
        })()
      : null
  )
  const [submitting, setSubmitting] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)

  const totalQuestions = questions.length

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    const supabase = createClient()

    // Grade answers
    let score = 0
    let maxScore = 0
    for (const q of questions) {
      maxScore += q.points
      const userAnswer = (answers[q.id] ?? '').trim().toLowerCase()
      const correctAnswer = (q.correct_answer ?? '').trim().toLowerCase()
      if (userAnswer === correctAnswer) {
        score += q.points
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const passed = percentage >= quiz.passing_score

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: quiz.id,
        answers,
        score,
        max_score: maxScore,
        passed,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Issue certificate if passed
    if (passed && attempt) {
      // Generate certificate number on the client via a server action equivalent
      const certNumber = `EIE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999 + 1)).padStart(6, '0')}`
      await supabase.from('certificates').upsert({
        user_id: userId,
        course_id: quiz.course_id,
        quiz_attempt_id: attempt.id,
        certificate_number: certNumber,
      }, { onConflict: 'user_id,course_id' })

      // Mark enrollment complete
      await supabase
        .from('enrollments')
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('course_id', quiz.course_id)
    }

    setResult({ score, maxScore, passed, attemptId: attempt?.id ?? '' })
    setState('result')
    setSubmitting(false)
    router.refresh()
  }

  // ---- INTRO ----
  if (state === 'intro') {
    return (
      <div>
        <Link href={`/courses/${quiz.course_id}`} className="text-xs text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> 강좌로 돌아가기
        </Link>
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
                {quiz.description && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{quiz.description}</p>}
              </div>
              <div className="grid grid-cols-3 gap-6 w-full max-w-sm text-center mt-2">
                <div>
                  <div className="text-2xl font-bold text-foreground">{totalQuestions}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">문제</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{quiz.passing_score}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">합격 기준 (%)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{previousAttempts.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">응시 횟수</div>
                </div>
              </div>
              {previousAttempts.length > 0 && (
                <div className="w-full max-w-sm bg-muted rounded-lg p-3 text-left">
                  <p className="text-xs font-semibold text-foreground mb-2">이전 응시 기록</p>
                  {previousAttempts.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs text-muted-foreground py-1">
                      <span>{new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
                      <span className={cn('font-semibold', a.passed ? 'text-accent' : 'text-destructive')}>
                        {a.score}/{a.max_score}점 ({a.passed ? '합격' : '불합격'})
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setState('taking')} className="w-full max-w-sm">
                테스트 시작하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- TAKING ----
  if (state === 'taking') {
    const q = questions[currentQ]
    const isLast = currentQ === totalQuestions - 1
    const allAnswered = questions.every(q => answers[q.id]?.trim())

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {currentQ + 1} / {totalQuestions} 문제
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  'w-6 h-6 rounded text-[10px] font-bold transition-colors',
                  i === currentQ ? 'bg-primary text-primary-foreground' :
                  answers[questions[i].id] ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <Card className="shadow-sm mb-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {currentQ + 1}
              </span>
              <p className="font-medium text-foreground leading-relaxed pt-0.5">{q.question_text}</p>
            </div>

            {q.question_type === 'multiple_choice' && q.options ? (
              <div className="flex flex-col gap-2">
                {(q.options as string[]).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                      answers[q.id] === opt
                        ? 'border-primary bg-primary/5 text-foreground font-medium'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40 text-foreground'
                    )}
                  >
                    <span className="inline-flex w-5 h-5 rounded-full border border-current text-[10px] font-bold items-center justify-center mr-2 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="답변을 입력하세요"
                value={answers[q.id] ?? ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                className="text-sm"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
          >
            이전
          </Button>
          <div className="flex gap-2">
            {!isLast && (
              <Button
                size="sm"
                onClick={() => setCurrentQ(prev => Math.min(totalQuestions - 1, prev + 1))}
              >
                다음
              </Button>
            )}
            {isLast && (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="min-w-24"
              >
                {submitting ? '채점 중...' : '제출하기'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---- RESULT ----
  const percentage = result ? Math.round((result.score / result.maxScore) * 100) : 0
  const passed = result?.passed ?? false

  return (
    <div>
      <Link href={`/courses/${quiz.course_id}`} className="text-xs text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> 강좌로 돌아가기
      </Link>
      <Card className="shadow-sm">
        <CardContent className="p-8 flex flex-col items-center text-center gap-5">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            passed ? 'bg-accent/10' : 'bg-destructive/10'
          )}>
            {passed
              ? <CheckCircle2 className="w-8 h-8 text-accent" />
              : <XCircle className="w-8 h-8 text-destructive" />
            }
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {passed ? '합격!' : '불합격'}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {passed
                ? '축하합니다! 수료증이 발급되었습니다.'
                : `합격 기준은 ${quiz.passing_score}점입니다. 다시 도전해 보세요.`}
            </p>
          </div>

          {/* Score circle */}
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/40" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="currentColor" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                strokeLinecap="round"
                className={passed ? 'text-accent' : 'text-destructive'}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{percentage}%</span>
              <span className="text-[10px] text-muted-foreground">{result?.score}/{result?.maxScore}점</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {passed ? (
              <Link href="/certificate" className="w-full">
                <Button className="w-full gap-2">
                  <Award className="w-4 h-4" />
                  수료증 보기
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setAnswers({})
                  setCurrentQ(0)
                  setResult(null)
                  setState('intro')
                }}
              >
                <RotateCcw className="w-4 h-4" />
                재시험 응시
              </Button>
            )}
            <Link href={`/courses/${quiz.course_id}`} className="w-full">
              <Button variant="ghost" className="w-full">강좌로 돌아가기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
