'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ArrowDown, Settings, Upload, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface QuestionItem {
  id: string
  text: string
  options: string[]
  correctIndex: string
}

interface PeriodItem {
  id: string
  title: string
  youtubeUrl: string
  questions: QuestionItem[]
}

export default function EducationsCreatePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [applyStart, setApplyStart] = useState('')
  const [applyEnd, setApplyEnd] = useState('')
  const [trainStart, setTrainStart] = useState('')
  const [trainEnd, setTrainEnd] = useState('')
  const [periods, setPeriods] = useState<PeriodItem[]>([])

  function addPeriod() {
    setPeriods([...periods, {
      id: crypto.randomUUID(),
      title: '',
      youtubeUrl: '',
      questions: []
    }])
  }

  function removePeriod(id: string) {
    setPeriods(periods.filter(p => p.id !== id))
  }

  function updatePeriod(id: string, field: keyof PeriodItem, value: any) {
    setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function handleExcelUpload(periodId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

      const parsedQuestions: QuestionItem[] = []
      
      let startIndex = 0
      if (data[0] && typeof data[0][0] === 'string' && data[0][0].includes('지문')) {
        startIndex = 1
      }

      for (let i = startIndex; i < data.length; i++) {
        const row = data[i]
        if (!row[0]) continue

        const qText = String(row[0] || '')
        const opt1 = String(row[1] || '')
        const opt2 = String(row[2] || '')
        const opt3 = String(row[3] || '')
        const opt4 = String(row[4] || '')
        const correctNum = Number(row[5]) || 1

        parsedQuestions.push({
          id: crypto.randomUUID(),
          text: qText,
          options: [opt1, opt2, opt3, opt4],
          correctIndex: String(correctNum - 1)
        })
      }

      if (parsedQuestions.length > 0) {
        setPeriods(periods.map(p => p.id === periodId ? { ...p, questions: parsedQuestions } : p))
        alert(`${parsedQuestions.length}개의 문제가 성공적으로 업로드되었습니다.`)
      } else {
        alert('엑셀 파일에서 문제를 찾을 수 없습니다. 양식을 확인해주세요.')
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !applyStart || !applyEnd || !trainStart || !trainEnd || periods.length === 0) {
      alert('교육명, 일정 및 최소 1개의 교시를 등록해주세요.')
      return
    }

    const missingQs = periods.findIndex(p => p.questions.length === 0)
    if (missingQs !== -1) {
      if (!confirm(`${missingQs + 1}교시에 등록된 평가 문제가 없습니다. 이대로 저장하시겠습니까?`)) return
    }

    setLoading(true)

    try {
      // 1. Create Course automatically
      const { data: courseData, error: cError } = await supabase.from('courses').insert({
        title,
        description: '통합 교육 과정',
        passing_score: passingScore,
        is_published: true,
        evaluation_type: 'lesson',
        retake_on_fail: true,
        question_count: 0,
        question_type: 'multiple_choice'
      }).select().single()

      if (!courseData || cError) {
        console.error('Course creation error:', cError)
        alert(`교육 과정 생성 오류: ${cError?.message || '알 수 없는 오류'}`)
        setLoading(false)
        return
      }

      // 2. Create Session
      const { data: sessionData, error: sError } = await supabase.from('sessions').insert({
        course_id: courseData.id,
        title,
        apply_start: new Date(applyStart).toISOString(),
        apply_end: new Date(applyEnd).toISOString(),
        train_start: new Date(trainStart).toISOString(),
        train_end: new Date(trainEnd).toISOString(),
        is_active: true
      }).select('*, courses(*)').single()

      // 3. Create Lessons and Questions mapping
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i]
        const lessonTitle = `${i + 1}교시. ${p.title}`

        const { data: lessonData } = await supabase.from('lessons').insert({
          course_id: courseData.id,
          title: lessonTitle,
          youtube_url: p.youtubeUrl,
          sort_order: i + 1,
          duration_seconds: 600
        }).select().single()

        if (lessonData && p.questions.length > 0) {
          const questionInserts = p.questions.map((q, qIdx) => ({
            lesson_id: lessonData.id,
            question_text: q.text,
            question_type: 'multiple_choice',
            options: q.options.filter(o => o.trim() !== ''),
            correct_answer: q.options[Number(q.correctIndex)],
            points: 10,
            sort_order: qIdx + 1
          }))
          await supabase.from('questions').insert(questionInserts)
        }
      }

      if (sessionData) {
        alert('새로운 교육이 성공적으로 생성되었습니다.')
        router.push('/admin/sessions')
      } else {
        console.error('Session creation error:', sError)
        alert(`회차 생성 오류: ${sError?.message || '알 수 없는 오류'}`)
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Network or unexpected error:', err)
      if (err?.message?.includes('Failed to fetch')) {
        alert('서버 연결 실패 (Failed to fetch): .env.local 파일의 Supabase URL/KEY가 올바른지 확인해 주세요. (인터넷 연결 및 백엔드 상태 확인 필요)')
      } else {
        alert(`네트워크 또는 서버 통신 오류: ${err?.message || '알 수 없는 오류'}`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8 mb-20">
      <div>
        <h1 className="text-2xl font-bold">교육 생성</h1>
        <p className="text-muted-foreground mt-1">새로운 교육을 생성하고, 각 교시별 영상과 문제를 한 번에 등록하세요.</p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-lg">1. 교육 기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>교육명 *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 2026년 5월 신임강사 연수" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>합격 기준 점수 *</Label>
                <Input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>신청 시작 일시 *</Label>
                <Input type="datetime-local" value={applyStart} onChange={e => setApplyStart(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>신청 마감 일시 *</Label>
                <Input type="datetime-local" value={applyEnd} onChange={e => setApplyEnd(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>교육 시작 일시 *</Label>
                <Input type="datetime-local" value={trainStart} onChange={e => setTrainStart(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>교육 종료 일시 *</Label>
                <Input type="datetime-local" value={trainEnd} onChange={e => setTrainEnd(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-accent/20">
          <CardHeader className="bg-accent/5 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">2. 교시(Period) 구성 및 평가 등록</CardTitle>
              <CardDescription>각 교시별 제목과 유튜브 링크를 입력하고 엑셀로 문제를 일괄 업로드하세요.</CardDescription>
            </div>
            <Button type="button" onClick={addPeriod} variant="outline" size="sm" className="gap-1 border-accent text-accent hover:bg-accent/10">
              <Plus className="w-4 h-4" /> 교시 추가
            </Button>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-6 bg-muted/5">
            {periods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">교시 추가 버튼을 눌러 교육을 구성하세요.</div>
            ) : (
              periods.map((p, index) => (
                <div key={p.id} className="relative bg-background border rounded-lg p-5 shadow-sm">
                  <div className="absolute -left-3 -top-3 w-auto px-2 h-8 rounded bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                    {index + 1}교시
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removePeriod(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="grid gap-6 mt-2">
                    <div className="grid gap-4 pl-4 border-l-2 border-accent/30">
                      <div className="flex flex-col gap-1.5">
                        <Label>교육 제목 (주제) *</Label>
                        <Input value={p.title} onChange={e => updatePeriod(p.id, 'title', e.target.value)} placeholder="예: EiE 교육 비전과 핵심 가치" required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>유튜브 링크 URL *</Label>
                        <Input value={p.youtubeUrl} onChange={e => updatePeriod(p.id, 'youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
                      </div>
                    </div>

                    <div className="flex justify-center -my-2"><ArrowDown className="w-5 h-5 text-muted-foreground/30" /></div>

                    <div className="grid gap-4 pl-4 border-l-2 border-primary/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-primary flex items-center gap-2"><Settings className="w-4 h-4"/> 평가 문제 (엑셀 업로드)</h4>
                        <div className="relative overflow-hidden inline-block">
                          <Button type="button" variant="outline" size="sm" className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                            <Upload className="w-4 h-4"/> 엑셀 문제 일괄 등록
                          </Button>
                          <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleExcelUpload(p.id, e)}
                          />
                        </div>
                      </div>
                      
                      {p.questions.length === 0 ? (
                        <div className="bg-muted/30 border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                          <p className="mb-2">아직 등록된 문제가 없습니다.</p>
                          <p className="text-xs">엑셀 양식: A열(문제지문), B~E열(보기1~4), F열(정답번호 1~4)</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4"/> 총 {p.questions.length}개의 문제가 로드되었습니다.
                          </div>
                          <div className="max-h-64 overflow-y-auto pr-2 flex flex-col gap-2">
                            {p.questions.map((q, qIdx) => (
                              <div key={q.id} className="text-xs border rounded p-3 bg-muted/20">
                                <p className="font-bold mb-1">Q{qIdx+1}. {q.text}</p>
                                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={Number(q.correctIndex) === oIdx ? 'text-primary font-bold' : ''}>
                                      {oIdx+1}) {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={loading}>
          {loading ? '생성 중...' : '교육 신규 생성하기'}
        </Button>
      </form>
    </div>
  )
}
