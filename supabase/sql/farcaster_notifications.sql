create table if not exists public.farcaster_notifications (
  fid bigint primary key,
  notification_id text not null,
  updated_at timestamptz not null default now()
);

-- If you enable RLS in your project, prefer a service-role policy or keep RLS disabled for this table.



