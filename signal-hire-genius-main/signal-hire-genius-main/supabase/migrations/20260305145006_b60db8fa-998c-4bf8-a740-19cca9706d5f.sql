
-- Create table for job descriptions
CREATE TABLE public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  raw_text TEXT NOT NULL,
  parsed_role TEXT,
  parsed_seniority TEXT,
  parsed_skills TEXT[],
  parsed_domain TEXT,
  parsed_responsibilities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for generated questions
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jd_id UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'scenario',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for candidates
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  jd_id UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken_seconds INTEGER,
  score INTEGER,
  status TEXT DEFAULT 'Reviewing',
  ai_analysis TEXT,
  strengths TEXT[],
  recommendation TEXT
);

-- Create table for candidate answers
CREATE TABLE public.candidate_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  individual_score INTEGER,
  individual_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_answers ENABLE ROW LEVEL SECURITY;

-- Public read/write policies
CREATE POLICY "Public access to job_descriptions" ON public.job_descriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to candidate_answers" ON public.candidate_answers FOR ALL USING (true) WITH CHECK (true);
