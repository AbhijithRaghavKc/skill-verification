"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Shield,
  Briefcase,
  Globe,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];
const PIE_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

type AnalyticsData = {
  overview: {
    totalCredentials: number;
    totalAssessments: number;
    activeJobs: number;
    verifiedSkills: number;
    platformUsers: number;
    avgMatchScore: number;
  };
  skillsDemandData: { skill: string; demand: number }[];
  verificationTrendData: { month: string; verifications: number }[];
  assessmentPerformanceData: { category: string; passRate: number; avgScore: number }[];
  credentialDistributionData: { name: string; value: number }[];
  jobMarketData: { month: string; postings: number; applications: number }[];
  matchScoreData: { range: string; count: number }[];
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
        {label && (
          <p className="mb-1 text-xs font-semibold text-gray-700">{label}</p>
        )}
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, router]);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const user = session?.user as { name: string; email: string; role: string };

  const overview = analytics?.overview || {
    totalCredentials: 0,
    totalAssessments: 0,
    activeJobs: 0,
    verifiedSkills: 0,
    platformUsers: 0,
    avgMatchScore: 0,
  };

  const overviewStats = [
    {
      title: "Total Credentials Issued",
      value: overview.totalCredentials.toLocaleString(),
      icon: Award,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Assessments",
      value: overview.totalAssessments.toLocaleString(),
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "Active Jobs",
      value: overview.activeJobs.toLocaleString(),
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Verified Skills",
      value: overview.verifiedSkills.toLocaleString(),
      icon: Shield,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Platform Users",
      value: overview.platformUsers.toLocaleString(),
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Avg. Match Score",
      value: `${overview.avgMatchScore}%`,
      icon: TrendingUp,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
    },
  ];

  const skillsDemandData = (analytics?.skillsDemandData || []).map((d, i) => ({
    ...d,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const verificationTrendData = analytics?.verificationTrendData || [];
  const assessmentPerformanceData = analytics?.assessmentPerformanceData || [];
  const credentialDistributionData = analytics?.credentialDistributionData || [];
  const jobMarketData = analytics?.jobMarketData || [];
  const matchScoreData = analytics?.matchScoreData || [];

  const totalMatches = matchScoreData.reduce((a, b) => a + b.count, 0) || 1;
  const highMatchCount = matchScoreData[3]?.count || 0;
  const midMatchCount = matchScoreData[2]?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Platform Analytics
            </h1>
            <p className="mt-1 text-gray-500">
              Real-time market insights and platform performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
            <Clock className="h-4 w-4" />
            <span>Updated just now</span>
          </div>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {overviewStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-lg ${stat.bg} p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="skills">
          <TabsList className="mb-6">
            <TabsTrigger value="skills">Skills Demand</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="jobs">Job Market</TabsTrigger>
            <TabsTrigger value="matches">Match Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Skills Demand</CardTitle>
                    <CardDescription>
                      Top skills across all job postings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {skillsDemandData.length === 0 ? (
                  <p className="py-16 text-center text-gray-400">No job postings data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={skillsDemandData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="skill" tick={{ fontSize: 12, fill: "#6b7280" }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="demand" name="Job Postings" radius={[4, 4, 0, 0]}>
                        {skillsDemandData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <div>
                    <CardTitle>Verification Trend</CardTitle>
                    <CardDescription>
                      Monthly blockchain credential verifications over the past 6 months
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={verificationTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="verificationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="verifications" name="Verifications" stroke="#10b981" strokeWidth={2.5} fill="url(#verificationGradient)" dot={{ r: 5, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 7 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <CardTitle>Assessment Performance</CardTitle>
                    <CardDescription>
                      Pass rate and average scores across skill categories
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentPerformanceData.length === 0 ? (
                  <p className="py-16 text-center text-gray-400">No assessment data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={assessmentPerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Bar dataKey="passRate" name="Pass Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgScore" name="Avg Score (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <CardTitle>Credential Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of issued credentials by type
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {credentialDistributionData.length === 0 ? (
                    <p className="py-16 text-center text-gray-400">No credentials issued yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={credentialDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={130}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name} ${value}%`}
                          labelLine={true}
                        >
                          {credentialDistributionData.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
                        <Legend wrapperStyle={{ fontSize: "13px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credential Breakdown</CardTitle>
                  <CardDescription>
                    Detailed issuance numbers by credential type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {credentialDistributionData.length === 0 ? (
                    <p className="py-16 text-center text-gray-400">No data available</p>
                  ) : (
                    <div className="space-y-5">
                      {credentialDistributionData.map((item, index) => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                              <span className="font-medium text-gray-700">{item.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{item.value}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            ~{Math.round((item.value / 100) * overview.totalCredentials).toLocaleString()} credentials
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle>Job Market Overview</CardTitle>
                    <CardDescription>
                      Monthly job postings and application volume over the past 6 months
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={jobMarketData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="postingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                    <Area type="monotone" dataKey="applications" name="Applications" stroke="#3b82f6" strokeWidth={2.5} fill="url(#applicationsGradient)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="postings" name="Job Postings" stroke="#f59e0b" strokeWidth={2.5} fill="url(#postingsGradient)" dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-600" />
                    <div>
                      <CardTitle>Match Score Distribution</CardTitle>
                      <CardDescription>
                        Distribution of candidate-to-job match scores
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={matchScoreData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#06b6d4" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">High Match Rate</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-900">
                          {((highMatchCount / totalMatches) * 100).toFixed(1)}%
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">Candidates scoring 76-100%</p>
                      </div>
                      <div className="rounded-lg bg-emerald-100 p-3">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Mid-Range Majority</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-900">
                          {((midMatchCount / totalMatches) * 100).toFixed(1)}%
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">Candidates scoring 51-75%</p>
                      </div>
                      <div className="rounded-lg bg-cyan-100 p-3">
                        <BarChart3 className="h-5 w-5 text-cyan-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Match Events</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-900">
                          {totalMatches.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">Across all score ranges</p>
                      </div>
                      <div className="rounded-lg bg-indigo-100 p-3">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
