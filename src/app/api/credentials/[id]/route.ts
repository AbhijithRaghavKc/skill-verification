import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { credentials } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credential = await db.query.credentials.findFirst({
      where: eq(credentials.id, params.id),
    });

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: credential });
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

    const body = await req.json();
    const { status, blockchainTxHash, tokenId, ipfsHash } = body;

    const [updated] = await db
      .update(credentials)
      .set({
        ...(status && { status }),
        ...(blockchainTxHash && { blockchainTxHash }),
        ...(tokenId && { tokenId }),
        ...(ipfsHash && { ipfsHash }),
        updatedAt: new Date(),
      })
      .where(eq(credentials.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
