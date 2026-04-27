-- EiE Education: 회차 기반 교육 및 신청 시스템 스키마 생성 스크립트

-- 1. 회차(Sessions) 테이블
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  apply_start TIMESTAMPTZ NOT NULL,
  apply_end TIMESTAMPTZ NOT NULL,
  train_start TIMESTAMPTZ NOT NULL,
  train_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 신청(Applications) 테이블
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  english_name TEXT,
  phone TEXT NOT NULL,
  campus TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  token TEXT UNIQUE, -- 고유 접속 링크 토큰 (승인 시 생성)
  fail_count INT DEFAULT 0, -- 평가 미달 횟수 (2회 시 리셋을 위함)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 문자 발송 로그(SMS Logs) 테이블
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 기존 수강 테이블(enrollments)에 application 연동 (선택적)
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;

-- 5. RLS (Row Level Security) 설정 - 관리자만 접근 가능하도록 하거나 Public 에 오픈 (신청 폼 작성을 위해 insert 허용 등 필요)
-- 편의상 테스트를 위해 전체 허용으로 열거나, 실제 서비스 시에는 세밀한 정책 적용 필요.
-- 여기서는 기본적으로 Public Insert 허용 (신청 시)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read to applications by token" ON public.applications FOR SELECT USING (true); -- 토큰 조회를 위해 Select 허용
CREATE POLICY "Allow update to applications" ON public.applications FOR UPDATE USING (true); -- 토큰 기반 업데이트 허용

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read to sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow admin all on sessions" ON public.sessions USING (true);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to sms_logs" ON public.sms_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin all on sms_logs" ON public.sms_logs USING (true);
