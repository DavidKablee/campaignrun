/** Small line icons for the dock; they sit above the short label so the buttons read at a glance. */
export function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    canvass: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M19 6v4',
    flyers: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
    rally: 'M3 10v4l3 1 9 4V5L6 9zM19 9a4 4 0 010 6',
    wave: 'M8 13V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v8a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2-4a1.5 1.5 0 012.5-1.5L8 14',
    say: 'M4 5h16v11H9l-5 4z',
    share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2',
    back: 'M15 5l-7 7 7 7',
    close: 'M6 6l12 12M18 6L6 18',
    rooms: 'M4 20V9l8-5 8 5v11zM9 20v-6h6v6',
    friend: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M19 8v6M16 11h6',
    phone: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2',
    jobs: 'M9 4h6v3H9zM6 6h12v15H6zM9 12h6M9 16h4',
    board: 'M5 20V10M12 20V4M19 20v-7',
    convoy: 'M3 6h14l4 5v6H3zM7 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z',
    settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',
    people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8a2.5 2.5 0 010 5M21 20c0-2.4-1.6-4.4-4-5',
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  );
}
