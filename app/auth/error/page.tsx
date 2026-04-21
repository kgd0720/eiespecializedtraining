import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">인증 오류</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              인증 과정에서 문제가 발생했습니다. 다시 시도해 주세요.
            </p>
          </div>
          <Link href="/auth/login">
            <Button>로그인으로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
