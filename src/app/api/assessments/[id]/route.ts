import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { assessments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
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

    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, params.id),
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
