/**
 * Outbound email.
 *
 * Resend is the provider: set `RESEND_API_KEY` (and `CR_MAIL_FROM`, `CR_APP_URL`)
 * and mail is really sent, locally or deployed. With no key the console mailer
 * prints the link to the server log. That is usable for development and is
 * *deliberately* refused in production: shipping with it would mean a player
 * asking for a password reset silently gets nothing while the token sits in a
 * log file.
 *
 * Resend only lets an unverified sender (`onboarding@resend.dev`, the default
 * here) deliver to the email address the Resend account was created with. To
 * mail anyone else, verify a domain in Resend and set `CR_MAIL_FROM` to it.
 */
export interface Message {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(msg: Message): Promise<void>;
}

export const APP_URL = (process.env.CR_APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');

export function verifyLink(token: string): string {
  return `${APP_URL}/?verify=${encodeURIComponent(token)}`;
}

export function resetLink(token: string): string {
  return `${APP_URL}/?reset=${encodeURIComponent(token)}`;
}

export const consoleMailer: Mailer = {
  async send(msg) {
    // Not structured-logged with the request: this is a development aid, and
    // keeping it on its own stream makes it obvious it is not a delivery.
    console.log(`[mail:dev] to=${msg.to} subject=${JSON.stringify(msg.subject)}\n${msg.text}`);
  },
};

const RESEND_URL = 'https://api.resend.com/emails';

/** Sends through Resend's HTTP API. Throws on any non-2xx so callers can log it; never logs the key. */
export function resendMailer(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async send(msg) {
      const res = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        throw new Error(`resend ${res.status}: ${detail}`);
      }
    },
  };
}

/** Collects messages instead of sending them. Used by the tests. */
export function memoryMailer(): Mailer & { sent: Message[] } {
  const sent: Message[] = [];
  return {
    sent,
    async send(msg) {
      sent.push(msg);
    },
  };
}

export function createMailer(): Mailer {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const from = process.env.CR_MAIL_FROM?.trim() || 'Campaigner <onboarding@resend.dev>';
    console.log(`[mail] sending through Resend from ${from}`);
    return resendMailer(key, from);
  }
  if (process.env.NODE_ENV === 'production') {
    // Refusing to boot is deliberate. The quiet failure — starting anyway and
    // printing reset links into a log nobody reads — looks healthy from
    // outside while every locked-out player is permanently locked out.
    if (process.env.CR_ALLOW_NO_MAIL !== 'true') {
      throw new Error(
        'No mail provider configured. Set RESEND_API_KEY (and CR_MAIL_FROM) before deploying: ' +
          'password reset and email verification both depend on it. ' +
          'To run a staging instance without mail anyway, set CR_ALLOW_NO_MAIL=true.',
      );
    }
    console.warn(
      '[mail] CR_ALLOW_NO_MAIL=true: no mail is being sent. Verification and password reset links ' +
        'are printed to this log only. Do not run a public instance like this.',
    );
  }
  return consoleMailer;
}
