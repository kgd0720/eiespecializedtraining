'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const user = { id: '00000000-0000-0000-0000-000000000000' }

    const { data, error } = await supabase.from('courses').insert({
      title,
      description: description || null,
      passing_score: passingScore,
      thumbnail_url: thumbnailUrl || null,
      is_published: false,
      created_by: user.id,
    }).select().single()

    if (error) { setError(error.message); setLoading(false); return }

    router.push(`/admin/courses/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/admin/courses" className="text-xs text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> 강좌 목록으로
      </Link>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">새 강좌 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">강좌 제목 *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: EiE 교육 방법론" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">강좌 설명</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="강좌에 대한 간략한 설명을 입력하세요" rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
              <Input id="thumbnailUrl" type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passingScore">합격 기준 점수 (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">테스트에서 이 점수 이상을 받으면 수료증이 발급됩니다.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '생성 중...' : '강좌 만들기'}
              </Button>
              <Link href="/admin/courses">
                <Button type="button" variant="outline">취소</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
