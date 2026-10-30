# Guardrails

These are non-negotiable legal and design constraints for Campaign Run.

1. **Disclosure**: Lives on the About screen, in the terms, and on payment screens and ad pages (owner decision, C79: it is not repeated on the splash, share cards, result or board screens, where it read as low confidence. C86 exception: the Board carries one plain line, "A game board", because it is the one screen that looks like a result; it is a label, not the disclosure text). Text: "Fictional game. All characters, parties and events are invented; any resemblance to real people is coincidental. Not affiliated with or endorsed by any political party, aspirant or electoral body. Scores are game scores, not polls."
2. **Not a poll**: Score is Crowd; the community view is the Rally Map. No polling-style percentages until 200 uniques per state.
3. **Parody names are allowed** when they joke about a role and would not make a stranger name one real person. **Never in the game:** party logos, symbols or slogans; real politicians' names or nicknames; phonetic echoes of those names; signature outfits, props, or faces; any character→person mapping; electoral-body marks; the player committing vote-buying/rigging/violence; weapons or injuries; insecurity incidents; ethnic/religious jokes; health/age/disability jokes; arrests; invented quotes from real people; home-state or ethnic bonuses.
4. **Villains are generic**: Integrity-threat characters never wear party colours, are never tied to a state/ethnicity/religion, and appear with equal frequency everywhere.
5. **Equal power**: All 6 Contenders are statistically equal (verified by 10k run bot).
6. **Money must not buy the map**: Real-money items are cosmetic/convenience. Map points are tier-capped.
7. **No paid randomness**: No loot boxes. No cash-out, no P2P transfers.
8. **No political ads**: No ads targeted by Contender choice.
9. **18+ Only**: Enforced on the splash screen: the first-time button reads "Run my race" and the line under it says tapping it confirms you are 18 or over (C82; the button used to carry the words). Sign-up repeats it.
10. **Contender choice is sensitive data**: Private by default. NEVER sent to server in R0 (until C11 consent).
11. **Palaces are scenery only**: Never a pickup zone or rally venue (implies traditional ruler endorsement).
12. **Hashed blocklist**: Real names are blocked via SHA-256 hashes. Plain text lists NEVER committed.
13. **Mobilise places are presets only** (C82): players in a shared place can say only a phrase or emoji from `places.json`; there is no text box and the server rejects anything else, so nothing a player types reaches another player. Avatars are plain citizens seeded from the account, never the player's Contender or Studio look. Rewards are coins and a small Following head start, capped per Lagos day on the server; they never touch the sim or a Contender's power. Ambient "Locals" are labelled as such, never speak and are never counted as players. An invite link carries only a state and a place, nothing about the player or their Contender.
