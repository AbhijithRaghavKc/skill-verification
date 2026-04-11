import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { assessmentAttempts, assessments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

    const attempts = await db.query.assessmentAttempts.findMany({
      where: eq(assessmentAttempts.candidateId, userId),
      orderBy: [desc(assessmentAttempts.startedAt)],
    });

    const enriched = await Promise.all(
      attempts.map(async (attempt) => {
        const assessment = await db.query.assessments.findFirst({
          where: eq(assessments.id, attempt.assessmentId),
        });
        return {
          ...attempt,
          assessment: assessment
            ? { title: assessment.title, difficulty: assessment.difficulty }
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
