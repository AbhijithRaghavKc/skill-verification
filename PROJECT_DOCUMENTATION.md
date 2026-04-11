# SkillChain — Blockchain-Based Skill Verification Platform with AI-Powered Assessment and Job Matching

## Complete Project Documentation

---

## Table of Contents

1. [What Is SkillChain?](#1-what-is-skillchain)
2. [Why Did We Build This?](#2-why-did-we-build-this)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design](#5-database-design)
6. [Authentication System](#6-authentication-system)
7. [Smart Contract (Blockchain Layer)](#7-smart-contract-blockchain-layer)
8. [IPFS Integration](#8-ipfs-integration)
9. [AI-Powered Assessment Engine](#9-ai-powered-assessment-engine)
10. [ML Job Matching Algorithm](#10-ml-job-matching-algorithm)
11. [API Routes (Backend)](#11-api-routes-backend)
12. [Frontend Pages](#12-frontend-pages)
13. [UI Component Library](#13-ui-component-library)
14. [Notifications System](#14-notifications-system)
15. [Folder Structure](#15-folder-structure)
16. [How to Run the Project](#16-how-to-run-the-project)
17. [Environment Variables](#17-environment-variables)
18. [Development Phases](#18-development-phases)

---

## 1. What Is SkillChain?

SkillChain is a full-stack, cloud-native platform that solves the problem of credential fraud and inefficient skill verification in the job market. It brings together three technologies that traditionally operate in isolation:

- **Blockchain (Polygon)** — Issues tamper-proof NFT credentials (ERC-721) that cannot be forged or altered
- **AI Assessment Engine** — Tests candidates across 10 technical skills with 150 questions, graded using a difficulty-weighted scoring algorithm with AI-generated recommendations
- **ML Job Matching** — Matches candidates to jobs using a weighted algorithm that gives a 1.25x bonus to blockchain-verified skills

The platform supports four user roles — **candidates**, **employers**, **institutions**, and **administrators** — each with their own dashboard, views, and permissions.

### The Core Pipeline

The unique contribution of SkillChain is the **assessment-to-credential-to-matching pipeline**:

1. A candidate takes an AI-graded assessment on the platform
2. If they pass, the institution issues a blockchain-verified NFT credential
3. When the candidate applies for a job, the ML matching algorithm weighs their verified credentials higher (1.25x multiplier)
4. Employers see match scores and can trust them because the underlying skills are blockchain-verified

This creates a virtuous cycle: accurate assessments produce reliable credentials, which produce better job matches.

---

## 2. Why Did We Build This?

### The Problem

Three interrelated problems exist in today's job market:

1. **Credential fraud** — Paper-based and PDF credentials are easily forged. Traditional verification takes 5-10 business days and costs ~$75 per request. Centralised issuers can be compromised.

2. **No skill assessment integration** — Existing blockchain credential systems (like VerDe, NFTCert) store and verify credentials but never actually test whether the person has the skill. They assume an external authority has already validated the skill.

3. **Unreliable job matching** — ML job matching algorithms (like LinkedIn's, TAPJFNN) achieve high accuracy on curated datasets but degrade significantly when operating on self-reported, unverified skill data.

### The Research Gap

A comprehensive literature review of 15+ academic studies revealed that **no existing system combines all five dimensions**:

| Dimension | Existing Systems | SkillChain |
|-----------|-----------------|------------|
| Blockchain Credentials | Yes (some) | Yes |
| NFT Tokenisation (ERC-721) | Yes (some) | Yes |
| AI Assessment | No integration | Yes |
| ML Job Matching | Separate systems | Yes |
| Integrated End-to-End Platform | None | Yes |

The closest prior work is E2C-Chain (Liu et al., 2020), which connects education and employment via blockchain but lacks NFT tokenisation, AI assessment, and ML matching.

### Research Question

> *To what extent does integrating blockchain-verified credential data into a weighted ML job matching algorithm improve matching accuracy compared to approaches that operate on unverified skill data?*

---

## 3. System Architecture

SkillChain follows a cloud-native architecture with the following layers:

```
+-----------------------------------------------------------+
|                    Frontend (Next.js 14)                    |
|  React 18 + TypeScript + Tailwind CSS + Framer Motion      |
|  12 Pages | 16 UI Components | MetaMask Wallet Integration |
+-----------------------------------------------------------+
                              |
                    Next.js API Routes
                              |
+-----------------------------------------------------------+
|                    Backend Layer                            |
|  NextAuth.js (JWT) | Zod Validation | 22+ API Endpoints   |
+-----------------------------------------------------------+
          |                    |                    |
+-----------------+  +-----------------+  +-----------------+
| PostgreSQL (DB) |  | Polygon Amoy    |  | Pinata IPFS     |
| Neon Serverless |  | Smart Contract  |  | Metadata Storage|
| Drizzle ORM     |  | ERC-721 NFTs    |  | Decentralised   |
| 10 Tables       |  | Ethers.js v6    |  | JSON Storage    |
+-----------------+  +-----------------+  +-----------------+
```

### Why This Architecture?

- **Next.js 14** — Server-side rendering + API routes in one framework, reducing deployment complexity
- **Neon Serverless PostgreSQL** — Scales to zero when idle (cost-effective for academic projects), auto-scales under load
- **Polygon Amoy Testnet** — ~94% cheaper gas fees than Ethereum mainnet, same Solidity compatibility
- **IPFS via Pinata** — Credential metadata stored off-chain in a decentralised manner; on-chain NFTs reference IPFS hashes

---

## 4. Technology Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| **Frontend** | Next.js 14, React 18, TypeScript | Server components, file-based routing, type safety |
| **Styling** | Tailwind CSS, Framer Motion | Utility-first CSS, smooth animations |
| **UI Components** | Radix UI | Accessible, unstyled primitives we can customise |
| **Backend** | Next.js API Routes | Co-located with frontend, serverless-ready |
| **Authentication** | NextAuth.js (JWT strategy) | Battle-tested, supports multiple providers, 30-day sessions |
| **Database** | PostgreSQL on Neon Serverless | Relational integrity, serverless scaling, free tier |
| **ORM** | Drizzle ORM | Type-safe queries, lightweight, supports Neon |
| **Blockchain** | Solidity 0.8.20, OpenZeppelin | Industry-standard smart contract development |
| **Blockchain Client** | Ethers.js v6 | Modern, well-documented blockchain interaction library |
| **Blockchain Network** | Polygon Amoy Testnet | Low-cost, EVM-compatible testnet |
| **IPFS** | Pinata | Managed IPFS pinning service with free tier |
| **Validation** | Zod | Runtime type-safe schema validation |
| **Charts** | Recharts | React-native charting library for analytics |
| **Password Hashing** | bcryptjs | Industry-standard password hashing |
| **Icons** | Lucide React | Clean, consistent icon set |

### Key Dependencies (from package.json)

```json
{
  "next": "14.2.35",
  "react": "^18",
  "drizzle-orm": "^0.45.1",
  "ethers": "^6.16.0",
  "next-auth": "^4.24.13",
  "recharts": "^3.7.0",
  "zod": "^4.3.6",
  "bcryptjs": "^3.0.3",
  "framer-motion": "^12.34.0",
  "@neondatabase/serverless": "^1.0.2"
}
```

---

## 5. Database Design

The database consists of **10 tables** managed by Drizzle ORM with full relational integrity.

### 5.1 Tables Overview

#### `users`
Stores all platform users across all four roles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated unique identifier |
| email | VARCHAR(255) | Unique email address |
| name | VARCHAR(255) | Display name |
| passwordHash | TEXT | bcrypt-hashed password |
| role | ENUM | `candidate`, `employer`, `institution`, `admin` |
| walletAddress | VARCHAR(42) | Ethereum/Polygon wallet address (optional) |
| avatar | TEXT | Profile image URL |
| bio | TEXT | User biography |
| organizationName | VARCHAR(255) | For employers/institutions |
| isVerified | BOOLEAN | Admin verification status |
| createdAt / updatedAt | TIMESTAMP | Automatic timestamps |

#### `skills`
Master list of skills available on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| name | VARCHAR(255) | Skill name (e.g., "JavaScript", "Python") |
| category | VARCHAR(100) | Category grouping |
| description | TEXT | Skill description |

#### `credentials`
Credentials issued by institutions to candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| candidateId | UUID (FK -> users) | Who received the credential |
| issuerId | UUID (FK -> users) | Which institution issued it |
| title | VARCHAR(255) | Credential title |
| description | TEXT | Detailed description |
| type | VARCHAR(100) | Type of credential (certification, degree, etc.) |
| status | ENUM | `pending`, `verified`, `rejected`, `revoked` |
| skillIds | JSONB | Array of skill UUIDs this credential covers |
| metadata | JSONB | Additional metadata |
| blockchainTxHash | VARCHAR(66) | Polygon transaction hash |
| tokenId | VARCHAR(78) | NFT token ID on the smart contract |
| ipfsHash | VARCHAR(100) | IPFS hash of metadata JSON |
| issuedAt / expiresAt | TIMESTAMP | Validity period |

#### `assessments`
Skill assessments created by institutions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| title | VARCHAR(255) | Assessment title |
| description | TEXT | What the assessment covers |
| skillId | UUID (FK -> skills) | Which skill this tests |
| creatorId | UUID (FK -> users) | Institution that created it |
| status | ENUM | `draft`, `active`, `completed`, `expired` |
| difficulty | VARCHAR(20) | beginner, intermediate, advanced |
| duration | INTEGER | Time limit in minutes |
| passingScore | INTEGER | Minimum score to pass (default: 70) |
| questions | JSONB | Array of question objects |
| totalAttempts | INTEGER | How many times it's been taken |
| averageScore | REAL | Running average score |

#### `assessment_attempts`
Records of each time a candidate takes an assessment.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| assessmentId | UUID (FK -> assessments) | Which assessment |
| candidateId | UUID (FK -> users) | Who took it |
| score | REAL | Percentage score achieved |
| passed | BOOLEAN | Whether they met the passing score |
| answers | JSONB | Their submitted answers |
| aiAnalysis | JSONB | AI-generated analysis (strengths, weaknesses, recommendations) |
| startedAt / completedAt | TIMESTAMP | Time tracking |

#### `jobs`
Job postings created by employers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| employerId | UUID (FK -> users) | Who posted the job |
| title | VARCHAR(255) | Job title |
| description | TEXT | Full job description |
| company | VARCHAR(255) | Company name |
| location | VARCHAR(255) | Job location |
| type | VARCHAR(50) | full-time, part-time, contract, remote |
| salaryMin / salaryMax | INTEGER | Salary range |
| requiredSkillIds | JSONB | Array of required skill UUIDs |
| preferredSkillIds | JSONB | Array of preferred skill UUIDs |
| status | ENUM | `open`, `closed`, `filled`, `draft` |

#### `applications`
Job applications submitted by candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| jobId | UUID (FK -> jobs) | Which job |
| candidateId | UUID (FK -> users) | Who applied |
| status | ENUM | `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted` |
| matchScore | REAL | ML-calculated match score (0-100) |
| coverLetter | TEXT | Application cover letter |

#### `user_skills`
Links users to their skills with proficiency levels.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| userId | UUID (FK -> users) | Which user |
| skillId | UUID (FK -> skills) | Which skill |
| proficiencyLevel | INTEGER | 1-5 proficiency scale |
| isVerified | BOOLEAN | Whether blockchain-verified |
| verifiedAt | TIMESTAMP | When verification occurred |
| credentialId | UUID (FK -> credentials) | Linked credential |

#### `blockchain_transactions`
Audit log of all blockchain interactions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| userId | UUID (FK -> users) | Who initiated the transaction |
| txHash | VARCHAR(66) | Polygon transaction hash |
| type | VARCHAR(50) | Transaction type (issue, verify, revoke) |
| status | VARCHAR(20) | pending, confirmed, failed |
| metadata | JSONB | Additional transaction data |

#### `notifications`
In-app notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| userId | UUID (FK -> users) | Recipient |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification body |
| type | VARCHAR(50) | assessment, credential, application, etc. |
| isRead | BOOLEAN | Read status |
| link | VARCHAR(500) | Where to navigate when clicked |

### 5.2 Relationships

```
users ──< credentials (as candidate)
users ──< credentials (as issuer)
users ──< assessment_attempts
users ──< jobs (as employer)
users ──< applications (as candidate)
users ──< user_skills
users ──< notifications
users ──< blockchain_transactions

skills ──< assessments
skills ──< user_skills

assessments ──< assessment_attempts

jobs ──< applications

credentials ──< user_skills
```

### 5.3 Enums

- **user_role**: `candidate`, `employer`, `institution`, `admin`
- **credential_status**: `pending`, `verified`, `rejected`, `revoked`
- **assessment_status**: `draft`, `active`, `completed`, `expired`
- **job_status**: `open`, `closed`, `filled`, `draft`
- **application_status**: `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted`

---

## 6. Authentication System

### How It Works

Authentication is implemented using **NextAuth.js** with a **Credentials provider** and **JWT session strategy**.

#### Registration Flow (`POST /api/auth/signup`)
1. User submits: name, email, password, role, (optional) organizationName
2. Input validated with Zod schema
3. Password hashed with `bcryptjs` (salt rounds auto-generated)
4. User record created in PostgreSQL
5. Response returned; user redirected to sign-in page

#### Login Flow (`POST /api/auth/[...nextauth]`)
1. User submits email and password
2. NextAuth's `authorize()` callback:
   - Looks up user by email in the database
   - Compares password hash with `bcrypt.compare()`
   - Returns user object if valid, `null` if not
3. JWT token generated containing: `id`, `email`, `name`, `role`, `walletAddress`
4. Session cookie set with 30-day expiry

#### Session Structure
Every authenticated request includes a session with:
```typescript
{
  user: {
    id: string;        // UUID
    email: string;
    name: string;
    role: "candidate" | "employer" | "institution" | "admin";
    walletAddress?: string;
  }
}
```

#### Security Measures
- Passwords hashed with bcryptjs (never stored in plain text)
- JWT tokens signed with `NEXTAUTH_SECRET`
- 30-day session expiry
- Role-based access control on API routes (e.g., only institutions can issue credentials)
- Custom sign-in and error pages

---

## 7. Smart Contract (Blockchain Layer)

### SkillCredential.sol

The smart contract is written in Solidity 0.8.20 and inherits from three OpenZeppelin contracts:

- **ERC721** — Standard NFT implementation
- **ERC721URIStorage** — Allows storing metadata URIs per token
- **AccessControl** — Role-based permission management

#### Contract Details

| Property | Value |
|----------|-------|
| Token Name | SkillCredential |
| Token Symbol | SKLC |
| Network | Polygon Amoy Testnet |
| Standard | ERC-721 |

#### Data Structure

Each credential stores:
```solidity
struct Credential {
    address holder;        // Who owns the credential
    address issuer;        // Which institution issued it
    string credentialHash; // Keccak256 hash of credential data
    uint256 issuedAt;      // Block timestamp
    bool isValid;          // Can be revoked
}
```

#### Core Functions

1. **`issueCredential(address holder, string credentialHash, string metadataURI)`**
   - Mints a new ERC-721 NFT to the holder's address
   - Stores credential hash and IPFS metadata URI on-chain
   - Restricted to addresses with `ISSUER_ROLE`
   - Emits `CredentialIssued` event
   - Returns the new token ID

2. **`verifyCredential(uint256 tokenId)`**
   - View function (no gas cost to call)
   - Returns: holder, issuer, credentialHash, issuedAt, isValid
   - Anyone can verify a credential by its token ID

3. **`revokeCredential(uint256 tokenId)`**
   - Sets `isValid = false` on the credential
   - Only the original issuer or an admin can revoke
   - Emits `CredentialRevoked` event

4. **`addIssuer(address account)` / `removeIssuer(address account)`**
   - Admin-only functions to manage who can issue credentials

5. **`getCredentialsByHolder(address)` / `getCredentialsByIssuer(address)`**
   - Query functions to retrieve all credential token IDs for a given address

#### Blockchain Client (Ethers.js Integration)

The `src/lib/blockchain.ts` file provides a TypeScript interface to the smart contract:

- `issueCredentialOnChain()` — Signs and sends the issue transaction, extracts token ID from event logs
- `verifyCredentialOnChain()` — Reads credential data from the contract
- `revokeCredentialOnChain()` — Signs and sends the revoke transaction
- `getHolderCredentials()` — Queries credentials by holder address
- `generateCredentialHash()` — Creates a deterministic Keccak256 hash from credential data using ABI encoding

---

## 8. IPFS Integration

### Why IPFS?

NFTs on-chain should be lightweight (gas costs scale with data size). The actual credential metadata (name, description, issuer details, skills, attributes) is stored on IPFS — a decentralised file system — and the NFT stores just the IPFS hash as its `tokenURI`.

### How It Works

1. **`buildCredentialMetadata()`** — Constructs NFT-standard metadata:
   ```json
   {
     "name": "JavaScript Expert Certification",
     "description": "Certified by NCI",
     "attributes": [
       { "trait_type": "Type", "value": "certification" },
       { "trait_type": "Issuer", "value": "NCI" },
       { "trait_type": "Skill", "value": "JavaScript" }
     ],
     "issuer": { "id": "uuid", "name": "NCI" },
     "issuedAt": "2026-03-28T00:00:00Z",
     "skills": ["JavaScript"]
   }
   ```

2. **`uploadToIPFS()`** — Uploads metadata JSON to Pinata's IPFS pinning service
   - If Pinata API keys are configured: uploads to real IPFS, returns the IPFS hash (CID)
   - If no API keys (development mode): generates a deterministic SHA-256 hash as a fallback

3. **`getIPFSUrl()`** — Converts an IPFS hash to a gateway URL:
   `QmXyz...` → `https://gateway.pinata.cloud/ipfs/QmXyz...`

---

## 9. AI-Powered Assessment Engine

### Overview

The assessment engine evaluates candidates across **10 technical skills**, each with **3 difficulty tiers** and **5 questions per tier** = **150 total questions**.

### Supported Skills

1. JavaScript
2. Python
3. Solidity
4. React
5. TypeScript
6. Node.js
7. Docker
8. AWS
9. Rust
10. Go

### Question Structure

Each question is a multiple-choice object:
```typescript
{
  id: string;          // e.g., "js-b-1"
  question: string;    // The question text
  options: string[];   // 4 answer choices
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string; // Why this answer is correct
  points: number;      // 10 (beginner), 15 (intermediate), 20 (advanced)
}
```

### Difficulty-Weighted Scoring

Questions are weighted by difficulty:
- **Beginner questions**: 10 points each
- **Intermediate questions**: 15 points each
- **Advanced questions**: 20 points each

This means getting an advanced question right is worth 2x a beginner question, reflecting the deeper skill demonstrated.

### AI Analysis System

After submission, the `analyzeAssessmentResults()` function generates:

1. **Score Calculation** — Total points earned / total points possible, expressed as a percentage

2. **Strength and Weakness Areas** — Identifies which difficulty tiers the candidate performed well or poorly in

3. **5-Tier Recommendation System**:

| Score Range | Tier | Recommendation |
|-------------|------|----------------|
| 95%+ | Expert | Ready for mentoring roles, suggest advanced contributions |
| 85-94% | Strong | Strong performance, review specific weak topics |
| 70-84% | Good | Good foundation, practice intermediate/advanced concepts |
| 50-69% | Developing | Needs strengthening, structured learning recommended |
| Below 50% | Foundational | Review fundamentals, start with beginner materials |

4. **Confidence Score** — Calculated from:
   - Accuracy rate across difficulty levels
   - Consistency of performance (high beginner + low advanced = lower confidence)
   - Coverage of question categories

### Assessment Flow

1. Candidate browses available assessments (filtered by skill, difficulty)
2. Starts an assessment → timer begins (configurable duration)
3. Answers multiple-choice questions, can navigate between questions
4. Submits answers → `POST /api/assessments/submit`
5. Server:
   - Fetches the assessment's question bank
   - Runs `analyzeAssessmentResults()` for AI grading
   - Creates an `assessment_attempt` record with score and AI analysis
   - If passed: auto-creates a `user_skill` record with `isVerified: true`
   - Sends a notification to the candidate
6. Results displayed: score, pass/fail, strength areas, weakness areas, AI recommendations

---

## 10. ML Job Matching Algorithm

### Overview

The matching algorithm (`src/lib/matching.ts`) computes a compatibility score between a candidate's skill profile and a job's requirements. The key innovation is the **1.25x blockchain verification bonus** — candidates whose skills have been verified on-chain score higher than those with self-reported skills.

### Algorithm Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Required Skill Weight | 0.7 (70%) | Required skills matter more |
| Preferred Skill Weight | 0.3 (30%) | Preferred skills are a bonus |
| Verified Multiplier | 1.25x | Blockchain-verified skills score 25% higher |
| Max Skill Score | Capped at 120% then 100% | Allows exceeding requirements but caps at 100 |
| Verified Bonus | Up to 10 points | Additional bonus based on % of verified skills |

### How It Works

#### Step 1: Required Skills Scoring
For each required skill in the job:
```
skillScore = min(candidateLevel / requiredLevel, 1.2) * 100
if (skill.isVerified) skillScore = min(skillScore * 1.25, 100)
```

#### Step 2: Preferred Skills Scoring
Same formula applied to preferred skills (but weighted at 0.3 instead of 0.7).

#### Step 3: Normalization
```
normalizedRequired = requiredScore / (numRequiredSkills * 100)
normalizedPreferred = preferredScore / (numPreferredSkills * 100)
```

#### Step 4: Overall Score
```
verifiedBonus = (verifiedCount / totalSkills) * 10
overallScore = min(
  (normalizedRequired * 0.7 + normalizedPreferred * 0.3) * 100 + verifiedBonus,
  100
)
```

#### Step 5: Confidence Score
```
confidence = (skillsWhereCandiateHasExperience / totalSkills) * 100
```

#### Step 6: Recommendation
| Score | Recommendation |
|-------|---------------|
| 85+ | "Excellent match. Candidate strongly recommended." |
| 70-84 | "Good match. Candidate meets most requirements." |
| 50-69 | "Partial match. Candidate may need additional skill development." |
| Below 50 | "Low match. Significant skill gaps identified." |

### Match Result Output

```typescript
{
  overallScore: 82,           // 0-100
  skillBreakdown: [           // Per-skill detail
    {
      skillName: "React",
      matchScore: 95,
      isVerified: true,
      candidateLevel: 4,
      requiredLevel: 3
    },
    // ...
  ],
  verifiedBonus: 5,           // Points from verification
  recommendation: "Good match. Candidate meets most requirements.",
  confidence: 80              // How complete the skill coverage is
}
```

### Utility Functions

1. **`calculateJobMatch(candidate, job)`** — Core matching function for one candidate-job pair
2. **`rankCandidatesForJob(candidates, job)`** — Ranks multiple candidates for a single job (sorted by score descending)
3. **`recommendJobsForCandidate(candidate, jobs)`** — Ranks multiple jobs for a single candidate (sorted by score descending)

---

## 11. API Routes (Backend)

The backend exposes **22+ RESTful API endpoints** via Next.js API Routes. All routes use Zod validation, JWT authentication (via NextAuth), and return consistent JSON responses.

### Authentication Routes

#### `POST /api/auth/signup`
- **Purpose**: Register a new user
- **Body**: `{ name, email, password, role, organizationName? }`
- **Validation**: Zod schema checks email format, password length, valid role
- **Security**: Password hashed with bcryptjs before storage
- **Returns**: `{ success: true, user: { id, email, name, role } }`

#### `POST /api/auth/[...nextauth]`
- **Purpose**: NextAuth sign-in/sign-out handler
- **Supports**: Credentials provider (email + password)
- **Returns**: JWT session token (30-day expiry)

### Credential Routes

#### `GET /api/credentials`
- **Purpose**: List credentials (filtered by role)
- **Candidate**: Sees their own credentials
- **Institution**: Sees credentials they issued
- **Admin**: Sees all credentials
- **Returns**: Array of credential objects with issuer/candidate details

#### `POST /api/credentials`
- **Purpose**: Issue a new credential
- **Restricted to**: Institutions only
- **Body**: `{ candidateId, title, description, type, skillIds }`
- **Returns**: Created credential object

#### `GET /api/credentials/[id]`
- **Purpose**: Get a single credential by ID
- **Returns**: Full credential with relations

### Assessment Routes

#### `GET /api/assessments`
- **Purpose**: List all active assessments
- **Returns**: Array with skill info, difficulty, duration, attempt count

#### `POST /api/assessments`
- **Purpose**: Create a new assessment
- **Restricted to**: Institutions only
- **Body**: `{ title, description, skillId, difficulty, duration, passingScore }`
- **Auto-generates**: Question bank using `generateAssessmentQuestions()`

#### `GET /api/assessments/[id]`
- **Purpose**: Get single assessment with questions
- **Returns**: Full assessment object

#### `POST /api/assessments/submit`
- **Purpose**: Submit assessment answers for AI grading
- **Body**: `{ assessmentId, answers: { questionId: selectedOption } }`
- **Processing**:
  1. Retrieves assessment questions
  2. Runs `analyzeAssessmentResults()` (AI grading)
  3. Creates assessment attempt record
  4. If passed: creates verified `user_skill`
  5. Sends notification
- **Returns**: `{ score, passed, analysis: { strengths, weaknesses, recommendations } }`

#### `GET /api/assessments/attempts`
- **Purpose**: Get all assessment attempts for the logged-in user
- **Returns**: Array of attempts with scores and AI analysis

### Job Routes

#### `GET /api/jobs`
- **Purpose**: List all open jobs
- **Supports**: Search and filter parameters
- **Returns**: Array of jobs with employer info

#### `POST /api/jobs`
- **Purpose**: Post a new job listing
- **Restricted to**: Employers only
- **Body**: `{ title, description, company, location, type, salaryMin, salaryMax, requiredSkillIds, preferredSkillIds }`

#### `GET /api/jobs/[id]`
- **Purpose**: Get single job with full details

#### `PATCH /api/jobs/[id]`
- **Purpose**: Update a job listing
- **Restricted to**: Job owner (employer)

#### `DELETE /api/jobs/[id]`
- **Purpose**: Delete a job listing
- **Restricted to**: Job owner (employer)

#### `POST /api/jobs/apply`
- **Purpose**: Apply to a job
- **Body**: `{ jobId, coverLetter? }`
- **Processing**:
  1. Fetches candidate's skills (including verification status)
  2. Runs ML matching algorithm
  3. Creates application with calculated match score
  4. Sends notification to employer
- **Returns**: `{ application, matchResult }`

#### `GET /api/jobs/applications`
- **Purpose**: List applications (role-filtered)
- **Candidate**: Sees their own applications
- **Employer**: Sees applications to their jobs

#### `PATCH /api/jobs/applications`
- **Purpose**: Update application status
- **Restricted to**: Employers
- **Body**: `{ applicationId, status }`
- **Notifies**: Candidate when status changes

### User Routes

#### `GET /api/users/profile`
- **Purpose**: Get current user's full profile
- **Returns**: User data + skills + credential count + assessment stats

#### `PATCH /api/users/profile`
- **Purpose**: Update profile fields
- **Body**: `{ name?, bio?, walletAddress? }`

#### `GET /api/users/dashboard`
- **Purpose**: Role-specific dashboard statistics
- **Candidate**: Credential count, verified count, assessments taken, avg score, job matches
- **Employer**: Total jobs, applications received, active jobs
- **Institution**: Issued credentials, verified credentials

### Matching Route

#### `POST /api/matching`
- **Purpose**: Get ML job recommendations for the logged-in candidate
- **Processing**: Runs `recommendJobsForCandidate()` across all open jobs
- **Returns**: Ranked list of jobs with match scores and breakdowns

### Other Routes

#### `GET /api/skills`
- **Purpose**: List all skills in the platform

#### `POST /api/blockchain/issue`
- **Purpose**: Issue a credential on-chain
- **Processing**: Uploads metadata to IPFS, calls smart contract, records transaction
- **Returns**: Transaction hash, token ID, IPFS hash

#### `POST /api/blockchain/verify`
- **Purpose**: Verify a credential on-chain by token ID
- **Returns**: Credential validity, holder, issuer, hash, timestamp

#### `GET /api/analytics`
- **Purpose**: Platform-wide analytics from real DB data
- **Returns**: Stats for credentials, assessments, jobs, skills, users, match scores

#### `GET /api/admin/stats`
- **Purpose**: Admin dashboard statistics
- **Restricted to**: Admin role only
- **Returns**: User counts by role, credential/assessment/job/transaction counts

#### `GET/PATCH /api/admin/users`
- **Purpose**: Admin user management
- **GET**: List all users with details
- **PATCH**: Update user verification status or role

#### `GET/PATCH /api/notifications`
- **GET**: Fetch notifications for logged-in user
- **PATCH**: Mark notifications as read

---

## 12. Frontend Pages

### Page 1: Landing Page (`/`)
The public-facing homepage that introduces SkillChain.

- **Hero section**: Gradient heading "Blockchain-Verified Skills for the Modern Workforce" with CTA buttons (Get Started, Learn More)
- **Feature showcase**: 6 animated cards highlighting key features (NFT Credentials, AI Assessment, ML Matching, Decentralised Storage, Role-Based Access, Analytics)
- **Role descriptions**: Explains what candidates, employers, and institutions can do on the platform
- **Platform stats**: Live counters (total credentials, assessments, verified skills)
- **Footer CTA**: Final call-to-action to sign up
- **Animations**: Framer Motion scroll-triggered animations throughout

### Page 2: Sign In (`/auth/signin`)
- Email and password form with validation
- Error messages for invalid credentials
- Link to sign up for new users
- Redirects to dashboard on success

### Page 3: Sign Up (`/auth/signup`)
- **Step 1**: Role selection — clickable cards for Candidate, Employer, Institution
- **Step 2**: Registration form — name, email, password, (optional) organization name
- Zod validation on all fields
- Redirects to sign-in on success

### Page 4: Dashboard (`/dashboard`)
Role-specific dashboard with stats and quick actions.

**Candidate Dashboard**:
- Stat cards: Total credentials, verified credentials, assessments taken, average score, job matches, blockchain verifications
- Quick action buttons: Take Assessment, Browse Jobs, View Credentials
- Recent activity feed

**Employer Dashboard**:
- Stat cards: Total posted jobs, applications received, active listings
- Quick actions: Post Job, View Applications

**Institution Dashboard**:
- Stat cards: Issued credentials, verified credentials
- Quick actions: Issue Credential, Create Assessment

### Page 5: Credentials (`/credentials`)
- **Credential card grid**: Cards showing title, issuer, status badge (colour-coded: green=verified, yellow=pending, red=rejected/revoked)
- **Detail modal**: Expanded view with blockchain transaction hash, token ID, IPFS hash, skills, dates
- **Institution view**: Form to issue new credentials to candidates (select candidate, enter title, choose skills, set type)

### Page 6: Assessments (`/assessments`)
- **Browse view**: List of available assessments with skill name, difficulty badge, duration, number of attempts
- **Assessment runner**:
  - Countdown timer in the header
  - Question display with 4 radio-button options
  - Navigation dots to jump between questions
  - Submit button
- **Results view**:
  - Score percentage with pass/fail indicator
  - Strength areas (green badges)
  - Weakness areas (red badges)
  - AI recommendations list
  - Link to view credential if passed

### Page 7: Jobs (`/jobs`)
**Candidate View** (3 tabs):
- **Browse Jobs**: Search bar + filters, job cards with title, company, location, salary, required skills
- **My Applications**: Status tracker for submitted applications (pending → reviewed → shortlisted → accepted/rejected)
- **Recommended**: ML-powered job recommendations with match score percentages

**Employer View**:
- List of posted jobs with application counts
- "Post Job" dialog with full form (title, description, company, location, type, salary range, required/preferred skills)
- "Manage Applications" link per job

### Page 8: Job Applications (`/jobs/applications`)
- **Employer-only page**
- Table/card view of all applications across all posted jobs
- Each application shows:
  - Candidate name and email
  - Job title
  - Match score with colour-coded progress bar (green 70+, yellow 50-69, red <50)
  - Cover letter preview
  - Action buttons: Shortlist, Accept, Reject
  - Status badge

### Page 9: Profile (`/profile`)
Four tabs:

**Overview Tab**:
- Avatar with initials
- Name, email, role, organization, member since date
- Credential and assessment count badges
- Edit profile form (name, bio)

**Wallet Section**:
- MetaMask connect button (one-click wallet linking)
- Manual wallet address entry field
- Displays truncated wallet address when connected

**Skills Tab** (candidates only):
- Skill cards with:
  - Skill name and category
  - Proficiency bar (1-5 scale)
  - Verified badge (checkmark icon if blockchain-verified)
  - Credential link if verified through an assessment

**Activity Tab**:
- Recent credentials (last 5)
- Recent assessment attempts with scores
- Recent job applications with status

**Settings Tab**:
- Change password form
- Delete account (danger zone with confirmation)

### Page 10: Verify (`/verify`)
- **Public verification page** (conceptually accessible without auth)
- Search input: Enter token ID or transaction hash
- Verification result display:
  - Status: Valid (green), Revoked (red), Not Found (grey)
  - Credential details grid: holder address, issuer address, issue date, skills
- "How It Works" section explaining the blockchain verification process
- Recent verifications list

### Page 11: Analytics (`/analytics`)
- **6 overview stat cards** (live from database):
  - Total Credentials, Total Assessments, Active Jobs, Verified Skills, Total Users, Average Match Score
- **6 chart tabs** (all pulling real data from the `/api/analytics` endpoint):

| Chart | Type | What It Shows |
|-------|------|---------------|
| Skills Demand | Bar chart | Top skills across job postings |
| Verification Trend | Area chart | 6-month blockchain verifications over time |
| Assessment Performance | Grouped bar | Pass rate + average score by skill category |
| Credential Distribution | Pie chart + bars | Breakdown by credential type |
| Job Market | Dual area chart | Job postings vs applications over 6 months |
| Match Score Distribution | Bar chart + insights | Distribution of ML match scores |

### Page 12: Admin (`/admin`)
- **Admin-only** (redirects non-admin users)

**Overview Tab**:
- 10 stat cards: users by role (candidates, employers, institutions, admins), total credentials, assessments, jobs, applications, blockchain transactions, notifications
- Recent users list with join dates

**Manage Users Tab**:
- Full user table with columns: name, email, role, verified status, join date
- Actions per user:
  - Verify/Unverify toggle button
  - Role dropdown to change user role
- Sortable and searchable

---

## 13. UI Component Library

### Radix UI Components (16)

All built on Radix UI primitives (accessible, unstyled) with Tailwind CSS styling:

| Component | File | Purpose |
|-----------|------|---------|
| Button | `ui/button.tsx` | Primary, secondary, destructive, outline, ghost variants |
| Input | `ui/input.tsx` | Text input with consistent styling |
| Textarea | `ui/textarea.tsx` | Multi-line text input |
| Card | `ui/card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Badge | `ui/badge.tsx` | Status badges: default, secondary, success, warning, destructive, outline |
| Select | `ui/select.tsx` | Dropdown select with search |
| Dialog | `ui/dialog.tsx` | Modal dialogs for forms and confirmations |
| Tabs | `ui/tabs.tsx` | Tab navigation |
| Progress | `ui/progress.tsx` | Progress bars (used for match scores, skill levels) |
| Avatar | `ui/avatar.tsx` | User avatars with fallback initials |
| Label | `ui/label.tsx` | Form labels |
| Toast | `ui/toast.tsx` | Toast notifications (success, error, info) |
| Separator | (inline) | Visual dividers |

### Custom Components

| Component | File | Purpose |
|-----------|------|---------|
| Navbar | `layout/navbar.tsx` | Top navigation with logo, links, notification bell (with unread count badge), mobile hamburger menu, role-based admin link |
| Footer | `layout/footer.tsx` | Site footer with links and copyright |
| Sidebar | `layout/sidebar.tsx` | Side navigation for dashboard pages |
| WalletConnect | `wallet-connect.tsx` | MetaMask integration button — detects wallet, requests connection, saves address |
| Providers | `providers.tsx` | Wraps app with SessionProvider (NextAuth) and ToastProvider |

---

## 14. Notifications System

### How It Works

Notifications are stored in the database and displayed via a bell icon in the navbar.

#### Creating Notifications
The `createNotification()` helper function is called from API routes:
```typescript
await createNotification({
  userId: "candidate-uuid",
  title: "Assessment Passed!",
  message: "You scored 85% on JavaScript Assessment",
  type: "assessment",
  link: "/profile"
});
```

#### Notification Triggers
| Event | Who Gets Notified | Message |
|-------|-------------------|---------|
| Job application submitted | Employer | "New application received for [Job Title]" |
| Assessment completed (pass) | Candidate | "Congratulations! You scored X% and earned a verified skill" |
| Assessment completed (fail) | Candidate | "You scored X%. Keep practicing!" |
| Application status changed | Candidate | "Your application for [Job] was [shortlisted/accepted/rejected]" |

#### Frontend Display
- Navbar bell icon shows unread count as a red badge
- Clicking opens a dropdown panel with notification list
- Each notification shows: title, message, time ago, link
- "Mark all read" button at the bottom

---

## 15. Folder Structure

```
blockchain-skill-verification-platform/
├── contracts/
│   └── SkillCredential.sol              # Solidity smart contract (ERC-721)
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page
│   │   ├── layout.tsx                    # Root layout (Navbar + Footer wrapper)
│   │   ├── globals.css                   # Global styles + Tailwind directives
│   │   ├── favicon.ico                   # Site icon
│   │   ├── fonts/                        # Geist font files
│   │   ├── (dashboard)/layout.tsx        # Dashboard layout wrapper
│   │   ├── admin/page.tsx                # Admin dashboard
│   │   ├── analytics/page.tsx            # Analytics with charts
│   │   ├── assessments/page.tsx          # Assessment browser + runner
│   │   ├── auth/
│   │   │   ├── signin/page.tsx           # Login page
│   │   │   └── signup/page.tsx           # Registration page
│   │   ├── credentials/page.tsx          # Credential management
│   │   ├── dashboard/page.tsx            # Role-specific dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx                  # Job marketplace
│   │   │   └── applications/page.tsx     # Employer application management
│   │   ├── profile/page.tsx              # User profile (4 tabs)
│   │   ├── verify/page.tsx               # Public credential verification
│   │   └── api/                          # Backend API routes
│   │       ├── auth/
│   │       │   ├── signup/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── credentials/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── assessments/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── submit/route.ts
│   │       │   └── attempts/route.ts
│   │       ├── jobs/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── apply/route.ts
│   │       │   └── applications/route.ts
│   │       ├── matching/route.ts
│   │       ├── skills/route.ts
│   │       ├── blockchain/
│   │       │   ├── issue/route.ts
│   │       │   └── verify/route.ts
│   │       ├── users/
│   │       │   ├── profile/route.ts
│   │       │   └── dashboard/route.ts
│   │       ├── analytics/route.ts
│   │       ├── admin/
│   │       │   ├── stats/route.ts
│   │       │   └── users/route.ts
│   │       └── notifications/route.ts
│   ├── components/
│   │   ├── ui/                           # 16 Radix UI components
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/
│   │   │   ├── navbar.tsx                # Navigation + notification bell
│   │   │   ├── footer.tsx                # Site footer
│   │   │   └── sidebar.tsx               # Dashboard sidebar
│   │   ├── wallet-connect.tsx            # MetaMask integration
│   │   └── providers.tsx                 # Session + Toast providers
│   ├── db/
│   │   ├── schema.ts                     # 10 tables + relations + types
│   │   └── index.ts                      # Neon DB connection
│   ├── lib/
│   │   ├── auth.ts                       # NextAuth configuration
│   │   ├── blockchain.ts                 # Ethers.js smart contract interface
│   │   ├── ipfs.ts                       # Pinata IPFS upload/retrieval
│   │   ├── matching.ts                   # ML job matching algorithm
│   │   ├── notifications.ts             # Notification helper
│   │   ├── utils.ts                      # Helpers + 150-question bank + AI analysis
│   │   └── validations.ts               # Zod schemas for all inputs
│   └── types/
│       └── index.ts                      # Shared TypeScript types
├── .env.example                          # Environment variable template
├── .eslintrc.json                        # ESLint configuration
├── .gitignore                            # Git ignore rules
├── drizzle.config.ts                     # Drizzle ORM configuration
├── next.config.mjs                       # Next.js configuration
├── package.json                          # Dependencies and scripts
├── postcss.config.mjs                    # PostCSS configuration
├── tailwind.config.ts                    # Tailwind CSS configuration
└── tsconfig.json                         # TypeScript configuration
```

---

## 16. How to Run the Project

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- A **Neon** database account (free tier: https://neon.tech)
- (Optional) **MetaMask** browser extension for wallet features
- (Optional) **Pinata** account for IPFS (free tier: https://pinata.cloud)
- (Optional) **Polygon Amoy testnet** wallet with test MATIC for blockchain features

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd blockchain-skill-verification-platform
```

#### 2. Install Dependencies
```bash
npm install
```
This installs all packages listed in `package.json` including Next.js, React, Drizzle, Ethers.js, NextAuth, Recharts, Zod, bcryptjs, and all Radix UI components.

#### 3. Create Environment File
```bash
cp .env.example .env
```

#### 4. Configure Environment Variables
Edit `.env` with your values:

```env
# REQUIRED — Database
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# REQUIRED — Authentication
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OPTIONAL — Blockchain (needed for on-chain features)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=your-deployed-contract-address

# OPTIONAL — IPFS (falls back to SHA-256 hash without these)
IPFS_API_KEY=your-pinata-api-key
IPFS_API_SECRET=your-pinata-api-secret
```

**How to get each value:**

| Variable | How to Get It |
|----------|---------------|
| `DATABASE_URL` | Sign up at https://neon.tech → Create a project → Copy the connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |
| `NEXTAUTH_URL` | `http://localhost:3000` for local development |
| `BLOCKCHAIN_RPC_URL` | Use the public endpoint: `https://rpc-amoy.polygon.technology` |
| `BLOCKCHAIN_PRIVATE_KEY` | MetaMask → Account Details → Export Private Key |
| `CONTRACT_ADDRESS` | Deploy the contract and copy the address (see below) |
| `IPFS_API_KEY` / `IPFS_API_SECRET` | Sign up at https://pinata.cloud → API Keys → New Key |

#### 5. Push Database Schema
```bash
npx drizzle-kit push
```
This creates all 10 tables, enums, and relations in your Neon PostgreSQL database.

#### 6. Start Development Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

#### 7. (Optional) Deploy Smart Contract
To use blockchain features, deploy `contracts/SkillCredential.sol` to Polygon Amoy:

1. Use Remix IDE (https://remix.ethereum.org) or Hardhat
2. Compile with Solidity 0.8.20
3. Deploy to Polygon Amoy testnet
4. Copy the deployed contract address to your `.env` file

### Build for Production
```bash
npm run build    # Creates optimised production build
npm run start    # Starts production server
```

### Lint Code
```bash
npm run lint     # Runs ESLint
```

### What Works Without Blockchain/IPFS?

The platform is fully functional without blockchain configuration:
- User registration and login
- Assessments (taking and AI grading)
- Job posting and applications
- ML job matching with scores
- Profile management
- Analytics dashboard
- Admin panel
- Notifications

The only features requiring blockchain env vars:
- On-chain credential issuance (`/api/blockchain/issue`)
- On-chain credential verification (`/api/blockchain/verify`)
- IPFS metadata storage (falls back to deterministic hash)

---

## 17. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Neon format) |
| `NEXTAUTH_SECRET` | Yes | — | Random string for JWT token signing |
| `NEXTAUTH_URL` | Yes | — | Application base URL |
| `BLOCKCHAIN_RPC_URL` | No | — | Polygon Amoy RPC endpoint |
| `BLOCKCHAIN_PRIVATE_KEY` | No | — | Wallet private key for signing blockchain transactions |
| `CONTRACT_ADDRESS` | No | — | Deployed SkillCredential.sol address |
| `IPFS_API_KEY` | No | — | Pinata API key for IPFS uploads |
| `IPFS_API_SECRET` | No | — | Pinata API secret |

---

## 18. Development Phases

The project was developed in 7 phases following an Agile methodology with iterative sprints:

| Phase | What Was Built | Commits |
|-------|---------------|---------|
| **Phase 1**: Requirements & Architecture | Tech stack selection, system design, project scaffolding | Early commits |
| **Phase 2**: Smart Contract | `SkillCredential.sol` with ERC-721, AccessControl, ISSUER_ROLE, issueCredential, verifyCredential, revokeCredential | ~10 commits |
| **Phase 3**: Database & API | 10-table PostgreSQL schema with Drizzle ORM, 22+ API routes with Zod validation | ~30 commits |
| **Phase 4**: AI Assessment Engine | 150-question bank across 10 skills × 3 difficulties, difficulty-weighted scoring, 5-tier AI recommendations | ~15 commits |
| **Phase 5**: ML Job Matching | Weighted matching algorithm (0.7/0.3), 1.25x verified bonus, confidence scoring, ranking functions | ~10 commits |
| **Phase 6**: Frontend | 12 pages with role-specific views, Radix UI components, Tailwind styling, Framer Motion animations, MetaMask wallet | ~50 commits |
| **Phase 7**: Integration & Testing | IPFS integration, blockchain API routes, notification system, analytics dashboard, admin panel | ~30 commits |

**Total: 151 commits** across all phases, with the final commit (`dbe192d`) confirming a clean build with 0 errors.

---

*This documentation was generated from the actual codebase of the SkillChain platform, built as part of the MSc Cloud Computing Research Project at the National College of Ireland.*
