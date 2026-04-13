"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Wallet,
  Shield,
  Award,
  FileCheck,
  Save,
  Edit2,
  Link as LinkIcon,
  Mail,
  Building2,
  Plus,
  Trash2,
  ShieldCheck,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatDate, truncateAddress } from "@/lib/utils";
import { WalletConnect } from "@/components/wallet-connect";

type Skill = {
  id: string;
  skillId: string;
  proficiencyLevel: number;
  isVerified: boolean | null;
  verifiedAt: string | null;
  credentialId: string | null;
  skillName: string;
  skillCategory: string;
};

type AvailableSkill = {
  id: string;
  name: string;
  category: string;
};

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  walletAddress: string | null;
  organizationName: string | null;
  createdAt: string;
  skills: Skill[];
  stats: {
    credentials: number;
    assessments: number;
  };
};

type RecentCredential = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  issuedAt: string | null;
};

type RecentAttempt = {
  id: string;
  score: number | null;
  status: string;
  completedAt: string | null;
  assessment?: {
    title: string;
  };
};

type RecentApplication = {
  id: string;
  status: string;
  appliedAt: string;
  job?: {
    title: string;
    company: string;
  };
};

type ActivityData = {
  recentCredentials: RecentCredential[];
  recentAttempts: RecentAttempt[];
  recentApplications: RecentApplication[];
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activity, setActivity] = useState<ActivityData>({
    recentCredentials: [],
    recentAttempts: [],
    recentApplications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchProfile();
      fetchActivity();
    }
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/users/profile");
      const data = await res.json();
      if (data.success) setProfile(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActivity() {
    try {
      const [credRes, assessRes, jobRes] = await Promise.all([
        fetch("/api/credentials?limit=5"),
        fetch("/api/assessments/attempts?limit=5"),
        fetch("/api/jobs/applications?limit=5"),
      ]);
      const [credData, assessData, jobData] = await Promise.all([
        credRes.json(),
        assessRes.json(),
        jobRes.json(),
      ]);
      setActivity({
        recentCredentials: credData.success ? credData.data.slice(0, 5) : [],
        recentAttempts: assessData.success ? assessData.data.slice(0, 5) : [],
        recentApplications: jobData.success ? jobData.data.slice(0, 5) : [],
      });
    } catch {
      // Activity data is non-critical; ignore fetch errors
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

  const initials = (profile?.name || user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isCandidate = profile?.role === "candidate";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            {isCandidate && (
              <TabsTrigger value="skills" className="gap-2">
                <Shield className="h-4 w-4" />
                Skills
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Award className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Avatar + Info Card */}
              <Card className="lg:col-span-1">
                <CardContent className="flex flex-col items-center pt-6 pb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                    {initials}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {profile?.name}
                  </h2>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {profile?.role}
                  </Badge>
                  {profile?.organizationName && (
                    <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                      <Building2 className="h-4 w-4" />
                      {profile.organizationName}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs">
                      Member since{" "}
                      {profile?.createdAt ? formatDate(profile.createdAt) : "-"}
                    </span>
                  </div>

                  <div className="mt-4 w-full border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Credentials</span>
                      <span className="font-medium text-gray-900">
                        {profile?.stats?.credentials ?? 0}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">Assessments</span>
                      <span className="font-medium text-gray-900">
                        {profile?.stats?.assessments ?? 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile + Wallet */}
              <div className="space-y-6 lg:col-span-2">
                <EditProfileForm
                  profile={profile}
                  onSuccess={fetchProfile}
                />
                <WalletSection
                  walletAddress={profile?.walletAddress ?? null}
                  onSuccess={fetchProfile}
                />
              </div>
            </div>
          </TabsContent>

          {/* Skills Tab (candidates only) */}
          {isCandidate && (
            <TabsContent value="skills">
              <SkillsTab skills={profile?.skills ?? []} onRefresh={fetchProfile} />
            </TabsContent>
          )}

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ActivityTab activity={activity} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Edit Profile Form ---------- */

function EditProfileForm({
  profile,
  onSuccess,
}: {
  profile: ProfileData | null;
  onSuccess: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name ?? "",
    bio: profile?.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name, bio: profile.bio ?? "" });
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.name, bio: formData.bio }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || "Failed to update profile");
      setSaving(false);
      return;
    }

    setSuccess("Profile updated successfully");
    setEditing(false);
    setSaving(false);
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your display name and bio</CardDescription>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditing(true);
                setSuccess("");
                setError("");
              }}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          {editing ? (
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your full name"
            />
          ) : (
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
              {profile?.name || "-"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          {editing ? (
            <Textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us a bit about yourself"
              rows={3}
            />
          ) : (
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 min-h-[72px]">
              {profile?.bio || "No bio added yet."}
            </p>
          )}
        </div>

        {editing && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setError("");
                if (profile) {
                  setFormData({
                    name: profile.name,
                    bio: profile.bio ?? "",
                  });
                }
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Wallet Section ---------- */

function WalletSection({
  walletAddress,
  onSuccess,
}: {
  walletAddress: string | null;
  onSuccess: () => void;
}) {
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  function validateAddress(address: string): boolean {
    return address.startsWith("0x") && address.length === 42;
  }

  async function handleSave() {
    if (!validateAddress(newAddress)) {
      setError(
        "Invalid wallet address. Must start with 0x and be 42 characters long."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: newAddress }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || "Failed to update wallet address");
      setSaving(false);
      return;
    }

    setSuccess("Wallet address updated");
    setNewAddress("");
    setSaving(false);
    onSuccess();
  }

  function handleCopy() {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          Wallet Address
        </CardTitle>
        <CardDescription>
          Link your Web3 wallet to receive blockchain credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        {walletAddress ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-sm text-gray-900">
                {truncateAddress(walletAddress)}
              </span>
              <span className="text-xs text-gray-400">(Connected)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              <LinkIcon className="mr-1 h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400">
            <Wallet className="h-4 w-4" />
            No wallet address connected
          </div>
        )}

        <div className="space-y-3">
          <WalletConnect
            currentAddress={null}
            onConnect={async (address) => {
              setNewAddress(address);
              setSaving(true);
              setError("");
              setSuccess("");
              const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address }),
              });
              const data = await res.json();
              if (!res.ok || !data.success) {
                setError(data.error || "Failed to update wallet address");
              } else {
                setSuccess("Wallet connected successfully");
                onSuccess();
              }
              setSaving(false);
              setNewAddress("");
            }}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">or enter manually</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {walletAddress ? "Update Wallet Address" : "Set Wallet Address"}
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => {
                  setNewAddress(e.target.value);
                  setError("");
                }}
                className="font-mono"
              />
              <Button
                onClick={handleSave}
                disabled={saving || !newAddress}
                className="shrink-0"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Must start with 0x and be exactly 42 characters
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Skills Tab ---------- */

function SkillsTab({
  skills,
  onRefresh,
}: {
  skills: Skill[];
  onRefresh: () => void;
}) {
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [proficiency, setProficiency] = useState(50);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Inline edit state: map of userSkillId -> draft proficiency value
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(50);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableSkills(d.data); })
      .catch(() => {});
  }, []);

  // Skills the candidate doesn't already have
  const existingSkillIds = new Set(skills.map((s) => s.skillId));
  const addableSkills = availableSkills.filter((s) => !existingSkillIds.has(s.id));

  async function handleAdd() {
    if (!selectedSkillId) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/users/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: selectedSkillId, proficiencyLevel: proficiency }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed to add skill"); return; }
      setShowAddForm(false);
      setSelectedSkillId("");
      setProficiency(50);
      onRefresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userSkillId: string) {
    setRemoving(userSkillId);
    try {
      const res = await fetch("/api/users/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSkillId }),
      });
      const data = await res.json();
      if (data.success) onRefresh();
    } finally {
      setRemoving(null);
    }
  }

  async function handleUpdateProficiency(skill: Skill) {
    setSaving(skill.id);
    try {
      const res = await fetch("/api/users/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.skillId, proficiencyLevel: editValue }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        onRefresh();
      }
    } finally {
      setSaving(null);
    }
  }

  const verifiedCount = skills.filter((s) => s.isVerified).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Skills &amp; Proficiency</h2>
          {skills.length > 0 && (
            <p className="text-sm text-gray-500">
              {verifiedCount} of {skills.length} blockchain-verified
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {skills.length > 0 && <Badge variant="secondary">{skills.length} skills</Badge>}
          <Button
            size="sm"
            className="gap-2"
            onClick={() => { setShowAddForm(!showAddForm); setError(""); }}
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Add Skill Form */}
      {showAddForm && (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Add a skill to your profile</h3>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-2 text-xs text-red-600">{error}</div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Skill</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
              >
                <option value="">Select a skill...</option>
                {addableSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
              {addableSkills.length === 0 && availableSkills.length > 0 && (
                <p className="text-xs text-gray-400">You already have all available skills.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Self-assessed Proficiency: <span className="font-bold text-blue-700">{proficiency}%</span>
                <span className="ml-2 text-gray-400">
                  ({proficiency >= 80 ? "Expert" : proficiency >= 60 ? "Advanced" : proficiency >= 40 ? "Intermediate" : "Beginner"})
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={proficiency}
                onChange={(e) => setProficiency(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
                <span>Expert</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">
              Self-reported skills show as Unverified. Get a credential from an institution to earn blockchain verification.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={adding || !selectedSkillId} className="gap-1">
                <Save className="h-3 w-3" />
                {adding ? "Adding..." : "Add Skill"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setError(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {skills.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No skills yet</h3>
            <p className="mt-1 text-sm text-gray-500 text-center">
              Add your skills above, or complete assessments to earn verified skills.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" />
              Add Your First Skill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skills Grid */}
      {skills.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <Card key={skill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {skill.isVerified ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Shield className="h-4 w-4 text-gray-300 shrink-0" />
                      )}
                      <h3 className="font-medium text-gray-900 truncate">{skill.skillName}</h3>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">{skill.skillCategory}</p>
                    {skill.isVerified && skill.verifiedAt && (
                      <p className="text-xs text-emerald-600 ml-5">
                        Verified {formatDate(skill.verifiedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {skill.isVerified ? (
                      <Badge variant="success" className="gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unverified</Badge>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(skill.id);
                        setEditValue(skill.proficiencyLevel);
                      }}
                      title="Edit proficiency"
                      className="text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!skill.isVerified && (
                      <button
                        onClick={() => handleRemove(skill.id)}
                        disabled={removing === skill.id}
                        title="Remove skill"
                        className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === skill.id ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Proficiency</span>
                      <span className="font-semibold text-blue-600">{editValue}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <p className="text-xs text-gray-400">
                      {editValue >= 80 ? "Expert" : editValue >= 60 ? "Advanced" : editValue >= 40 ? "Intermediate" : "Beginner"}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateProficiency(skill)}
                        disabled={saving === skill.id}
                        className="gap-1 h-7 text-xs"
                      >
                        <Save className="h-3 w-3" />
                        {saving === skill.id ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Proficiency</span>
                      <span className="font-semibold text-gray-900">{skill.proficiencyLevel}%</span>
                    </div>
                    <Progress value={skill.proficiencyLevel} />
                    <p className="text-xs text-gray-400">
                      {skill.proficiencyLevel >= 80
                        ? "Expert"
                        : skill.proficiencyLevel >= 60
                        ? "Advanced"
                        : skill.proficiencyLevel >= 40
                        ? "Intermediate"
                        : "Beginner"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Activity Tab ---------- */

const credentialStatusConfig: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "default"; label: string }
> = {
  verified: { variant: "success", label: "Verified" },
  pending: { variant: "warning", label: "Pending" },
  rejected: { variant: "destructive", label: "Rejected" },
  revoked: { variant: "destructive", label: "Revoked" },
};

const applicationStatusConfig: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "default" | "secondary"; label: string }
> = {
  accepted: { variant: "success", label: "Accepted" },
  pending: { variant: "warning", label: "Pending" },
  rejected: { variant: "destructive", label: "Rejected" },
  shortlisted: { variant: "default", label: "Shortlisted" },
  withdrawn: { variant: "secondary", label: "Withdrawn" },
};

function ActivityTab({ activity }: { activity: ActivityData }) {
  return (
    <div className="space-y-6">
      {/* Recent Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Recent Credentials
          </CardTitle>
          <CardDescription>Your last 5 credentials</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.recentCredentials.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No credentials yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.recentCredentials.map((cred) => {
                const config =
                  credentialStatusConfig[cred.status] ??
                  credentialStatusConfig.pending;
                return (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cred.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cred.type} &bull;{" "}
                        {cred.issuedAt
                          ? formatDate(cred.issuedAt)
                          : formatDate(cred.createdAt)}
                      </p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-600" />
            Recent Assessments
          </CardTitle>
          <CardDescription>Your last 5 assessment attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.recentAttempts.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No assessments taken yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attempt.assessment?.title ?? "Assessment"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attempt.completedAt
                        ? formatDate(attempt.completedAt)
                        : "In progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    {attempt.score !== null && attempt.score !== undefined ? (
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            attempt.score >= 70
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {attempt.score}%
                        </span>
                        <p className="text-xs text-gray-400">
                          {attempt.score >= 70 ? "Passed" : "Failed"}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="warning">In Progress</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Job Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Recent Job Applications
          </CardTitle>
          <CardDescription>Your last 5 job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.recentApplications.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No job applications yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.recentApplications.map((app) => {
                const config =
                  applicationStatusConfig[app.status] ??
                  applicationStatusConfig.pending;
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {app.job?.title ?? "Job Position"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {app.job?.company && `${app.job.company} \u2022 `}
                        {formatDate(app.appliedAt)}
                      </p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Account Settings Tab ---------- */

function SettingsTab() {
  return (
    <div className="space-y-6">
      <ChangePasswordForm />
      <DangerZone />
    </div>
  );
}

function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || "Failed to change password");
      setSaving(false);
      return;
    }

    setSuccess("Password changed successfully");
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZone() {
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDeleting(true);

    const res = await fetch("/api/users/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || "Failed to delete account");
      setDeleting(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions that affect your account permanently
        </CardDescription>
      </CardHeader>
      <CardContent>
        {confirming ? (
          <form onSubmit={handleDelete} className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-3 text-sm font-semibold text-red-700">
                Are you absolutely sure? This action cannot be undone.
              </p>
              {error && (
                <div className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Enter your password to confirm
                </label>
                <Input
                  type="password"
                  placeholder="Your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" variant="destructive" disabled={deleting || !password}>
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setConfirming(false); setPassword(""); setError(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-xs text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
              Delete Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
