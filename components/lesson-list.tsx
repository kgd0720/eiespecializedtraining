'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

interface LessonListProps {
  lessons: Lesson[]
  completedLessonIds: Set<string>
  isEnrolled: boolean
  courseId: string
}

export function LessonList({ lessons, completedLessonIds, isEnrolled, courseId }: LessonListProps) {
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [completedLocal, setCompletedLocal] = useState<Set<string>>(new Set(completedLessonIds))
  const [marking, setMarking] = useState<string | null>(null)
  const router = useRouter()

  async function markComplete(lessonId: string) {
    if (!isEnrolled || completedLocal.has(lessonId)) return
    setMarking(lessonId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMarking(null); return }

    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

    setCompletedLocal(prev => new Set([...prev, lessonId]))
    setMarking(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      {lessons.map((lesson, idx) => {
        const isCompleted = completedLocal.has(lesson.id)
        const isOpen = activeLesson === lesson.id
        const ytId = getYouTubeId(lesson.youtube_url)

        return (
          <Card key={lesson.id} className={cn('shadow-sm overflow-hidden', isCompleted && 'border-accent/30')}>
            {/* Header row */}
            <button
              className="w-full text-left"
              onClick={() => setActiveLesson(isOpen ? null : lesson.id)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="font-medium text-foreground text-sm truncate">{lesson.title}</span>
                  </div>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.description}</p>
                  )}
                </div>
                <div className="shrink-0 ml-2">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>

            {/* Video panel */}
            {isOpen && (
              <div className="border-t border-border">
                {isEnrolled ? (
                  <div className="p-4">
                    {ytId ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-4">
                        <p className="text-muted-foreground text-sm">영상을 불러올 수 없습니다.</p>
                      </div>
                    )}
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-accent border-accent/30 hover:bg-accent/5"
                        onClick={() => markComplete(lesson.id)}
                        disabled={marking === lesson.id}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {marking === lesson.id ? '저장 중...' : '강의 완료 처리'}
                      </Button>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-accent font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 완료한 강의입니다
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    수강 등록 후 강의를 시청하실 수 있습니다.
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
