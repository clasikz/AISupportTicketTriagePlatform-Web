# TT Desk - Web

Frontend for TT Desk - AI Support Platform. A ticket management interface with AI-assisted triage, real-time filtering, and an analytics dashboard. Built as a portfolio project demonstrating Next.js app router patterns, JWT auth flows, and composable UI design.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **React 18** with custom hooks for data fetching
- **Tailwind CSS 3** with custom design tokens
- **Recharts** (lazy-loaded via `next/dynamic`)
- **Vercel** for deployment

## Quick start (local)

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create a `.env.local` file in the project root:

    ```env
    NEXT_PUBLIC_BACKEND_URL=https://localhost:7185
    ```

    Point this at your running instance of the [backend API](https://github.com/krzarsuela/TTDesk).

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000).

## Authentication

Uses the backend's demo auth: enter any user ID string on the login page to sign in. No password required. The app stores `accessToken`, `refreshToken`, and `userId` in `localStorage`. The `apiFetch` utility automatically handles token refresh on 401 responses.

## Features

- **Ticket board** - Paginated ticket list with search, filters (status, priority, category, agent), multi-column sort, and resizable columns persisted to `localStorage`
- **Ticket detail** - Right-side slide-over panel with AI triage box (reasoning + suggested steps), metadata, status/reassign actions, comments, and activity history
- **Create ticket** - Modal with title and description inputs; AI automatically assigns category, priority, and agent on submission
- **Dashboard** - Analytics overview with stat cards and Recharts visualizations (status breakdown, priority distribution, category breakdown)
- **Drag-to-resize** - Sidebar and slide-over panel widths are draggable and persisted
- **Cold start detection** - Banner shown after 4s if backend is slow (Vercel free tier warm-up)
- **Token refresh** - Concurrent 401s share a single refresh request (no thundering herd)

## Project structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx            # / (ticket board)
│   ├── dashboard/page.tsx  # /dashboard (analytics)
│   └── login/page.tsx      # /login
├── components/
│   ├── layout/             # AppShell, Topbar, Sidebar, Footer
│   ├── tickets/            # TicketTable, TicketSlideOver, CreateTicketModal, badges
│   ├── dashboard/          # DashboardGrid, StatCard
│   ├── skeletons/          # Loading placeholders
│   └── ui/                 # ColdStartBanner
├── context/                # AuthContext, NotificationContext
├── hooks/                  # useTickets, useTicket, useDashboard, useStats, useDragResize
├── lib/                    # apiFetch, endpoints, utils (normalizeTicket, formatters)
└── types/                  # Shared TypeScript types and enums
```

## Design highlights

- Ticket enums (status, priority, category) arrive as integers from the backend and are normalized in `normalizeTicket()` before use in the UI.
- The ticket detail slide-over fetches its own data via `useTicket(id)` to get AI triage results, since the list endpoint does not include them.
- `DashboardGrid` is loaded via `next/dynamic` with `ssr: false`, keeping the `/dashboard` initial JS bundle at ~3 kB instead of ~115 kB (Recharts excluded from page chunk).
- `useDragResize` is a generic hook used for both the sidebar and the slide-over panel; sizes persist to `localStorage` per key.
- Comments returned from the API are filtered on the client to exclude `userId === "ai"` entries (AI triage notes stored server-side as comments).

## Environment variables

| Variable                  | Required | Description                                                 |
| ------------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Yes      | Base URL of the backend API (e.g. `https://localhost:7185`) |

## Deployment

The project includes a `vercel.json` for deployment on Vercel. Set `NEXT_PUBLIC_BACKEND_URL` to your hosted backend URL in the Vercel project settings.

```bash
npm run build   # production build
npm start       # production server
```

## Backend

The companion backend API lives at [TTDesk](https://github.com/krzarsuela/TTDesk) (ASP.NET Core 8, PostgreSQL, Groq AI).

## Author

#### Klent Zarsuela - Full-stack Web Developer

Portfolio: https://www.klentzarsuela.vercel.app
