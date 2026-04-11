"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Application = {
  id: string;
  status: string;
  matchScore: number | null;
  coverLetter: string | null;
  appliedAt: string;
  candidateId: string;
  job: { title: string; company: string } | null;
};

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive" | "default" | "secondary"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  reviewed: { variant: "default", label: "Reviewed" },
  shortlisted: { variant: "default", label: "Shortlisted" },
  accepted: { variant: "success", label: "Accepted" },
  rejected: { variant: "destructive", label: "Rejected" },
};

export default function ManageApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const user = session?.user as { name: string; email: string; role: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      if (user?.role !== "employer" && user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchApplications();
    }
  }, [status, router, user?.role]);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/jobs/applications");
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(applicationId: string, newStatus: string) {
    setUpdating(applicationId);
    const res = await fetch("/api/jobs/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Applications
          </h1>
          <p className="mt-1 text-gray-500">
            Review and manage candidate applications for your job postings
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Applications Yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Applications will appear here when candidates apply to your jobs
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = statusConfig[app.status] || statusConfig.pending;
              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {app.job?.title || "Job Position"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {app.job?.company || "Company"} &bull;{" "}
                              Applied {formatDate(app.appliedAt)}
                            </p>
                          </div>
                        </div>

                        {app.matchScore !== null && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-500">Match Score:</span>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${
                                    app.matchScore >= 75
                                      ? "bg-emerald-500"
                                      : app.matchScore >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${app.matchScore}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  app.matchScore >= 75
                                    ? "text-emerald-600"
                                    : app.matchScore >= 50
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Math.round(app.matchScore)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {app.coverLetter && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {app.coverLetter}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updating === app.id || app.status === "shortlisted"}
                            onClick={() => updateStatus(app.id, "shortlisted")}
                            className="text-xs gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Shortlist
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={updating === app.id || app.status === "accepted"}
                            onClick={() => updateStatus(app.id, "accepted")}
                            className="text-xs gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={updating === app.id || app.status === "rejected"}
                            onClick={() => updateStatus(app.id, "rejected")}
                            className="text-xs gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
