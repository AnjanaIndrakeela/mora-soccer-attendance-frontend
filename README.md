# Mora Football — Frontend

Web app for the Mora Football team attendance system: QR check-in, admin review, squad stats, tournaments and matches. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and shadcn/ui. The API lives in the separate `Mora Soccer-Backend` repository.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) and React 19
- [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives, `lucide-react` icons)
- [TanStack Query](https://tanstack.com/query) for data fetching and caching
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for forms
- [Recharts](https://recharts.org) for charts, [Sonner](https://sonner.emilkowal.ski) for toasts

## Getting started

Start the backend first (see its README), then:

```bash
npm install
cp .env.example .env.local   # point BACKEND_URL at the running backend
npm run dev
```

Open http://localhost:3000. With the backend's seed data you can log in as:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@morasoccer.lk` | `admin12345` |
| Player | `kasun@morasoccer.lk` | `player12345` |

The backend's `CLIENT_URL` must be this app's URL: it is used for CORS, QR-code links and password-reset links.

### Environment variables

| Variable | Description |
| --- | --- |
| `BACKEND_URL` | Backend base URL that `/api/*` is proxied to. **Read at build time**, so rebuild after changing it. |
| `NEXT_PUBLIC_TEAM_TIMEZONE` | Team timezone (default `Asia/Colombo`). Times are stored in UTC and shown in this zone. |

## How it fits together

- **API proxy.** [next.config.ts](next.config.ts) rewrites `/api/*` to the backend, so the browser only ever talks to this origin. The backend's httpOnly `token` cookie is therefore first-party (`SameSite=Lax`), and [src/proxy.ts](src/proxy.ts) (Next 16's name for middleware) can see it to redirect logged-out users to `/login`. The check is optimistic; the backend verifies the JWT on every request.
- **Data fetching.** All API calls go through [src/lib/api.ts](src/lib/api.ts). [src/lib/queries.ts](src/lib/queries.ts) has one TanStack Query hook per resource; mutations invalidate the related queries (e.g. finalizing a session refreshes sessions, players and stats).
- **Roles.** Admins see create/edit/review actions. Players get read-only pages plus their own profile; other players' birthday, contact number and index number are never sent to them.
- **QR check-in.** A session's QR code encodes `CLIENT_URL/attend/{sessionId}?t={token}`. The mobile-first `/attend` page checks the player in, sending them through login first if needed.

## Routes

| Route | Who | What |
| --- | --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Everyone | Auth. Sign-up requires an index number already on the roster. |
| `/dashboard` | All | Stat cards, next-tournament countdown, attendance donut and trend. |
| `/team`, `/team/[id]` | All (admins edit) | Top 10 / full roster by attendance, pending sign-ups, add/edit/deactivate players, player profiles. |
| `/sessions`, `/sessions/[id]/review` | All (admins manage) | Session list, create, QR display/download/full-screen, end, review, approve all, finalize. |
| `/tournaments` | All (admins edit) | Upcoming tournaments with countdowns, past results, friendlies, add tournament, log match. |
| `/progress` | All | Trend, by type/batch/position, per-player bars, at-risk list, streaks, W/D/L, date-range filter. |
| `/attend/[sessionId]` | Players | QR scan landing page. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  app/
    (auth)/              # Login, register, forgot/reset password (full-bleed background)
    (app)/               # Signed-in pages sharing the navbar shell
    attend/[sessionId]/  # QR scan landing page
    layout.tsx, providers.tsx, globals.css
  components/
    ui/                  # shadcn/ui components (+ native-select)
    charts/              # Recharts: attendance donut, trend line, percent bars
    ...                  # Dialogs, badges, app shell, shared bits
  lib/                   # api client, query hooks, types, date/number formatting
  proxy.ts               # Redirects logged-out users to /login
public/
  logo.jpg               # Team crest
  login-bg.svg           # Login background (placeholder pitch; swap for a team photo)
```

## Deploying (Vercel)

1. Import the repo into Vercel.
2. Set `BACKEND_URL` (your Render/Railway URL) and `NEXT_PUBLIC_TEAM_TIMEZONE` in the project's environment variables, then deploy. The rewrite is baked in at build time, so redeploy after changing `BACKEND_URL`.
3. Set the backend's `CLIENT_URL` to the Vercel URL.

## Customizing

- **Login background:** replace `public/login-bg.svg`, or put a photo in `public/` and change the `src` in [src/app/(auth)/layout.tsx](<src/app/(auth)/layout.tsx>).
- **Brand colors:** `--brand` and the chart/status tokens are in [src/app/globals.css](src/app/globals.css).
- **More UI components:** `npx shadcn@latest add <component>`.
