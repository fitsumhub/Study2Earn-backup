# Study2Earn — Full Project Documentation

> **Gamified Exit Exam preparation platform** for Ethiopian freshman university students.  
> Study MoE curriculum, take mock exams, earn XP, compete on leaderboards, and redeem rewards — including bank withdrawals to Ethiopian banks.

**Version:** 2026 prototype  
**Default dev URL:** `http://localhost:3000`  
**Last updated:** June 14, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Routing](#routing)
6. [Authentication & Access Control](#authentication--access-control)
7. [Student Features](#student-features)
8. [Admin Console](#admin-console)
9. [Data Layer & Persistence](#data-layer--persistence)
10. [Hooks Reference](#hooks-reference)
11. [Components Reference](#components-reference)
12. [Library Modules](#library-modules)
13. [Styling & Design System](#styling--design-system)
14. [Scripts & Tooling](#scripts--tooling)
15. [SSR & Server](#ssr--server)
16. [Environment & Configuration](#environment--configuration)
17. [Development Conventions](#development-conventions)
18. [Production & Deployment Notes](#production--deployment-notes)
19. [Future Backend Integration](#future-backend-integration)

---

## Overview

Study2Earn is a full-stack React application built with **TanStack Start** (SSR-capable) and **TanStack Router** (file-based routing). It targets Ethiopian first-year university students preparing for the national **Exit Exam**.

### Core value proposition

| Pillar | Description |
|--------|-------------|
| **Study** | Official MoE PDF library with 14 books across 5 academic tracks |
| **Practice** | Timed chapter mock exams (MCQ) for 16 freshman courses |
| **Compete** | National leaderboard ranked by verified reading time and XP |
| **Earn** | XP wallet, referral bonuses, redemption catalog, and ETB bank withdrawals |

### User roles

| Role | Access |
|------|--------|
| **Guest** | Home, Dashboard, Library, Mock Exams, Profile, Admin (demo) |
| **Signed-in student** | All guest pages + **Rewards** + **Leaderboard** |
| **Admin** | `/admin` console — students, content, exams, rewards, withdrawals, moderation |

> **Note:** This prototype uses **client-side localStorage** for auth, exam progress, referrals, and withdrawals. There is no real backend API yet.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TanStack Start 1.x |
| Routing | TanStack Router (file-based, auto-generated `routeTree.gen.ts`) |
| Data fetching | TanStack React Query 5 |
| Build | Vite 7 |
| SSR / Deploy | Nitro (via `@lovable.dev/vite-tanstack-config`) |
| Language | TypeScript 5.8 (strict) |
| Styling | Tailwind CSS 4 + `tw-animate-css` |
| UI primitives | Radix UI + shadcn/ui pattern (`src/components/ui/`) |
| Icons | Lucide React |
| Charts | Recharts |
| Toasts | Sonner |
| Forms | React Hook Form + Zod (available; auth uses native forms) |
| Fonts | Fraunces (serif headings) + Inter (body) via Google Fonts |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** 9+

### Install

```bash
cd study2earn-source
npm install
```

### Development

```bash
npm run dev
```

Opens at **http://localhost:3000** (port 3000 is fixed in `vite.config.ts`).

### Build

```bash
npm run build
```

Produces:

- `dist/client/` — client assets
- `dist/server/` — SSR server bundle

### Preview production build

```bash
npm run preview
```

### Lint & format

```bash
npm run lint
npm run format
```

### Type check

```bash
npx tsc --noEmit
```

---

## Project Structure

```
study2earn-source/
├── src/
│   ├── routes/              # File-based pages (TanStack Router)
│   │   ├── __root.tsx       # App shell, meta, error/404 pages
│   │   ├── index.tsx        # Home /
│   │   ├── login.tsx        # Sign in + shared AuthShell
│   │   ├── register.tsx     # Sign up
│   │   ├── dashboard.tsx    # Student dashboard
│   │   ├── library.tsx      # MoE book library
│   │   ├── exams.tsx        # Exams layout (<Outlet />)
│   │   ├── exams.index.tsx  # Course list /exams
│   │   ├── exams.$courseId.tsx          # Course layout
│   │   ├── exams.$courseId.index.tsx    # Chapter list
│   │   ├── exams.$courseId.$chapterId.tsx # Mock exam taker
│   │   ├── leaderboard.tsx  # National rankings (login required)
│   │   ├── rewards.tsx      # XP wallet (login required)
│   │   ├── profile.tsx      # User profile
│   │   ├── admin.tsx        # Admin console
│   │   └── sitemap[.]xml.ts # SEO sitemap route
│   ├── components/          # Feature & layout components
│   ├── hooks/               # React hooks (state + side effects)
│   ├── lib/                 # Data, stores, utilities, types
│   ├── assets/              # Static images (e.g. hero-student.jpg)
│   ├── router.tsx           # Router factory + QueryClient
│   ├── server.ts            # SSR entry with error wrapper
│   ├── start.ts             # TanStack Start bootstrap
│   ├── routeTree.gen.ts     # AUTO-GENERATED — do not edit
│   └── styles.css           # Tailwind + brand CSS variables
├── vite.config.ts
├── tsconfig.json            # Path alias: @/* → src/*
├── package.json
└── PROJECT_DOCUMENTATION.md # This file
```

---

## Routing

TanStack Start uses **file-based routing**. Every `src/routes/*.tsx` file maps to a URL. Nested routes require parent files with `<Outlet />`.

### Route map

| URL | File | Auth | Description |
|-----|------|------|-------------|
| `/` | `index.tsx` | Public | Landing page, hero, featured books, top scholars |
| `/login` | `login.tsx` | Public | Sign in; supports `?redirect=` and `?ref=` |
| `/register` | `register.tsx` | Public | Sign up; supports `?ref=` referral code |
| `/dashboard` | `dashboard.tsx` | Public | Student overview, stats, recent activity |
| `/library` | `library.tsx` | Public | 14 MoE books, search, filters, PDF viewer sheet |
| `/exams` | `exams.index.tsx` | Public | 16 mock exam courses |
| `/exams/:courseId` | `exams.$courseId.index.tsx` | Public | Chapter list with detail sheet |
| `/exams/:courseId/:chapterId` | `exams.$courseId.$chapterId.tsx` | Public | Timed MCQ mock exam |
| `/leaderboard` | `leaderboard.tsx` | **Login required** | Weekly national rankings |
| `/rewards` | `rewards.tsx` | **Login required** | XP wallet, referrals, withdrawals, badges |
| `/profile` | `profile.tsx` | Public | Account settings (demo data) |
| `/admin` | `admin.tsx` | Public (demo) | Full admin console |
| `/sitemap.xml` | `sitemap[.]xml.ts` | Public | XML sitemap |

### Nested exams routing pattern

```
exams.tsx              → layout only (<Outlet />)
exams.index.tsx        → /exams (course grid)
exams.$courseId.tsx    → layout only (<Outlet />)
exams.$courseId.index.tsx → /exams/:courseId (chapters)
exams.$courseId.$chapterId.tsx → /exams/:courseId/:chapterId (exam)
```

### Search params

| Route | Params | Purpose |
|-------|--------|---------|
| `/login` | `redirect`, `ref` | Post-login redirect; referral code passthrough |
| `/register` | `ref`, `redirect` | Referral code from share link; post-signup redirect |

Example: `/login?redirect=%2Fleaderboard` shows enhanced leaderboard login context.

---

## Authentication & Access Control

### How it works

Auth is **client-side only**, persisted in `localStorage` under key `study2earn-auth`.

| File | Role |
|------|------|
| `src/lib/auth-data.ts` | Types, demo user, protected route list |
| `src/lib/auth-store.ts` | `readAuth`, `signIn`, `signOut`, `isAuthenticated` |
| `src/lib/require-auth.ts` | Route guard — redirects to `/login?redirect=...` |
| `src/lib/auth-redirect.ts` | Contextual login messaging per protected page |
| `src/hooks/use-auth.ts` | React hook wrapping the store |

### Protected routes

Only these require login:

- `/leaderboard`
- `/rewards`

All other routes are **public**. Guests see **Sign in / Get started** in the header; logged-in users see name + XP.

### Demo sign-in

On the login form, **any email and password** works (demo mode). Default user:

```
Name:       Abebe Balcha
Email:      abebe.balcha@aau.edu.et
University: Addis Ababa University
XP:         1,240
ID:         STU-8842
```

### Sign-up

Creates a new user with 50 starting XP and signs in immediately. Referral code `?ref=CODE` on register shows a bonus banner (+50 XP for friend).

### Header behavior

`SiteHeader` reads auth via `useAuth()`. Rewards and Leaderboard nav links show a **lock icon** when logged out.

---

## Student Features

### 1. Home (`/`)

- Hero with CTA to register and library
- Featured book grid (6 books)
- Top 3 leaderboard preview
- Platform stats

### 2. Dashboard (`/dashboard`)

- XP summary, study streak, chapters completed
- Recent exam scores
- Continue reading cards with `BookCover` thumbnails
- Quick links to library and exams

### 3. Library (`/library`)

- **14 books** across tracks: Natural Science, Social Science, Common, Engineering, Medicine
- Search, category filters, grid/list view toggle
- Continue reading section
- Per-book: progress %, XP earned, chapter list, PDF sheet viewer
- Professional `BookCover` component with per-book gradients and icons

### 4. Mock Exams (`/exams`)

**16 courses** in `src/lib/exam-data.ts`:

| Course ID | Name |
|-----------|------|
| `emerging-tech` | Introduction to Emerging Technologies |
| `general-physics` | General Physics |
| `inclusiveness` | Inclusiveness |
| `general-biology` | General Biology |
| `math-natural` | Mathematics (Natural Science) |
| `math-social` | Mathematics (Social Science) |
| `english-i` | English Skills I |
| `english-ii` | English Skills II |
| `physical-fitness` | Physical Fitness |
| `moral-citizenship` | Moral & Citizenship Education |
| `economics` | Economics |
| `global-affairs` | Global Affairs |
| `geography-ethiopia` | Geography of Ethiopia |
| `general-psychology` | General Psychology |
| `entrepreneurship` | Entrepreneurship |
| `anthropology` | Anthropology |

**Exam flow:**

1. Pick course → chapter list
2. Click chapter → `ChapterDetailSheet` (objectives, topics, progress)
3. Start exam → `MockExamTaker` (timed MCQ, instant scoring, XP calculation)

**XP formula** (`use-exam-progress.ts`):

```
base XP = round(score / 10) * 5
bonus   = +25 XP if first completion AND score >= 60%
```

Progress stored in `localStorage` key `study2earn-exam-progress`.

### 5. Leaderboard (`/leaderboard`) — login required

- Top 3 podium display
- Full top-10 table with university, hours, XP, trend
- Ranked by verified reading time (mock data)

### 6. Rewards (`/rewards`) — login required

#### XP wallet

- Balance = base XP (1,240) + exam XP + referral XP − pending withdrawal XP
- Lifetime earned, referral XP, redemption count

#### Referral program (`ReferralPanel`)

| Event | XP |
|-------|-----|
| Friend signs up with your code | Friend gets **50 XP**; you get **50 XP** |
| Friend completes first chapter | You get **+100 XP** |
| Milestone: 3 referrals | **+150 XP** bonus |
| Milestone: 5 referrals | **+300 XP** bonus |
| Milestone: 10 referrals | **+750 XP** bonus |

- Share link: `/register?ref=YOUR-CODE`
- Persisted in `localStorage` key `study2earn-referrals`

#### Bank withdrawal (`WithdrawalPanel`)

| Rule | Value |
|------|-------|
| Conversion rate | **8 XP = 1 ETB** |
| Minimum | **50 ETB** (400 XP) |
| Maximum | **5,000 ETB** |
| Banks supported | **15 Ethiopian banks** (CBE, Awash, Dashen, BoA, United, Nib, CBO, OIB, Lion, Wegagen, Zemen, Bunna, Berhan, Abay, Addis) |

- Student selects bank (branded `BankLogo`), enters account details, submits request
- Status flow: `pending` → `approved` → `paid` (or `rejected`)
- Shared store: `localStorage` key `study2earn-withdrawals`

#### Redemption catalog

| Reward | XP Cost |
|--------|---------|
| 100 ETB Airtime Credit | 800 |
| 1-month Ad-Free Experience | 400 |
| University Bookstore Voucher | 2,000 |
| Featured Leaderboard Spot | 1,500 |
| Custom Profile Theme | 300 |
| Exclusive Study Group Access | 600 |

#### Badges

6 badges (3 earned by default): First Steps, 7-Day Streak, Night Owl, Exam Ace, Eagle Eye, Marathon Reader.

### 7. Profile (`/profile`)

- Avatar, university, program, year
- Notification preferences (UI only)
- Two-factor authentication toggle (UI only)

### 8. Login / Register

- Split layout: brand panel (left) + form (right)
- **Contextual login** when `?redirect=/leaderboard` or `?redirect=/rewards`:
  - Explains why login is needed
  - Shows perks list
  - Leaderboard: top-3 scholar preview
  - Rewards: 8 XP = 1 ETB teaser
  - CTA: "Sign in to view Leaderboard" / "Sign in to open Rewards"
  - "Browse for free" links to Library, Exams, Dashboard

---

## Admin Console

**URL:** `/admin`  
**Entry:** `admin.tsx` → `AdminShell` + `AdminPanel` + `AdminDialogs`

### Sections

| Section | Features |
|---------|----------|
| **Overview** | KPI cards, pending action alerts, top performers, platform health, engagement by track, recent students, activity feed |
| **Students** | Search, status filters (All/Active/Pending/Suspended), approve/suspend/message |
| **Content** | 14 library books with thumbnails, MoE sync status, sync action |
| **Exams** | Publish/unpublish exams, draft count badge |
| **Rewards** | Reward catalog CRUD, **bank withdrawal approval table** with bank logos, approve/reject/mark paid |
| **Analytics** | Reading hours chart, XP economy chart |
| **Moderation** | Flag queue, resolve reports |
| **Settings** | Email alerts, auto-approve, daily exam limit, default XP |

### Sidebar badges

Live counts on: Students (pending), Content (unsynced), Exams (drafts), Rewards (pending withdrawals), Moderation (open flags).

### Withdrawal admin workflow

1. Student submits withdrawal → appears as **pending** in Rewards section
2. Admin clicks **Approve** → status `approved`
3. Admin clicks **Mark paid** → status `paid`
4. Admin can **Reject** at pending stage

Withdrawal state is shared with the student app via `withdrawal-store.ts` (same `localStorage` key).

### Export

- Students CSV
- Platform summary TXT

### State management

`useAdminDashboard` hook holds in-memory React state (users, exams, rewards, flags, notifications, activity). Not persisted across page reloads except withdrawals (shared store).

---

## Data Layer & Persistence

### localStorage keys

| Key | Module | Data |
|-----|--------|------|
| `study2earn-auth` | `auth-store.ts` | Login session |
| `study2earn-exam-progress` | `use-exam-progress.ts` | Chapter scores, XP, attempts |
| `study2earn-referrals` | `use-referral.ts` | Referral code, history, tier bonuses |
| `study2earn-withdrawals` | `withdrawal-store.ts` | All withdrawal requests (shared user ↔ admin) |

### Sync pattern

All persistent hooks use `useSyncExternalStore` + custom event dispatch:

```typescript
window.dispatchEvent(new Event("auth-change"));
window.dispatchEvent(new Event("exam-progress-change"));
window.dispatchEvent(new Event("referral-change"));
window.dispatchEvent(new Event("withdrawal-change"));
```

### Static mock data

| File | Contents |
|------|----------|
| `mock-data.ts` | Subjects, library books, leaderboard, rewards, badges, exam history |
| `exam-data.ts` | 16 courses, chapters, MCQ question banks |
| `admin-data.ts` | Admin stats, trends, top performers, recent users, activity |
| `book-thumbnails.ts` | Per-book cover styles and icons |
| `chapter-meta.ts` | Generated chapter objectives/topics |
| `ethiopian-banks.ts` | 15 banks with brand colors |
| `referral-data.ts` | Tiers, XP rates, default referrals |
| `withdrawal-data.ts` | Conversion rates, seed requests, demo user |

---

## Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `use-auth.ts` | Login state, signIn, signUp, signOut |
| `useExamProgress` | `use-exam-progress.ts` | Chapter/course/overall stats, record attempt, XP calc |
| `useReferral` | `use-referral.ts` | Referral code, history, tier progress, total XP |
| `useWithdrawals` | `use-withdrawals.ts` | Submit/list withdrawals; admin approve/reject/paid |
| `useAdminDashboard` | `use-admin-dashboard.ts` | Full admin console state and actions |
| `useMobile` | `use-mobile.tsx` | Responsive breakpoint helper |

---

## Components Reference

### Layout & chrome

| Component | File | Description |
|-----------|------|-------------|
| `SiteHeader` | `site-chrome.tsx` | Nav bar, auth-aware user menu |
| `SiteFooter` | `site-chrome.tsx` | Footer links |
| `BookCover` | `book-cover.tsx` | Professional book thumbnail with spine effect |

### Student features

| Component | File | Description |
|-----------|------|-------------|
| `MockExamTaker` | `mock-exam-taker.tsx` | Timed MCQ exam UI with review |
| `ChapterDetailSheet` | `chapter-detail-sheet.tsx` | Side panel for chapter info |
| `ReferralPanel` | `referral-panel.tsx` | Refer-and-earn UI on rewards page |
| `WithdrawalPanel` | `withdrawal-panel.tsx` | Bank picker + withdrawal form + history |
| `BankLogo` | `bank-logo.tsx` | Styled bank badge from brand colors |

### Admin

| Component | File | Description |
|-----------|------|-------------|
| `AdminShell` | `admin-shell.tsx` | Sidebar layout, notifications, export |
| `AdminPanel` | `admin-panel.tsx` | All admin section content |
| `AdminDialogs` | `admin-dialogs.tsx` | Add student, publish exam, upload content, create reward |
| `AdminStatCard` | `admin-shell.tsx` | Reusable KPI card |

### UI primitives

`src/components/ui/` — shadcn/ui components: Button, Card, Dialog, Sheet, Table, Chart, Sidebar, Badge, Input, Select, etc.

---

## Library Modules

| Module | Purpose |
|--------|---------|
| `auth-data.ts` | Auth types, demo user, protected routes |
| `auth-store.ts` | Auth localStorage read/write |
| `auth-redirect.ts` | Login page context per redirect target |
| `require-auth.ts` | TanStack Router `beforeLoad` guard |
| `withdrawal-data.ts` | Withdrawal types, rates, seed data |
| `withdrawal-store.ts` | Shared withdrawal localStorage |
| `ethiopian-banks.ts` | 15 banks + `getBankById()` |
| `referral-data.ts` | Referral tiers and XP constants |
| `admin-types.ts` | Admin section types and metadata |
| `admin-data.ts` | Platform metrics and seed data |
| `exam-data.ts` | Courses, chapters, MCQ banks |
| `mock-data.ts` | General app mock data |
| `book-thumbnails.ts` | Book cover visual config |
| `chapter-meta.ts` | Chapter detail generator |
| `utils.ts` | `cn()` — clsx + tailwind-merge |
| `error-capture.ts` | SSR error capture helper |
| `error-page.ts` | HTML error page renderer |
| `lovable-error-reporting.ts` | Error reporting integration |
| `config.server.ts` | Server-side config |

---

## Styling & Design System

### Brand colors (CSS variables in `styles.css`)

| Token | Usage |
|-------|-------|
| `brand-navy` | Primary brand, buttons, headings |
| `brand-gold` | Accent, XP highlights, badges |
| `brand-sage` | Tags, success accents |

### Typography

- **Headings:** Fraunces (serif)
- **Body:** Inter (sans-serif)

### Layout patterns

- Max width containers: `max-w-6xl` / `max-w-7xl`
- Cards: `rounded-2xl border border-slate-100 bg-white shadow-sm`
- Sticky header with backdrop blur

---

## Scripts & Tooling

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Vite dev on port 3000 |
| Build | `npm run build` | Client + SSR production build |
| Dev build | `npm run build:dev` | Development mode build |
| Preview | `npm run preview` | Serve production build locally |
| Lint | `npm run lint` | ESLint (includes Prettier rules) |
| Format | `npm run format` | Prettier write all files |

### Path alias

```typescript
import { something } from "@/lib/utils";
// resolves to src/lib/utils
```

---

## SSR & Server

- **Entry:** `src/server.ts` wraps TanStack Start server entry
- Catches catastrophic SSR 500 responses and renders a friendly HTML error page
- **Root layout:** `src/routes/__root.tsx` — HTML shell, meta tags, QueryClient provider
- **Router:** `src/router.tsx` — creates router with `routeTree.gen.ts`

### Important routing rule

Every parent route that has children **must** render `<Outlet />`. List pages use `.index.tsx` suffix:

```
exams.tsx          → <Outlet /> only
exams.index.tsx    → actual /exams content
```

---

## Environment & Configuration

| File | Purpose |
|------|---------|
| `vite.config.ts` | Port 3000, TanStack Start server entry, dev middleware |
| `tsconfig.json` | Strict TS, `@/*` path alias |
| `components.json` | shadcn/ui config |
| `.prettierrc` | Code formatting rules |
| `eslint.config.js` | Lint rules |

No `.env` file is required for local development. The app runs entirely on mock data.

---

## Development Conventions

1. **Do not edit** `src/routeTree.gen.ts` — it is auto-generated by TanStack Router plugin.
2. **Do not create** `src/pages/` — use `src/routes/` only.
3. **New routes:** add `src/routes/your-page.tsx`; dev server regenerates route tree.
4. **Persistent client state:** follow the `useSyncExternalStore` + localStorage + custom event pattern.
5. **Protected routes:** add `beforeLoad: () => requireAuth("/your-path")` and register in `PROTECTED_ROUTES` if needed.
6. **Commits:** only when explicitly requested.
7. **Minimize scope** — match existing naming, imports, and component patterns.

### Adding a new public page

```tsx
// src/routes/my-page.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/my-page")({
  component: MyPage,
});

function MyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">{/* content */}</main>
      <SiteFooter />
    </div>
  );
}
```

### Adding a login-protected page

```tsx
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/my-protected-page")({
  beforeLoad: () => requireAuth("/my-protected-page"),
  component: MyProtectedPage,
});
```

---

## Production & Deployment Notes

- Built with `@lovable.dev/vite-tanstack-config` (Nitro deploy plugin activates in Lovable cloud context)
- Client bundle includes route-based code splitting
- Admin chunk is ~540 KB (consider lazy-loading admin route in production)
- Run `npm run build` before deploy; restart preview server after rebuild to avoid stale `dist/` module errors

---

## Future Backend Integration

When connecting to a real API, replace these areas first:

| Area | Current | Target |
|------|---------|--------|
| Auth | `localStorage` demo session | JWT / session cookies + `/api/auth` |
| Exam progress | `localStorage` | `POST /api/progress` per attempt |
| Referrals | `localStorage` | Server-validated referral codes |
| Withdrawals | Shared `localStorage` | Admin API with real bank transfer workflow |
| Leaderboard | Static `mock-data.ts` | Live rankings from reading-time service |
| Library PDFs | Mock chapter metadata | MoE CDN / signed PDF URLs |
| Admin dashboard | In-memory React state | REST or GraphQL admin API |

Recommended stack alignment: **Supabase** (auth + Postgres + RLS) or custom Node API with the existing TanStack Start server functions pattern in `src/lib/api/`.

---

## Quick Test Checklist

| Action | Expected result |
|--------|-----------------|
| Visit `/library` logged out | Page loads; header shows Sign in |
| Visit `/leaderboard` logged out | Redirects to `/login?redirect=/leaderboard` |
| Sign in with any credentials | Header shows Abebe Balcha + XP |
| Visit `/rewards` after login | Wallet, referrals, withdrawal panel visible |
| Submit withdrawal request | Appears in `/admin` → Rewards → Pending |
| Admin approves withdrawal | Student history shows Approved |
| Take a mock exam | XP updates on dashboard and rewards |
| Share referral link `?ref=CODE` | Register page shows referral banner |

---

## License & Attribution

© 2026 Study2Earn Ethiopia. Built for the next generation of Ethiopian scholars.

---

*Generated from the Study2Earn source codebase. For route conventions, see also `src/routes/README.md`.*
