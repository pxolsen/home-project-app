create extension if not exists pgcrypto;

create type project_status as enum ('Idea', 'Quoted', 'Scheduled', 'In progress', 'Done');
create type project_priority as enum ('Urgent', 'Soon', 'Someday');
create type execution_type as enum ('DIY', 'Professional');
create type attachment_type as enum ('Receipt', 'Warranty', 'Permit', 'Quote', 'Photo', 'Other');
create type home_member_role as enum ('owner', 'editor', 'viewer');
create type vendor_rating as enum ('Would hire again', 'Maybe', 'Do not hire again');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  built_year integer,
  square_feet integer,
  style text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.home_members (
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role home_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  title text not null,
  category text not null,
  priority project_priority not null default 'Soon',
  status project_status not null default 'Idea',
  execution_type execution_type not null default 'DIY',
  estimate numeric(12, 2) not null default 0,
  actual numeric(12, 2),
  timing text not null default '',
  owner text not null default '',
  notes text,
  selected_contractor_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  trade text not null default '',
  contact text not null default '',
  quoted_amount numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add constraint projects_selected_contractor_id_fkey
  foreign key (selected_contractor_id)
  references public.contractors(id)
  on delete set null
  deferrable initially deferred;

create table public.history_records (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  title text not null,
  category text not null,
  completed_date text not null,
  amount numeric(12, 2) not null default 0,
  execution_type execution_type not null default 'Professional',
  contractor text not null default '',
  notes text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  history_record_id uuid references public.history_records(id) on delete cascade,
  name text not null,
  type attachment_type not null default 'Other',
  notes text,
  storage_path text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attachments_single_parent check (
    (project_id is not null and history_record_id is null)
    or (project_id is null and history_record_id is not null)
  )
);

create table public.trusted_vendors (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  name text not null,
  trade text not null default '',
  note text not null default '',
  rating vendor_rating not null default 'Maybe',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_members_user_id_idx on public.home_members(user_id);
create index projects_home_id_idx on public.projects(home_id);
create index contractors_project_id_idx on public.contractors(project_id);
create index history_records_home_id_idx on public.history_records(home_id);
create index attachments_home_id_idx on public.attachments(home_id);
create index attachments_project_id_idx on public.attachments(project_id);
create index attachments_history_record_id_idx on public.attachments(history_record_id);
create index trusted_vendors_home_id_idx on public.trusted_vendors(home_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger homes_set_updated_at
before update on public.homes
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger contractors_set_updated_at
before update on public.contractors
for each row execute function public.set_updated_at();

create trigger history_records_set_updated_at
before update on public.history_records
for each row execute function public.set_updated_at();

create trigger attachments_set_updated_at
before update on public.attachments
for each row execute function public.set_updated_at();

create trigger trusted_vendors_set_updated_at
before update on public.trusted_vendors
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_home_member(target_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.home_members
    where home_members.home_id = target_home_id
      and home_members.user_id = auth.uid()
  );
$$;

create function public.can_edit_home(target_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.home_members
    where home_members.home_id = target_home_id
      and home_members.user_id = auth.uid()
      and home_members.role in ('owner', 'editor')
  );
$$;

create function public.is_home_owner(target_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.home_members
    where home_members.home_id = target_home_id
      and home_members.user_id = auth.uid()
      and home_members.role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.homes enable row level security;
alter table public.home_members enable row level security;
alter table public.projects enable row level security;
alter table public.contractors enable row level security;
alter table public.history_records enable row level security;
alter table public.attachments enable row level security;
alter table public.trusted_vendors enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can create homes"
on public.homes for insert
with check (created_by = auth.uid());

create policy "Members can read homes"
on public.homes for select
using (public.is_home_member(id) or created_by = auth.uid());

create policy "Home editors can update homes"
on public.homes for update
using (public.can_edit_home(id) or created_by = auth.uid())
with check (public.can_edit_home(id) or created_by = auth.uid());

create policy "Home owners can delete homes"
on public.homes for delete
using (public.is_home_owner(id) or created_by = auth.uid());

create policy "Members can read memberships"
on public.home_members for select
using (public.is_home_member(home_id));

create policy "Users can create their initial owner membership"
on public.home_members for insert
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.homes
    where homes.id = home_members.home_id
      and homes.created_by = auth.uid()
  )
);

create policy "Owners can manage memberships"
on public.home_members for all
using (public.is_home_owner(home_id))
with check (public.is_home_owner(home_id));

create policy "Home members can read projects"
on public.projects for select
using (public.is_home_member(home_id));

create policy "Home editors can create projects"
on public.projects for insert
with check (created_by = auth.uid() and public.can_edit_home(home_id));

create policy "Home editors can update projects"
on public.projects for update
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "Home editors can delete projects"
on public.projects for delete
using (public.can_edit_home(home_id));

create policy "Home members can read contractors"
on public.contractors for select
using (
  exists (
    select 1
    from public.projects
    where projects.id = contractors.project_id
      and public.is_home_member(projects.home_id)
  )
);

create policy "Home editors can create contractors"
on public.contractors for insert
with check (
  exists (
    select 1
    from public.projects
    where projects.id = contractors.project_id
      and public.can_edit_home(projects.home_id)
  )
);

create policy "Home editors can update contractors"
on public.contractors for update
using (
  exists (
    select 1
    from public.projects
    where projects.id = contractors.project_id
      and public.can_edit_home(projects.home_id)
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = contractors.project_id
      and public.can_edit_home(projects.home_id)
  )
);

create policy "Home editors can delete contractors"
on public.contractors for delete
using (
  exists (
    select 1
    from public.projects
    where projects.id = contractors.project_id
      and public.can_edit_home(projects.home_id)
  )
);

create policy "Home members can read history records"
on public.history_records for select
using (public.is_home_member(home_id));

create policy "Home editors can create history records"
on public.history_records for insert
with check (created_by = auth.uid() and public.can_edit_home(home_id));

create policy "Home editors can update history records"
on public.history_records for update
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "Home editors can delete history records"
on public.history_records for delete
using (public.can_edit_home(home_id));

create policy "Home members can read attachments"
on public.attachments for select
using (public.is_home_member(home_id));

create policy "Home editors can create attachments"
on public.attachments for insert
with check (created_by = auth.uid() and public.can_edit_home(home_id));

create policy "Home editors can update attachments"
on public.attachments for update
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "Home editors can delete attachments"
on public.attachments for delete
using (public.can_edit_home(home_id));

create policy "Home members can read trusted vendors"
on public.trusted_vendors for select
using (public.is_home_member(home_id));

create policy "Home editors can create trusted vendors"
on public.trusted_vendors for insert
with check (created_by = auth.uid() and public.can_edit_home(home_id));

create policy "Home editors can update trusted vendors"
on public.trusted_vendors for update
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "Home editors can delete trusted vendors"
on public.trusted_vendors for delete
using (public.can_edit_home(home_id));

insert into storage.buckets (id, name, public)
values ('home-attachments', 'home-attachments', false)
on conflict (id) do nothing;

create policy "Home members can read attachment files"
on storage.objects for select
using (
  bucket_id = 'home-attachments'
  and exists (
    select 1
    from public.attachments
    where attachments.storage_path = storage.objects.name
      and public.is_home_member(attachments.home_id)
  )
);

create policy "Signed in users can upload attachment files"
on storage.objects for insert
with check (
  bucket_id = 'home-attachments'
  and auth.uid() is not null
);

create policy "Home editors can update attachment files"
on storage.objects for update
using (
  bucket_id = 'home-attachments'
  and exists (
    select 1
    from public.attachments
    where attachments.storage_path = storage.objects.name
      and public.can_edit_home(attachments.home_id)
  )
);

create policy "Home editors can delete attachment files"
on storage.objects for delete
using (
  bucket_id = 'home-attachments'
  and exists (
    select 1
    from public.attachments
    where attachments.storage_path = storage.objects.name
      and public.can_edit_home(attachments.home_id)
  )
);
