import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { jobs, userSkills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recommendJobsForCandidate } from "@/lib/matching";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const candidateSkills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
    });

    const allSkills = await db.query.skills.findMany();
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    const openJobs = await db.query.jobs.findMany({
      where: eq(jobs.status, "open"),
    });

    const candidateProfile = {
      skills: candidateSkills.map((cs) => ({
        skillId: cs.skillId,
        skillName: skillMap.get(cs.skillId) || "",
        proficiencyLevel: cs.proficiencyLevel,
        isVerified: cs.isVerified || false,
      })),
    };

    const jobsWithRequirements = openJobs.map((job) => ({
      id: job.id,
      requirements: {
        requiredSkills: (job.requiredSkills || []).map((s) => ({
          skillId: s.skillId,
          skillName: skillMap.get(s.skillId) || "",
          minLevel: s.minLevel,
        })),
        preferredSkills: (job.preferredSkills || []).map((s) => ({
          skillId: s.skillId,
          skillName: skillMap.get(s.skillId) || "",
          minLevel: s.minLevel,
        })),
      },
    }));

    const recommendations = recommendJobsForCandidate(
      candidateProfile,
      jobsWithRequirements
    );

    const enrichedRecommendations = recommendations.map((rec) => {
      const job = openJobs.find((j) => j.id === rec.jobId);
      return {
        ...rec,
        job,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedRecommendations,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
