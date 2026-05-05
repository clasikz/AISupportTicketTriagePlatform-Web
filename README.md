# TT Desk — Web

Frontend for TT Desk, an AI-powered support ticket triage platform. Tickets are automatically classified and routed the moment they are submitted. The interface mirrors the density and layout of tools like Jira and Azure Boards.

> Portfolio project demonstrating Next.js App Router patterns, JWT auth with silent refresh, composable UI design, and real-time agent analysis polling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS 3 — no other CSS framework |
| Charts | Recharts (lazy-loaded via `next/dynamic`) |
| Auth | JWT + refresh token — stored in `localStorage` |
| State | React Context (auth only) — no external state library |
| Deploy | Vercel |

**Design token:** Primary blue `#0052cc` — used across topbar, active nav, badges, and focus rings.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — mounts AppShell
│   ├── page.tsx                # / — ticket board (table + slide-over)
│   ├── dashboard/
│   │   └── page.tsx            # /dashboard — stat cards + Recharts
│   ├── login/
│   │   ├── layout.tsx          # Isolated layout (no AppShell/sidebar)
│   │   └── page.tsx            # /login — credential form + cold start banner
│   └── users/
│       └── page.tsx            # /users — admin-only user management
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Auth guard + sidebar + topbar wrapper
│   │   ├── Topbar.tsx          # Fixed top bar — logo, user info, logout
│   │   ├── Sidebar.tsx         # Resizable left nav — Planning + Admin sections
│   │   └── Footer.tsx          # Footer with humans.txt link
│   ├── tickets/
│   │   ├── TicketTable.tsx     # Paginated table — filters toolbar, sort headers
│   │   ├── TicketTableRow.tsx  # Single row — status, priority, category badges
│   │   ├── TicketSlideOver.tsx # Right panel — triage box, comments, activity
│   │   ├── CreateTicketModal.tsx # Modal — title + description → AI triage on submit
│   │   ├── StatusBadge.tsx     # Colour-coded status pill
│   │   ├── PriorityBadge.tsx   # Colour-coded priority pill
│   │   ├── CategoryBadge.tsx   # Colour-coded category pill
│   │   └── AgentChip.tsx       # Resolves agent ID → display name + avatar
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx   # Recharts charts (lazy-loaded, ssr: false)
│   │   └── StatCard.tsx        # Single metric card with icon
│   ├── skeletons/
│   │   ├── TableSkeleton.tsx   # Shimmer placeholder for ticket table
│   │   ├── SlideOverSkeleton.tsx # Shimmer placeholder for slide-over
│   │   └── StatCardSkeleton.tsx  # Shimmer placeholder for stat cards
│   └── ui/
│       └── ColdStartBanner.tsx # Yellow banner after 4s slow backend response
│
├── context/
│   ├── AuthContext.tsx         # user, accessToken, login(), logout()
│   └── NotificationContext.tsx # Global toast notifications
│
├── hooks/
│   ├── useTickets.ts           # Paginated + filtered ticket list
│   ├── useTicket.ts            # Single ticket detail (polls for specialist comments)
│   ├── useStats.ts             # Dashboard stat counters
│   ├── useDashboard.ts         # Full dashboard breakdown
│   ├── useAssignees.ts         # humans[] + aiAgents[] for reassign dropdown
│   └── useDragResize.ts        # Generic drag-to-resize hook (sidebar + slide-over)
│
├── lib/
│   ├── api.ts                  # apiFetch — Bearer injection + 401 refresh interceptor
│   ├── endpoints.ts            # All API URL builders
│   └── utils.ts                # formatDateTime, formatRelativeTime, AGENT_COLORS,
│                               # AGENT_DISPLAY_NAMES, AI_AGENT_IDS, createUserNameResolver
│
└── types/
    └── index.ts                # Enums, interfaces, STATUS_TRANSITIONS map
```

---

## Workflows

### Auth Flow

```
User enters credentials
        │
        │  POST /api/auth/login { username, password }
        ▼
    AuthContext.login()
        │
        ├── [401] ──► throw Error("Invalid credentials") ──► show error on form
        │
        └── [200] ──► store in localStorage:
                         accessToken   (JWT, 15-30 min TTL)
                         refreshToken  (base64, 7-day TTL)
                         user          (JSON: masterId, firstName, lastName,
                                               email, role, isAdmin)
                      setState({ user, accessToken, isAuthenticated: true })
                      ──► redirect to /

AppShell mounts on every page:
  isLoading? ──► spinner
  !isAuthenticated + !isLoginPage? ──► router.replace("/login")
  else ──► render Topbar + Sidebar + {children}

Sidebar:
  user.isAdmin? ──► show "Admin" section with /users link
```

---

### API Request + Silent Token Refresh

```
Component calls apiFetch(url, options)
        │
        ▼
  Read accessToken from localStorage
  Attach Authorization: Bearer <token>
  Send request
        │
        ├── [200-299] ──► return Response ──► component handles data
        │
        ├── [403] ──► throw RateLimitError() ──► show rate limit toast
        │               (403 = rate limit, NOT auth failure — do not refresh)
        │
        └── [401] ──► token expired
                  │
                  ▼
            refreshTokens()  ← module-level singleton
                  │
                  ├── isRefreshing = true? ──► return same refreshPromise
                  │   (concurrent 401s share one refresh — no thundering herd)
                  │
                  │  POST /api/auth/refresh { refreshToken }
                  │
                  ├── [401] ──► clear localStorage ──► redirect /login
                  │
                  └── [200] ──► store new accessToken + refreshToken
                            ──► retry original request with new token
                            ──► return retried Response
```

---

### Ticket Board Data Flow

```
BoardPage mounts
     │
     ├── useStats()   ──► GET /api/tickets/stats  ──► StatCards
     └── useTickets(filters) ──► GET /api/tickets?{query}
                                      │
                                      ▼
                               normalizeTicket()
                               (status int → TicketStatus enum,
                                ai triage fields unpacked)
                                      │
                                      ▼
                               TicketTable renders rows

User clicks row
     │
     ▼
TicketSlideOver opens
     │
     └── useTicket(id) ──► GET /api/tickets/{id}
                               │
                               ▼
                        { ticket, ai, attachments }
                               │
                  ┌────────────┼───────────────────┐
                  ▼            ▼                   ▼
           AI Triage box   Comments tab        Activity tab
           (always shown)  userComments[]      activities[]
                           specialistComments[]

specialistComments = comments where userId ∈ AI_AGENT_IDS
userComments       = comments where userId ∉ AI_AGENT_IDS and userId ≠ "ai"
```

---

### Specialist Analysis Polling

```
TicketSlideOver mounts / currentAssignedTo changes
        │
        ▼
  hasAiTriage?           ──► No  → no polling needed
  currentAgentAnalyzed?  ──► Yes → latest specialist comment is already
                                   from the current agent, stop polling
  AI_AGENT_IDS.has(assignedTo)? ──► No → human assigned, no polling
        │
        ▼ (all conditions pass → analysis pending)
  setInterval(refetch, 3000)   ← poll every 3s
  setTimeout(stop, 30000)      ← give up after 30s

  Each refetch:
    GET /api/tickets/{id}/comments
        │
        ▼
    latestSpecialistComment?.userId === currentAssignedTo?
        │
        ├── Yes ──► clearInterval + clearTimeout
        │           render SpecialistCard (analysis, workflow, solutions)
        │
        └── No  ──► show spinner "Agent analysis in progress..."
                    (if timed out → show "Taking longer than expected" warning)

SpecialistCard display logic:
  result.outOfScope = true?
    └──► orange card "Outside my domain"
         Try: [ triageResult.AssignedTo ] chip

  result.outOfScope = false?
    └──► latest card (blue tint, "Latest" badge)
         older cards → collapsed in OlderAnalysesAccordion
         accordion order: most recent first (reversed)
```

---

### Ticket Creation Flow

```
User clicks "+ New Ticket"
        │
        ▼
CreateTicketModal opens
        │
  User fills title + description
        │
        │  POST /api/tickets { title, description }
        ▼
  [loading state on button]
        │
        ├── [error] ──► show error toast
        │
        └── [200] ──► CreateTicketResponse { ticket, ai }
                            │
                            ▼
                      close modal
                      refetch ticket list
                      refetch stats
                      (specialist analysis fires in background on server)
```

---

### Status Transition

```
Footer "Update status" dropdown
        │
  validTransitions = STATUS_TRANSITIONS[currentStatus]
  (computed client-side from STATUS_TRANSITIONS map in types/index.ts)
        │
  User selects new status
        │
        │  PUT /api/tickets/{id} { title, description, status: int }
        ▼
  ├── [200/204] ──► refetch ticket + refetch list + refetch stats
  │
  └── [404] ──► "Invalid status transition" toast
                (404 = bad transition, NOT missing ticket)
```

---

### Reassign Flow

```
Footer "Reassign" dropdown
        │
  humans[]    ──► from useAssignees() → GET /api/assignees
  aiAgents[]  ──► same response
        │
  User selects agent
        │
        │  PUT /api/tickets/{id}/assign { assignedTo }
        ▼
  ├── [204] ──► refetch ticket
  │             if new assignee ∈ AI_AGENT_IDS:
  │               currentAgentAnalyzed resets (latestSpecialistComment.userId ≠ new agent)
  │               polling resumes automatically
  │
  └── [error] ──► show error toast
```

---

## Key Design Decisions

| Decision | Detail |
|---|---|
| Jira/Azure Boards visual style | Blue `#0052cc` topbar, 224px resizable sidebar, dense table, white content panels |
| No external state library | React Context for auth only; all data lives in hooks with local `useState` |
| `apiFetch` singleton refresh | Module-level `isRefreshing` flag — concurrent 401s share one refresh request |
| `403` ≠ `401` | Backend returns 403 for rate limit (not 429) — handled separately, never triggers refresh |
| `404` on PUT = bad transition | `PUT /api/tickets/{id}` returning 404 means invalid status transition, not a missing resource |
| localStorage tokens | Portfolio simplicity — use httpOnly cookies for production |
| AGENT_COLORS use hex + inline styles | Tailwind purges dynamic class strings even when files are in the content scan — hex values in `utils.ts` are safe |
| Recharts lazy-loaded (`ssr: false`) | Keeps `/dashboard` initial JS bundle ~3 kB instead of ~115 kB |
| `useDragResize` generic hook | Handles both sidebar and slide-over; persists widths to localStorage per key |
| Skeleton shimmer on all fetches | Every data section shows shimmer placeholders — no blank states during load |
| Cold start banner | Shown after 4s if backend hasn't responded — Render.com free tier can take 30-60s to spin up |
| `currentAgentAnalyzed` checks latest | Checks if the **most recent** specialist comment is from the current agent — not just any comment. Fixes stale analysis showing as "done" after reassignment |
| Admin-only delete | Delete ticket button hidden for non-admins in TicketSlideOver; backend also enforces 403 |
| AI triage chip frozen | AI Triage section shows `ticketData.ai.assignedTo` (original triage), not `ticketData.assignedTo` (live) |

---

## Features

- **Ticket board** — paginated table with search, multi-filter (status, priority, category, agent), multi-column sort, resizable columns persisted to `localStorage`
- **Ticket detail** — right slide-over with AI triage banner (category + priority + triage's agent suggestion), metadata grid, status/reassign dropdowns, comments tab, activity history tab
- **Specialist analysis** — per-agent AI analysis cards with analysis text, optional ASCII workflow diagram, and recommended steps; older analyses collapsed in accordion (newest first)
- **Out-of-scope detection** — agent cards show orange "Outside my domain" when category is outside their domain, with triage-recommended agent as suggestion
- **Create ticket** — modal submits to backend; AI triage result shown immediately; specialist analysis appears via polling
- **Dashboard** — stat cards + Recharts charts (status breakdown, priority distribution, category breakdown)
- **User management** — admin-only `/users` page; toggle `isAdmin` per user via switch; add/delete users
- **Drag-to-resize** — sidebar and slide-over panel widths draggable and persisted
- **Cold start banner** — yellow banner after 4s slow response (Render.com free-tier warm-up)
- **Silent token refresh** — 401s auto-refresh with no concurrent duplicate requests

---

## Quick Start (Local)

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Backend must be running — see [TTDesk](https://github.com/krzarsuela/TTDesk).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Base URL of the backend API |

---

## Deployment

Deployed on Vercel. `vercel.json` is included.

1. Set `NEXT_PUBLIC_BACKEND_URL` in Vercel project settings to your Render.com backend URL.
2. Ensure the backend CORS config allows your Vercel domain.

```bash
npm run build   # production build
npm start       # production server
```

---

## Backend

Companion API: [TTDesk](https://github.com/krzarsuela/TTDesk) — ASP.NET Core 8, PostgreSQL, Groq AI, Render.com.

---

## Author

**Klent Zarsuela** — Full-stack Web Developer

Portfolio: [klentzarsuela.vercel.app](https://www.klentzarsuela.vercel.app)
