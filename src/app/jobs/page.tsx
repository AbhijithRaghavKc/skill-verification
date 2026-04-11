"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";

type SkillRequirement = { skillId: string; minLevel: number };

type Job = {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  requiredSkills: SkillRequirement[];
  preferredSkills: SkillRequirement[];
  status: string;
  createdAt: string;
  _count?: { applications: number };
};

type Skill = {
  id: string;
  name: string;
  category: string;
};

type Application = {
  id: string;
  jobId: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  job?: Job;
  matchScore?: number;
};

type MatchResult = {
  jobId: string;
  match: {
    overallScore: number;
    recommendation: string;
    confidence: string;
    skillBreakdown: Record<string, unknown>;
  };
};

const jobTypeColors: Record<string, string> = {
  "full-time": "bg-blue-100 text-blue-800",
  "part-time": "bg-purple-100 text-purple-800",
  contract: "bg-amber-100 text-amber-800",
  remote: "bg-emerald-100 text-emerald-800",
};

const applicationStatusConfig: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }
> = {
  pending: { label: "Pending", variant: "warning" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  shortlisted: { label: "Shortlisted", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  accepted: { label: "Accepted", variant: "success" },
};

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [postJobOpen, setPostJobOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchJobs();
      fetchSkills();
    }
  }, [status, router]);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  async function fetchSkills() {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (data.success) setSkills(data.data);
    } catch {
      // fail silently
    }
  }

  const user = session?.user as { name: string; email: string; role: string };
  const role = user?.role || "candidate";
  const isCandidate = role === "candidate";
  const isEmployer = role === "employer";

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || job.type === filterType;
    return matchesSearch && matchesType;
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEmployer ? "Job Postings" : "Browse Jobs"}
            </h1>
            <p className="mt-1 text-gray-500">
              {isEmployer
                ? "Manage your job listings and review applications"
                : "Find your next opportunity with blockchain-verified credentials"}
            </p>
          </div>

          {isEmployer && (
            <div className="flex gap-2">
              <Link href="/jobs/applications">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Manage Applications
                </Button>
              </Link>
            <Dialog open={postJobOpen} onOpenChange={setPostJobOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Post Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    Create a new job listing to find qualified candidates.
                  </DialogDescription>
                </DialogHeader>
                <PostJobForm
                  skills={skills}
                  onSuccess={() => {
                    setPostJobOpen(false);
                    fetchJobs();
                  }}
                />
              </DialogContent>
            </Dialog>
            </div>
          )}
        </div>

        {isCandidate ? (
          <CandidateView
            jobs={filteredJobs}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            setSelectedJob={setSelectedJob}
            setDetailOpen={setDetailOpen}
          />
        ) : isEmployer ? (
          <EmployerView
            jobs={filteredJobs}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            setSelectedJob={setSelectedJob}
            setDetailOpen={setDetailOpen}
          />
        ) : (
          <PublicJobListings
            jobs={filteredJobs}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            onSelectJob={(job) => {
              setSelectedJob(job);
              setDetailOpen(true);
            }}
          />
        )}
      </main>

      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          showApply={isCandidate}
          skills={skills}
        />
      )}
    </div>
  );
}

function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by title or company..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full-time">Full-Time</SelectItem>
            <SelectItem value="part-time">Part-Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function JobCard({
  job,
  onClick,
  actionSlot,
}: {
  job: Job;
  onClick: () => void;
  actionSlot?: React.ReactNode;
}) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3" />
                {job.company}
              </CardDescription>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              jobTypeColors[job.type] || "bg-gray-100 text-gray-800"
            }`}
          >
            {job.type}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-gray-500 line-clamp-2">
          {job.description}
        </p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {job.location}
          </div>
          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              {job.salaryMin && job.salaryMax
                ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}`
                : job.salaryMin
                ? `From ${formatCurrency(job.salaryMin)}`
                : `Up to ${formatCurrency(job.salaryMax)}`}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            {job.requiredSkills.length} required skill
            {job.requiredSkills.length !== 1 ? "s" : ""}
            {job.preferredSkills.length > 0 &&
              `, ${job.preferredSkills.length} preferred`}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Posted {formatDate(job.createdAt)}
          </div>
        </div>
        {actionSlot && (
          <div
            className="mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {actionSlot}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Briefcase className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No jobs found
        </h3>
        <p className="mt-1 text-gray-500">{message}</p>
      </CardContent>
    </Card>
  );
}

function PublicJobListings({
  jobs,
  loading,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  onSelectJob,
}: {
  jobs: Job[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  onSelectJob: (job: Job) => void;
}) {
  return (
    <>
      <SearchFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
      />
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState message="No jobs match your search criteria" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />
          ))}
        </div>
      )}
    </>
  );
}

function CandidateView({
  jobs,
  loading,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  setSelectedJob,
  setDetailOpen,
}: {
  jobs: Job[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  setSelectedJob: (job: Job | null) => void;
  setDetailOpen: (open: boolean) => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<MatchResult[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);

  async function fetchApplications() {
    setAppsLoading(true);
    try {
      const res = await fetch("/api/jobs/apply");
      const data = await res.json();
      if (data.success) setApplications(data.data || []);
    } catch {
      // fail silently
    } finally {
      setAppsLoading(false);
    }
  }

  async function fetchMatches() {
    setMatchLoading(true);
    try {
      const res = await fetch("/api/matching");
      const data = await res.json();
      if (data.success) setMatchedJobs(data.data || []);
    } catch {
      // fail silently
    } finally {
      setMatchLoading(false);
    }
  }

  function handleTabChange(value: string) {
    if (value === "applications") fetchApplications();
    if (value === "recommended") fetchMatches();
  }

  const jobById = (id: string) => jobs.find((j) => j.id === id);

  return (
    <Tabs defaultValue="browse" onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
        <TabsTrigger value="applications">My Applications</TabsTrigger>
        <TabsTrigger value="recommended">Recommended</TabsTrigger>
      </TabsList>

      <TabsContent value="browse">
        <SearchFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
        />
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState message="No jobs match your search criteria" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => {
                  setSelectedJob(job);
                  setDetailOpen(true);
                }}
                actionSlot={
                  <ApplyButton
                    job={job}
                    onApplied={() => {}}
                  />
                }
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="applications">
        {appsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No applications yet
              </h3>
              <p className="mt-1 text-gray-500">
                Browse jobs and apply to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const job = app.job || jobById(app.jobId);
              const statusConf =
                applicationStatusConfig[app.status] ||
                applicationStatusConfig.pending;
              return (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {job?.title || "Unknown Position"}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job?.company || "Unknown Company"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {app.matchScore !== undefined && (
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {app.matchScore}% match
                          </Badge>
                        )}
                        <Badge variant={statusConf.variant}>
                          {statusConf.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Applied {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="recommended">
        {matchLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : matchedJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No recommendations yet
              </h3>
              <p className="mt-1 text-gray-500">
                Add skills and credentials to get personalized job matches
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...matchedJobs]
              .sort((a, b) => b.match.overallScore - a.match.overallScore)
              .map((match) => {
                const job = jobById(match.jobId);
                if (!job) return null;
                const score = match.match.overallScore;
                const scoreColor =
                  score >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : score >= 60
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800";
                return (
                  <JobCard
                    key={match.jobId}
                    job={job}
                    onClick={() => {
                      setSelectedJob(job);
                      setDetailOpen(true);
                    }}
                    actionSlot={
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 ${scoreColor}`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {score}% match
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {match.match.recommendation}
                        </span>
                      </div>
                    }
                  />
                );
              })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ApplyButton({
  job,
  onApplied,
}: {
  job: Job;
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            at {job.company} &middot; {job.location}
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          job={job}
          onSuccess={() => {
            setOpen(false);
            onApplied();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ApplicationForm({
  job,
  onSuccess,
}: {
  job: Job;
  onSuccess: () => void;
}) {
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    overallScore: number;
    recommendation: string;
    skillBreakdown: Record<string, unknown>;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, coverLetter }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit application");
        return;
      }

      if (data.success && data.data?.matchResult) {
        setResult(data.data.matchResult);
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const score = result.overallScore;
    const scoreColor =
      score >= 80
        ? "text-emerald-600"
        : score >= 60
        ? "text-blue-600"
        : "text-amber-600";
    const scoreBg =
      score >= 80
        ? "bg-emerald-50"
        : score >= 60
        ? "bg-blue-50"
        : "bg-amber-50";

    return (
      <div className={`rounded-lg p-6 ${scoreBg} text-center space-y-3`}>
        <TrendingUp className={`mx-auto h-10 w-10 ${scoreColor}`} />
        <h3 className="text-lg font-semibold text-gray-900">
          Application Submitted!
        </h3>
        <p className={`text-4xl font-bold ${scoreColor}`}>{score}%</p>
        <p className="text-sm text-gray-600">Match Score</p>
        <p className="text-sm text-gray-700 capitalize font-medium">
          {result.recommendation}
        </p>
        <Button className="w-full" onClick={onSuccess}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 space-y-1">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {job.location}
        </div>
        {(job.salaryMin || job.salaryMax) && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            {job.salaryMin && job.salaryMax
              ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}`
              : job.salaryMin
              ? `From ${formatCurrency(job.salaryMin)}`
              : `Up to ${formatCurrency(job.salaryMax)}`}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Cover Letter
        </label>
        <Textarea
          placeholder="Tell the employer why you're a great fit for this role..."
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={6}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}

function JobDetailDialog({
  job,
  open,
  onOpenChange,
  showApply,
  skills,
}: {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showApply: boolean;
  skills: Skill[];
}) {
  const skillMap = new Map(skills.map((s) => [s.id, s.name]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-xl">{job.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </DialogDescription>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                jobTypeColors[job.type] || "bg-gray-100 text-gray-800"
              }`}
            >
              {job.type}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              {job.location}
            </span>
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                {job.salaryMin && job.salaryMax
                  ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}`
                  : job.salaryMin
                  ? `From ${formatCurrency(job.salaryMin)}`
                  : `Up to ${formatCurrency(job.salaryMax)}`}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              Posted {formatDate(job.createdAt)}
            </span>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Job Description
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {job.requiredSkills.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Required Skills ({job.requiredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <Badge key={s.skillId} variant="default" className="text-xs">
                    {skillMap.get(s.skillId) || s.skillId} (Level {s.minLevel}+)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {job.preferredSkills.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Preferred Skills ({job.preferredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((s) => (
                  <Badge key={s.skillId} variant="secondary" className="text-xs">
                    {skillMap.get(s.skillId) || s.skillId} (Level {s.minLevel}+)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {showApply && (
            <div className="pt-2">
              <ApplyButton job={job} onApplied={() => onOpenChange(false)} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployerView({
  jobs,
  loading,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  setSelectedJob,
  setDetailOpen,
}: {
  jobs: Job[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  setSelectedJob: (job: Job | null) => void;
  setDetailOpen: (open: boolean) => void;
}) {
  const [applications, setApplications] = useState<
    {
      id: string;
      jobId: string;
      jobTitle: string;
      candidateName: string;
      candidateEmail: string;
      status: string;
      matchScore: number;
      createdAt: string;
    }[]
  >([]);
  const [appsLoading, setAppsLoading] = useState(false);

  async function fetchApplications() {
    setAppsLoading(true);
    try {
      const res = await fetch("/api/jobs/applications");
      const data = await res.json();
      if (data.success) setApplications(data.data || []);
    } catch {
      // fail silently
    } finally {
      setAppsLoading(false);
    }
  }

  function handleTabChange(value: string) {
    if (value === "applications") fetchApplications();
  }

  return (
    <Tabs defaultValue="postings" onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="postings">My Postings</TabsTrigger>
        <TabsTrigger value="applications">Applications</TabsTrigger>
      </TabsList>

      <TabsContent value="postings">
        <SearchFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
        />
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No jobs posted yet
              </h3>
              <p className="mt-1 text-gray-500">
                Click &quot;Post Job&quot; to create your first listing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => {
                  setSelectedJob(job);
                  setDetailOpen(true);
                }}
                actionSlot={
                  job._count?.applications !== undefined ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {job._count.applications} application
                      {job._count.applications !== 1 ? "s" : ""}
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="applications">
        {appsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No applications yet
              </h3>
              <p className="mt-1 text-gray-500">
                Applications will appear here once candidates apply
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusConf =
                applicationStatusConfig[app.status] ||
                applicationStatusConfig.pending;
              const score = app.matchScore;
              const scoreColor =
                score >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : score >= 60
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800";
              return (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {app.candidateName || "Candidate"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {app.candidateEmail}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {app.jobTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {score !== undefined && score > 0 && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 ${scoreColor}`}
                          >
                            <TrendingUp className="h-3 w-3" />
                            {score}%
                          </span>
                        )}
                        <Badge variant={statusConf.variant}>
                          {statusConf.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      Applied {formatDate(app.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SkillPicker({
  label,
  skills,
  selected,
  onAdd,
  onRemove,
  defaultLevel,
}: {
  label: string;
  skills: Skill[];
  selected: SkillRequirement[];
  onAdd: (req: SkillRequirement) => void;
  onRemove: (skillId: string) => void;
  defaultLevel: number;
}) {
  const [addSkillId, setAddSkillId] = useState("");
  const [addLevel, setAddLevel] = useState(defaultLevel);
  const available = skills.filter((s) => !selected.some((r) => r.skillId === s.id));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <Select value={addSkillId} onValueChange={setAddSkillId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select skill..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          max={5}
          value={addLevel}
          onChange={(e) => setAddLevel(Number(e.target.value))}
          className="w-20"
          placeholder="Level"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (addSkillId) {
              onAdd({ skillId: addSkillId, minLevel: addLevel });
              setAddSkillId("");
              setAddLevel(defaultLevel);
            }
          }}
        >
          Add
        </Button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((req) => {
            const skill = skills.find((s) => s.id === req.skillId);
            return (
              <span
                key={req.skillId}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800"
              >
                {skill?.name} (Level {req.minLevel}+)
                <button
                  type="button"
                  onClick={() => onRemove(req.skillId)}
                  className="ml-0.5 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostJobForm({ skills, onSuccess }: { skills: Skill[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    type: "full-time",
    salaryMin: "",
    salaryMax: "",
  });
  const [requiredSkills, setRequiredSkills] = useState<SkillRequirement[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<SkillRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: formData.title,
      company: formData.company,
      location: formData.location,
      description: formData.description,
      type: formData.type,
      salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
      requiredSkills,
      preferredSkills,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post job");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Job Title</label>
          <Input
            placeholder="e.g., Senior Blockchain Developer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Company</label>
          <Input
            placeholder="e.g., Acme Corp"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <Input
            placeholder="e.g., San Francisco, CA"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Job Type</label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-Time</SelectItem>
              <SelectItem value="part-time">Part-Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Min Salary (USD)
          </label>
          <Input
            type="number"
            placeholder="e.g., 80000"
            value={formData.salaryMin}
            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Max Salary (USD)
          </label>
          <Input
            type="number"
            placeholder="e.g., 120000"
            value={formData.salaryMax}
            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
            min={0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Textarea
          placeholder="Describe the role, responsibilities, and requirements..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      <SkillPicker
        label="Required Skills"
        skills={skills}
        selected={requiredSkills}
        onAdd={(req) => setRequiredSkills((prev) => [...prev, req])}
        onRemove={(id) => setRequiredSkills((prev) => prev.filter((r) => r.skillId !== id))}
        defaultLevel={3}
      />

      <SkillPicker
        label="Preferred Skills"
        skills={skills}
        selected={preferredSkills}
        onAdd={(req) => setPreferredSkills((prev) => [...prev, req])}
        onRemove={(id) => setPreferredSkills((prev) => prev.filter((r) => r.skillId !== id))}
        defaultLevel={2}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Posting..." : "Post Job"}
      </Button>
    </form>
  );
}
