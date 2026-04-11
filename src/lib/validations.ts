import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["candidate", "employer", "institution"]),
  organizationName: z.string().max(255).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const credentialSchema = z.object({
  candidateId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.string().min(1).max(100),
  skillIds: z.array(z.string().uuid()),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const assessmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  skillId: z.string().uuid(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().int().min(5).max(180),
  passingScore: z.number().int().min(1).max(100).default(70),
});

export const assessmentSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.record(z.string(), z.number()),
});

export const jobSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  company: z.string().min(1).max(255),
  location: z.string().max(255).optional(),
  type: z.enum(["full-time", "part-time", "contract", "remote"]),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  requiredSkills: z
    .array(z.object({ skillId: z.string().uuid(), minLevel: z.number().int().min(1).max(5) }))
    .default([]),
  preferredSkills: z
    .array(z.object({ skillId: z.string().uuid(), minLevel: z.number().int().min(1).max(5) }))
    .default([]),
});

export const applicationSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  bio: z.string().max(1000).optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});
