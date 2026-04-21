'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    
    // Handle shorthand ID: if no @ is present, append @eie.com
    const finalEmail = email.includes('@') ? email : `${email}@eie.com`
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: finalEmail, 
      password 
    })

    if (error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground leading-none">EiE Education</div>
            <div className="text-xs text-muted-foreground mt-0.5">강사 연수 플랫폼</div>
          </div>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              아이디와 비밀번호를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">아이디</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={email}
                  onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12)
                    setEmail(val)
                  }}
                  maxLength={12}
                  pattern="[A-Za-z0-9]{1,12}"
                  title="최대 12자리의 영문과 숫자로만 입력해주세요"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12)
                    setPassword(val)
                  }}
                  maxLength={12}
                  pattern="[A-Za-z0-9]{1,12}"
                  title="최대 12자리의 영문과 숫자로만 입력해주세요"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/auth/sign-up" className="text-primary font-medium hover:underline">
                회원가입
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
