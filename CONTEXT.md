# SkillChain — Full Project Context

## What Is This Project?

SkillChain is a blockchain-based skill verification platform. It lets institutions issue tamper-proof NFT credentials to candidates, candidates take AI-graded assessments to prove their skills, and employers find the best candidates using an ML-powered matching algorithm. Everything is verified on-chain using Polygon.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, NextAuth.js (JWT) |
| Database | PostgreSQL (Neon Serverless), Drizzle ORM |
| Blockchain | Solidity (ERC721), Ethers.js v6, Polygon Amoy Testnet |
| Charts | Recharts |
| UI | Radix UI + custom components |
| IPFS | Pinata (for credential metadata) |
| Validation | Zod |

---

## Database Schema (9 Tables)

1. **users** — id, email, name, passwordHash, role (candidate/employer/institution/admin), walletAddress, bio, organizationName, isVerified, timestamps
2. **skills** — id, name, category, description
3. **credentials** — id, candidateId, issuerId, title, description, type, status (pending/verified/rejected/revoked), skillIds, blockchainTxHash, tokenId, ipfsHash, timestamps
4. **assessments** — id, title, description, skillId, creatorId, status, difficulty, duration, passingScore, questions (JSON), totalAttempts, averageScore
5. **assessment_attempts** — id, assessmentId, candidateId, score, passed, answers, aiAnalysis, timestamps
6. **jobs** — id, employerId, title, description, company, location, type, salaryMin/Max, requiredSkillIds, preferredSkillIds, status
7. **applications** — id, jobId, candidateId, status (pending/reviewed/shortlisted/rejected/accepted), matchScore, coverLetter
8. **user_skills** — id, userId, skillId, proficiencyLevel, isVerified, verifiedAt, credentialId
9. **blockchain_transactions** — id, userId, txHash, type, status, metadata
10. **notifications** — id, userId, title, message, type, isRead, link, createdAt

---

## Authentication

- NextAuth.js with Credentials provider
- JWT session strategy (30-day expiry)
- Passwords hashed with bcryptjs
- Session includes: id, email, name, role, walletAddress
- 4 roles: candidate, employer, institution, admin

---

## Smart Contract (SkillCredential.sol)

- ERC721 NFT on Polygon Amoy testnet
- Functions: issueCredential, verifyCredential, revokeCredential
- Issuer role management (only authorized issuers can mint)
- Events: CredentialIssued, CredentialRevoked
- Each credential stores: holder address, issuer address, credential hash, timestamp, validity

---

## API Routes (22 Endpoints)

### Auth
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/[...nextauth]` — NextAuth signin/signout

### Credentials
- `GET /api/credentials` — List credentials (role-filtered)
- `POST /api/credentials` — Issue new credential (institutions only)
- `GET /api/credentials/[id]` — Get single credential

### Assessments
- `GET /api/assessments` — List assessments
- `POST /api/assessments` — Create assessment (institutions only)
- `GET /api/assessments/[id]` — Get single assessment
- `POST /api/assessments/submit` — Submit answers, get AI-graded results
- `GET /api/assessments/attempts` — Get user's assessment attempts

### Jobs
- `GET /api/jobs` — List open jobs
- `POST /api/jobs` — Post new job (employers only)
- `GET /api/jobs/[id]` — Get single job
- `PATCH /api/jobs/[id]` — Update job
- `DELETE /api/jobs/[id]` — Delete job
- `POST /api/jobs/apply` — Apply to job with ML match scoring
- `GET /api/jobs/applications` — List applications (role-filtered)
- `PATCH /api/jobs/applications` — Update application status (employers)

### Users
- `GET /api/users/profile` — Get current user profile + skills + stats
- `PATCH /api/users/profile` — Update profile (name, bio, walletAddress)
- `GET /api/users/dashboard` — Role-specific dashboard stats

### Other
- `GET /api/skills` — List all skills
- `POST /api/matching` — ML job recommendations
- `POST /api/blockchain/issue` — Issue credential on-chain with IPFS
- `POST /api/blockchain/verify` — Verify credential on-chain
- `GET /api/analytics` — Platform analytics from real DB data
- `GET /api/admin/stats` — Admin platform statistics
- `GET/PATCH /api/admin/users` — Admin user management
- `GET/PATCH /api/notifications` — User notifications

---

## ML Job Matching Algorithm

- Required skills weighted at 0.7, preferred at 0.3
- Proficiency level comparison (candidateLevel / requiredLevel)
- 1.25x multiplier for blockchain-verified skills
- Confidence score based on skill coverage
- Returns: overallScore, skillBreakdown, verifiedBonus, recommendation, confidence
- Supports: rankCandidatesForJob, recommendJobsForCandidate

---

## Assessment Engine

### Question Bank (150 questions)
- **10 skills**: JavaScript, Python, Solidity, React, TypeScript, Node.js, Docker, AWS, Rust, Go
- **3 difficulty tiers each**: Beginner (10pts), Intermediate (15pts), Advanced (20pts)
- **5 questions per tier** = 15 per skill, 150 total

### AI Analysis
- Difficulty-weighted scoring (easy vs hard accuracy tracked separately)
- 5-tier recommendation system:
  - 95%+: Expert ready, suggest mentoring
  - 85-94%: Strong, review specific weak topics
  - 70-84%: Good foundation, practice more
  - 50-69%: Needs strengthening, structured learning
  - Below 50%: Review fundamentals
- Confidence scoring formula combining accuracy + difficulty performance

---

## IPFS Integration

- `uploadToIPFS()` — Uploads JSON metadata to Pinata IPFS
- `buildCredentialMetadata()` — Builds NFT-standard metadata with attributes
- `getIPFSUrl()` — Resolves IPFS hash to gateway URL
- Fallback: generates deterministic SHA-256 hash when API keys not configured
- Credential metadata includes: name, description, issuer, skills, attributes, issuedAt

---

## Notifications System

- Database table with userId, title, message, type, isRead, link
- `createNotification()` server helper used across API routes
- Triggers on:
  - Job application submitted → notifies employer
  - Assessment completed → notifies candidate
  - Application status changed → notifies candidate
- Navbar bell icon with unread count badge
- Dropdown panel with notification list + "Mark all read"

---

## Frontend Pages (10 pages)

### 1. Landing Page (`/`)
- Hero with gradient heading and CTA buttons
- Feature showcase (6 cards)
- Role descriptions (candidate/employer/institution)
- Platform stats counters
- Footer CTA

### 2. Sign In (`/auth/signin`)
- Email + password form
- Error handling
- Link to sign up

### 3. Sign Up (`/auth/signup`)
- Role selection cards (candidate/employer/institution)
- Registration form (name, email, password, organization)
- Redirects to signin on success

### 4. Dashboard (`/dashboard`)
- **Candidate**: credential count, verified count, assessments taken, avg score, job matches, blockchain verifications, quick action buttons
- **Employer**: total jobs, applications received, active jobs
- **Institution**: issued credentials, verified credentials

### 5. Credentials (`/credentials`)
- Credential card grid with status badges (pending/verified/rejected/revoked)
- Credential detail modal with blockchain hash, token ID, IPFS hash
- Institution view: issue new credentials form

### 6. Assessments (`/assessments`)
- Browse available assessments with difficulty/duration
- Timed assessment runner with countdown
- Question display with option selection
- Navigation dots for question jumping
- Results view: score, pass/fail, strength areas, weakness areas, AI recommendations

### 7. Jobs (`/jobs`)
- **Candidate tabs**: Browse jobs (search/filter), My Applications (status tracker), Recommended (ML matches)
- **Employer view**: Posted jobs list, Post Job dialog
- Job detail modal with apply dialog + cover letter
- Match score display after applying
- "Manage Applications" link for employers

### 8. Jobs Applications (`/jobs/applications`)
- Employer-only page
- All applications across all posted jobs
- Match score progress bars (color-coded)
- Cover letter preview
- Shortlist / Accept / Reject buttons per application
- Status badges

### 9. Profile (`/profile`)
- **Overview tab**: Avatar, name, email, role, org, member since, credential/assessment counts, edit profile form
- **Wallet section**: MetaMask connect button + manual address entry
- **Skills tab** (candidates): Skill cards with proficiency bars, verified badges
- **Activity tab**: Recent credentials, assessment attempts, job applications
- **Settings tab**: Change password, delete account (danger zone)

### 10. Verify (`/verify`)
- Public page (no auth required conceptually, but behind auth guard)
- Search by token ID or transaction hash
- Verification result: valid/revoked/not found
- Credential details grid (holder, issuer, date, skills)
- How-it-works explanation
- Recent verifications list

### 11. Analytics (`/analytics`)
- 6 overview stat cards (live from DB): total credentials, assessments, active jobs, verified skills, users, avg match score
- 6 chart tabs (all from real DB data):
  - Skills Demand (bar chart — top skills across job postings)
  - Verification Trend (area chart — 6-month blockchain verifications)
  - Assessment Performance (grouped bar — pass rate + avg score by category)
  - Credential Distribution (pie chart + breakdown bars by type)
  - Job Market (dual area chart — postings vs applications over 6 months)
  - Match Score Distribution (bar chart + insight cards)

### 12. Admin (`/admin`)
- Admin-only (redirects non-admins)
- **Overview tab**: 10 stat cards (users by role, credentials, assessments, jobs, blockchain txs), recent users list
- **Manage Users tab**: Full user table with name, email, role, verified status, join date, actions (verify/unverify toggle, role dropdown)

---

## UI Component Library (16 components)

All built on Radix UI with Tailwind styling:
Button, Input, Textarea, Card (Header/Title/Description/Content/Footer), Badge (default/secondary/success/warning/destructive/outline), Select, Dialog, Tabs, Progress, Avatar, Label, Toast, Separator

Custom components:
- Navbar (desktop + mobile, notification bell, role-based admin link)
- Footer
- Sidebar
- WalletConnect (MetaMask integration)

---

## Folder Structure

```
├── contracts/
│   └── SkillCredential.sol
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Landing
│   │   ├── layout.tsx                      # Root layout
│   │   ├── globals.css                     # Styles
│   │   ├── auth/signin/page.tsx            # Sign in
│   │   ├── auth/signup/page.tsx            # Sign up
│   │   ├── dashboard/page.tsx              # Role dashboard
│   │   ├── credentials/page.tsx            # Credentials
│   │   ├── assessments/page.tsx            # Assessments
│   │   ├── jobs/page.tsx                   # Jobs marketplace
│   │   ├── jobs/applications/page.tsx      # Employer app mgmt
│   │   ├── profile/page.tsx                # User profile
│   │   ├── verify/page.tsx                 # Public verification
│   │   ├── analytics/page.tsx              # Platform analytics
│   │   ├── admin/page.tsx                  # Admin dashboard
│   │   └── api/                            # 22 API routes
│   │       ├── auth/signup/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── credentials/route.ts
│   │       ├── credentials/[id]/route.ts
│   │       ├── assessments/route.ts
│   │       ├── assessments/[id]/route.ts
│   │       ├── assessments/submit/route.ts
│   │       ├── assessments/attempts/route.ts
│   │       ├── jobs/route.ts
│   │       ├── jobs/[id]/route.ts
│   │       ├── jobs/apply/route.ts
│   │       ├── jobs/applications/route.ts
│   │       ├── matching/route.ts
│   │       ├── skills/route.ts
│   │       ├── blockchain/issue/route.ts
│   │       ├── blockchain/verify/route.ts
│   │       ├── users/profile/route.ts
│   │       ├── users/dashboard/route.ts
│   │       ├── analytics/route.ts
│   │       ├── admin/stats/route.ts
│   │       ├── admin/users/route.ts
│   │       └── notifications/route.ts
│   ├── components/
│   │   ├── ui/                             # 16 Radix components
│   │   ├── layout/navbar.tsx               # Navbar + notifications
│   │   ├── layout/footer.tsx
│   │   ├── layout/sidebar.tsx
│   │   ├── wallet-connect.tsx              # MetaMask integration
│   │   └── providers.tsx                   # Session + Toast providers
│   ├── db/
│   │   ├── schema.ts                       # 9 tables + relations
│   │   └── index.ts                        # Neon DB connection
│   └── lib/
│       ├── auth.ts                         # NextAuth config
│       ├── blockchain.ts                   # Ethers.js integration
│       ├── matching.ts                     # ML matching algorithm
│       ├── ipfs.ts                         # Pinata IPFS upload
│       ├── notifications.ts               # Notification helper
│       ├── utils.ts                        # Helpers + 150 question bank
│       └── validations.ts                  # Zod schemas
├── package.json
├── .env.example
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## Environment Variables

```
DATABASE_URL=           # Neon PostgreSQL connection string
NEXTAUTH_SECRET=        # Random string for JWT signing
NEXTAUTH_URL=           # App URL (http://localhost:3000)
BLOCKCHAIN_RPC_URL=     # Polygon Amoy RPC endpoint
BLOCKCHAIN_PRIVATE_KEY= # Issuer wallet private key
CONTRACT_ADDRESS=       # Deployed contract address
IPFS_API_KEY=           # Pinata API key (optional)
IPFS_API_SECRET=        # Pinata API secret (optional)
```

---

## Setup Commands

```bash
npm install                 # Install dependencies
cp .env.example .env        # Create env file
# Edit .env with your values
npx drizzle-kit push        # Push schema to database
npm run dev                 # Start dev server at localhost:3000
npm run build               # Production build
npm run start               # Start production server
```

---

## Git History Summary

- 151 total commits
- Phase 1-9 (commits 1-117): Backend + foundation + landing/auth/dashboard = 50%
- Phase 10-16 (commits 118-151): All feature pages + extras = remaining 50%
- Final commit: `dbe192d` — all features complete, build passes with 0 errors
