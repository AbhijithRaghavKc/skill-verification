import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { applications, jobs, userSkills } from "@/db/schema";
import { applicationSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";
import { calculateJobMatch } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const candidateId = (session.user as { id: string }).id;
    const body = await req.json();
    const validated = applicationSchema.parse(body);

    const existingApp = await db.query.applications.findFirst({
      where: and(
        eq(applications.jobId, validated.jobId),
        eq(applications.candidateId, candidateId)
      ),
    });

    if (existingApp) {
      return NextResponse.json(
        { success: false, error: "Already applied to this job" },
        { status: 409 }
      );
    }

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, validated.jobId),
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const candidateSkills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, candidateId),
    });

    const allSkills = await db.query.skills.findMany();
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    const candidateProfile = {
      skills: candidateSkills.map((cs) => ({
        skillId: cs.skillId,
        skillName: skillMap.get(cs.skillId) || "",
        proficiencyLevel: cs.proficiencyLevel,
        isVerified: cs.isVerified || false,
      })),
    };

    const jobRequirements = {
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
    };

    const matchResult = calculateJobMatch(candidateProfile, jobRequirements);

    const [application] = await db
      .insert(applications)
      .values({
        jobId: validated.jobId,
        candidateId,
        coverLetter: validated.coverLetter,
        matchScore: matchResult.overallScore,
        status: "pending",
      })
      .returning();

    // Notify the employer about the new application
    await createNotification({
      userId: job.employerId,
      title: "New Job Application",
      message: `A candidate applied to "${job.title}" with a ${matchResult.overallScore}% match score.`,
      type: "application",
      link: "/jobs/applications",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          application,
          matchResult,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid input data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
