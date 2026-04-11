"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Award,
  Shield,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  Loader2,
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
import { formatDate, truncateAddress } from "@/lib/utils";

type Credential = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  blockchainTxHash: string | null;
  tokenId: string | null;
  issuedAt: string | null;
  createdAt: string;
};

type Skill = {
  id: string;
  name: string;
  category: string;
};

const statusConfig: Record<
  string,
  { icon: typeof Shield; variant: "success" | "default" | "warning" | "destructive"; label: string }
> = {
  verified: { icon: Shield, variant: "success", label: "Verified" },
  pending: { icon: Clock, variant: "warning", label: "Pending" },
  rejected: { icon: XCircle, variant: "destructive", label: "Rejected" },
  revoked: { icon: XCircle, variant: "destructive", label: "Revoked" },
};

export default function CredentialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchCredentials();
      fetchSkills();
    }
  }, [status, router]);

  async function fetchCredentials() {
    const res = await fetch("/api/credentials");
    const data = await res.json();
    if (data.success) setCredentials(data.data);
    setLoading(false);
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

  async function handleIssueOnChain(credentialId: string) {
    setIssuingId(credentialId);
    try {
      const res = await fetch("/api/blockchain/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });
      if (res.ok) {
        await fetchCredentials();
      }
    } catch {
      // fail silently — user can retry
    } finally {
      setIssuingId(null);
    }
  }

  const user = session?.user as { name: string; email: string; role: string };
  const isInstitution = user?.role === "institution";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isInstitution ? "Issued Credentials" : "My Credentials"}
            </h1>
            <p className="mt-1 text-gray-500">
              {isInstitution
                ? "Manage and issue blockchain-verified credentials"
                : "View and manage your verified credentials"}
            </p>
          </div>

          {isInstitution && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Issue Credential
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue New Credential</DialogTitle>
                  <DialogDescription>
                    Create a new blockchain-verified credential for a candidate.
                  </DialogDescription>
                </DialogHeader>
                <IssueCredentialForm
                  skills={skills}
                  onSuccess={() => {
                    setDialogOpen(false);
                    fetchCredentials();
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No credentials yet
              </h3>
              <p className="mt-1 text-gray-500">
                {isInstitution
                  ? "Start by issuing your first credential"
                  : "Complete assessments to earn credentials"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((credential) => {
              const config = statusConfig[credential.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isIssuing = issuingId === credential.id;

              return (
                <Card key={credential.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {credential.title}
                          </CardTitle>
                          <CardDescription>{credential.type}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={config.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {credential.description && (
                      <p className="mb-4 text-sm text-gray-500 line-clamp-2">
                        {credential.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      {credential.issuedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Issued</span>
                          <span className="text-gray-900">
                            {formatDate(credential.issuedAt)}
                          </span>
                        </div>
                      )}
                      {credential.blockchainTxHash && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">TX Hash</span>
                          <a
                            href={`https://amoy.polygonscan.com/tx/${credential.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {truncateAddress(credential.blockchainTxHash)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {credential.tokenId && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Token ID</span>
                          <span className="text-gray-900">
                            #{credential.tokenId}
                          </span>
                        </div>
                      )}
                    </div>
                    {isInstitution && credential.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full gap-2"
                        disabled={isIssuing}
                        onClick={() => handleIssueOnChain(credential.id)}
                      >
                        {isIssuing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Issuing on Blockchain...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            Issue on Blockchain
                          </>
                        )}
                      </Button>
                    )}
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

function IssueCredentialForm({
  skills,
  onSuccess,
}: {
  skills: Skill[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    candidateId: "",
    title: "",
    description: "",
    type: "certification",
  });
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, skillIds: selectedSkillIds }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to issue credential");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Candidate ID
        </label>
        <Input
          placeholder="Enter candidate UUID"
          value={formData.candidateId}
          onChange={(e) =>
            setFormData({ ...formData, candidateId: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input
          placeholder="e.g., Advanced JavaScript Certification"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certification">Certification</SelectItem>
            <SelectItem value="degree">Degree</SelectItem>
            <SelectItem value="badge">Badge</SelectItem>
            <SelectItem value="diploma">Diploma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          placeholder="Describe the credential"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      {skills.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Associated Skills
          </label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
            {skills.map((skill) => (
              <label
                key={skill.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSkillIds.includes(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{skill.name}</span>
                <span className="text-xs text-gray-400">{skill.category}</span>
              </label>
            ))}
          </div>
          {selectedSkillIds.length > 0 && (
            <p className="text-xs text-gray-500">
              {selectedSkillIds.length} skill{selectedSkillIds.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Issuing..." : "Issue Credential"}
      </Button>
    </form>
  );
}
