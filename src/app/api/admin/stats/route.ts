import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  credentials,
  assessments,
  assessmentAttempts,
  jobs,
  applications,
  skills,
  blockchainTransactions,
} from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = (session.user as { role: string }).role;
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [candidateCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "candidate"));
    const [employerCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "employer"));
    const [institutionCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "institution"));
    const [totalCredentials] = await db.select({ count: count() }).from(credentials);
    const [verifiedCredentials] = await db
      .select({ count: count() })
      .from(credentials)
      .where(eq(credentials.status, "verified"));
    const [totalAssessments] = await db.select({ count: count() }).from(assessments);
    const [totalAttempts] = await db.select({ count: count() }).from(assessmentAttempts);
    const [totalJobs] = await db.select({ count: count() }).from(jobs);
    const [openJobs] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "open"));
    const [totalApplications] = await db.select({ count: count() }).from(applications);
    const [totalSkills] = await db.select({ count: count() }).from(skills);
    const [totalTxs] = await db.select({ count: count() }).from(blockchainTransactions);

    const recentUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 10,
    });

    const safeUsers = recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers?.count || 0,
          candidates: candidateCount?.count || 0,
          employers: employerCount?.count || 0,
          institutions: institutionCount?.count || 0,
        },
        credentials: {
          total: totalCredentials?.count || 0,
          verified: verifiedCredentials?.count || 0,
        },
        assessments: {
          total: totalAssessments?.count || 0,
          attempts: totalAttempts?.count || 0,
        },
        jobs: {
          total: totalJobs?.count || 0,
          open: openJobs?.count || 0,
          applications: totalApplications?.count || 0,
        },
        skills: totalSkills?.count || 0,
        blockchainTxs: totalTxs?.count || 0,
        recentUsers: safeUsers,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
