"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Award,
  BookOpen,
  Wallet,
  Calendar,
  TrendingUp,
  Star,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

// ---------- Types ----------

type SkillRequirement = { skillId: string; minLevel: number };
type AvailableSkill = { id: string; name: string; category: string };

type Application = {
  id: string;
  jobId: string;
  status: string;
  matchScore: number | null;
  coverLetter: string | null;
  appliedAt: string;
  candidateId: string;
  candidate: { id: string; name: string };
  job: { title: string; company: string } | null;
};

type SkillBreakdownItem = {
  skillName: string;
  matchScore: number;
  isVerified: boolean;
  candidateLevel: number;
  requiredLevel: number;
};

type CandidateProfile = {
  id: string;
  name: string;
  bio: string | null;
  walletAddress: string | null;
  memberSince: string;
  skills: {
    id: string;
    skillId: string;
    skillName: string;
    skillCategory: string;
    proficiencyLevel: number;
    isVerified: boolean | null;
    verifiedAt: string | null;
  }[];
  credentials: {
    id: string;
    title: string;
    type: string;
    issuedAt: string | null;
    expiresAt: string | null;
    blockchainTxHash: string | null;
    tokenId: string | null;
  }[];
  assessments: {
    id: string;
    assessmentTitle: string;
    assessmentDifficulty: string;
    score: number | null;
    passed: boolean | null;
    completedAt: string | null;
  }[];
  matchBreakdown: {
    overallScore: number;
    recommendation: string;
    confidence: number;
    verifiedBonus: number;
    skillBreakdown: SkillBreakdownItem[];
  } | null;
};

// ---------- Helpers ----------

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "default" | "secondary"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  reviewed: { variant: "default", label: "Reviewed" },
  shortlisted: { variant: "default", label: "Shortlisted" },
  accepted: { variant: "success", label: "Accepted" },
  rejected: { variant: "destructive", label: "Rejected" },
};

function proficiencyLabel(level: number) {
  if (level >= 80) return "Expert";
  if (level >= 60) return "Advanced";
  if (level >= 40) return "Intermediate";
  return "Beginner";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: score + "%" }} />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

// ---------- Candidate Profile Dialog ----------

function CandidateProfileDialog({
  open,
  onClose,
  profile,
  loading,
  application,
  availableSkills,
  onRefreshProfile,
}: {
  open: boolean;
  onClose: () => void;
  profile: CandidateProfile | null;
  loading: boolean;
  application: Application | null;
  availableSkills: AvailableSkill[];
  onRefreshProfile: () => Promise<number | null>;
}) {
  const [editingReqs, setEditingReqs] = useState(false);
  const [reqSkills, setReqSkills] = useState<SkillRequirement[]>([]);
  const [prefSkills, setPrefSkills] = useState<SkillRequirement[]>([]);
  const [addReqId, setAddReqId] = useState("");
  const [addReqLevel, setAddReqLevel] = useState(3);
  const [addPrefId, setAddPrefId] = useState("");
  const [addPrefLevel, setAddPrefLevel] = useState(2);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState("");

  // Reset edit state when dialog opens
  useEffect(() => {
    if (open) {
      setEditingReqs(false);
      setSkillsError("");
    }
  }, [open]);

  async function handleSaveJobSkills() {
    if (!application) return;
    setSavingSkills(true);
    setSkillsError("");
    try {
      const res = await fetch("/api/jobs/" + application.jobId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredSkills: reqSkills, preferredSkills: prefSkills }),
      });
      const data = await res.json();
      if (!data.success) {
        setSkillsError(data.error || "Failed to save requirements");
      } else {
        setEditingReqs(false);
        // Refresh profile and write the new score back to the application record
        const newScore = await onRefreshProfile();
        if (newScore !== null && newScore > 0) {
          await fetch("/api/jobs/applications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applicationId: application.id, matchScore: newScore }),
          });
        }
      }
    } catch {
      setSkillsError("Network error — please try again");
    } finally {
      setSavingSkills(false);
    }
  }

  if (!application) return null;

  const verifiedSkillsCount = profile ? profile.skills.filter((s) => s.isVerified).length : 0;
  const totalSkillsCount = profile ? profile.skills.length : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading candidate profile...</p>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">Could not load candidate profile.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Candidate Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
                {getInitials(profile.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                {profile.bio && (
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Member since {formatDate(profile.memberSince)}
                  </span>
                  {profile.walletAddress && (
                    <span className="flex items-center gap-1 font-mono">
                      <Wallet className="h-3 w-3" />
                      {profile.walletAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Match Score Card */}
            {profile.matchBreakdown && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      Match for: {application.job ? application.job.title : "this role"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-800"
                    onClick={onRefreshProfile}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                  <span
                    className={`text-2xl font-bold ${
                      profile.matchBreakdown.overallScore >= 75
                        ? "text-emerald-600"
                        : profile.matchBreakdown.overallScore >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {profile.matchBreakdown.overallScore}%
                  </span>
                </div>

                <ScoreBar score={profile.matchBreakdown.overallScore} />

                <p className="text-xs text-gray-600 italic">
                  {profile.matchBreakdown.recommendation}
                </p>

                <div className="flex gap-4 text-xs text-gray-500">
                  <span>
                    Confidence:{" "}
                    <span className="font-medium text-gray-700">
                      {profile.matchBreakdown.confidence}%
                    </span>
                  </span>
                  {profile.matchBreakdown.verifiedBonus > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      +{profile.matchBreakdown.verifiedBonus} verified bonus
                    </span>
                  )}
                </div>

                {/* Per-skill breakdown */}
                {profile.matchBreakdown.skillBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-blue-100 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Skill-by-Skill Breakdown
                    </p>
                    {profile.matchBreakdown.skillBreakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {item.isVerified ? (
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <ShieldOff className="h-3 w-3 text-gray-300" />
                            )}
                            <span className="text-xs font-medium text-gray-700">
                              {item.skillName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {item.candidateLevel > 0
                              ? `${item.candidateLevel} / ${item.requiredLevel} required`
                              : "Not in profile"}
                          </span>
                        </div>
                        <ScoreBar score={item.matchScore} />
                      </div>
                    ))}
                  </div>
                )}

                {/* No requirements warning + inline editor */}
                {profile.matchBreakdown.skillBreakdown.length === 0 && !editingReqs && (
                  <div className="pt-2 border-t border-blue-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-amber-700 flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" />
                        No required skills set for this job — match cannot be calculated.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => {
                          setReqSkills([]);
                          setPrefSkills([]);
                          setEditingReqs(true);
                        }}
                      >
                        <Settings2 className="h-3 w-3" />
                        Set Requirements
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline skill requirements editor */}
                {editingReqs && (
                  <div className="pt-3 border-t border-blue-100 space-y-4">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Set Job Requirements
                    </p>

                    {/* Required skills */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Required Skills</label>
                      <div className="flex gap-2">
                        <Select value={addReqId} onValueChange={setAddReqId}>
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Select skill..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSkills
                              .filter((s) => !reqSkills.some((r) => r.skillId === s.id))
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number" min={1} max={5} value={addReqLevel}
                          onChange={(e) => setAddReqLevel(Number(e.target.value))}
                          className="w-16 h-8 text-xs"
                          title="Min level (1-5)"
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs px-3"
                          onClick={() => {
                            if (addReqId) {
                              setReqSkills((p) => [...p, { skillId: addReqId, minLevel: addReqLevel }]);
                              setAddReqId("");
                            }
                          }}
                        >Add</Button>
                      </div>
                      {reqSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {reqSkills.map((r) => (
                            <span key={r.skillId} className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800">
                              {availableSkills.find((s) => s.id === r.skillId)?.name} (L{r.minLevel}+)
                              <button type="button" onClick={() => setReqSkills((p) => p.filter((x) => x.skillId !== r.skillId))} className="hover:text-red-600">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preferred skills */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Preferred Skills (optional)</label>
                      <div className="flex gap-2">
                        <Select value={addPrefId} onValueChange={setAddPrefId}>
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Select skill..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSkills
                              .filter((s) => !prefSkills.some((r) => r.skillId === s.id) && !reqSkills.some((r) => r.skillId === s.id))
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number" min={1} max={5} value={addPrefLevel}
                          onChange={(e) => setAddPrefLevel(Number(e.target.value))}
                          className="w-16 h-8 text-xs"
                          title="Min level (1-5)"
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs px-3"
                          onClick={() => {
                            if (addPrefId) {
                              setPrefSkills((p) => [...p, { skillId: addPrefId, minLevel: addPrefLevel }]);
                              setAddPrefId("");
                            }
                          }}
                        >Add</Button>
                      </div>
                      {prefSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {prefSkills.map((r) => (
                            <span key={r.skillId} className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-800">
                              {availableSkills.find((s) => s.id === r.skillId)?.name} (L{r.minLevel}+)
                              <button type="button" onClick={() => setPrefSkills((p) => p.filter((x) => x.skillId !== r.skillId))} className="hover:text-red-600">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {skillsError && <p className="text-xs text-red-600">{skillsError}</p>}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveJobSkills} disabled={savingSkills || reqSkills.length === 0} className="h-8 text-xs gap-1">
                        {savingSkills ? "Saving..." : "Save & Recalculate Match"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingReqs(false)} className="h-8 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  Cover Letter
                </h3>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {application.coverLetter}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  Skills
                </h3>
                {totalSkillsCount > 0 && (
                  <span className="text-xs text-gray-400">
                    {verifiedSkillsCount}/{totalSkillsCount} blockchain-verified
                  </span>
                )}
              </div>

              {profile.skills.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No skills listed.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {skill.isVerified ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {skill.skillName}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <Progress value={skill.proficiencyLevel} className="h-1.5" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-gray-700">
                          {skill.proficiencyLevel}%
                        </span>
                        <p className="text-xs text-gray-400">
                          {proficiencyLabel(skill.proficiencyLevel)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blockchain Credentials */}
            {profile.credentials.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  Verified Credentials
                </h3>
                <div className="space-y-2">
                  {profile.credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-emerald-900">{cred.title}</p>
                          <p className="text-xs text-emerald-700 capitalize">{cred.type}</p>
                        </div>
                        <Badge variant="success" className="text-xs shrink-0">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          On-chain
                        </Badge>
                      </div>
                      {cred.issuedAt && (
                        <p className="text-xs text-emerald-600">
                          Issued {formatDate(cred.issuedAt)}
                          {cred.expiresAt ? ` · Expires ${formatDate(cred.expiresAt)}` : ""}
                        </p>
                      )}
                      {cred.blockchainTxHash && (
                        <p className="text-xs font-mono text-emerald-500 truncate">
                          tx: {cred.blockchainTxHash}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Scores */}
            {profile.assessments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  Assessment Scores
                </h3>
                <div className="space-y-2">
                  {profile.assessments.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {attempt.assessmentTitle}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {attempt.assessmentDifficulty}
                          {attempt.completedAt ? ` · ${formatDate(attempt.completedAt)}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        {attempt.score !== null && (
                          <span className="text-sm font-bold text-gray-700">
                            {Math.round(attempt.score)}%
                          </span>
                        )}
                        {attempt.passed !== null && (
                          <p className={`text-xs font-medium ${attempt.passed ? "text-emerald-600" : "text-red-500"}`}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main Page ----------

export default function ManageApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Profile dialog state
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);

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
      fetch("/api/skills").then(r => r.json()).then(d => { if (d.success) setAvailableSkills(d.data); }).catch(() => {});
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

  const fetchProfileData = useCallback(async (app: Application): Promise<number | null> => {
    setCandidateProfile(null);
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/users/candidates/${app.candidateId}?jobId=${app.jobId}`);
      const data = await res.json();
      if (data.success) {
        setCandidateProfile(data.data);
        const score = data.data?.matchBreakdown?.overallScore ?? null;
        // Update the score on the application card if it changed
        if (score !== null && score > 0) {
          setApplications((prev) =>
            prev.map((a) => (a.id === app.id ? { ...a, matchScore: score } : a))
          );
        }
        return score;
      }
    } finally {
      setProfileLoading(false);
    }
    return null;
  }, []);

  const openProfile = useCallback(async (app: Application) => {
    setSelectedApp(app);
    setProfileOpen(true);
    fetchProfileData(app);
  }, [fetchProfileData]);

  const refreshProfile = useCallback((): Promise<number | null> => {
    if (selectedApp) return fetchProfileData(selectedApp);
    return Promise.resolve(null);
  }, [selectedApp, fetchProfileData]);

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Applications</h1>
          <p className="mt-1 text-gray-500">
            Review candidate profiles and manage applications for your job postings
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Applications Yet</h3>
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {getInitials(app.candidate ? app.candidate.name : "?")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {app.candidate ? app.candidate.name : "Unknown Candidate"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Applied for{" "}
                              <span className="font-medium text-gray-700">
                                {app.job ? app.job.title : "Unknown Position"}
                              </span>{" "}
                              at {app.job ? app.job.company : "-"} &bull; {formatDate(app.appliedAt)}
                            </p>
                          </div>
                        </div>

                        {app.matchScore !== null && app.matchScore > 0 && (
                          <div className="mt-3 flex items-center gap-2 max-w-xs">
                            <span className="text-sm text-gray-500 shrink-0">Match:</span>
                            <ScoreBar score={app.matchScore} />
                          </div>
                        )}

                        {app.coverLetter && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2 max-w-xl">
                            {app.coverLetter}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProfile(app)}
                            className="text-xs gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updating === app.id || app.status === "shortlisted"}
                            onClick={() => updateStatus(app.id, "shortlisted")}
                            className="text-xs gap-1"
                          >
                            <Star className="h-3 w-3" />
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

      <CandidateProfileDialog
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setSelectedApp(null);
          setCandidateProfile(null);
        }}
        profile={candidateProfile}
        loading={profileLoading}
        application={selectedApp}
        availableSkills={availableSkills}
        onRefreshProfile={refreshProfile}
      />
    </div>
  );
}
