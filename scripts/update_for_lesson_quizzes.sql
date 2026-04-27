-- 1. questions 테이블에 lesson_id 외래키 추가
-- 기존에는 quiz_id 에 종속되었으나, 차시별 문제 구조로 변경되면서 lesson_id 가 필요해짐.
-- 기존 퀴즈 구조와의 하위 호환성을 위해 quiz_id 는 nullable 로 변경 (또는 그대로 두고 새로 추가)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;

-- 2. quiz_id 를 필수가 아니도록 변경 (선택적)
ALTER TABLE public.questions ALTER COLUMN quiz_id DROP NOT NULL;
