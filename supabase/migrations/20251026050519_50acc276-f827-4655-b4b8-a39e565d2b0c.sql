-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create contests table
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contests are viewable by everyone" 
  ON public.contests FOR SELECT 
  USING (true);

-- Create problems table
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Problems are viewable by everyone" 
  ON public.problems FOR SELECT 
  USING (true);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  output TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" 
  ON public.submissions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" 
  ON public.submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create leaderboard view function
CREATE OR REPLACE FUNCTION public.get_contest_leaderboard(contest_id_param UUID)
RETURNS TABLE (
  username TEXT,
  total_score BIGINT,
  user_id UUID
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    p.username,
    COALESCE(SUM(s.score), 0) as total_score,
    p.user_id
  FROM public.profiles p
  LEFT JOIN public.submissions s ON p.user_id = s.user_id 
    AND s.contest_id = contest_id_param 
    AND s.status = 'Accepted'
  GROUP BY p.user_id, p.username
  ORDER BY total_score DESC
  LIMIT 50;
$$;

-- Trigger to update profile total_score
CREATE OR REPLACE FUNCTION public.update_user_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Accepted' THEN
    UPDATE public.profiles
    SET total_score = total_score + NEW.score
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_score_on_submission
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_score();

-- Insert sample contest and problems
INSERT INTO public.contests (id, name, description, start_time, end_time) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Shodh-a-Code Demo Contest',
  'Welcome to the demo contest! Solve problems and climb the leaderboard.',
  NOW(),
  NOW() + INTERVAL '7 days'
) ON CONFLICT DO NOTHING;

INSERT INTO public.problems (contest_id, title, description, test_cases, score) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  '[{"input":"[2,7,11,15], 9","expectedOutput":"[0,1]"},{"input":"[3,2,4], 6","expectedOutput":"[1,2]"}]'::jsonb,
  100
),
(
  '00000000-0000-0000-0000-000000000001',
  'Reverse String',
  'Write a function that reverses a string. The input string is given as an array of characters.',
  '[{"input":"[\"h\",\"e\",\"l\",\"l\",\"o\"]","expectedOutput":"[\"o\",\"l\",\"l\",\"e\",\"h\"]"},{"input":"[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]","expectedOutput":"[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"}]'::jsonb,
  150
),
(
  '00000000-0000-0000-0000-000000000001',
  'Palindrome Number',
  'Given an integer x, return true if x is a palindrome, and false otherwise.',
  '[{"input":"121","expectedOutput":"true"},{"input":"-121","expectedOutput":"false"},{"input":"10","expectedOutput":"false"}]'::jsonb,
  200
) ON CONFLICT DO NOTHING;