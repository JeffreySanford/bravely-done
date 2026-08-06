# Rewards and Healthy Retention

## Reward categories

- Courage XP for beginning avoided work _(built — granted on encounter completion)_
- Focus XP for completing an honest sprint _(built — granted on sprint completion, gated on real
  elapsed time)_
- Wisdom XP for splitting, estimating, or revising a plan _(not built as its own category — splitting
  a quest grants half Quest XP rather than a distinct Wisdom XP counter)_
- Quest XP for completion _(built — plus the Daily loop's First Brave Step and Today's Three bonuses,
  which stack on top of it)_
- Coins for ordinary progress _(built — spendable on workbench upgrades)_
- Materials for camp construction _(represented by the bridge construction stage, not a separate
  counter)_
- Reputation for helping others _(not built — needs the social system)_
- Treasury value for real paid work _(not built)_

## Return cadence

### Daily

- Campfire welcome _(not built — the campfire exists as a scene landmark with real fuel state, but
  there's no once-per-day welcome beat wired to it)_
- Today's Three quest choices _(built — the player designates up to 3 of their own OPEN/IN_PROGRESS
  quests per UTC day; completing one grants a bonus on top of the normal reward. Player-chosen, not
  system-suggested.)_
- First Brave Step bonus _(built — granted on the first quest completed each UTC day; never on login
  or elapsed time, and never on a split)_
- Optional small companion interaction _(not built)_

### Weekly

- **Weekly Summit** — a boss or challenge tied to the most important goal _(not built)_. Named
  "Summit", not "Expedition": Expedition is already the Agile/SAFe dual-label for a **Sprint** (see
  [Agile/SAFe progression](agile-safe-progression.md)), and reusing it here made this cadence
  ambiguous with the Adventure Sprint that already exists.
- **Chronicle** summarizing progress _(built — `GET /characters/:id/chronicle`, and the
  `/basecamp/:characterId/chronicle` route)_. Reports what actually happened over the window — quests
  by resolution, sprints and their committed focus minutes, encounters — assembled from timestamps
  the domain already records, plus real XP/coin totals and a per-category breakdown summed from the
  transaction ledger below. Those totals are measured, not estimated — before the ledger existed the
  Chronicle deliberately omitted them rather than infer them from event counts.
- Chest based on consistency and recovery, not raw hours _(not built)_

### Monthly

- Campaign chapter
- New region or camp development arc
- Rare cosmetic or companion evolution
- Personal accomplishment recap

## Ethical rules

- No purchased random loot.
- No permanent loss after missing a day.
- No public shaming or coercive leaderboards.
- Rest days and comeback quests are legitimate play.
- Reward formulas must resist idle timers and repetitive low-value farming.
- Notifications are useful, rate-limited, and controllable.

## Transaction ledger

Every XP/coin movement is recorded as an append-only `RewardEntry`
(`apps/backend/src/reward-ledger/`), written inside the same database transaction as the balance
change it describes. A grant can therefore never exist without its entry, or an entry without its
grant.

- `Character.xp`/`coins` stay authoritative for the **current balance**; the ledger is **history**
  alongside them, not a replacement. Deriving balances from the ledger would mean recomputing a sum
  on every read and backfilling opening balances — a much larger change than the reporting problem it
  would solve.
- **Spends are recorded too**, as negative amounts (the workbench upgrade). A rewards-only ledger
  would stop reconciling the first time anyone spent anything; including spends means summing the
  ledger equals the character's balance, which is asserted in the integration suite.
- Rows are never updated or deleted. A correction is a new compensating entry, so the ledger stays
  truthful about what was actually granted at the time — reward constants can change later without
  silently rewriting history.
