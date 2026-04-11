import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { credentials, users } from "@/db/schema";
import { credentialSchema } from "@/lib/validations";
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
    const role = (session.user as { role: string }).role;

    let result;
    if (role === "institution") {
      result = await db.query.credentials.findMany({
        where: eq(credentials.issuerId, userId),
        orderBy: [desc(credentials.createdAt)],
      });
    } else {
      result = await db.query.credentials.findMany({
        where: eq(credentials.candidateId, userId),
        orderBy: [desc(credentials.createdAt)],
      });
    }

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
        { success: false, error: "Only institutions can issue credentials" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = credentialSchema.parse(body);
    const issuerId = (session.user as { id: string }).id;

    const candidate = await db.query.users.findFirst({
      where: eq(users.id, validated.candidateId),
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    const [credential] = await db
      .insert(credentials)
      .values({
        candidateId: validated.candidateId,
        issuerId,
        title: validated.title,
        description: validated.description,
        type: validated.type,
        skillIds: validated.skillIds,
        metadata: validated.metadata,
        status: "pending",
        issuedAt: new Date(),
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: credential },
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
