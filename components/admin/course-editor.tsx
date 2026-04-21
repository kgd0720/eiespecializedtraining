'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course, Lesson, Quiz, Question } from '@/lib/types'

interface AdminCourseEditorProps {
  course: Course
  lessons: Lesson[]
  quiz: Quiz | null
  questions: Question[]
}

export function AdminCourseEditor({ course: initialCourse, lessons: initialLessons, quiz: initialQuiz, questions: initialQuestions }: AdminCourseEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  // Course state
  const [courseTitle, setCourseTitle] = useState(initialCourse.title)
  const [courseDesc, setCourseDesc] = useState(initialCourse.description ?? '')
  const [passingScore, setPassingScore] = useState(initialCourse.passing_score)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Lesson state
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', youtube_url: '' })
  const [addingLesson, setAddingLesson] = useState(false)
  const [lessonFormOpen, setLessonFormOpen] = useState(false)

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz)
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [newQuestion, setNewQuestion] = useState<{
    question_text: string
    question_type: 'multiple_choice' | 'short_answer'
    options: string[]
    correct_answer: string
    points: number
  }>({ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', points: 1 })
  const [questionFormOpen, setQuestionFormOpen] = useState(false)
  const [addingQuestion, setAddingQuestion] = useState(false)

  async function saveCourse() {
    setSaving(true)
    await supabase.from('courses').update({
      title: courseTitle,
      description: courseDesc || null,
      passing_score: passingScore,
      updated_at: new Date().toISOString(),
    }).eq('id', initialCourse.id)
    setSaveMsg('저장되었습니다.')
    setTimeout(() => setSaveMsg(null), 2000)
    setSaving(false)
    router.refresh()
  }

  async function addLesson() {
    if (!newLesson.title || !newLesson.youtube_url) return
    setAddingLesson(true)
    const { data } = await supabase.from('lessons').insert({
      course_id: initialCourse.id,
      title: newLesson.title,
      description: newLesson.description || null,
      youtube_url: newLesson.youtube_url,
      sort_order: lessons.length,
    }).select().single()
    if (data) setLessons(prev => [...prev, data as Lesson])
    setNewLesson({ title: '', description: '', youtube_url: '' })
    setLessonFormOpen(false)
    setAddingLesson(false)
  }

  async function deleteLesson(lessonId: string) {
    await supabase.from('lessons').delete().eq('id', lessonId)
    setLessons(prev => prev.filter(l => l.id !== lessonId))
  }

  async function createQuiz() {
    const { data } = await supabase.from('quizzes').insert({
      course_id: initialCourse.id,
      title: `${courseTitle} 테스트`,
      passing_score: passingScore,
    }).select().single()
    if (data) setQuiz(data as Quiz)
  }

  async function addQuestion() {
    if (!quiz || !newQuestion.question_text) return
    setAddingQuestion(true)

    const opts = newQuestion.question_type === 'multiple_choice'
      ? newQuestion.options.filter(o => o.trim())
      : null

    const { data } = await supabase.from('questions').insert({
      quiz_id: quiz.id,
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      options: opts,
      correct_answer: newQuestion.correct_answer || null,
      points: newQuestion.points,
      sort_order: questions.length,
    }).select().single()

    if (data) setQuestions(prev => [...prev, data as Question])
    setNewQuestion({ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', points: 1 })
    setQuestionFormOpen(false)
    setAddingQuestion(false)
  }

  async function deleteQuestion(qId: string) {
    await supabase.from('questions').delete().eq('id', qId)
    setQuestions(prev => prev.filter(q => q.id !== qId))
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground text-balance">{initialCourse.title}</h1>

      {/* Course Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">강좌 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>강좌 제목</Label>
            <Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>강좌 설명</Label>
            <Textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>합격 기준 (%)</Label>
            <Input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveCourse} disabled={saving} size="sm">
              {saving ? '저장 중...' : '정보 저장'}
            </Button>
            {saveMsg && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />{saveMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">강의 목록 ({lessons.length})</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setLessonFormOpen(v => !v)}>
            <Plus className="w-3.5 h-3.5" />
            강의 추가
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{lesson.title}</div>
                <div className="text-xs text-muted-foreground truncate">{lesson.youtube_url}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteLesson(lesson.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {lessonFormOpen && (
            <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-muted/20">
              <div className="text-sm font-semibold text-foreground">새 강의 추가</div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">강의 제목 *</Label>
                <Input
                  value={newLesson.title}
                  onChange={e => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 1강 - EiE 소개"
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">YouTube URL *</Label>
                <Input
                  value={newLesson.youtube_url}
                  onChange={e => setNewLesson(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">강의 설명 (선택)</Label>
                <Input
                  value={newLesson.description}
                  onChange={e => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addLesson} disabled={addingLesson}>
                  {addingLesson ? '추가 중...' : '추가'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setLessonFormOpen(false)}>취소</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">테스트 문제 ({questions.length}문항)</CardTitle>
          {quiz ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setQuestionFormOpen(v => !v)}>
              <Plus className="w-3.5 h-3.5" />
              문제 추가
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={createQuiz}>테스트 생성</Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!quiz && (
            <p className="text-sm text-muted-foreground">테스트가 없습니다. 위의 버튼으로 테스트를 생성하세요.</p>
          )}

          {questions.map((q, idx) => (
            <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs font-mono text-muted-foreground w-5 mt-0.5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{q.question_text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                    {q.question_type === 'multiple_choice' ? '객관식' : '단답형'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{q.points}점</span>
                  {q.correct_answer && (
                    <span className="text-[10px] text-accent">정답: {q.correct_answer}</span>
                  )}
                </div>
                {q.options && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(q.options as string[]).map((opt, i) => (
                      <span key={i} className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border',
                        opt === q.correct_answer ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'
                      )}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteQuestion(q.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {questionFormOpen && quiz && (
            <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-muted/20">
              <div className="text-sm font-semibold text-foreground">새 문제 추가</div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">문제 유형</Label>
                <div className="flex gap-2">
                  {(['multiple_choice', 'short_answer'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewQuestion(prev => ({ ...prev, question_type: type }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        newQuestion.question_type === type
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {type === 'multiple_choice' ? '객관식' : '단답형'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">문제 내용 *</Label>
                <Textarea
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder="문제를 입력하세요"
                  rows={2}
                  className="text-sm"
                />
              </div>
              {newQuestion.question_type === 'multiple_choice' && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs">선택지 (최대 4개)</Label>
                  {newQuestion.options.map((opt, i) => (
                    <Input
                      key={i}
                      value={opt}
                      onChange={e => {
                        const opts = [...newQuestion.options]
                        opts[i] = e.target.value
                        setNewQuestion(prev => ({ ...prev, options: opts }))
                      }}
                      placeholder={`선택지 ${String.fromCharCode(65 + i)}`}
                      className="text-sm"
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs">정답 *</Label>
                  <Input
                    value={newQuestion.correct_answer}
                    onChange={e => setNewQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                    placeholder={newQuestion.question_type === 'multiple_choice' ? '선택지와 동일하게 입력' : '정답 텍스트'}
                    className="text-sm"
                  />
                </div>
                <div className="w-24 flex flex-col gap-1.5">
                  <Label className="text-xs">배점</Label>
                  <Input type="number" min={1} value={newQuestion.points} onChange={e => setNewQuestion(prev => ({ ...prev, points: Number(e.target.value) }))} className="text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addQuestion} disabled={addingQuestion}>
                  {addingQuestion ? '추가 중...' : '문제 추가'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setQuestionFormOpen(false)}>취소</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
