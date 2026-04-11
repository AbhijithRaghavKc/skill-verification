# SkillChain — Complete Technical Guide

## AI-Powered Assessment & ML Job Matching Platform

> This guide covers **everything except the blockchain/smart contract layer**. It documents the frontend, backend, database, AI assessment engine, ML matching algorithm, Python evaluation scripts, and step-by-step instructions to run every part of the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Layer](#4-database-layer)
5. [Authentication System](#5-authentication-system)
6. [AI-Powered Assessment Engine](#6-ai-powered-assessment-engine)
7. [ML Job Matching Algorithm](#7-ml-job-matching-algorithm)
8. [Backend API Routes](#8-backend-api-routes)
9. [Frontend Pages](#9-frontend-pages)
10. [UI Components](#10-ui-components)
11. [Notifications System](#11-notifications-system)
12. [Python Evaluation Scripts](#12-python-evaluation-scripts)
13. [How to Run Everything](#13-how-to-run-everything)
14. [Folder Structure](#14-folder-structure)

---

## 1. Project Overview

### What Is SkillChain?

SkillChain is a full-stack platform that solves credential fraud and inefficient skill verification in the job market. It integrates three technologies:

- **AI Assessment Engine** — Tests candidates across 10 technical skills with 150 questions using difficulty-weighted scoring and a 5-tier recommendation system
- **ML Job Matching** — Matches candidates to jobs using a weighted algorithm (0.7 required / 0.3 preferred) with a 1.25x multiplier for blockchain-verified skills
- **Full-Stack Web Application** — 12 pages, 22+ API routes, 4 user roles, real-time notifications, analytics dashboard

### The Core Pipeline

```
Candidate takes assessment
        ↓
AI grades with difficulty-weighted scoring
        ↓
If passed → skill marked as "verified" in database
        ↓
Candidate applies to job
        ↓
ML algorithm computes match score (verified skills get 1.25x bonus)
        ↓
Employer sees ranked candidates with match scores
```

### Four User Roles

| Role | Can Do |
|------|--------|
| **Candidate** | Take assessments, view credentials, apply to jobs, see ML recommendations |
| **Employer** | Post jobs, view applications with match scores, shortlist/accept/reject candidates |
| **Institution** | Create assessments, issue credentials to candidates |
| **Admin** | Manage all users, view platform statistics, verify/unverify users, change roles |

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                        │
│  Next.js 14 │ React 18 │ TypeScript │ Tailwind CSS         │
│  12 Pages │ 16 UI Components │ Framer Motion Animations    │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTP (REST API)
┌──────────────────────────┴─────────────────────────────────┐
│                    BACKEND (Server)                          │
│  Next.js API Routes │ NextAuth.js (JWT) │ Zod Validation    │
│  22+ Endpoints │ Role-Based Access Control                  │
└────────┬──────────────────────────┬────────────────────────┘
         │                          │
┌────────┴─────────┐    ┌──────────┴───────────┐
│   PostgreSQL DB   │    │   AI / ML Engine      │
│   Neon Serverless │    │   150 Questions Bank  │
│   Drizzle ORM     │    │   Difficulty Scoring  │
│   10 Tables       │    │   Weighted Matching   │
└──────────────────┘    └──────────────────────┘
```

### Why These Choices?

- **Next.js 14** — Combines frontend and backend in one framework. Server-side rendering for SEO, API routes for backend logic, file-based routing for simplicity.
- **Neon Serverless PostgreSQL** — Scales to zero when idle (free tier), auto-scales under load, full SQL support with relational integrity.
- **Drizzle ORM** — Type-safe queries in TypeScript, lightweight (no heavy runtime), native Neon support.
- **NextAuth.js** — Battle-tested authentication with JWT strategy. 30-day sessions, role-based access, custom pages.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js | 14.2.35 | React framework with SSR + API routes |
| Frontend | React | 18 | Component-based UI |
| Frontend | TypeScript | 5 | Type safety |
| Frontend | Tailwind CSS | 3.4.1 | Utility-first CSS |
| Frontend | Framer Motion | 12.34.0 | Smooth page animations |
| Frontend | Recharts | 3.7.0 | Charts for analytics dashboard |
| UI | Radix UI | Various | Accessible, unstyled UI primitives |
| UI | Lucide React | 0.563.0 | Icon library |
| Backend | NextAuth.js | 4.24.13 | Authentication (JWT) |
| Backend | Zod | 4.3.6 | Runtime schema validation |
| Backend | bcryptjs | 3.0.3 | Password hashing |
| Database | PostgreSQL | Neon | Serverless relational database |
| Database | Drizzle ORM | 0.45.1 | Type-safe database queries |
| Evaluation | Python | 3.x | ML/AI evaluation scripts |
| Evaluation | scikit-learn | 1.4.1 | Classification metrics |
| Evaluation | matplotlib | 3.8.3 | Graph generation |
| Evaluation | seaborn | 0.13.2 | Statistical visualisation |
| Evaluation | pandas | 2.2.1 | Data analysis |
| Evaluation | numpy | 1.26.4 | Numerical computing |

---

## 4. Database Layer

### 4.1 Connection Setup

**File: `src/db/index.ts`**

The database connects to Neon Serverless PostgreSQL using the `@neondatabase/serverless` driver with Drizzle ORM:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 4.2 Schema (10 Tables)

**File: `src/db/schema.ts`**

#### Enums
```
user_role:         candidate | employer | institution | admin
credential_status: pending | verified | rejected | revoked
assessment_status: draft | active | completed | expired
job_status:        open | closed | filled | draft
application_status: pending | reviewed | shortlisted | rejected | accepted
```

#### Table: `users`
Central user table for all four roles.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| passwordHash | TEXT | NOT NULL (bcrypt) |
| role | user_role ENUM | NOT NULL, default "candidate" |
| walletAddress | VARCHAR(42) | Optional (Ethereum address) |
| avatar | TEXT | Optional |
| bio | TEXT | Optional |
| organizationName | VARCHAR(255) | Optional (for employers/institutions) |
| isVerified | BOOLEAN | Default false |
| createdAt | TIMESTAMP | Auto, NOT NULL |
| updatedAt | TIMESTAMP | Auto, NOT NULL |

#### Table: `skills`
Master skill catalogue.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | UNIQUE, NOT NULL |
| category | VARCHAR(100) | NOT NULL |
| description | TEXT | Optional |

#### Table: `credentials`
Credentials issued by institutions to candidates.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| candidateId | UUID | FK → users.id, NOT NULL |
| issuerId | UUID | FK → users.id, NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | Optional |
| type | VARCHAR(100) | NOT NULL (certification, degree, etc.) |
| status | credential_status | NOT NULL, default "pending" |
| skillIds | JSONB | Array of skill UUIDs |
| metadata | JSONB | Additional data |
| blockchainTxHash | VARCHAR(66) | Polygon tx hash (optional) |
| tokenId | VARCHAR(78) | NFT token ID (optional) |
| ipfsHash | VARCHAR(100) | IPFS metadata hash (optional) |
| issuedAt | TIMESTAMP | Optional |
| expiresAt | TIMESTAMP | Optional |

#### Table: `assessments`
Skill assessments created by institutions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | Optional |
| skillId | UUID | FK → skills.id, NOT NULL |
| creatorId | UUID | FK → users.id, NOT NULL |
| status | assessment_status | NOT NULL, default "draft" |
| difficulty | VARCHAR(20) | NOT NULL (beginner/intermediate/advanced) |
| duration | INTEGER | NOT NULL (minutes) |
| passingScore | INTEGER | NOT NULL, default 70 |
| questions | JSONB | Array of question objects |
| totalAttempts | INTEGER | Default 0 |
| averageScore | REAL | Default 0 |

**Question object structure stored in JSONB:**
```typescript
{
  id: string;          // "js-b-1"
  question: string;    // "What is the output of typeof null?"
  options: string[];   // ["null", "undefined", "object", "boolean"]
  correctAnswer: number; // 2 (index)
  explanation: string; // "typeof null returns 'object'..."
  points: number;      // 10 | 15 | 20
}
```

#### Table: `assessment_attempts`
Each time a candidate takes an assessment.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| assessmentId | UUID | FK → assessments.id |
| candidateId | UUID | FK → users.id |
| score | REAL | Percentage (0-100) |
| passed | BOOLEAN | Whether score >= passingScore |
| answers | JSONB | `{ questionId: selectedOptionIndex }` |
| aiAnalysis | JSONB | AI-generated analysis object |
| startedAt | TIMESTAMP | Auto |
| completedAt | TIMESTAMP | Set on submission |

**AI Analysis object stored in JSONB:**
```typescript
{
  strengthAreas: string[];     // Topics answered correctly
  weaknessAreas: string[];     // Topics answered incorrectly
  recommendations: string[];   // AI-generated study advice
  confidenceScore: number;     // 0-100 confidence in assessment
  detailedBreakdown: Record<string, number>; // Per-topic scores
}
```

#### Table: `jobs`
Job postings by employers.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| employerId | UUID | FK → users.id |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | NOT NULL |
| company | VARCHAR(255) | NOT NULL |
| location | VARCHAR(255) | Optional |
| type | VARCHAR(50) | full-time/part-time/contract/remote |
| salaryMin | INTEGER | Optional |
| salaryMax | INTEGER | Optional |
| requiredSkillIds | JSONB | Array of skill UUIDs |
| preferredSkillIds | JSONB | Array of skill UUIDs |
| status | job_status | default "open" |

#### Table: `applications`
Job applications with ML match scores.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| jobId | UUID | FK → jobs.id |
| candidateId | UUID | FK → users.id |
| status | application_status | default "pending" |
| matchScore | REAL | ML-computed (0-100) |
| coverLetter | TEXT | Optional |

#### Table: `user_skills`
Links users to skills with proficiency and verification status.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| skillId | UUID | FK → skills.id |
| proficiencyLevel | INTEGER | 1-5 scale |
| isVerified | BOOLEAN | default false |
| verifiedAt | TIMESTAMP | When verified |
| credentialId | UUID | FK → credentials.id (optional) |

#### Table: `blockchain_transactions`
Audit log of on-chain interactions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| txHash | VARCHAR(66) | UNIQUE |
| type | VARCHAR(50) | issue/verify/revoke |
| status | VARCHAR(20) | pending/confirmed/failed |
| metadata | JSONB | Optional |

#### Table: `notifications`
In-app notification system.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| title | VARCHAR(255) | NOT NULL |
| message | TEXT | NOT NULL |
| type | VARCHAR(50) | assessment/credential/application |
| isRead | BOOLEAN | default false |
| link | VARCHAR(500) | Navigation target |

### 4.3 Relationships

```
users 1──< many credentials (as candidate)
users 1──< many credentials (as issuer)
users 1──< many assessment_attempts
users 1──< many jobs (as employer)
users 1──< many applications (as candidate)
users 1──< many user_skills
users 1──< many notifications
users 1──< many blockchain_transactions
skills 1──< many assessments
skills 1──< many user_skills
assessments 1──< many assessment_attempts
jobs 1──< many applications
credentials 1──< many user_skills (verification link)
```

---

## 5. Authentication System

**Files: `src/lib/auth.ts`, `src/app/api/auth/signup/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`**

### Registration Flow

1. User fills sign-up form: name, email, password, role, (optional) organization
2. `POST /api/auth/signup` validates input with Zod:
   ```typescript
   const signUpSchema = z.object({
     name: z.string().min(2).max(255),
     email: z.string().email(),
     password: z.string().min(8).max(100),
     role: z.enum(["candidate", "employer", "institution"]),
     organizationName: z.string().max(255).optional(),
   });
   ```
3. Password hashed with `bcryptjs` (never stored as plain text)
4. User inserted into PostgreSQL
5. Redirect to sign-in page

### Login Flow

1. User submits email + password to NextAuth
2. `authorize()` callback:
   - Queries user by email from database
   - Compares password with `bcrypt.compare()`
   - Returns user object or `null`
3. JWT token generated with: id, email, name, role, walletAddress
4. Cookie set with 30-day expiry

### Session Object

Every authenticated API route can access:
```typescript
{
  user: {
    id: string;          // UUID
    email: string;
    name: string;
    role: "candidate" | "employer" | "institution" | "admin";
    walletAddress?: string;
  }
}
```

### Security

- Passwords: bcrypt-hashed (auto salt)
- Sessions: JWT signed with NEXTAUTH_SECRET, 30-day expiry
- Access control: Every API route checks `session.user.role` before allowing operations
- Validation: All inputs validated with Zod schemas at the API boundary

---

## 6. AI-Powered Assessment Engine

**Files: `src/lib/utils.ts` (question bank + AI analysis), `src/app/api/assessments/submit/route.ts` (grading endpoint)**

### 6.1 Question Bank

The engine contains **150 pre-built questions** across:

| Skill | Beginner (10pts) | Intermediate (15pts) | Advanced (20pts) | Total |
|-------|:---:|:---:|:---:|:---:|
| JavaScript | 5 | 5 | 5 | 15 |
| Python | 5 | 5 | 5 | 15 |
| Solidity | 5 | 5 | 5 | 15 |
| React | 5 | 5 | 5 | 15 |
| TypeScript | 5 | 5 | 5 | 15 |
| Node.js | 5 | 5 | 5 | 15 |
| Docker | 5 | 5 | 5 | 15 |
| AWS | 5 | 5 | 5 | 15 |
| Rust | 5 | 5 | 5 | 15 |
| Go | 5 | 5 | 5 | 15 |
| **Total** | **50** | **50** | **50** | **150** |

Each question is a multiple-choice object:
```typescript
{
  id: "js-b-1",
  question: "What is the output of typeof null?",
  options: ["null", "undefined", "object", "boolean"],
  correctAnswer: 2,       // index → "object"
  explanation: "typeof null returns 'object' due to a historical bug in JavaScript.",
  points: 10              // 10=beginner, 15=intermediate, 20=advanced
}
```

### 6.2 Assessment Creation

When an institution creates an assessment via `POST /api/assessments`:

1. They specify: skill, difficulty, duration, passing score
2. `generateAssessmentQuestions(skillName, difficulty, count)` is called
3. It pulls from the question bank for that skill/difficulty
4. Questions are shuffled randomly
5. Stored as JSONB in the `assessments.questions` column

### 6.3 Difficulty-Weighted Scoring

The `analyzeAssessmentResults()` function scores answers with difficulty weighting:

```
Beginner questions:     10 points each (easy concepts)
Intermediate questions: 15 points each (moderate depth)
Advanced questions:     20 points each (expert-level)

Score = (earned_points / total_points) × 100
```

**Example:** A candidate answers 15 questions:
- Gets 5/5 beginner correct: 50 points
- Gets 3/5 intermediate correct: 45 points
- Gets 1/5 advanced correct: 20 points
- Total: 115 / 225 = 51.1%

The weighting means advanced questions contribute disproportionately — a candidate who only knows basics will score lower even with perfect beginner answers.

### 6.4 AI Analysis Generation

After scoring, the function generates a complete analysis:

**Strength/Weakness Detection:**
- Tracks which questions were answered correctly vs incorrectly
- Separately tracks beginner accuracy (`easy_correct / easy_total`) and advanced accuracy (`hard_correct / hard_total`)

**5-Tier Recommendation System:**

| Score | Tier | Recommendations Generated |
|-------|------|---------------------------|
| 95%+ | Expert | "Outstanding mastery. Ready for expert-level challenges." / "Consider mentoring others." |
| 85-94% | Strong | "Strong performance. Deep understanding of core concepts." / "Try advanced-level assessments." |
| 70-84% | Good | "Good foundational knowledge with room for improvement." / "Practice with real-world projects." |
| 50-69% | Developing | "Basic understanding. Strengthen core concepts." / "Consider structured learning resources." |
| <50% | Foundational | "Significant knowledge gaps. Start with beginner materials." / "Focus on core principles." |

**Confidence Score Formula:**
```
confidence = min(
  accuracy × 60
  + (easy_accuracy × 20)      // weighted beginner performance
  + (hard_accuracy × 20),     // weighted advanced performance
  100
)
```

This means a candidate who aces beginner questions but fails advanced ones gets a lower confidence score than one who performs consistently across all levels.

### 6.5 Post-Assessment Pipeline

When `POST /api/assessments/submit` is called:

```
1. Validate input (Zod schema: { assessmentId, answers })
2. Fetch assessment questions from DB
3. Run analyzeAssessmentResults(answers, questions)
4. Insert assessment_attempt record with score + aiAnalysis
5. Increment assessment.totalAttempts
6. IF passed (score >= 70):
   → Create user_skill record with isVerified=true
   → proficiencyLevel = ceil(score / 20)  [maps 70-100 to levels 4-5]
7. Send notification to candidate
8. Return { score, passed, analysis }
```

---

## 7. ML Job Matching Algorithm

**File: `src/lib/matching.ts`**

### 7.1 Algorithm Overview

The matching algorithm computes a compatibility score (0-100) between a candidate's skill profile and a job's requirements. The key innovation is the **1.25x blockchain verification bonus**.

### 7.2 Parameters

```typescript
const requiredWeight     = 0.7;    // Required skills = 70% of score
const preferredWeight    = 0.3;    // Preferred skills = 30% of score
const verifiedMultiplier = 1.25;   // 25% bonus for verified skills
```

### 7.3 Step-by-Step Algorithm

**Input:**
```typescript
candidate: {
  skills: [
    { skillId: "s1", skillName: "React", proficiencyLevel: 4, isVerified: true },
    { skillId: "s2", skillName: "Node.js", proficiencyLevel: 3, isVerified: false },
  ]
}

job: {
  requiredSkills:  [{ skillId: "s1", skillName: "React", minLevel: 3 }],
  preferredSkills: [{ skillId: "s2", skillName: "Node.js", minLevel: 4 }],
}
```

**Step 1 — Score each required skill:**
```
For each required skill:
  IF candidate has the skill:
    skillScore = min(candidateLevel / requiredLevel, 1.2) × 100
    IF skill is blockchain-verified:
      skillScore = min(skillScore × 1.25, 100)
      verifiedCount++
  ELSE:
    skillScore = 0
```

**Step 2 — Score each preferred skill:**
Same formula as required skills.

**Step 3 — Normalise:**
```
normalizedRequired  = requiredScore  / (numRequiredSkills × 100)
normalizedPreferred = preferredScore / (numPreferredSkills × 100)
```

**Step 4 — Calculate verified bonus:**
```
verifiedBonus = (verifiedCount / totalSkills) × 10
```
Up to 10 extra points based on what percentage of skills are blockchain-verified.

**Step 5 — Overall score:**
```
overallScore = min(
  round((normalizedRequired × 0.7 + normalizedPreferred × 0.3) × 100 + verifiedBonus),
  100
)
```

**Step 6 — Confidence:**
```
confidence = (skillsWhereCandiateHasAnyExperience / totalSkills) × 100
```

**Step 7 — Recommendation:**
```
85+  → "Excellent match. Candidate strongly recommended."
70-84 → "Good match. Candidate meets most requirements."
50-69 → "Partial match. Candidate may need additional skill development."
<50   → "Low match. Significant skill gaps identified."
```

### 7.4 Worked Example

**Candidate:** React level 4 (verified), Node.js level 3 (unverified)
**Job:** Required: React min 3. Preferred: Node.js min 4.

```
React (required):
  skillScore = min(4/3, 1.2) × 100 = 120 → capped at 120
  verified: 120 × 1.25 = 150 → capped at 100
  requiredScore = 100

Node.js (preferred):
  skillScore = min(3/4, 1.2) × 100 = 75
  not verified: stays 75
  preferredScore = 75

normalizedRequired  = 100 / 100 = 1.0
normalizedPreferred = 75 / 100  = 0.75
verifiedBonus = (1/2) × 10 = 5

overallScore = min(round((1.0 × 0.7 + 0.75 × 0.3) × 100 + 5), 100)
             = min(round(70 + 22.5 + 5), 100)
             = min(98, 100)
             = 98 → "Excellent match"

confidence = (2/2) × 100 = 100%
```

### 7.5 Utility Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `calculateJobMatch(candidate, job)` | Core matching for one pair | MatchResult object |
| `rankCandidatesForJob(candidates[], job)` | Rank multiple candidates | Sorted array by score (desc) |
| `recommendJobsForCandidate(candidate, jobs[])` | Rank jobs for one candidate | Sorted array by score (desc) |

### 7.6 Match Result Object

```typescript
{
  overallScore: 98,
  skillBreakdown: [
    { skillName: "React", matchScore: 100, isVerified: true, candidateLevel: 4, requiredLevel: 3 },
    { skillName: "Node.js", matchScore: 75, isVerified: false, candidateLevel: 3, requiredLevel: 4 },
  ],
  verifiedBonus: 5,
  recommendation: "Excellent match. Candidate strongly recommended.",
  confidence: 100,
}
```

---

## 8. Backend API Routes

**22+ RESTful endpoints** in `src/app/api/`. All use JSON responses, Zod validation, and JWT auth.

### Auth

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/signup` | No | Register (name, email, password, role) |
| POST | `/api/auth/[...nextauth]` | No | Sign in / sign out (NextAuth handler) |

### Assessments

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/assessments` | Yes | List all active assessments |
| POST | `/api/assessments` | Institution | Create assessment with auto-generated question bank |
| GET | `/api/assessments/[id]` | Yes | Get single assessment with questions |
| POST | `/api/assessments/submit` | Candidate | Submit answers → AI grading → score + analysis |
| GET | `/api/assessments/attempts` | Yes | Get logged-in user's attempt history |

**Submit flow detail:**
```
POST /api/assessments/submit
Body: { assessmentId: "uuid", answers: { "js-b-1": 2, "js-b-2": 1, ... } }

→ Fetches assessment questions
→ Runs analyzeAssessmentResults()
→ Creates assessment_attempt record
→ If passed: creates verified user_skill
→ Sends notification
→ Returns: { score: 85, passed: true, analysis: { strengths, weaknesses, recommendations } }
```

### Jobs

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/jobs` | Yes | List open jobs (searchable) |
| POST | `/api/jobs` | Employer | Post new job |
| GET | `/api/jobs/[id]` | Yes | Get single job |
| PATCH | `/api/jobs/[id]` | Employer (owner) | Update job |
| DELETE | `/api/jobs/[id]` | Employer (owner) | Delete job |
| POST | `/api/jobs/apply` | Candidate | Apply to job → ML matching → score |
| GET | `/api/jobs/applications` | Yes | List applications (role-filtered) |
| PATCH | `/api/jobs/applications` | Employer | Update application status |

**Apply flow detail:**
```
POST /api/jobs/apply
Body: { jobId: "uuid", coverLetter: "optional text" }

→ Fetches candidate's skills (including isVerified)
→ Fetches job's required/preferred skills
→ Runs calculateJobMatch()
→ Creates application record with matchScore
→ Notifies employer
→ Returns: { application, matchResult: { overallScore, breakdown, recommendation } }
```

### Credentials

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/credentials` | Yes | List credentials (role-filtered) |
| POST | `/api/credentials` | Institution | Issue credential to candidate |
| GET | `/api/credentials/[id]` | Yes | Get single credential |

### Users

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/users/profile` | Yes | Get profile + skills + stats |
| PATCH | `/api/users/profile` | Yes | Update name, bio, walletAddress |
| GET | `/api/users/dashboard` | Yes | Role-specific dashboard data |

### ML Matching

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/matching` | Candidate | Get ML job recommendations (ranked list) |

### Other

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/skills` | Yes | List all skills |
| GET | `/api/analytics` | Yes | Platform analytics (live from DB) |
| GET | `/api/admin/stats` | Admin | User counts, credential/job/assessment stats |
| GET/PATCH | `/api/admin/users` | Admin | List users, update roles/verification |
| GET/PATCH | `/api/notifications` | Yes | Get notifications, mark as read |

### Zod Validation Schemas

**File: `src/lib/validations.ts`**

Every API input is validated:

```typescript
signUpSchema:        { name, email, password, role, organizationName? }
credentialSchema:    { candidateId, title, description?, type, skillIds[], expiresAt?, metadata? }
assessmentSchema:    { title, description?, skillId, difficulty, duration, passingScore? }
assessmentSubmissionSchema: { assessmentId, answers: Record<string, number> }
jobSchema:           { title, description, company, location?, type, salaryMin?, salaryMax?, requiredSkillIds[], preferredSkillIds[] }
applicationSchema:   { jobId, coverLetter? }
profileUpdateSchema: { name?, bio?, walletAddress? }
```

---

## 9. Frontend Pages

### Page 1: Landing Page (`/`)
- Hero section with gradient heading and CTA buttons
- 6 feature cards with Framer Motion scroll animations
- Role descriptions for candidates, employers, institutions
- Live platform stats counters
- Footer with call-to-action

### Page 2: Sign In (`/auth/signin`)
- Email + password form
- Error display for invalid credentials
- Link to sign up

### Page 3: Sign Up (`/auth/signup`)
- Step 1: Role selection (clickable cards for candidate/employer/institution)
- Step 2: Registration form with Zod validation
- Redirects to sign-in on success

### Page 4: Dashboard (`/dashboard`)
**Role-specific stats:**
- **Candidate:** Credential count, verified count, assessments taken, avg score, job matches
- **Employer:** Total jobs posted, applications received, active listings
- **Institution:** Issued credentials, verified credentials

Quick action buttons for each role.

### Page 5: Credentials (`/credentials`)
- Card grid with colour-coded status badges (green=verified, yellow=pending, red=rejected/revoked)
- Detail modal: title, issuer, skills, blockchain hash, token ID, IPFS hash
- Institution view: issue credential form (select candidate, title, skills, type)

### Page 6: Assessments (`/assessments`)
- Browse assessments: skill, difficulty badge, duration, attempt count
- **Timed assessment runner:**
  - Countdown timer
  - Question with 4 radio-button options
  - Navigation dots to jump between questions
  - Submit button
- **Results view:**
  - Score percentage with pass/fail
  - Green strength badges
  - Red weakness badges
  - AI recommendation list

### Page 7: Jobs (`/jobs`)
**Candidate tabs:**
- **Browse:** Search + filter, job cards with company, location, salary, skills
- **My Applications:** Status tracker (pending → reviewed → shortlisted → accepted/rejected)
- **Recommended:** ML-powered recommendations with match score bars

**Employer view:**
- Posted jobs list with application counts
- "Post Job" dialog with full form
- Link to manage applications

### Page 8: Job Applications (`/jobs/applications`)
- Employer-only page
- Application cards with:
  - Candidate info, job title
  - Colour-coded match score bar (green 70+, yellow 50-69, red <50)
  - Cover letter preview
  - Shortlist / Accept / Reject buttons

### Page 9: Profile (`/profile`)
**4 tabs:**
- **Overview:** Avatar, name, email, role, edit form
- **Skills (candidates):** Skill cards with proficiency bars, verified badges
- **Activity:** Recent credentials, assessment attempts, job applications
- **Settings:** Change password, delete account (danger zone)

**Wallet section:** MetaMask connect button + manual address entry

### Page 10: Verify (`/verify`)
- Search by token ID or transaction hash
- Result: Valid (green) / Revoked (red) / Not Found (grey)
- Credential details grid
- "How it works" section

### Page 11: Analytics (`/analytics`)
- 6 stat cards (live from DB): credentials, assessments, jobs, verified skills, users, avg match score
- 6 chart tabs:
  - Skills Demand (bar chart)
  - Verification Trend (area chart)
  - Assessment Performance (grouped bar)
  - Credential Distribution (pie chart)
  - Job Market (dual area chart)
  - Match Score Distribution (bar chart + insights)

### Page 12: Admin (`/admin`)
- **Overview:** 10 stat cards, recent users list
- **Manage Users:** Full user table with verify/unverify toggle, role dropdown

---

## 10. UI Components

### Radix UI Components (16)

| Component | Variants/Features |
|-----------|-------------------|
| Button | default, secondary, destructive, outline, ghost, link; sizes sm/default/lg |
| Input | Text input with consistent border/focus styling |
| Textarea | Multi-line with auto-resize |
| Card | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Badge | default, secondary, success, warning, destructive, outline |
| Select | Dropdown with trigger, content, items |
| Dialog | Modal with overlay, close button, header, content, footer |
| Tabs | TabsList, TabsTrigger, TabsContent |
| Progress | Percentage bar (used for match scores, skill levels) |
| Avatar | Image with fallback initials |
| Label | Accessible form labels |
| Toast | Success/error/info toast notifications |

### Custom Components

| Component | File | Features |
|-----------|------|----------|
| Navbar | `layout/navbar.tsx` | Logo, nav links, notification bell with unread badge, mobile menu, admin link (role-gated) |
| Footer | `layout/footer.tsx` | Links, copyright |
| Sidebar | `layout/sidebar.tsx` | Dashboard side navigation |
| WalletConnect | `wallet-connect.tsx` | MetaMask detection, connection request, address display |
| Providers | `providers.tsx` | SessionProvider (NextAuth) + ToastProvider wrapper |

---

## 11. Notifications System

**File: `src/lib/notifications.ts`**

### Creating Notifications
```typescript
await createNotification({
  userId: "candidate-uuid",
  title: "Assessment Passed!",
  message: "You scored 85% on JavaScript Assessment",
  type: "assessment",
  link: "/profile",
});
```

### Triggers

| Event | Recipient | Example Message |
|-------|-----------|-----------------|
| Assessment completed (pass) | Candidate | "Congratulations! You scored 85% and earned a verified skill." |
| Assessment completed (fail) | Candidate | "You scored 45%. Keep practicing!" |
| Job application submitted | Employer | "New application received for Senior React Developer" |
| Application status changed | Candidate | "Your application was shortlisted/accepted/rejected" |

### Frontend Display
- Bell icon in navbar with red unread count badge
- Dropdown panel with notification list
- Each shows: title, message, time ago, clickable link
- "Mark all read" button

---

## 12. Python Evaluation Scripts

### 12.1 Overview

Two Python scripts replicate the TypeScript algorithms in Python and evaluate them with test data:

| Script | What It Evaluates | Graphs Generated |
|--------|-------------------|-----------------|
| `ml_matching_evaluation.py` | ML matching accuracy, verified vs unverified impact, weight sensitivity | 6 graphs |
| `assessment_evaluation.py` | Scoring accuracy, difficulty weighting, tier classification, per-skill analysis | 6 graphs |

### 12.2 ML Matching Evaluation

**File: `evaluation/ml_matching_evaluation.py`**

**What it does:**
1. Ports the exact `calculateJobMatch()` function from TypeScript to Python
2. Defines 20 curated test cases with human-labelled expected match quality (excellent/good/partial/low)
3. Runs the algorithm on each test case
4. Computes classification metrics: accuracy, precision, recall, F1 score
5. Compares verified vs unverified scores (strips `isVerified` flags and re-runs)
6. Generates 6 graphs

**Test case structure:**
```python
{
    "id": "TC01",
    "desc": "Senior full-stack dev with all verified skills → React/Node/TS job",
    "candidate": [
        {"skillId": "s3", "proficiencyLevel": 5, "isVerified": True},  # React
        {"skillId": "s5", "proficiencyLevel": 5, "isVerified": True},  # Node.js
    ],
    "required": [
        {"skillId": "s3", "skillName": "React", "minLevel": 4},
    ],
    "preferred": [
        {"skillId": "s5", "skillName": "Node.js", "minLevel": 3},
    ],
    "expected_label": "excellent",  # Human judgement
}
```

**Graphs generated:**

| Graph | File | What It Shows |
|-------|------|---------------|
| Confusion Matrix | `confusion_matrix.png` | Predicted vs actual match labels |
| Score Distribution | `score_distribution.png` | Per-test-case scores coloured by label |
| Verified vs Unverified | `verified_vs_unverified.png` | Side-by-side bars: impact of 1.25x bonus |
| Score Histogram | `score_histogram.png` | Distribution of all match scores |
| Confidence vs Score | `confidence_vs_score.png` | Scatter plot: does confidence correlate with score? |
| Weight Sensitivity | `weight_sensitivity.png` | How score changes with different weights and multipliers |

### 12.3 Assessment Engine Evaluation

**File: `evaluation/assessment_evaluation.py`**

**What it does:**
1. Ports `analyzeAssessmentResults()` from TypeScript to Python
2. Simulates 500 assessment attempts (10 skills × 5 performance levels × 10 runs)
3. Each simulation generates realistic answer patterns based on the performance level
4. Evaluates: scoring accuracy, difficulty weighting effect, tier classification accuracy
5. Generates 6 graphs

**Performance level simulation:**
```
Expert:     90-100% easy, 85-95% medium, 80-90% hard
Strong:     85-95%  easy, 70-85% medium, 60-80% hard
Good:       75-90%  easy, 55-75% medium, 40-60% hard
Developing: 60-80%  easy, 35-55% medium, 20-40% hard
Beginner:   40-60%  easy, 15-35% medium, 5-20%  hard
```

**Graphs generated:**

| Graph | File | What It Shows |
|-------|------|---------------|
| Score Distribution | `assessment_score_distribution.png` | Box plots by performance level |
| Pass Rate by Skill | `pass_rate_by_skill.png` | Horizontal bars per skill |
| Difficulty Heatmap | `difficulty_accuracy_heatmap.png` | Accuracy by level × tier |
| Tier Confusion Matrix | `tier_confusion_matrix.png` | AI tier prediction accuracy |
| Score vs Confidence | `assessment_score_vs_confidence.png` | Scatter coloured by level |
| Score per Skill by Level | `score_per_skill_by_level.png` | Grouped bars per skill |

---

## 13. How to Run Everything

### 13.1 Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **Python 3.8+** — [Download](https://python.org)
- **npm** (comes with Node.js)
- **A Neon database** — Free tier at [neon.tech](https://neon.tech)

### 13.2 Install & Setup

```bash
# 1. Clone the repo
git clone <repository-url>
cd blockchain-skill-verification-platform

# 2. Install Node.js dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

### 13.3 Configure Environment Variables

Edit `.env`:

```env
# REQUIRED — without these the app won't start
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**How to get each value:**

| Variable | How |
|----------|-----|
| `DATABASE_URL` | Sign up at neon.tech → Create project → Copy connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local |

### 13.4 Setup Database

```bash
# Push schema (creates all 10 tables + enums + relations)
npx drizzle-kit push
```

This connects to your Neon database and creates:
- 5 enums (user_role, credential_status, assessment_status, job_status, application_status)
- 10 tables (users, skills, credentials, assessments, assessment_attempts, jobs, applications, user_skills, blockchain_transactions, notifications)
- All foreign key relationships

### 13.5 Run the Web Application

```bash
# Development mode (with hot reload)
npm run dev

# Open in browser
open http://localhost:3000
```

**Production build:**
```bash
npm run build    # Compiles optimised production build
npm run start    # Starts production server on port 3000
```

**Lint code:**
```bash
npm run lint     # Runs ESLint
```

### 13.6 Run Python Evaluation Scripts

```bash
# 1. Install Python dependencies
pip install -r evaluation/requirements.txt

# If you get PEP 668 error on macOS:
pip install --break-system-packages -r evaluation/requirements.txt

# Or use a virtual environment (recommended):
python3 -m venv venv
source venv/bin/activate
pip install -r evaluation/requirements.txt
```

#### Run ML Matching Evaluation

```bash
python3 evaluation/ml_matching_evaluation.py
```

**Output:**
- Prints test case results table (20 cases)
- Prints classification metrics (accuracy, precision, recall, F1)
- Prints verified vs unverified impact analysis
- Saves 6 graphs to `evaluation/graphs/`
- Saves `ml_matching_results.json`

#### Run Assessment Engine Evaluation

```bash
python3 evaluation/assessment_evaluation.py
```

**Output:**
- Prints simulation overview (500 simulations)
- Prints scoring accuracy by performance level
- Prints difficulty-weighted analysis
- Prints tier classification accuracy
- Prints per-skill analysis
- Saves 6 graphs to `evaluation/graphs/`
- Saves `assessment_results.json`

### 13.7 View Generated Graphs

All graphs are saved as PNG files in `evaluation/graphs/`:

```bash
# List all generated files
ls evaluation/graphs/

# Open all graphs (macOS)
open evaluation/graphs/*.png

# Or open specific ones:
open evaluation/graphs/confusion_matrix.png
open evaluation/graphs/verified_vs_unverified.png
open evaluation/graphs/assessment_score_distribution.png
open evaluation/graphs/difficulty_accuracy_heatmap.png
```

### 13.8 View JSON Results

```bash
# ML matching results
cat evaluation/graphs/ml_matching_results.json

# Assessment results
cat evaluation/graphs/assessment_results.json
```

### 13.9 Quick Reference — All Commands

```bash
# ─── Setup (run once) ────────────────────────────
npm install                              # Install Node deps
cp .env.example .env                     # Create env file
# (edit .env with your values)
npx drizzle-kit push                     # Create DB tables
pip install -r evaluation/requirements.txt  # Install Python deps

# ─── Run Web App ─────────────────────────────────
npm run dev                              # Dev server → localhost:3000
npm run build && npm run start           # Production build + run
npm run lint                             # Lint code

# ─── Run Evaluations ────────────────────────────
python3 evaluation/ml_matching_evaluation.py    # ML matching eval + graphs
python3 evaluation/assessment_evaluation.py     # Assessment eval + graphs

# ─── View Results ────────────────────────────────
open evaluation/graphs/*.png                    # All graphs
cat evaluation/graphs/ml_matching_results.json  # ML metrics JSON
cat evaluation/graphs/assessment_results.json   # Assessment metrics JSON
```

---

## 14. Folder Structure

```
blockchain-skill-verification-platform/
├── evaluation/                            # Python evaluation scripts
│   ├── requirements.txt                   # Python dependencies
│   ├── ml_matching_evaluation.py          # ML matching accuracy eval
│   ├── assessment_evaluation.py           # AI assessment scoring eval
│   └── graphs/                            # Generated output
│       ├── confusion_matrix.png
│       ├── score_distribution.png
│       ├── verified_vs_unverified.png
│       ├── score_histogram.png
│       ├── confidence_vs_score.png
│       ├── weight_sensitivity.png
│       ├── assessment_score_distribution.png
│       ├── pass_rate_by_skill.png
│       ├── difficulty_accuracy_heatmap.png
│       ├── tier_confusion_matrix.png
│       ├── assessment_score_vs_confidence.png
│       ├── score_per_skill_by_level.png
│       ├── ml_matching_results.json
│       └── assessment_results.json
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Landing page
│   │   ├── layout.tsx                     # Root layout
│   │   ├── globals.css                    # Styles
│   │   ├── (dashboard)/layout.tsx         # Dashboard layout
│   │   ├── admin/page.tsx                 # Admin dashboard
│   │   ├── analytics/page.tsx             # Analytics + charts
│   │   ├── assessments/page.tsx           # Assessment browser + runner
│   │   ├── auth/signin/page.tsx           # Login
│   │   ├── auth/signup/page.tsx           # Registration
│   │   ├── credentials/page.tsx           # Credential management
│   │   ├── dashboard/page.tsx             # Role-specific dashboard
│   │   ├── jobs/page.tsx                  # Job marketplace
│   │   ├── jobs/applications/page.tsx     # Employer app management
│   │   ├── profile/page.tsx               # User profile (4 tabs)
│   │   ├── verify/page.tsx                # Public verification
│   │   └── api/                           # 22+ API routes
│   │       ├── auth/signup/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── assessments/route.ts
│   │       ├── assessments/[id]/route.ts
│   │       ├── assessments/submit/route.ts    # AI grading endpoint
│   │       ├── assessments/attempts/route.ts
│   │       ├── credentials/route.ts
│   │       ├── credentials/[id]/route.ts
│   │       ├── jobs/route.ts
│   │       ├── jobs/[id]/route.ts
│   │       ├── jobs/apply/route.ts            # ML matching endpoint
│   │       ├── jobs/applications/route.ts
│   │       ├── matching/route.ts              # ML recommendations
│   │       ├── skills/route.ts
│   │       ├── users/profile/route.ts
│   │       ├── users/dashboard/route.ts
│   │       ├── analytics/route.ts
│   │       ├── admin/stats/route.ts
│   │       ├── admin/users/route.ts
│   │       └── notifications/route.ts
│   ├── components/
│   │   ├── ui/                            # 16 Radix UI components
│   │   ├── layout/navbar.tsx              # Nav + notifications
│   │   ├── layout/footer.tsx
│   │   ├── layout/sidebar.tsx
│   │   ├── wallet-connect.tsx             # MetaMask integration
│   │   └── providers.tsx                  # Session + Toast providers
│   ├── db/
│   │   ├── schema.ts                      # 10 tables + relations + types
│   │   └── index.ts                       # Neon DB connection
│   ├── lib/
│   │   ├── auth.ts                        # NextAuth configuration
│   │   ├── matching.ts                    # ML job matching algorithm
│   │   ├── notifications.ts              # Notification helper
│   │   ├── utils.ts                       # Helpers + 150 questions + AI analysis
│   │   └── validations.ts               # Zod schemas
│   └── types/
│       └── index.ts                       # Shared TypeScript types
├── .env.example                           # Env var template
├── drizzle.config.ts                      # Drizzle ORM config
├── next.config.mjs                        # Next.js config
├── package.json                           # Dependencies + scripts
├── tailwind.config.ts                     # Tailwind config
└── tsconfig.json                          # TypeScript config
```

---

*This guide documents the SkillChain platform excluding the blockchain/smart contract layer. For blockchain documentation, see `PROJECT_DOCUMENTATION.md`.*
