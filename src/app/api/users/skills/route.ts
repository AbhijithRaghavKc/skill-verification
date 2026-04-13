import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { userSkills, skills } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/users/skills - add or update a skill on the candidate's profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: string }).role;
    if (role !== "candidate") {
      return NextResponse.json({ success: false, error: "Only candidates can manage skills" }, { status: 403 });
    }

    const userId = (session.user as { id: string }).id;
    const { skillId, proficiencyLevel } = await req.json();

    if (!skillId) {
      return NextResponse.json({ success: false, error: "skillId is required" }, { status: 400 });
    }
    if (typeof proficiencyLevel !== "number" || proficiencyLevel < 1 || proficiencyLevel > 100) {
      return NextResponse.json({ success: false, error: "proficiencyLevel must be 1-100" }, { status: 400 });
    }

    // Verify the skill exists
    const skill = await db.query.skills.findFirst({ where: eq(skills.id, skillId) });
    if (!skill) {
      return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
    }

    // Check if candidate already has this skill
    const existing = await db.query.userSkills.findFirst({
      where: and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)),
    });

    if (existing) {
      // Update proficiency level (never touch isVerified - that's set by credentials)
      const [updated] = await db
        .update(userSkills)
        .set({ proficiencyLevel })
        .where(eq(userSkills.id, existing.id))
        .returning();
      return NextResponse.json({ success: true, data: { ...updated, skillName: skill.name, skillCategory: skill.category } });
    }

    // Insert new user skill (unverified by default)
    const [created] = await db
      .insert(userSkills)
      .values({ userId, skillId, proficiencyLevel, isVerified: false })
      .returning();

    return NextResponse.json(
      { success: true, data: { ...created, skillName: skill.name, skillCategory: skill.category } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[users/skills POST]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/skills - remove a skill from the candidate's profile
// Body: { userSkillId }
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { userSkillId } = await req.json();

    if (!userSkillId) {
      return NextResponse.json({ success: false, error: "userSkillId is required" }, { status: 400 });
    }

    // Only delete if it belongs to this user and is NOT blockchain-verified
    const existing = await db.query.userSkills.findFirst({
      where: and(eq(userSkills.id, userSkillId), eq(userSkills.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
    }

    if (existing.isVerified) {
      return NextResponse.json(
        { success: false, error: "Cannot remove a blockchain-verified skill" },
        { status: 403 }
      );
    }

    await db.delete(userSkills).where(eq(userSkills.id, userSkillId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[users/skills DELETE]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
