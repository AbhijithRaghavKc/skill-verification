import { NextRequest, NextResponse } from "next/server";
import { verifyCredentialOnChain } from "@/lib/blockchain";
import { db } from "@/db";
import { credentials } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { credentialId, tokenId } = await req.json();

    if (!credentialId && !tokenId) {
      return NextResponse.json(
        { success: false, error: "Credential ID or Token ID required" },
        { status: 400 }
      );
    }

    if (tokenId) {
      try {
        const onChainData = await verifyCredentialOnChain(tokenId);
        return NextResponse.json({
          success: true,
          data: {
            verified: onChainData.isValid,
            onChain: true,
            ...onChainData,
          },
        });
      } catch {
        return NextResponse.json({
          success: true,
          data: {
            verified: false,
            onChain: false,
            error: "Token not found on blockchain",
          },
        });
      }
    }

    const credential = await db.query.credentials.findFirst({
      where: eq(credentials.id, credentialId),
    });

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Credential not found" },
        { status: 404 }
      );
    }

    let onChainVerified = false;
    if (credential.tokenId) {
      try {
        const onChainData = await verifyCredentialOnChain(credential.tokenId);
        onChainVerified = onChainData.isValid;
      } catch {
        onChainVerified = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        credential: {
          id: credential.id,
          title: credential.title,
          status: credential.status,
          issuedAt: credential.issuedAt,
          blockchainTxHash: credential.blockchainTxHash,
          tokenId: credential.tokenId,
        },
        verified: credential.status === "verified",
        onChainVerified,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
