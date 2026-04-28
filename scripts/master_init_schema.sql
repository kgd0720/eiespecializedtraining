-- EiE Education: Master Schema Initialization
-- 빈 Supabase 프로젝트에 필요한 모든 테이블을 한 번에 생성하고 권한을 열어주는 통합 스크립트입니다.

-- 1. COURSES 테이블
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  passing_score INTEGER NOT NULL DEFAULT 70,
  evaluation_type TEXT DEFAULT 'lesson',
  max_retries INTEGER DEFAULT NULL,
  retake_on_fail BOOLEAN DEFAULT true,
  question_count INTEGER DEFAULT 0,
  question_type TEXT DEFAULT 'multiple_choice',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SESSIONS 테이블 (회차/교육)
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

-- 3. APPLICATIONS 테이블 (수강생 신청내역)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  english_name TEXT,
  phone TEXT NOT NULL,
  campus TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  token TEXT UNIQUE,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LESSONS 테이블 (교시/영상)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. QUESTIONS 테이블 (엑셀 문제)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB DEFAULT NULL,
  correct_answer TEXT DEFAULT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CERTIFICATES 테이블 (수료증)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- UUID from applications.id
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_number TEXT NOT NULL UNIQUE
);

-- 7. SMS LOGS 테이블 (문자 발송 내역)
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- RLS(보안 정책) 전면 비활성화 (로그인 없는 관리자/수강생 운영을 위함)
-- ========================================================
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs DISABLE ROW LEVEL SECURITY;

-- 테이블 생성이 완료되었습니다.
