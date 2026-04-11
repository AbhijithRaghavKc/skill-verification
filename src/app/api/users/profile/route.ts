import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, userSkills, credentials, assessmentAttempts } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { profileUpdateSchema } from "@/lib/validations";

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

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const skills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
    });

    const [credentialCount] = await db
      .select({ count: count() })
      .from(credentials)
      .where(eq(credentials.candidateId, userId));

    const [attemptCount] = await db
      .select({ count: count() })
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.candidateId, userId));

    const safeUser = Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== "passwordHash")
    );

    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        skills,
        stats: {
          credentials: credentialCount?.count || 0,
          assessments: attemptCount?.count || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const validated = profileUpdateSchema.parse(body);

    const [updated] = await db
      .update(users)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    const safeUser = Object.fromEntries(
      Object.entries(updated).filter(([key]) => key !== "passwordHash")
    );

    return NextResponse.json({ success: true, data: safeUser });
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
