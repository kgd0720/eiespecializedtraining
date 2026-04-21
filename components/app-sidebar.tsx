'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

interface AppSidebarProps {
  profile: Profile | null
}

const instructorNav = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/courses', label: '수강 목록', icon: BookOpen },
  { href: '/certificate', label: '내 수료증', icon: Award },
]

const adminNav = [
  { href: '/admin', label: '관리자 홈', icon: Shield },
  { href: '/admin/courses', label: '강좌 관리', icon: BookOpen },
  { href: '/admin/users', label: '수강생 관리', icon: GraduationCap },
]

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navItems = isAdmin ? [...instructorNav, ...adminNav] : instructorNav

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-sidebar text-sidebar-foreground min-h-screen">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground leading-none">EiE Education</div>
            <div className="text-[10px] text-sidebar-primary mt-0.5">강사 연수 플랫폼</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1" aria-label="주요 메뉴">
        {isAdmin && (
          <div className="px-2 pt-1 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-primary opacity-60">강사</span>
          </div>
        )}
        {instructorNav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="px-2 pt-3 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-primary opacity-60">관리자</span>
            </div>
            {adminNav.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-sidebar-foreground">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-sidebar-foreground truncate">
              {profile?.full_name ?? '사용자'}
            </div>
            <div className="text-[10px] text-sidebar-primary truncate">
              {isAdmin ? '관리자' : '강사'}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 gap-2 px-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </Button>
      </div>
    </aside>
  )
}
