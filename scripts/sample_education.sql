-- 샘플 교육 데이터 자동 생성 스크립트
-- Supabase SQL Editor에서 이 스크립트를 실행하면 샘플 교육(1교시, 2교시, 문제 포함)이 자동 생성됩니다.

DO $$
DECLARE
  new_course_id UUID := gen_random_uuid();
  new_session_id UUID := gen_random_uuid();
  lesson1_id UUID := gen_random_uuid();
  lesson2_id UUID := gen_random_uuid();
BEGIN
  -- 1. 과정(Course) 생성
  INSERT INTO public.courses (id, title, description, passing_score, is_published, evaluation_type, created_at, updated_at)
  VALUES (
    new_course_id,
    '2026년 5월 신임 원장 필수 교육',
    '통합 교육 과정',
    70,
    true,
    'lesson',
    NOW(),
    NOW()
  );

  -- 2. 세션(Session, 교육기간) 생성
  INSERT INTO public.sessions (id, course_id, title, apply_start, apply_end, train_start, train_end, is_active, created_at, updated_at)
  VALUES (
    new_session_id,
    new_course_id,
    '2026년 5월 신임 원장 필수 교육',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    true,
    NOW(),
    NOW()
  );

  -- 3. 1교시(Lesson 1) 생성
  INSERT INTO public.lessons (id, course_id, title, youtube_url, sort_order, duration_seconds, created_at, updated_at)
  VALUES (
    lesson1_id,
    new_course_id,
    '1교시. EiE 브랜드 스토리와 비전',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    1,
    600,
    NOW(),
    NOW()
  );

  -- 4. 2교시(Lesson 2) 생성
  INSERT INTO public.lessons (id, course_id, title, youtube_url, sort_order, duration_seconds, created_at, updated_at)
  VALUES (
    lesson2_id,
    new_course_id,
    '2교시. 효율적인 캠퍼스 운영 노하우',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    2,
    600,
    NOW(),
    NOW()
  );

  -- 5. 1교시 문제 생성 (2문제)
  INSERT INTO public.questions (lesson_id, question_text, question_type, options, correct_answer, points, sort_order, created_at)
  VALUES 
    (lesson1_id, 'EiE 브랜드가 가장 중요하게 생각하는 핵심 가치는 무엇입니까?', 'multiple_choice', ARRAY['매출 증대', '원생들의 창의적 사고', '단순 암기력', '빠른 진도'], '원생들의 창의적 사고', 10, 1, NOW()),
    (lesson1_id, '브랜드 스토리 강연에서 언급된 설립 연도는 언제입니까?', 'multiple_choice', ARRAY['2000년', '2010년', '2020년', '2025년'], '2010년', 10, 2, NOW());

  -- 6. 2교시 문제 생성 (1문제)
  INSERT INTO public.questions (lesson_id, question_text, question_type, options, correct_answer, points, sort_order, created_at)
  VALUES 
    (lesson2_id, '효율적인 캠퍼스 운영을 위해 가장 먼저 해야 할 일은 무엇입니까?', 'multiple_choice', ARRAY['광고비 증액', '학부모 소통 강화', '무작정 강사 채용', '인테리어 공사'], '학부모 소통 강화', 10, 1, NOW());

END $$;
