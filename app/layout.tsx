import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: 'EiE Education — 강사 연수 플랫폼',
  description: 'EiE Education 강사를 위한 온라인 연수 플랫폼. 영상 강의 시청, 테스트 응시, 수료증 발급.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
