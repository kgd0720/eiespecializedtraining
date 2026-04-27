'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Users,
  Award,
  BarChart,
  Plus
} from 'lucide-react'
import type { Profile } from '@/lib/types'

interface AppSidebarProps {
  profile: Profile | null
}

const adminNav = [
  { href: '/admin/sessions', label: '교육 관리', icon: BookOpen },
  { href: '/admin/sessions/create', label: '교육 생성', icon: Plus },
  { href: '/admin/applications', label: '회원 리스트', icon: Users },
  { href: '/admin/certificates', label: '수료증 관리', icon: Award },
  { href: '/admin/stats', label: '통계', icon: BarChart },
]

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()

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
            <div className="text-[10px] text-sidebar-primary mt-0.5">통합 관리 시스템</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1" aria-label="주요 메뉴">
        {adminNav.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
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
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-sidebar-foreground">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-sidebar-foreground truncate">
              {profile?.full_name ?? '최고 관리자'}
            </div>
            <div className="text-[10px] text-sidebar-primary truncate">
              운영 계정
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
