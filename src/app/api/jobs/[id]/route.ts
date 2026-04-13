import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { jobs, applications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, params.id),
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: job });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string; role: string }).id;
    const userRole = (session.user as { id: string; role: string }).role;

    const existing = await db.query.jobs.findFirst({
      where: eq(jobs.id, params.id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (existing.employerId !== userId && userRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Build update object with only allowed fields
    const update: {
      updatedAt: Date;
      requiredSkills?: { skillId: string; minLevel: number }[];
      preferredSkills?: { skillId: string; minLevel: number }[];
      title?: string;
      description?: string;
      status?: string;
    } = { updatedAt: new Date() };

    if (Array.isArray(body.requiredSkills)) {
      update.requiredSkills = body.requiredSkills;
    }
    if (Array.isArray(body.preferredSkills)) {
      update.preferredSkills = body.preferredSkills;
    }
    if (typeof body.title === "string") update.title = body.title;
    if (typeof body.description === "string") update.description = body.description;
    if (typeof body.status === "string") update.status = body.status;

    const [updated] = await db
      .update(jobs)
      .set(update)
      .where(eq(jobs.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string; role: string }).id;
    const userRole = (session.user as { id: string; role: string }).role;

    const existing = await db.query.jobs.findFirst({
      where: eq(jobs.id, params.id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (existing.employerId !== userId && userRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await db.delete(applications).where(eq(applications.jobId, params.id));
    await db.delete(jobs).where(eq(jobs.id, params.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
