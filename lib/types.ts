export type UserRole = 'instructor' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  passing_score: number
  evaluation_type: 'final' | 'lesson' | 'mixed'
  max_retries: number | null
  retake_on_fail: boolean
  question_count: number
  question_type: 'multiple_choice' | 'short_answer' | 'mixed'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  youtube_url: string
  sort_order: number
  duration_seconds: number
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string | null
  passing_score: number
  time_limit_minutes: number | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  quiz_id: string | null
  lesson_id: string | null
  question_text: string
  question_type: 'multiple_choice' | 'short_answer'
  options: string[] | null
  correct_answer: string | null
  points: number
  sort_order: number
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  answers: Record<string, string>
  score: number | null
  max_score: number | null
  passed: boolean | null
  submitted_at: string | null
  created_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  quiz_attempt_id: string | null
  issued_at: string
  certificate_number: string
}

export interface Session {
  id: string
  course_id: string
  title: string
  apply_start: string
  apply_end: string
  train_start: string
  train_end: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  session_id: string
  name: string
  english_name: string | null
  phone: string
  campus: string
  status: 'pending' | 'approved' | 'rejected'
  token: string | null
  fail_count: number
  created_at: string
  updated_at: string
}

export interface SmsLog {
  id: string
  application_id: string | null
  phone: string
  status: string
  message_content: string | null
  sent_at: string
}
