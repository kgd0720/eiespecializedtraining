import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">EiE specialized training</span>
        </div>
        <nav>
          <Link href="/dashboard">
            <Button variant="ghost" className="font-medium">대시보드 입장</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-20 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-8 border border-primary/20">
          <span>새로운 교육 경험</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mb-6 leading-[1.1]">
          성장을 위한 최고의 선택, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
            EiE 강사 연수 플랫폼
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          언제 어디서나 쉽고 빠르게. 직관적인 동영상 학습과 체계적인 평가 시스템으로 강사님의 역량을 한 단계 높여보세요.
        </p>

        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-lg hover:shadow-xl transition-all group">
            학습 시작하기
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
      </main>
    </div>
  )
}
