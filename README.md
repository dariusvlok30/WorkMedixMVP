# WorkMedix — Medical Screening Clinic Platform

A full-stack web application for a medical screening clinic. Handles company bookings, admin management, secure document storage, and AI-powered semantic search.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Vector Search | Pinecone |
| Email | Resend |
| Deployment | Vercel |

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-org/workmedix.git
cd workmedix
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `PINECONE_API_KEY` + `PINECONE_INDEX`
- `OPENAI_API_KEY`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `ADMIN_EMAIL`

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/schema.sql`
3. Go to **Storage** → create a new bucket named `documents` (set to **Private**)

### 4. Clerk Setup

1. Create an app at [clerk.com](https://clerk.com)
2. Enable **Email + Password** sign-in only
3. Create admin user accounts manually in the Clerk dashboard (no public signup)
4. Copy keys to `.env.local`

### 5. Pinecone Setup

1. Create an account at [pinecone.io](https://pinecone.io)
2. Create an index named `workmedix-bookings`
   - Dimensions: `1536`
   - Metric: `cosine`
3. Copy API key to `.env.local`

### 6. Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key and copy to `.env.local`

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel project settings
4. Deploy — Vercel auto-deploys on every push to `main`

---

## Pages

### Public
| Route | Description |
|---|---|
| `/` | Landing page — hero, services, why us, contact |
| `/book` | Company booking form |
| `/book/success` | Booking confirmation |
| `/sign-in` | Admin login (Clerk) |

### Admin (requires login)
| Route | Description |
|---|---|
| `/dashboard` | Stats overview + upcoming bookings |
| `/bookings` | Full bookings list with filters |
| `/bookings/[id]` | Booking detail, status management, documents |
| `/search` | AI semantic search (Pinecone) |

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bookings` | Admin | List all bookings (with filters) |
| `POST` | `/api/bookings` | Public | Create booking + send emails + index in Pinecone |
| `GET` | `/api/bookings/[id]` | Admin | Get single booking with documents |
| `PATCH` | `/api/bookings/[id]` | Admin | Update status/notes |
| `DELETE` | `/api/bookings/[id]` | Admin | Delete booking |
| `POST` | `/api/documents` | Admin | Upload file to Supabase Storage |
| `GET` | `/api/documents/[id]` | Admin | Get 1-hour signed download URL |
| `DELETE` | `/api/documents/[id]` | Admin | Delete file from storage + DB |
| `POST` | `/api/search` | Admin | Semantic search via Pinecone |
| `POST` | `/api/send-email` | Admin | Send manual email via Resend |
| `GET` | `/api/dashboard/stats` | Admin | Aggregated dashboard stats |

---

## Project Structure

```
workmedix/
├── app/
│   ├── (public)/           # Landing page, booking form, success
│   ├── (admin)/            # Dashboard, bookings, search (Clerk-protected)
│   ├── sign-in/            # Clerk sign-in page
│   └── api/                # All API routes
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── public/             # Navbar, Footer, HeroSection, BookingForm, etc.
│   └── admin/              # Sidebar, TopBar, BookingsTable, DocumentUpload, etc.
├── lib/
│   ├── supabase/           # Browser, server, and admin Supabase clients
│   ├── pinecone.ts         # Vector upsert/query helpers
│   ├── resend.ts           # Email send helpers + HTML templates
│   ├── embeddings.ts       # OpenAI text-embedding-3-small
│   └── utils.ts            # cn(), formatDate(), etc.
├── types/index.ts          # Booking, Document, enums
├── hooks/use-toast.ts      # Toast notification hook
├── middleware.ts           # Clerk route protection
└── supabase/schema.sql     # Full database schema
```

---

## Features

- **Booking Form** — multi-field public form, client-side validation, auto emails on submit
- **Admin Dashboard** — stats cards, upcoming bookings, recent activity
- **Bookings Management** — filterable table, status updates, admin notes
- **Document Management** — drag-and-drop upload, signed download URLs, delete
- **Manual Email** — send emails to companies directly from booking detail
- **AI Search** — natural language semantic search powered by Pinecone + OpenAI embeddings
- **Clerk Auth** — secure admin login, no public user signup
