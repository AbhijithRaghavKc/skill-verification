import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const result = await db.query.skills.findMany();
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

    const { name, category, description } = await req.json();

    const [skill] = await db
      .insert(skills)
      .values({ name, category, description })
      .returning();

    return NextResponse.json({ success: true, data: skill }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
