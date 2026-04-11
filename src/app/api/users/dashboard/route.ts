import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  credentials,
  assessmentAttempts,
  applications,
  blockchainTransactions,
  jobs,
} from "@/db/schema";
import { eq, count, avg, and } from "drizzle-orm";

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

    if (role === "candidate") {
      const [totalCreds] = await db
        .select({ count: count() })
        .from(credentials)
        .where(eq(credentials.candidateId, userId));

      const [verifiedCreds] = await db
        .select({ count: count() })
        .from(credentials)
        .where(
          and(
            eq(credentials.candidateId, userId),
            eq(credentials.status, "verified")
          )
        );

      const [attemptStats] = await db
        .select({ count: count(), avgScore: avg(assessmentAttempts.score) })
        .from(assessmentAttempts)
        .where(eq(assessmentAttempts.candidateId, userId));

      const [appCount] = await db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.candidateId, userId));

      const [txCount] = await db
        .select({ count: count() })
        .from(blockchainTransactions)
        .where(eq(blockchainTransactions.userId, userId));

      return NextResponse.json({
        success: true,
        data: {
          totalCredentials: totalCreds?.count || 0,
          verifiedCredentials: verifiedCreds?.count || 0,
          assessmentsTaken: attemptStats?.count || 0,
          averageScore: Math.round(Number(attemptStats?.avgScore || 0)),
          jobMatches: appCount?.count || 0,
          blockchainVerifications: txCount?.count || 0,
        },
      });
    }

    if (role === "employer") {
      const [jobCount] = await db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.employerId, userId));

      const [appCount] = await db
        .select({ count: count() })
        .from(applications);

      return NextResponse.json({
        success: true,
        data: {
          totalJobs: jobCount?.count || 0,
          totalApplications: appCount?.count || 0,
          activeJobs: jobCount?.count || 0,
        },
      });
    }

    if (role === "institution") {
      const [issuedCreds] = await db
        .select({ count: count() })
        .from(credentials)
        .where(eq(credentials.issuerId, userId));

      const [verifiedCreds] = await db
        .select({ count: count() })
        .from(credentials)
        .where(
          and(
            eq(credentials.issuerId, userId),
            eq(credentials.status, "verified")
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          issuedCredentials: issuedCreds?.count || 0,
          verifiedCredentials: verifiedCreds?.count || 0,
        },
      });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
