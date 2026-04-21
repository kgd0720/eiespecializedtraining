'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEnroll() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full md:w-auto">
      {loading ? '등록 중...' : '수강 등록하기'}
    </Button>
  )
}
