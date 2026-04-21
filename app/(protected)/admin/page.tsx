import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Award, FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: courseCount },
    { count: userCount },
    { count: certCount },
    { count: enrollCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: '전체 강좌', value: courseCount ?? 0, icon: BookOpen, href: '/admin/courses', color: 'text-primary' },
    { label: '강사 수', value: userCount ?? 0, icon: Users, href: '/admin/users', color: 'text-accent' },
    { label: '총 수강 등록', value: enrollCount ?? 0, icon: FileQuestion, href: '/admin/users', color: 'text-muted-foreground' },
    { label: '발급 수료증', value: certCount ?? 0, icon: Award, href: '/admin/users', color: 'text-yellow-600' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-1">강좌, 강사, 수료 현황을 관리합니다.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">강좌 관리</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">강좌를 추가, 수정하고 강의와 퀴즈를 관리합니다.</p>
            <Link href="/admin/courses">
              <Button size="sm">강좌 관리하기</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">수강생 관리</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">강사 목록과 수강 현황, 수료 여부를 확인합니다.</p>
            <Link href="/admin/users">
              <Button size="sm" variant="outline">수강생 보기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
