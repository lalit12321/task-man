# Teamflow

A refined team task manager built with **Next.js 14**, **MongoDB**, and **JWT authentication**. Deploys cleanly to **Railway**.

No Firebase. No NextAuth. Just Next.js API routes talking to MongoDB via the native driver, with HTTP-only cookie sessions and bcrypt-hashed passwords.

---

## Features

- Email/password signup & login (JWT in HTTP-only cookies, bcrypt-hashed passwords)
- Teams with 6-character invite codes — share to invite, regenerate any time
- **Admin-only member management** — add, remove, and manage team member roles
- Tasks: title, description, status (To do / In progress / Done), priority (Low / Medium / High), assignee, due date
- Kanban-style team view + cross-team "My tasks" view with filters
- Overview dashboard with stats and focus list
- Mobile-responsive with slide-out drawer
- Toast notifications, modals, optimistic UI updates

---

## Tech stack

- Next.js 14 (App Router, TypeScript) — UI + API routes in one app
- MongoDB native driver (`mongodb` npm package — no Mongoose, no ORM)
- `jsonwebtoken` for JWT, `bcryptjs` for password hashing
- Tailwind CSS with custom design tokens
- `lucide-react` icons, `react-hot-toast` notifications
- Deployed on Railway via Nixpacks

---

## 1. Local setup

```bash
# Clone or unzip the project, then:
cd teamflow
npm install
cp .env.example .env.local   # fill in your MongoDB URI and JWT secret
npm run dev
```

Visit `http://localhost:3000`.

---

## 2. MongoDB setup

You have two easy options:

### Option A — MongoDB Atlas (recommended, free tier)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a **free M0 cluster** (any region is fine — pick one close to you).
3. **Database Access** → **Add new database user** → username + password (save these).
4. **Network Access** → **Add IP Address** → for development click **Allow Access From Anywhere** (`0.0.0.0/0`). For production-only Railway, you can paste the Railway egress IPs instead.
5. **Database** (top of left sidebar) → **Connect** → **Drivers** → **Node.js** → copy the connection string. It looks like:
   ```
   mongodb+srv://USERNAME:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the password you set in step 3.

### Option B — Local MongoDB

If you have MongoDB installed locally:
```
MONGODB_URI=mongodb://localhost:27017
```

### Generate a JWT secret

A long random string. On Linux/Mac:
```bash
openssl rand -base64 48
```
On Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | %{[byte](Get-Random -Max 256)}))
```

### Fill in `.env.local`

```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=teamflow
JWT_SECRET=<paste the long random string here>
```

Now restart `npm run dev` if it's already running (env vars only load on startup).

---

## 3. Deploy to Railway

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create teamflow --public --source=. --push   # or use the GitHub web UI
   ```
2. Go to [railway.app](https://railway.app) → **New project** → **Deploy from GitHub repo** → select your repo. Railway auto-detects Next.js via the included `nixpacks.toml` and `railway.json`.
3. In the Railway service → **Variables** → add:
   - `MONGODB_URI`
   - `MONGODB_DB` (e.g. `teamflow`)
   - `JWT_SECRET`
4. **Settings → Networking → Generate Domain**.
5. Done. Railway redeploys on every `git push`.

### Or via Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
railway variables set MONGODB_URI="..." MONGODB_DB=teamflow JWT_SECRET="..."
railway up
railway domain
```

### Why Railway works out of the box

- `railway.json` tells Railway to use Nixpacks and hit `/api/health` for health checks.
- `nixpacks.toml` pins Node 20.
- `next.config.mjs` sets `output: 'standalone'` for a lean runtime.
- `package.json`'s `start` script honours `$PORT` (Railway injects it).

---

## 4. Project structure

```
teamflow/
├── app/
│   ├── layout.tsx              # Root layout (AuthProvider, Toaster)
│   ├── globals.css             # Tailwind + design tokens
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Sign in
│   ├── signup/page.tsx         # Register
│   ├── api/
│   │   ├── health/             # GET — Railway health check
│   │   ├── auth/
│   │   │   ├── signup/         # POST — create account, set cookie
│   │   │   ├── login/          # POST — sign in, set cookie
│   │   │   ├── logout/         # POST — clear cookie
│   │   │   └── me/             # GET  — current user from JWT
│   │   ├── teams/
│   │   │   ├── route.ts        # GET (my teams), POST (create)
│   │   │   ├── join/           # POST — join via invite code
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, DELETE
│   │   │       ├── leave/              # POST
│   │   │       ├── regenerate-code/    # POST (owner only)
│   │   │       └── members/
│   │   │           ├── route.ts        # POST (add), DELETE (remove) — admin only
│   │   │           └── update-role/    # PATCH — update member role — admin only
│   │   └── tasks/
│   │       ├── route.ts        # GET (?teamId=), POST
│   │       └── [id]/route.ts   # PATCH, DELETE
│   └── dashboard/
│       ├── layout.tsx          # Auth-gated layout
│       ├── page.tsx            # Overview
│       ├── tasks/page.tsx      # Cross-team task list w/ filters
│       └── teams/
│           ├── page.tsx        # Teams list + create/join
│           └── [id]/page.tsx   # Team detail w/ kanban
├── components/
│   ├── Sidebar.tsx, MobileTopBar.tsx, Modal.tsx
│   ├── TaskCard.tsx, TaskEditor.tsx
│   ├── Avatar.tsx, Badges.tsx
├── contexts/
│   └── AuthContext.tsx         # client-side auth state via /api/auth/me
├── lib/
│   ├── db.ts                   # MongoDB client + typed collections
│   ├── auth.ts                 # JWT sign/verify, cookies
│   ├── api.ts                  # client fetch helper
│   ├── serialize.ts            # MongoDB doc → JSON
│   ├── members.ts              # client-side member management helpers
│   ├── teams.ts, tasks.ts      # client-side data fetching
│   ├── access.ts               # authorization helpers (requireTeamAdmin, etc.)
│   └── types.ts                # shared types
├── middleware.ts               # redirect unauth'd users from /dashboard
├── .env.example
├── railway.json, nixpacks.toml
├── tailwind.config.ts, postcss.config.js
├── next.config.mjs
└── package.json
```

---

## 5. Data model (MongoDB collections)

The app uses three collections, all created automatically on first write.

**users**
```js
{ _id, email, passwordHash, displayName, createdAt }
```

**teams**
```js
{
  _id, name, description, ownerId, inviteCode, createdAt,
  members: [{ userId, displayName, email, role: 'admin'|'member', photoURL }]
}
```

**tasks**
```js
{
  _id, teamId, title, description, status, priority,
  assigneeId, assigneeName, dueDate, createdBy, createdByName,
  createdAt, updatedAt
}
```

Indexes (created automatically on first signup):
- `users.email` unique
- `teams.inviteCode` unique
- `teams.members.userId`
- `tasks.teamId`, `tasks.assigneeId`

---

## 6. How authentication works

1. **Signup/Login** — `/api/auth/signup` and `/api/auth/login` hash/verify the password with bcrypt, sign a JWT containing `{ uid, email, displayName }`, and set it as an HTTP-only cookie.
2. **Every API request** carries the cookie. Routes call `requireSession()` from `lib/auth.ts` which reads and verifies the JWT — if invalid, the route returns 401.
3. **Page protection** — `middleware.ts` checks for the cookie on `/dashboard/*` and redirects to `/login` if it's missing.
4. **Logout** — `/api/auth/logout` clears the cookie.

---

## 7. Team member management (Admin-only feature)

Team admins can add, remove, and manage member roles using three endpoints:

### Add a member
**POST** `/api/teams/[id]/members`
```json
{
  "email": "newmember@example.com",
  "role": "member"  // optional, defaults to 'member'
}
```
Response: `{ ok: true, team: {...}, message: "..." }`

### Remove a member
**DELETE** `/api/teams/[id]/members`
```json
{
  "email": "member@example.com"
}
```
Response: `{ ok: true, team: {...}, message: "..." }`
Note: Cannot remove the last admin from the team.

### Update member role
**PATCH** `/api/teams/[id]/members/update-role`
```json
{
  "email": "member@example.com",
  "role": "admin"  // or 'member'
}
```
Response: `{ ok: true, team: {...}, message: "..." }`
Note: Cannot downgrade the only admin to a regular member.

### Client-side usage
```typescript
import { addTeamMember, removeTeamMember, updateTeamMemberRole } from '@/lib/members';

// Add a member
await addTeamMember(teamId, { email: 'user@example.com', role: 'admin' });

// Remove a member
await removeTeamMember(teamId, { email: 'user@example.com' });

// Update role
await updateTeamMemberRole(teamId, { email: 'user@example.com', role: 'member' });
```

---

## 8. Common issues

| Problem | Fix |
|---|---|
| `MONGODB_URI is not set` on startup | Create `.env.local` and restart `npm run dev` |
| `MongoServerError: bad auth` | Wrong username/password in the connection string |
| `MongoServerSelectionError` from anywhere except your local machine | Atlas Network Access — add `0.0.0.0/0` or the Railway IPs |
| Login works but `/dashboard` redirects back to `/login` | `JWT_SECRET` is different between the request and the verifier — make sure it's set on Railway and not changing between deploys |
| Build fails on Railway | Check that `MONGODB_URI` and `JWT_SECRET` env vars are set |
| Cannot add/remove members | You must be a team admin to manage members |

---

## License

MIT — do whatever you want with this.
