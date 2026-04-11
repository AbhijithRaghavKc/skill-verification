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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users,
  Award,
  FileCheck,
  Briefcase,
  Shield,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type AdminStats = {
  users: { total: number; candidates: number; employers: number; institutions: number };
  credentials: { total: number; verified: number };
  assessments: { total: number; attempts: number };
  jobs: { total: number; open: number; applications: number };
  skills: number;
  blockchainTxs: number;
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
  }[];
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  organizationName: string | null;
  walletAddress: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const user = session?.user as { name: string; email: string; role: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      if (user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchData();
    }
  }, [status, router, user?.role]);

  async function fetchData() {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
      ]);
      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);
      if (statsData.success) setStats(statsData.data);
      if (usersData.success) setAllUsers(usersData.data);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, updates: { role?: string; isVerified?: boolean }) {
    setUpdating(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    const data = await res.json();
    if (data.success) {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
    }
    setUpdating(null);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  const statCards = stats
    ? [
        { title: "Total Users", value: stats.users.total, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Candidates", value: stats.users.candidates, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Employers", value: stats.users.employers, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100" },
        { title: "Institutions", value: stats.users.institutions, icon: Award, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Credentials", value: `${stats.credentials.verified}/${stats.credentials.total}`, icon: Shield, color: "text-cyan-600", bg: "bg-cyan-100" },
        { title: "Assessments", value: stats.assessments.total, icon: FileCheck, color: "text-indigo-600", bg: "bg-indigo-100" },
        { title: "Assessment Attempts", value: stats.assessments.attempts, icon: BarChart3, color: "text-pink-600", bg: "bg-pink-100" },
        { title: "Jobs (Open)", value: `${stats.jobs.open}/${stats.jobs.total}`, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-100" },
        { title: "Applications", value: stats.jobs.applications, icon: FileCheck, color: "text-teal-600", bg: "bg-teal-100" },
        { title: "Blockchain Txs", value: stats.blockchainTxs, icon: Shield, color: "text-violet-600", bg: "bg-violet-100" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Platform management and oversight
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {statCards.map((card) => (
                <Card key={card.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg ${card.bg} p-2`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{card.title}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {typeof card.value === "number"
                            ? card.value.toLocaleString()
                            : card.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {stats?.recentUsers && stats.recentUsers.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Last 10 registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100">
                    {stats.recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {u.role}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user roles and verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Verified</th>
                        <th className="pb-3 pr-4">Joined</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-4 font-medium text-gray-900">
                            {u.name}
                          </td>
                          <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="secondary" className="capitalize">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {u.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-300" />
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-400 text-xs">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updating === u.id}
                                onClick={() =>
                                  updateUser(u.id, {
                                    isVerified: !u.isVerified,
                                  })
                                }
                                className="text-xs"
                              >
                                {u.isVerified ? "Unverify" : "Verify"}
                              </Button>
                              <select
                                className="rounded border border-gray-200 px-2 py-1 text-xs"
                                value={u.role}
                                onChange={(e) =>
                                  updateUser(u.id, { role: e.target.value })
                                }
                                disabled={updating === u.id}
                              >
                                <option value="candidate">Candidate</option>
                                <option value="employer">Employer</option>
                                <option value="institution">Institution</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
