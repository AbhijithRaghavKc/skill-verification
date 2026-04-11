import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

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

    if (role === "employer") {
      const employerJobs = await db.query.jobs.findMany({
        where: eq(jobs.employerId, userId),
      });
      const jobIds = employerJobs.map((j) => j.id);

      const allApps = await db.query.applications.findMany({
        orderBy: [desc(applications.createdAt)],
      });

      const filtered = allApps.filter((app) => jobIds.includes(app.jobId));

      const enriched = await Promise.all(
        filtered.map(async (app) => {
          const job = employerJobs.find((j) => j.id === app.jobId);
          return {
            id: app.id,
            status: app.status,
            matchScore: app.matchScore,
            coverLetter: app.coverLetter,
            appliedAt: app.createdAt,
            candidateId: app.candidateId,
            job: job
              ? { title: job.title, company: job.company }
              : null,
          };
        })
      );

      return NextResponse.json({ success: true, data: enriched });
    }

    const userApps = await db.query.applications.findMany({
      where: eq(applications.candidateId, userId),
      orderBy: [desc(applications.createdAt)],
    });

    const enriched = await Promise.all(
      userApps.map(async (app) => {
        const job = await db.query.jobs.findFirst({
          where: eq(jobs.id, app.jobId),
        });
        return {
          id: app.id,
          status: app.status,
          matchScore: app.matchScore,
          appliedAt: app.createdAt,
          job: job
            ? { title: job.title, company: job.company }
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
        { success: false, error: "Only employers can update application status" },
        { status: 403 }
      );
    }

    const { applicationId, status } = await req.json();

    const validStatuses = ["pending", "reviewed", "shortlisted", "rejected", "accepted"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const app = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, app.jobId), eq(jobs.employerId, userId)),
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Not authorized to update this application" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, applicationId))
      .returning();

    // Notify the candidate about their application status change
    const statusLabels: Record<string, string> = {
      reviewed: "is being reviewed",
      shortlisted: "has been shortlisted",
      accepted: "has been accepted",
      rejected: "has been rejected",
    };
    await createNotification({
      userId: app.candidateId,
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your application for "${job.title}" ${statusLabels[status] || "has been updated"}.`,
      type: "application",
      link: "/profile",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
