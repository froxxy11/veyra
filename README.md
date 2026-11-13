# Veyra
Skill earns its rank.

First repository-ready prototype. Run `npm start` and open http://localhost:3000. Run `npm test` for evaluation checks. No dependencies required; Node 22+ recommended.

## Implemented
Responsive, navigable discovery, market detail, workspace, evaluation, trader network, and NEAR explanation screens. Search/category filtering. Browser-local profile and attempt storage. Claim 10,000 demo credits, simulated YES/NO purchases, exposure checks, manual synthetic settlement, failure/reset/archive and completion checks. Reduced motion support.

## Explicit limitations
Watchlist, probability sorting, modal demo profile, and separate perpetuals roadmap are implemented.

No authentication, backend persistence, cross-user identity, live market feeds, external venue orders, AI API, deployed NEAR contract, wallet connection, or public rank issuance. All markets and charts are synthetic. Local storage is user-editable and cannot support trusted evaluation. Simulator has fixed asks and spread, marks unsettled positions at cost, and does not implement continuous mark-to-market, daily rollover, total liquidity consumption, fees, or queue priority. Passing logic uses elapsed days, 7 active days, 15 events, 8% return, 30% event-profit concentration, and no open positions. Manual settlement is demo-only. Loss failure discards remaining synthetic positions and sets balance zero; production must archive liquidation evidence first.

Polymarket and Kalshi live connectors need licensing clarification/authorization. Hyperliquid is a planned separate track. No affiliation is claimed. NEAR records are planned, not deployed. Branding availability unverified.

## Next implementation gates
1. Server-side append-only attempt ledger and secure authentication.
2. Exact UTC day and executable liquidation valuation, paused-data handling, deterministic fees, event grouping and qualifying activity thresholds.
3. Venue data permissions and read adapters with final resolution evidence.
4. NEAR testnet contract: rule commitments, authorized result reporting, result history, replay protection; disclose reporter trust.
5. Agent orchestration and evidence-grounded reports; no model-issued grades.
6. Replay scenarios isolated from live credentials and public profiles.

See docs/PRD.md for the agreed product scope.

### Hackathon demo: verify a Silver report

Open **Evaluations → Silver evaluation report → Verify on NEAR**. This replay requires no login and never touches account balances. It evaluates 15 synthetic trades using the draft Silver policy. The browser recomputes the report and its SHA-256 fingerprint, checks the finalized testnet transaction arguments, and offers an explorer link.

The proof is a fixed demo commitment, not a credential, production rank, external market attestation, or on-chain trading engine. The testnet contract is a no-op; the fingerprint is in the successful transaction's call arguments. Verification is read-only and doesn't require wallet approval. Testnet publishing is reproducible with `node scripts/anchor-demo.mjs` (creates a fresh faucet-funded testnet account; no mainnet funds).
