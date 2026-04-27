'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle2, Lock, Download, AlertTriangle } from 'lucide-react'
import * as htmlToImage from 'html-to-image'
import type { Application, Session, Course, Lesson, Question } from '@/lib/types'

interface TrainingClientProps {
  application: Application & { sessions: Session & { courses: Course } }
  course: Course
  lessons: Lesson[]
  questions: Question[]
  initialProgress: any[]
  certificate: any
}

export function TrainingClient({ application, course, lessons, questions, initialProgress, certificate }: TrainingClientProps) {
  const supabase = createClient()
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(lessons[0] || null)
  const [progress, setProgress] = useState(initialProgress)
  const [cert, setCert] = useState(certificate)
  
  const [quizMode, setQuizMode] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  const certRef = useRef<HTMLDivElement>(null)

  // Youtube API & strict playback state
  const playerRef = useRef<any>(null)
  const lastTimeRef = useRef(0)
  const intervalRef = useRef<any>(null)

  const failCount = application.fail_count || 0
  const isAllCompleted = lessons.length > 0 && progress.filter(p => p.completed_at).length === lessons.length

  useEffect(() => {
    // Determine the furthest lesson they can access based on progress
    if (!quizMode && !isAllCompleted) {
      const completedLessonIds = progress.filter(p => p.completed_at).map(p => p.lesson_id)
      const nextUnfinishedIndex = lessons.findIndex(l => !completedLessonIds.includes(l.id))
      
      if (nextUnfinishedIndex >= 0) {
        setActiveLesson(lessons[nextUnfinishedIndex])
      }
    }
  }, [progress, lessons, quizMode, isAllCompleted])

  // --- YouTube Player Logic ---
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
    
    ;(window as any).onYouTubeIframeAPIReady = () => {
      if (activeLesson && !quizMode && !isAllCompleted) initPlayer()
    }

    if ((window as any).YT && (window as any).YT.Player && activeLesson && !quizMode && !isAllCompleted) {
      initPlayer()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeLesson, quizMode, isAllCompleted])

  function initPlayer() {
    if (playerRef.current) {
      playerRef.current.destroy()
    }
    lastTimeRef.current = 0

    const videoId = extractYouTubeId(activeLesson?.youtube_url || '')
    if (!videoId) return

    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId,
      playerVars: {
        playsinline: 1,
        disablekb: 1, // Disable keyboard controls (skipping)
        controls: 0,  // Hide native controls
        rel: 0
      },
      events: {
        onStateChange: onPlayerStateChange
      }
    })
  }

  function extractYouTubeId(url: string) {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? match[1] : null
  }

  function onPlayerStateChange(event: any) {
    const YT = (window as any).YT
    if (event.data === YT.PlayerState.PLAYING) {
      playerRef.current.setPlaybackRate(1) // Prevent speedup
      
      intervalRef.current = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime()
        // Prevent skip
        if (currentTime > lastTimeRef.current + 2) {
          playerRef.current.seekTo(lastTimeRef.current)
        } else {
          lastTimeRef.current = currentTime
        }

        // Check completion
        const duration = playerRef.current.getDuration()
        if (duration > 0 && currentTime >= duration - 1) {
          clearInterval(intervalRef.current)
          handleVideoComplete()
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }

  function handleVideoComplete() {
    // Instead of marking complete, we go to Quiz mode
    setQuizMode(true)
    setAnswers({})
  }

  // --- Quiz Logic ---
  async function submitQuiz() {
    if (!activeLesson) return
    
    const lessonQuestions = questions.filter(q => q.lesson_id === activeLesson.id)
    if (lessonQuestions.length === 0) {
      // No questions for this lesson, auto pass
      await passLesson()
      return
    }

    let score = 0
    lessonQuestions.forEach(q => {
      if (String(answers[q.id]) === q.correct_answer) {
        score += 1
      }
    })

    const finalScore = Math.round((score / lessonQuestions.length) * 100)
    const passed = finalScore >= (course.passing_score || 70)

    if (passed) {
      await passLesson()
    } else {
      // Failed. Update fail_count
      const newFailCount = failCount + 1
      await supabase.from('applications').update({ fail_count: newFailCount }).eq('id', application.id)
      
      if (newFailCount >= 2) {
        alert('테스트에 2회 미달하여 모든 학습 진도가 초기화됩니다. 1강부터 다시 수강해 주세요.')
        await supabase.from('lesson_progress').delete().eq('user_id', application.id).eq('course_id', course.id)
        await supabase.from('applications').update({ fail_count: 0 }).eq('id', application.id)
        window.location.reload()
      } else {
        alert(`불합격입니다. (${finalScore}점 / 기준 ${course.passing_score}점)\n영상을 다시 시청하셔야 합니다.\n(1회 더 불합격 시 전체 과정이 초기화됩니다)`)
        setQuizMode(false) // Reset to video
        if (playerRef.current) playerRef.current.seekTo(0)
      }
    }
  }

  async function passLesson() {
    if (!activeLesson) return

    // Mark lesson as complete
    const { data } = await supabase.from('lesson_progress').upsert({
      user_id: application.id,
      lesson_id: activeLesson.id,
      course_id: course.id,
      completed_at: new Date().toISOString(),
      last_position: 0
    }).select().single()

    if (data) {
      const newProgress = [...progress.filter(p => p.lesson_id !== activeLesson.id), data]
      setProgress(newProgress)
      setQuizMode(false)
      
      // Check if all lessons are now done
      if (newProgress.filter(p => p.completed_at).length === lessons.length) {
        issueCertificate()
      }
    }
  }

  async function issueCertificate() {
    if (cert) return
    const { data: newCert } = await supabase.from('certificates').insert({
      user_id: application.id,
      course_id: course.id,
      certificate_number: `EIE-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }).select().single()
    if (newCert) setCert(newCert)
  }

  // --- JPG Certificate Generation ---
  async function downloadCertificate() {
    if (!certRef.current) return
    try {
      const dataUrl = await htmlToImage.toJpeg(certRef.current, { quality: 0.95, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `수료증_${application.name}.jpg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to generate JPG', err)
      alert('수료증 이미지 생성 중 오류가 발생했습니다.')
    }
  }

  // --- Render ---
  if (cert || isAllCompleted) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2"><CheckCircle2/> 모든 교육 이수 완료</h2>
        <p className="text-muted-foreground">축하합니다! 교육을 성공적으로 수료하셨습니다.</p>
        
        {cert && (
          <div 
            ref={certRef}
            className="w-[800px] h-[565px] bg-white border-[12px] border-double border-primary/20 p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-xl"
          >
            {/* Certificate Design */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '30px 30px' }}/>
            <div className="z-10 flex flex-col items-center text-center w-full">
              <h1 className="text-5xl font-serif font-bold text-foreground mb-12 tracking-widest text-primary">수 료 증</h1>
              
              <div className="w-full max-w-lg mb-10 text-left">
                <div className="flex mb-4 text-lg"><span className="w-24 font-bold text-muted-foreground">성 명:</span> <span className="font-medium">{application.name}</span></div>
                <div className="flex mb-4 text-lg"><span className="w-24 font-bold text-muted-foreground">소 속:</span> <span className="font-medium">{application.campus}</span></div>
                <div className="flex mb-4 text-lg"><span className="w-24 font-bold text-muted-foreground">과 정 명:</span> <span className="font-medium">{course.title.replace('[자동생성] ', '')}</span></div>
              </div>

              <p className="text-lg leading-relaxed mb-12 text-foreground/80">
                위 사람은 EiE Education에서 주관하는<br/>
                본 과정을 성실히 이수하였으므로 이 증서를 수여합니다.
              </p>

              <div className="text-xl font-medium mb-12">
                {new Date(cert.issued_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold font-serif tracking-widest">EiE Education 원장</div>
                <div className="w-16 h-16 rounded-full border-4 border-red-600/80 flex items-center justify-center transform rotate-12 opacity-80">
                  <span className="text-red-600/80 font-bold text-xs tracking-tighter">직인생략</span>
                </div>
              </div>
              
              <div className="absolute bottom-6 right-8 text-xs text-muted-foreground font-mono">
                NO. {cert.certificate_number}
              </div>
            </div>
          </div>
        )}

        <Button onClick={downloadCertificate} className="gap-2" size="lg">
          <Download className="w-5 h-5"/> 수료증 이미지 (JPG) 다운로드
        </Button>
      </div>
    )
  }

  const lessonQuestions = activeLesson ? questions.filter(q => q.lesson_id === activeLesson.id) : []

  if (quizMode && lessonQuestions.length > 0) {
    // Simply render all questions for this lesson in one page
    const allAnswered = lessonQuestions.every(q => answers[q.id] !== undefined)
    
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{activeLesson?.title} - 이해도 평가</h2>
        <p className="text-muted-foreground">영상을 모두 시청하셨습니다. 아래 문제를 풀어야 다음 교시로 넘어갈 수 있습니다.</p>
        
        {failCount > 0 && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 border border-red-200">
            <AlertTriangle className="w-4 h-4"/> 주의: 현재 1회 미달 상태입니다. 이번에도 불합격 시 1교시부터 다시 수강해야 합니다.
          </div>
        )}
        
        <div className="flex flex-col gap-6">
          {lessonQuestions.map((q, idx) => (
            <Card key={q.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">문제 {idx + 1}.</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="text-lg">{q.question_text}</div>
                {q.question_type === 'multiple_choice' && q.options && (
                  <div className="flex flex-col gap-2">
                    {(q.options as string[]).map((opt, i) => (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === String(opt) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}>
                        <input type="radio" name={q.id} value={opt} checked={answers[q.id] === String(opt)} onChange={() => setAnswers({...answers, [q.id]: String(opt)})} className="w-4 h-4" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button size="lg" className="mt-4" onClick={submitQuiz} disabled={!allAnswered}>
          평가 제출 및 다음 단계로
        </Button>
      </div>
    )
  }

  // Video Mode
  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Video Area */}
      <div className="flex-1 bg-black flex flex-col relative">
        <div className="absolute top-4 right-4 z-10 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 backdrop-blur-sm">
          <Lock className="w-3 h-3"/> 건너뛰기 불가
        </div>
        <div id="youtube-player" className="w-full h-full pointer-events-auto" />
        
        {/* Prevent interaction */}
        <div className="absolute inset-0 z-0 bg-transparent" />
      </div>

      {/* Sidebar Area */}
      <div className="w-80 border-l border-border bg-muted/10 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border bg-background sticky top-0 font-bold">전체 목차</div>
        <div className="p-2 flex flex-col gap-1">
          {lessons.map((lesson, idx) => {
            const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed_at)
            const isActive = activeLesson?.id === lesson.id
            const isLocked = !isCompleted && !isActive && idx > 0 && !progress.some(p => p.lesson_id === lessons[idx-1].id && p.completed_at)

            return (
              <div 
                key={lesson.id} 
                className={`flex items-start gap-3 p-3 text-left rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-md' : isCompleted ? 'bg-accent/5 opacity-70' : isLocked ? 'opacity-40' : 'bg-muted/50'}`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500 mt-0.5" /> : isLocked ? <Lock className="w-5 h-5 shrink-0 mt-0.5" /> : <PlayCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>{lesson.title}</div>
                  <div className={`text-xs mt-1 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {isCompleted ? '이수 완료' : isActive ? '학습 중' : '잠김'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
