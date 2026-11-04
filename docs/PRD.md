# Veyra — product specification draft
Global virtual prediction-trader evaluation and reputation platform on NEAR. No real funding, custody, paid challenges or external trading in the initial scope. Backers contact opted-in traders independently.

## Policy draft
10,000 starting credits. One active attempt per registered account. Silver: 8% net return, 14 elapsed days, 7 active UTC days, 15 distinct resolved underlying events, no open positions, largest event <=30% of aggregate positive event profits. Maximum 10% trailing peak-equity drawdown and 5% daily opening-equity loss. Maximum event exposure 1,000 and total open exposure 4,000. Exposure-violating orders rejected without failure. Threshold equality passes; breaches fail. Outages/disputed outcomes pause relevant actions, not automatic failure.

Future ranks Gold and Diamond require distinct published versioned policies. Silver failure returns unranked; Gold failure demotes Silver; Diamond failure demotes Gold. Old attempts remain visible. Closed successful attempts can start another program without simultaneous active balances. Production identity cannot guarantee unique humans through wallets/email alone.

## Architecture target
Browser UI -> authenticated application API -> transactional virtual ledger + evidence store. Deterministic risk/evaluation library shared by execution and replay. Source-specific read adapters discover eligible markets, normalize executable prices, ingest authoritative final payout vectors, and preserve resolution evidence. Orchestration agent schedules verification and explains fixed decisions. NEAR contract records rule commitments before attempts, then completed evidence/scorer commitments and rank transitions from explicitly authorized reporting keys. Raw positions and contacts remain private; hashes alone do not prove venue truth. Never record open trade details on public chain.

## Acceptance criteria before ranked launch
Atomic/idempotent credit claims and fills; no overspend under concurrency. Stale or missing data cannot fill or punish users. Venue/event grouping prevents exposure bypass. Finality/dispute states validated; duplicate reports cannot double credit. Failed attempts cannot receive later payouts. Full attempts archived before resets. Daily UTC baselines and continuous executable valuation implemented. Reports reproducible from immutable event logs and frozen policy. No replay account receives live credentials. Authorized signing and reporting keys scoped; no client can self-award rank. Profiles show all attempts and delayed closed trades, never live positions or non-opt-in contact details.

## Design
Midnight, warm ivory, mint and restrained amber. Multi-page market terminal; editorial hero, dense readable market cards, category tabs, responsive workspace, purposeful motion with reduced-motion alternative. Dedicated Hyperliquid coming-soon section; separate perpetual risk program later.
