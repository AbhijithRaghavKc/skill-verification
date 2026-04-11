export type UserRole = "candidate" | "employer" | "institution" | "admin";

export type CredentialStatus = "pending" | "verified" | "rejected" | "revoked";

export type AssessmentDifficulty = "beginner" | "intermediate" | "advanced";

export type JobType = "full-time" | "part-time" | "contract" | "remote";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
};

export type SkillMatch = {
  skillId: string;
  skillName: string;
  required: boolean;
  candidateLevel: number;
  requiredLevel: number;
  isVerified: boolean;
  matchPercentage: number;
};

export type JobMatchResult = {
  jobId: string;
  overallScore: number;
  skillMatches: SkillMatch[];
  verifiedSkillBonus: number;
  recommendation: string;
};

export type BlockchainCredential = {
  tokenId: string;
  holder: string;
  issuer: string;
  credentialHash: string;
  issuedAt: number;
  isValid: boolean;
};

export type DashboardStats = {
  totalCredentials: number;
  verifiedCredentials: number;
  assessmentsTaken: number;
  averageScore: number;
  jobMatches: number;
  blockchainVerifications: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
