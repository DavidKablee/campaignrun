-- Campaign Run API schema.
--
-- Two guardrails are enforced here, not only in application code:
--   * A Contender choice is sensitive (guardrail 10). `scores.contender_id` is
--     nullable and is only ever written for a player who has consented; the
--     standings query reads nothing else.
--   * Deleting an account must actually delete the play history, so every
--     child row cascades from `users`.

create extension if not exists "pgcrypto";

create table if not exists users (
  id                   uuid primary key default gen_random_uuid(),
  -- stored lower-cased; the unique index is therefore case-insensitive
  email                text        not null unique,
  username             text        not null unique,
  password_hash        text        not null,
  password_salt        text        not null,
  -- set when the player accepts the C11 Contender-sharing consent, null otherwise
  contender_consent_at timestamptz,
  legal_version        text,
  created_at           timestamptz not null default now(),
  last_seen_at         timestamptz not null default now()
);

create table if not exists sessions (
  -- the raw token only ever exists in the player's cookie
  token_hash text        primary key,
  user_id    uuid        not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expiry_idx on sessions (expires_at);

create table if not exists scores (
  id           bigserial   primary key,
  user_id      uuid        not null references users (id) on delete cascade,
  state_id     text        not null,
  crowd        integer     not null check (crowd >= 0 and crowd <= 100000),
  delivered    integer     not null default 0 check (delivered >= 0),
  dents        integer     not null default 0 check (dents >= 0),
  integrity    integer     not null default 0,
  capacity     integer     not null default 0,
  ride_id      text        not null,
  -- null unless the player consented to share their Contender (guardrail 10)
  contender_id text,
  created_at   timestamptz not null default now()
);
create index if not exists scores_board_idx on scores (state_id, crowd desc);
create index if not exists scores_user_idx on scores (user_id, state_id);
create index if not exists scores_standings_idx on scores (state_id, contender_id) where contender_id is not null;

-- C41 ----------------------------------------------------------------------
-- Email verification and password reset. A player who cannot reset a password
-- is locked out of their campaign permanently, and an unverified address
-- cannot be used to prove that a support request comes from the account
-- holder, so both are table stakes rather than polish.

alter table users add column if not exists email_verified_at timestamptz;

-- One table for both kinds of link. The raw token only ever exists in the
-- email; what is stored here is its SHA-256, the same treatment as a session.
create table if not exists email_tokens (
  token_hash text        primary key,
  user_id    uuid        not null references users (id) on delete cascade,
  kind       text        not null check (kind in ('verify', 'reset')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- set the moment it is spent; a link works exactly once
  used_at    timestamptz
);
create index if not exists email_tokens_user_idx on email_tokens (user_id, kind);
create index if not exists email_tokens_expiry_idx on email_tokens (expires_at);

-- Per-address login throttle. The in-process limiter is keyed on IP, which an
-- attacker rotates for free; this one follows the account being attacked.
create table if not exists login_throttle (
  email          text        primary key,
  failures       integer     not null default 0,
  locked_until   timestamptz,
  last_failed_at timestamptz not null default now()
);

-- C42 ----------------------------------------------------------------------
-- Name-only accounts.
--
-- A player can start with nothing but a board name. That account is real — it
-- lives on the server and its runs are saved — but it is reachable only from
-- the device that created it, because the only credential is a random key held
-- in that device's storage. There is no password to type and no address to
-- send a link to, so there is nothing a second device could present.
--
-- That is the honest shape of "just a name", and it is why the client asks for
-- an email later: adding one is what turns a device-bound account into an
-- account. Until then `email_verified_at` stays null, so `standings.ts` keeps
-- these runs off the public boards for free — which matters, because a
-- name-only account costs one POST and the privacy floor is what a cheap
-- account would otherwise walk through.

alter table users alter column email drop not null;
alter table users alter column password_hash drop not null;
alter table users alter column password_salt drop not null;

-- When the player may next be asked for an email, and how many times they have
-- said "not now". On the server rather than the device so the ladder cannot be
-- reset by clearing site data, and so the decision is testable.
alter table users add column if not exists email_prompt_after timestamptz;

-- C89: the one Mobilise-only opt-in. A player who says yes lets the people in their room see their
-- Contender's character. It is a separate choice from `contender_consent_at` (the map-colouring consent):
-- different purpose, different audience. null = plain citizen. `mobilise_asked_at` records that the
-- one-time question was answered, either way, so it is not asked again.
alter table users add column if not exists mobilise_contender_id text;
alter table users add column if not exists mobilise_asked_at timestamptz;
alter table users add column if not exists email_prompt_dismissals integer not null default 0;

-- One row per device holding a key for a name-only account. Hashed exactly
-- like a session token: the raw key only ever exists in that device's storage.
create table if not exists device_keys (
  key_hash     text        primary key,
  user_id      uuid        not null references users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
create index if not exists device_keys_user_idx on device_keys (user_id);

-- Replay verification ------------------------------------------------------
-- The seed of the run a score was verified against. A verified run can be
-- posted once: the same receipt twice would count twice in a region's
-- standing. Null for scores posted before replays, or with the check off.
alter table scores add column if not exists replay_seed bigint;
create unique index if not exists scores_replay_once on scores (user_id, replay_seed) where replay_seed is not null;

-- C78 ----------------------------------------------------------------------
-- Anonymous usage counters and state corrections.
--
-- Neither table has a user, a device, a session or an address in it. A counter row is
-- "this many of this event, on this day, for this state" and nothing finer; a correction is
-- a note about a state's world with no way back to who wrote it. That is the point: the funnel
-- (visit -> run -> share -> challenge opened) and the reviewer list both need only totals.

create table if not exists event_counts (
  day      date   not null,
  name     text   not null,
  -- '' for events that are not about a state
  state_id text   not null default '',
  n        bigint not null default 0 check (n >= 0),
  primary key (day, name, state_id)
);

create table if not exists state_feedback (
  id         bigserial   primary key,
  state_id   text        not null,
  landmark   text        not null default '',
  topic      text        not null,
  note       text        not null default '',
  from_here  boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists state_feedback_state_idx on state_feedback (state_id, created_at desc);

-- C82 ----------------------------------------------------------------------
-- Mobilise: what a player has earned from campaign places today (Lagos day), so the daily caps hold
-- across tabs and devices, and the state activity the Board shows. Presence itself (who is standing
-- where) is in process memory and never stored; chat is preset ids and is not stored at all.

create table if not exists place_daily (
  user_id    uuid    not null references users (id) on delete cascade,
  day        date    not null,
  coins      integer not null default 0 check (coins >= 0),
  supporters integer not null default 0 check (supporters >= 0),
  actions    integer not null default 0 check (actions >= 0),
  primary key (user_id, day)
);

create table if not exists place_activity (
  state_id text    not null,
  day      date    not null,
  points   bigint  not null default 0 check (points >= 0),
  primary key (state_id, day)
);

-- A report is a reason from a closed list about a board name in a room. No free text, no chat log.
create table if not exists place_reports (
  id          bigserial   primary key,
  reporter_id uuid        references users (id) on delete set null,
  reported_id uuid        references users (id) on delete set null,
  place_key   text        not null,
  reason      text        not null,
  created_at  timestamptz not null default now()
);
