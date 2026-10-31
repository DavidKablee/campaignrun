import { places } from '@cr/content';
import type { Db } from './db.ts';
import { hashTerm } from '../../packages/content/src/guardrails.ts';
import realNames from '../../packages/content/data/blocklist.hashes.json' with { type: 'json' };
import chatTerms from '../../packages/content/data/chat-terms.hashes.json' with { type: 'json' };

/**
 * C93: the rules for typed chat in Mobilise.
 *
 * Pure on purpose: text in, a verdict out, so every rule can be tested without a server. The word
 * filter is the same hashed approach as the Contender names (GUARDRAILS 12): real names come from
 * `blocklist.hashes.json`, abuse and scam terms from `chat-terms.hashes.json`, and neither plain list is
 * ever committed. Who may type, how long a message is kept and what happens after reports live in the
 * `chat` block of `places.json`.
 */

export type ChatRefusal = 'empty' | 'too-long' | 'links' | 'numbers' | 'flood' | 'repeat' | 'blocked';

export type ChatVerdict = { ok: true; text: string } | { ok: false; reason: ChatRefusal };

const NUMBER_WORDS = new Set(['zero', 'oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'nought']);

// Anything that looks like an address someone could be sent to: a scheme, "www", a bare domain on a common
// ending, a messenger short link, an @handle or email.
const LINK =
  /(https?:|www\.|@|\bt\.me\b|\bwa\.me\b|\bbit\.ly\b|\b[a-z0-9-]{2,}\s?\.\s?(com|ng|org|net|co|io|me|ly|gg|tv|app|xyz|info|biz|link|click|site|online|shop|ink)\b|\b(dot|d0t)\s?(com|ng|org|net)\b)/i;

export function defaultBlocked(): Set<string> {
  return new Set([...realNames.hashes, ...chatTerms.hashes]);
}

/** Collapse whitespace and odd width/compatibility forms so the rules see what a reader sees. */
export function tidy(raw: string): string {
  return raw
    .normalize('NFKC')
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when a hashed term appears as a word, a pair or triple of words, or letters spaced out. */
function hasBlockedTerm(text: string, hashes: Set<string>): boolean {
  if (hashes.size === 0) return false;
  // Edge punctuation is dropped first: the shared normaliser reads a trailing "!" as the letter i.
  const words = text
    .split(' ')
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= 3 && i + n <= words.length; n++) {
      if (hashes.has(hashTerm(words.slice(i, i + n).join(' ')))) return true;
    }
  }
  // "j o n" and "j.o.n": runs of single characters are joined and tested as one word.
  let run = '';
  for (const w of [...words, '']) {
    if (w.length === 1) run += w;
    else {
      if (run.length >= 3 && hashes.has(hashTerm(run))) return true;
      run = '';
    }
  }
  return false;
}

function looksLikeNumber(text: string): boolean {
  const digits = (text.match(/\d/g) ?? []).length;
  if (digits >= 7) return true;
  let streak = 0;
  for (const w of text.toLowerCase().split(/[^a-z]+/)) {
    streak = NUMBER_WORDS.has(w) ? streak + 1 : 0;
    if (streak >= 6) return true;
  }
  return false;
}

function isFlood(text: string): boolean {
  if (/(.)\1{4,}/u.test(text)) return true;
  if (/(\b.{1,6}\b)(\s+\1){3,}/iu.test(text)) return true;
  return text.length >= 12 && new Set(text.toLowerCase().replace(/\s/g, '')).size < 4;
}

/**
 * Judges one typed message. `last` is the sender's previous accepted message (to stop repeats).
 * The order is the order a person would explain a refusal in: empty, long, address, number, flood, word.
 */
export function checkText(raw: string, opts: { hashes?: Set<string>; last?: string | null } = {}): ChatVerdict {
  const text = tidy(raw);
  if (text.length === 0) return { ok: false, reason: 'empty' };
  if ([...text].length > places.chat.maxChars) return { ok: false, reason: 'too-long' };
  if (LINK.test(text)) return { ok: false, reason: 'links' };
  if (looksLikeNumber(text)) return { ok: false, reason: 'numbers' };
  if (isFlood(text)) return { ok: false, reason: 'flood' };
  if (opts.last && opts.last.toLowerCase() === text.toLowerCase()) return { ok: false, reason: 'repeat' };
  if (hasBlockedTerm(text, opts.hashes ?? defaultBlocked())) return { ok: false, reason: 'blocked' };
  return { ok: true, text };
}

export type ChatLock = 'off' | 'age' | 'job';

export interface ChatStatus {
  /** The server switch (`CR_CHAT_ENABLED`). */
  enabled: boolean;
  /** Whether this player may type right now. */
  canType: boolean;
  /** Why not, when they may not. */
  lock: ChatLock | null;
  maxChars: number;
  gapSeconds: number;
}

/** Account age and finished jobs decide who may type; the switch decides whether anyone may. */
export function statusFor(args: { enabled: boolean; accountAgeHours: number; jobsDone: number }): ChatStatus {
  const { chat } = places;
  const lock: ChatLock | null = !args.enabled
    ? 'off'
    : args.accountAgeHours < chat.minAccountHours
      ? 'age'
      : args.jobsDone < chat.minJobsDone
        ? 'job'
        : null;
  return { enabled: args.enabled, canType: lock === null, lock, maxChars: chat.maxChars, gapSeconds: chat.gapSeconds };
}

// ---- the service: who may type, what is kept, what reports do -------------------------------------

const HOUR = 3_600_000;
const MINUTE = 60_000;

/** Refusals that count as a strike: the sender tried something the rules exist to stop. */
const STRIKES: ReadonlySet<ChatRefusal> = new Set(['links', 'numbers', 'flood', 'blocked']);

export type SendResult =
  | { ok: true; text: string; shadow: boolean }
  | { ok: false; error: 'chat-locked'; lock: ChatLock }
  | { ok: false; error: 'rate-limited'; retryAfter: number }
  | { ok: false; error: 'refused'; reason: ChatRefusal };

export function createChat(deps: { database: Db; now: () => number; enabled?: () => boolean; hashes?: Set<string> }) {
  const { database, now } = deps;
  const enabled = deps.enabled ?? (() => process.env.CR_CHAT_ENABLED === 'true');
  const hashes = deps.hashes ?? defaultBlocked();
  const lastSent = new Map<string, { at: number; text: string }>();
  const strikes = new Map<string, number[]>();

  async function status(userId: string): Promise<ChatStatus> {
    const at = new Date(now());
    const [u, j] = await Promise.all([
      database.query<{ hours: number }>('select (extract(epoch from ($2::timestamptz - created_at)) / 3600)::float8 as hours from users where id = $1', [userId, at]),
      database.query<{ n: number }>(
        `select count(*)::int as n from place_jobs where user_id = $1 and done_at is not null and job_id <> '_all'`,
        [userId],
      ),
    ]);
    return statusFor({ enabled: enabled(), accountAgeHours: u.rows[0]?.hours ?? 0, jobsDone: j.rows[0]?.n ?? 0 });
  }

  async function isShadowed(userId: string): Promise<boolean> {
    const { rows } = await database.query<{ hidden: boolean }>(
      'select coalesce(chat_hidden_until > $2::timestamptz, false) as hidden from users where id = $1',
      [userId, new Date(now())],
    );
    return rows[0]?.hidden ?? false;
  }

  async function hideFor(userId: string, hours: number): Promise<void> {
    await database.query(
      'update users set chat_hidden_until = greatest(coalesce(chat_hidden_until, $2::timestamptz), $2::timestamptz + make_interval(secs => $3)) where id = $1',
      [userId, new Date(now()), (hours * HOUR) / 1000],
    );
  }

  function strike(userId: string): boolean {
    const { chat } = places;
    const t = now();
    const recent = (strikes.get(userId) ?? []).filter((s) => t - s < chat.strikeWindowMinutes * MINUTE);
    recent.push(t);
    strikes.set(userId, recent);
    return recent.length >= chat.strikesToCoolDown;
  }

  /** Judges, stores (for report review only) and tells the caller whether to relay it to the room. */
  async function send(userId: string, placeKey: string, raw: string): Promise<SendResult> {
    const st = await status(userId);
    if (!st.canType) return { ok: false, error: 'chat-locked', lock: st.lock! };

    const t = now();
    const prev = lastSent.get(userId);
    if (prev && t - prev.at < places.chat.gapSeconds * 1000) {
      return { ok: false, error: 'rate-limited', retryAfter: Math.ceil((places.chat.gapSeconds * 1000 - (t - prev.at)) / 1000) };
    }

    const verdict = checkText(raw, { hashes, last: prev?.text ?? null });
    if (!verdict.ok) {
      if (STRIKES.has(verdict.reason) && strike(userId)) {
        strikes.delete(userId);
        await hideFor(userId, places.chat.coolDownMinutes / 60);
      }
      return { ok: false, error: 'refused', reason: verdict.reason };
    }

    const shadow = await isShadowed(userId);
    lastSent.set(userId, { at: t, text: verdict.text });
    await database.query('insert into place_chat (user_id, place_key, body, shadowed, created_at) values ($1, $2, $3, $4, $5)', [
      userId,
      placeKey,
      verdict.text,
      shadow,
      new Date(t),
    ]);
    return { ok: true, text: verdict.text, shadow };
  }

  /** After a report: enough different people in the window and the player's text is hidden from others. */
  async function afterReport(reportedId: string): Promise<boolean> {
    const { chat } = places;
    const { rows } = await database.query<{ n: number }>(
      `select count(distinct reporter_id)::int as n from place_reports
       where reported_id = $1 and reporter_id is not null and created_at > $2::timestamptz - make_interval(secs => $3)`,
      [reportedId, new Date(now()), (chat.hideHours * HOUR) / 1000],
    );
    if ((rows[0]?.n ?? 0) < chat.reportsToHide) return false;
    await hideFor(reportedId, chat.hideHours);
    return true;
  }

  /** Deletes every message older than the retention window. Returns how many went. */
  async function purge(): Promise<number> {
    const { rows } = await database.query(
      'delete from place_chat where created_at < $1::timestamptz - make_interval(secs => $2) returning id',
      [new Date(now()), (places.chat.retentionHours * HOUR) / 1000],
    );
    return rows.length;
  }

  return { status, send, afterReport, purge, isShadowed };
}

export type Chat = ReturnType<typeof createChat>;
