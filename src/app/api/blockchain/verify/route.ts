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
        { status: 400 },
      );
    }

    if (tokenId) {
      let resolvedTokenId = tokenId;

      // If it looks like a tx hash (0x + 64 hex chars), resolve to token ID from DB
      if (typeof tokenId === "string" && /^0x[a-fA-F0-9]{64}$/.test(tokenId)) {
        const credential = await db.query.credentials.findFirst({
          where: eq(credentials.blockchainTxHash, tokenId),
        });

        if (!credential?.tokenId) {
          return NextResponse.json({
            success: true,
            data: {
              verified: false,
              onChain: false,
              error: "No credential found for this transaction hash",
            },
          });
        }

        resolvedTokenId = credential.tokenId;
      }

      try {
        console.log("[verify] resolvedTokenId:", resolvedTokenId);
        const onChainData = await verifyCredentialOnChain(resolvedTokenId);
        console.log("[verify] onChainData:", onChainData);
        return NextResponse.json({
          success: true,
          data: {
            verified: onChainData.isValid,
            onChain: true,
            ...onChainData,
          },
        });
      } catch (err) {
        console.error("[verify] on-chain error:", err);
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}
