/**
 * Outbound email.
 *
 * There is no provider wired up, because that needs an account only the
 * project owner can create. Everything around it is real — the tokens, their
 * expiry, single use, the routes — so wiring a provider is implementing
 * `send()` and setting `CR_MAIL_FROM`/`CR_APP_URL`, not building a flow.
 *
 * Until then the console mailer prints the link to the server log. That is
 * usable for development and is *deliberately* refused in production: shipping
 * with it would mean a player asking for a password reset silently gets
 * nothing while the token sits in a log file.
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
  if (process.env.NODE_ENV === 'production') {
    // Refusing to boot is deliberate. The quiet failure — starting anyway and
    // printing reset links into a log nobody reads — looks healthy from
    // outside while every locked-out player is permanently locked out.
    if (process.env.CR_ALLOW_NO_MAIL !== 'true') {
      throw new Error(
        'No mail provider configured. Implement Mailer.send() in api/src/mailer.ts before deploying: ' +
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
