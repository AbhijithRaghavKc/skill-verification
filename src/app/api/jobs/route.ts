import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { jobSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.query.jobs.findMany({
      where: eq(jobs.status, "open"),
      orderBy: [desc(jobs.createdAt)],
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
    if (role !== "employer" && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only employers can post jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = jobSchema.parse(body);
    const employerId = (session.user as { id: string }).id;

    const [job] = await db
      .insert(jobs)
      .values({
        employerId,
        title: validated.title,
        description: validated.description,
        company: validated.company,
        location: validated.location,
        type: validated.type,
        salaryMin: validated.salaryMin,
        salaryMax: validated.salaryMax,
        requiredSkills: validated.requiredSkills,
        preferredSkills: validated.preferredSkills,
        status: "open",
      })
      .returning();

    return NextResponse.json({ success: true, data: job }, { status: 201 });
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
