-- 1. courses 테이블에 평가 관련 세부 설정 컬럼 추가
-- 평가 방식: 'final' (과정 종료형), 'lesson' (차시별 평가형), 'mixed' (혼합형)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS evaluation_type TEXT DEFAULT 'final';

-- 재응시 횟수 제한 (null 이면 무제한)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT NULL;

-- 오답 시 재수강 여부
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS retake_on_fail BOOLEAN DEFAULT false;

-- 출제할 문제 수
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS question_count INT DEFAULT 10;

-- 문제 유형: 'multiple_choice' (객관식), 'short_answer' (주관식), 'mixed' (혼합)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'mixed';

-- (참고) 합격 점수는 이미 passing_score 로 존재합니다.
