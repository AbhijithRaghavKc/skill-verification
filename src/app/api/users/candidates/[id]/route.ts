import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, userSkills, skills, credentials, assessmentAttempts, assessments, jobs } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { calculateJobMatch } from "@/lib/matching";

// GET /api/users/candidates/[id]
// Returns a candidate's full profile for an employer reviewing their application.
// Optional ?jobId= query param triggers a per-skill match breakdown for that job.
// Auth: employer or admin only
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;
    if (role !== "employer" && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const candidateId = params.id;
    const jobId = req.nextUrl.searchParams.get("jobId");

    // Fetch candidate basic info
    const candidate = await db.query.users.findFirst({
      where: and(eq(users.id, candidateId), eq(users.role, "candidate")),
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    // Fetch candidate skills joined with skill metadata
    const rawSkills = await db
      .select({
        id: userSkills.id,
        skillId: userSkills.skillId,
        skillName: skills.name,
        skillCategory: skills.category,
        proficiencyLevel: userSkills.proficiencyLevel,
        isVerified: userSkills.isVerified,
        verifiedAt: userSkills.verifiedAt,
        credentialId: userSkills.credentialId,
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, candidateId))
      .orderBy(skills.name);

    // Fetch verified credentials
    const verifiedCredentials = await db.query.credentials.findMany({
      where: and(
        eq(credentials.candidateId, candidateId),
        eq(credentials.status, "verified")
      ),
    });

    // Fetch recent assessment attempts (last 5, completed only)
    const recentAttempts = await db
      .select({
        id: assessmentAttempts.id,
        score: assessmentAttempts.score,
        passed: assessmentAttempts.passed,
        completedAt: assessmentAttempts.completedAt,
        assessmentTitle: assessments.title,
        assessmentDifficulty: assessments.difficulty,
      })
      .from(assessmentAttempts)
      .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
      .where(eq(assessmentAttempts.candidateId, candidateId))
      .limit(5);

    // Build match breakdown if jobId is provided
    let matchBreakdown = null;
    if (jobId) {
      const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
      if (job) {
        const allSkillIds = [
          ...(job.requiredSkills ?? []).map((s) => s.skillId),
          ...(job.preferredSkills ?? []).map((s) => s.skillId),
        ];

        // Resolve skill names for the job's required/preferred skills
        const jobSkillMap: Record<string, string> = {};
        if (allSkillIds.length > 0) {
          const jobSkills = await db
            .select({ id: skills.id, name: skills.name })
            .from(skills)
            .where(inArray(skills.id, allSkillIds));
          jobSkills.forEach((s) => { jobSkillMap[s.id] = s.name; });
        }

        const candidateProfile = {
          skills: rawSkills.map((s) => ({
            skillId: s.skillId,
            skillName: s.skillName,
            proficiencyLevel: s.proficiencyLevel,
            isVerified: s.isVerified ?? false,
          })),
        };

        const jobRequirements = {
          requiredSkills: (job.requiredSkills ?? []).map((s) => ({
            skillId: s.skillId,
            skillName: jobSkillMap[s.skillId] ?? s.skillId,
            minLevel: s.minLevel,
          })),
          preferredSkills: (job.preferredSkills ?? []).map((s) => ({
            skillId: s.skillId,
            skillName: jobSkillMap[s.skillId] ?? s.skillId,
            minLevel: s.minLevel,
          })),
        };

        matchBreakdown = calculateJobMatch(candidateProfile, jobRequirements);
      }
    }

    // Mask wallet address for privacy (show first 6 + last 4 chars only)
    const maskedWallet = candidate.walletAddress
      ? `${candidate.walletAddress.slice(0, 6)}...${candidate.walletAddress.slice(-4)}`
      : null;

    return NextResponse.json({
      success: true,
      data: {
        id: candidate.id,
        name: candidate.name,
        bio: candidate.bio,
        walletAddress: maskedWallet,
        memberSince: candidate.createdAt,
        skills: rawSkills.map((s) => ({
          id: s.id,
          skillId: s.skillId,
          skillName: s.skillName,
          skillCategory: s.skillCategory,
          proficiencyLevel: s.proficiencyLevel,
          isVerified: s.isVerified,
          verifiedAt: s.verifiedAt,
        })),
        credentials: verifiedCredentials.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
          blockchainTxHash: c.blockchainTxHash,
          tokenId: c.tokenId,
        })),
        assessments: recentAttempts,
        matchBreakdown,
      },
    });
  } catch (err) {
    console.error("[candidates/[id] GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
