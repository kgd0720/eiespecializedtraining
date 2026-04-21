'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

export function TogglePublishButton({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('courses').update({ is_published: !isPublished }).eq('id', courseId)
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={loading} className="gap-1.5 text-muted-foreground hover:text-foreground">
      {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      {isPublished ? '비공개' : '게시'}
    </Button>
  )
}
