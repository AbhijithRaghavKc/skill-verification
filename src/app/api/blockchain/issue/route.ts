import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { credentials, blockchainTransactions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  issueCredentialOnChain,
  generateCredentialHash,
} from "@/lib/blockchain";
import { uploadToIPFS, buildCredentialMetadata } from "@/lib/ipfs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const role = (session.user as { role: string }).role;
    if (role !== "institution" && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only institutions can issue on blockchain" },
        { status: 403 },
      );
    }

    const { credentialId } = await req.json();

    const credential = await db.query.credentials.findFirst({
      where: eq(credentials.id, credentialId),
    });

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Credential not found" },
        { status: 404 },
      );
    }

    const candidate = await db.query.users.findFirst({
      where: eq(users.id, credential.candidateId),
    });

    if (!candidate?.walletAddress) {
      return NextResponse.json(
        { success: false, error: "Candidate wallet address not configured" },
        { status: 400 },
      );
    }

    const issuer = await db.query.users.findFirst({
      where: eq(users.id, credential.issuerId),
    });

    // Resolve skill names
    const skillIds = (credential.skillIds as string[]) || [];
    let skillNames: string[] = [];
    if (skillIds.length > 0) {
      const skillRecords = await db.query.skills.findMany();
      const skillMap = new Map(skillRecords.map((s) => [s.id, s.name]));
      skillNames = skillIds.map((id) => skillMap.get(id) || id);
    }

    // Upload metadata to IPFS
    const metadata = buildCredentialMetadata({
      title: credential.title,
      description: credential.description || "",
      issuerName: issuer?.organizationName || issuer?.name || "Unknown Issuer",
      issuerId: credential.issuerId,
      skills: skillNames,
      type: credential.type,
      issuedAt: credential.issuedAt?.toISOString() || new Date().toISOString(),
    });

    let ipfsHash: string;
    try {
      ipfsHash = await uploadToIPFS(metadata);
    } catch {
      ipfsHash = "pending";
    }

    const credentialHash = generateCredentialHash({
      candidateId: credential.candidateId,
      issuerId: credential.issuerId,
      title: credential.title,
      skills: skillNames,
      issuedAt: credential.issuedAt?.toISOString() || new Date().toISOString(),
    });

    const metadataURI = `ipfs://${ipfsHash}`;

    const { txHash, tokenId } = await issueCredentialOnChain(
      candidate.walletAddress,
      credentialHash,
      metadataURI,
    );

    await db
      .update(credentials)
      .set({
        status: "verified",
        blockchainTxHash: txHash,
        tokenId,
        ipfsHash,
        updatedAt: new Date(),
      })
      .where(eq(credentials.id, credentialId));

    const userId = (session.user as { id: string }).id;
    await db.insert(blockchainTransactions).values({
      userId,
      txHash,
      type: "credential_issue",
      status: "confirmed",
      metadata: { credentialId, tokenId, ipfsHash },
    });

    return NextResponse.json({
      success: true,
      data: { txHash, tokenId, ipfsHash },
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { success: false, error: "Blockchain transaction failed" },
      { status: 500 },
    );
  }
}

