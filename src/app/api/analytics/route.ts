import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  credentials,
  assessmentAttempts,
  jobs,
  applications,
  userSkills,
  blockchainTransactions,
} from "@/db/schema";
import { count, avg, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Overview stats
    const [userCount] = await db.select({ count: count() }).from(users);
    const [credentialCount] = await db.select({ count: count() }).from(credentials);
    const [assessmentCount] = await db.select({ count: count() }).from(assessmentAttempts);
    const [activeJobCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "open"));
    const [verifiedSkillCount] = await db
      .select({ count: count() })
      .from(userSkills)
      .where(eq(userSkills.isVerified, true));
    const [avgMatchScore] = await db
      .select({ avg: avg(applications.matchScore) })
      .from(applications);

    // Skills demand - count how many jobs require each skill
    const allJobs = await db.query.jobs.findMany();
    const allSkills = await db.query.skills.findMany();
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    const skillDemand: Record<string, number> = {};
    for (const job of allJobs) {
      const reqSkills = (job.requiredSkills || []).map((s) => s.skillId);
      const prefSkills = (job.preferredSkills || []).map((s) => s.skillId);
      for (const sid of [...reqSkills, ...prefSkills]) {
        const name = skillMap.get(sid) || sid;
        skillDemand[name] = (skillDemand[name] || 0) + 1;
      }
    }
    const skillsDemandData = Object.entries(skillDemand)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, demand]) => ({ skill, demand }));

    // Credential distribution by type
    const allCredentials = await db.query.credentials.findMany();
    const typeDist: Record<string, number> = {};
    for (const c of allCredentials) {
      typeDist[c.type] = (typeDist[c.type] || 0) + 1;
    }
    const total = allCredentials.length || 1;
    const credentialDistributionData = Object.entries(typeDist).map(
      ([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
      })
    );

    // Verification trend (last 6 months)
    const allTxs = await db.query.blockchainTransactions.findMany({
      orderBy: [desc(blockchainTransactions.createdAt)],
    });
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const verificationTrendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthNames[d.getMonth()];
      const monthTxs = allTxs.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return (
          txDate.getMonth() === d.getMonth() &&
          txDate.getFullYear() === d.getFullYear()
        );
      });
      verificationTrendData.push({
        month: monthLabel,
        verifications: monthTxs.length,
      });
    }

    // Assessment performance by skill category
    const allAttempts = await db.query.assessmentAttempts.findMany();
    const allAssessments = await db.query.assessments.findMany();
    const assessmentSkillMap = new Map(
      allAssessments.map((a) => [a.id, a.skillId])
    );
    const categoryPerf: Record<string, { total: number; passed: number; scoreSum: number }> = {};
    for (const attempt of allAttempts) {
      const skillId = assessmentSkillMap.get(attempt.assessmentId);
      const skill = skillId ? allSkills.find((s) => s.id === skillId) : null;
      const cat = skill?.category || "Other";
      if (!categoryPerf[cat]) {
        categoryPerf[cat] = { total: 0, passed: 0, scoreSum: 0 };
      }
      categoryPerf[cat].total++;
      if (attempt.passed) categoryPerf[cat].passed++;
      categoryPerf[cat].scoreSum += attempt.score || 0;
    }
    const assessmentPerformanceData = Object.entries(categoryPerf).map(
      ([category, data]) => ({
        category,
        passRate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
        avgScore: data.total > 0 ? Math.round(data.scoreSum / data.total) : 0,
      })
    );

    // Job market data (last 6 months)
    const allApplications = await db.query.applications.findMany();
    const jobMarketData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthNames[d.getMonth()];
      const monthJobs = allJobs.filter((j) => {
        const jd = new Date(j.createdAt);
        return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
      });
      const monthApps = allApplications.filter((a) => {
        const ad = new Date(a.createdAt);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      });
      jobMarketData.push({
        month: monthLabel,
        postings: monthJobs.length,
        applications: monthApps.length,
      });
    }

    // Match score distribution
    const matchScoreData = [
      { range: "0-25%", count: 0 },
      { range: "26-50%", count: 0 },
      { range: "51-75%", count: 0 },
      { range: "76-100%", count: 0 },
    ];
    for (const app of allApplications) {
      const score = app.matchScore || 0;
      if (score <= 25) matchScoreData[0].count++;
      else if (score <= 50) matchScoreData[1].count++;
      else if (score <= 75) matchScoreData[2].count++;
      else matchScoreData[3].count++;
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCredentials: credentialCount?.count || 0,
          totalAssessments: assessmentCount?.count || 0,
          activeJobs: activeJobCount?.count || 0,
          verifiedSkills: verifiedSkillCount?.count || 0,
          platformUsers: userCount?.count || 0,
          avgMatchScore: Math.round(Number(avgMatchScore?.avg || 0)),
        },
        skillsDemandData,
        verificationTrendData,
        assessmentPerformanceData,
        credentialDistributionData,
        jobMarketData,
        matchScoreData,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
