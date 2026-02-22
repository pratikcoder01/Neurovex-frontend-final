-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Study Sessions Table
create table public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  start_time timestamptz default now(),
  end_time timestamptz,
  average_focus integer,
  focus_trend text check (focus_trend in ('improving', 'stable', 'declining')),
  total_fatigue_events integer default 0,
  config jsonb -- Store session configuration
);

-- 2. EEG Band Logs (Time-series data)
create table public.eeg_band_logs (
  id bigint generated always as identity primary key,
  session_id uuid references public.study_sessions(id) not null,
  timestamp timestamptz default now(),
  delta float,
  theta float,
  alpha float,
  beta float,
  gamma float,
  signal_quality float
);

-- 3. AI Insights
create table public.ai_insights (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.study_sessions(id) not null,
  timestamp timestamptz default now(),
  pattern_type text check (pattern_type in ('focus', 'fatigue', 'stress', 'relax')),
  confidence_score float,
  reason_text text,
  eeg_bands_used jsonb
);

-- 4. Hardware Logs (Audit Trail)
create table public.hardware_logs (
  id bigint generated always as identity primary key,
  session_id uuid references public.study_sessions(id),
  timestamp timestamptz default now(),
  device_type text check (device_type in ('bulb', 'car')),
  action text,
  mode text check (mode in ('manual', 'auto')),
  trigger_focus_level integer
);

-- 5. User Annotations (Notes)
create table public.user_annotations (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.study_sessions(id) not null,
  note_text text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.study_sessions enable row level security;
alter table public.eeg_band_logs enable row level security;
alter table public.ai_insights enable row level security;
alter table public.hardware_logs enable row level security;
alter table public.user_annotations enable row level security;

-- Policies (Users can only see their own data)
create policy "Users can view own sessions" on public.study_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own sessions" on public.study_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on public.study_sessions
  for update using (auth.uid() = user_id);

-- EEG Logs Policy (Cascade via session ownership)
create policy "Users can view own eeg logs" on public.eeg_band_logs
  for select using (
    exists (
      select 1 from public.study_sessions
      where id = public.eeg_band_logs.session_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert own eeg logs" on public.eeg_band_logs
  for insert with check (
    exists (
      select 1 from public.study_sessions
      where id = public.eeg_band_logs.session_id
      and user_id = auth.uid()
    )
  );
