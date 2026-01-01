# WhaleTracker Server (Express)

This is a lightweight backend scaffold for the WhaleTracker app. It follows a simple MVC/clean architecture with clear separation of controllers, services, and routes.

Features
- Express server with routes for Wallets and Alerts
- Moralis API client (server-side) that reads API key from `MORALIS_API_KEY`
- Auth-ready placeholders and middleware (no auth implemented)
- Local storage adapters (replace with DB for production)
- Dockerfile and example `.env` provided

Getting started
1. cd server
2. cp .env.example .env and set `MORALIS_API_KEY`
3. npm install
4. npm run dev

API overview
- GET /health - basic health check
- POST /api/wallets - add a tracked wallet (body: { address, network, threshold })
  - Note: In development you can set an "X-User-Id" header to scope requests to a pretend user.
- GET /api/wallets - list tracked wallets (scoped to X-User-Id or anonymous)
- DELETE /api/wallets/:address - remove tracked wallet (scoped to X-User-Id)
- POST /api/wallets - add a tracked wallet (body: { address, network, threshold }) - note: plan limits apply; set `X-User-Plan` header for testing
- GET /api/alerts - list alerts (scoped to X-User-Id)
- POST /api/alerts - ingest an alert (body must include `wallet`) - intended for server-side pollers or workers
- POST /api/alerts/mark-viewed - mark one or more alerts as viewed
- Poller endpoints:
  - GET /api/poller/status - get poller run status
  - POST /api/poller/run - trigger a poller run (runs immediately)

Environment variables for poller tuning:
- POLL_INTERVAL_SECONDS (default 60)
- POLL_CONCURRENCY (default 5)
- MORALIS_FETCH_LIMIT (default 25)
- POLLER_MAX_SEEN (default 500)

Notes
- Do not commit secrets. Use envs or a secrets manager in production.
- Replace the simple storage adapters with a real DB (Postgres/Mongo) before production use.
- Consider running alert polling as a separate worker (e.g., serverless cron or background worker) for reliability.

Examples
- Add a wallet for user "alice":
  curl -X POST http://localhost:3000/api/wallets -H "Content-Type: application/json" -H "X-User-Id: alice" -d '{"address":"0xAbC...","network":"ethereum"}'
- Add same wallet again for alice (will return 409):
  curl -X POST http://localhost:3000/api/wallets -H "Content-Type: application/json" -H "X-User-Id: alice" -d '{"address":"0xAbC...","network":"ethereum"}'
- Add same wallet for different user bob (allowed):
  curl -X POST http://localhost:3000/api/wallets -H "Content-Type: application/json" -H "X-User-Id: bob" -d '{"address":"0xAbC...","network":"ethereum"}'
- Ingest an alert for alice:
  curl -X POST http://localhost:3000/api/alerts -H "Content-Type: application/json" -H "X-User-Id: alice" -d '{"wallet":"0xAbC...","type":"large_transfer","message":"$100k transfer detected"}'
- Create a checkout session (demo):
  curl -X POST http://localhost:3000/api/billing/checkout -H "Content-Type: application/json" -H "X-User-Id: alice" -d '{"planId":"pro"}'
- Webhook: set STRIPE_WEBHOOK_SECRET and configure Stripe to POST to /api/billing/webhook

