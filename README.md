# my-signal

Signal-to-noise ratio of the day. Three tasks, a wake tap, a signal/noise toggle, a sleep tap. Signal = time on one of the three declared tasks; everything else awake is noise. Bar to beat: 80/20.

## Model

- `day:<YYYY-MM-DD>` in Upstash Redis: `{date, events: [{t, type: wake|toggle|sleep}], tasks: [{text, done}] x3}`. A day is owned by its wake date, Europe/Paris.
- `current`: `{dayKey, state: asleep|signal|noise, lastTap, nagged}`.
- Ratio and legality live in `lib/day.ts` (`fold`, `nextState`), tested by `node --test lib/day.test.ts`.

## Routes

- `POST /api/login` sets the auth cookie; every other route sits behind `proxy.ts` (password in `APP_PASSWORD`).
- `GET /api/state`, `POST /api/tap {type}`, `POST /api/tasks {tasks x3}`, `GET /api/history`, `POST /api/push` (subscription), `POST /api/tick?key=TICK_KEY`.
- Tick rule: awake and no tap for 2h, then a push "Still in signal|noise?", renagged every 2h. Schedule an Upstash QStash POST to `/api/tick?key=...` every 15 min (Vercel Hobby cron is daily-only).

## Deploy

1. Vercel project on this repo, env vars from `.env.example` (values in `.env.local`, never committed).
2. Upstash Redis: claim or create, fill both `UPSTASH_*` vars.
3. QStash schedule: `*/15 * * * *` POST `https://<app>/api/tick?key=<TICK_KEY>`.
4. iPhone: open the site, Add to Home Screen, then tap the bell once (web push needs the installed app).

Icons regenerate with `node scripts/icons.mjs` from `public/logo.svg`.
