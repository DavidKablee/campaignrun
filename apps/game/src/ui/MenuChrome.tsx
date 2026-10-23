import type { ReactNode } from 'react';

/**
 * Shared chrome for the four menu screens (About, Settings, Account, Convoy
 * Yard). They are not the run, so they do not get the run's furniture: one
 * back affordance in a fixed place, a left-aligned title, and white floating
 * sheets on the dark ground — the C38 Lagos Life language.
 *
 * Deliberately not a layout component that owns its children's arrangement.
 * Each screen stacks `<Sheet>`s itself, because the Yard's sections and the
 * About page's prose want very different internal rhythm.
 */
export function MenuHead({
  title,
  sub,
  onBack,
  trailing,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
  trailing?: ReactNode;
}) {
  return (
    <header className="cr-menu-head">
      <button className="cr-menu-back" type="button" onClick={onBack} aria-label="Back">
        <span aria-hidden="true">←</span>
      </button>
      <div className="cr-menu-headings">
        <h2 className="cr-menu-title">{title}</h2>
        {sub ? <p className="cr-menu-sub">{sub}</p> : null}
      </div>
      {trailing ? <div className="cr-menu-trailing">{trailing}</div> : null}
    </header>
  );
}

/**
 * C47: a menu screen that runs past about one and a half phone screens stops
 * being a screen and becomes a document. Tabs cut it into panels the thumb can
 * reach instead, and the tab strip itself is the table of contents — which a
 * long scroll never was.
 */
export function Tabs<T extends string>({
  label,
  tabs,
  active,
  onPick,
}: {
  label: string;
  tabs: readonly { id: T; label: string }[];
  active: T;
  onPick: (id: T) => void;
}) {
  return (
    <div className="cr-tabs cr-tabs--menu" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`cr-tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`cr-panel-${t.id}`}
          className={`cr-tab${active === t.id ? ' is-active' : ''}`}
          onClick={() => onPick(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** The panel one tab owns. Keeps the roles paired with `Tabs` above. */
export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`cr-panel-${id}`} aria-labelledby={`cr-tab-${id}`} className="cr-tabpanel">
      {children}
    </div>
  );
}

/** A white floating card. `flush` removes the padding so lists can own their own. */
export function Sheet({
  eyebrow,
  title,
  aside,
  tone,
  flush,
  children,
}: {
  eyebrow?: string;
  title?: string;
  aside?: ReactNode;
  tone?: 'accent';
  flush?: boolean;
  children: ReactNode;
}) {
  const cls = ['cr-sheet', tone === 'accent' ? 'cr-sheet--accent' : '', flush ? 'cr-sheet--flush' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <section className={cls}>
      {eyebrow || title || aside ? (
        <div className="cr-sheet-head">
          <div>
            {eyebrow ? <p className="cr-eyebrow">{eyebrow}</p> : null}
            {title ? <h3 className="cr-sheet-title">{title}</h3> : null}
          </div>
          {aside ? <div className="cr-sheet-aside">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** One row in a `flush` Sheet: text block on the left, control on the right. */
export function Row({
  label,
  hint,
  control,
  onClick,
}: {
  label: string;
  hint?: string;
  control?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="cr-row-text">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      {control ?? (onClick ? <span className="cr-row-go" aria-hidden="true">›</span> : null)}
    </>
  );
  if (onClick) {
    return (
      <button className="cr-row-item cr-row-item--link" type="button" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="cr-row-item">{body}</div>;
}

/** A labelled checkbox that renders as a switch. Still a real checkbox. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="cr-row-item cr-row-item--toggle">
      <span className="cr-row-text">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input className="cr-switch" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
