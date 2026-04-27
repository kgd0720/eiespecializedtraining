import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 인증 절차 제거됨: 바로 통과시킴
  return NextResponse.next({ request })
}
