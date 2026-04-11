import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { assessments, skills } from "@/db/schema";
import { assessmentSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";
import { generateAssessmentQuestions } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await db.query.assessments.findMany({
      where: eq(assessments.status, "active"),
      orderBy: [desc(assessments.createdAt)],
    });

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = (session.user as { role: string }).role;
    if (role !== "institution" && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only institutions can create assessments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = assessmentSchema.parse(body);
    const creatorId = (session.user as { id: string }).id;

    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, validated.skillId),
    });

    if (!skill) {
      return NextResponse.json(
        { success: false, error: "Skill not found" },
        { status: 404 }
      );
    }

    const skillName = skill.name;
    const questions = generateAssessmentQuestions(
      skillName,
      validated.difficulty,
      5
    );

    const [assessment] = await db
      .insert(assessments)
      .values({
        title: validated.title,
        description: validated.description,
        skillId: validated.skillId,
        creatorId,
        difficulty: validated.difficulty,
        duration: validated.duration,
        passingScore: validated.passingScore,
        questions,
        status: "active",
      })
      .returning();

    return NextResponse.json(
      { success: true, data: assessment },
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
