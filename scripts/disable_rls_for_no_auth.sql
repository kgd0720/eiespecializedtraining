-- 로그인(인증) 절차를 생략하고 고유 접속 토큰으로 운영하도록 개편되면서,
-- Supabase의 기본 보안 정책(RLS - 로그인한 사용자만 쓰기 가능)이 활성화되어 있어
-- 데이터베이스 저장이 차단되는(Course creation error: {}) 오류를 해결하는 스크립트입니다.

-- Supabase SQL Editor에서 아래 스크립트를 전부 복사하여 실행(Run)해 주세요.

ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs DISABLE ROW LEVEL SECURITY;
