"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  Plus,
  Clock,
  Trophy,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Lightbulb,
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
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
};

type Assessment = {
  id: string;
  title: string;
  description: string | null;
  skillId: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  passingScore: number;
  totalAttempts: number;
  averageScore: number | null;
  status: string;
  createdAt: string;
  questions: AssessmentQuestion[];
};

type SubmissionResult = {
  score: number;
  passed: boolean;
  analysis: {
    strengthAreas: string[];
    weaknessAreas: string[];
    recommendations: string[];
    confidenceScore: number;
  };
};

const difficultyConfig: Record<
  string,
  { variant: "success" | "warning" | "destructive"; label: string }
> = {
  beginner: { variant: "success", label: "Beginner" },
  intermediate: { variant: "warning", label: "Intermediate" },
  advanced: { variant: "destructive", label: "Advanced" },
};

export default function AssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchAssessments();
    }
  }, [status, router]);

  async function fetchAssessments() {
    const res = await fetch("/api/assessments");
    const data = await res.json();
    if (data.success) setAssessments(data.data);
    setLoading(false);
  }

  const user = session?.user as { name: string; email: string; role: string };
  const isInstitutionOrAdmin = user?.role === "institution" || user?.role === "admin";

  function handleStartAssessment(assessment: Assessment) {
    setAssessmentResult(null);
    setActiveAssessment(assessment);
  }

  function handleAssessmentComplete(result: SubmissionResult) {
    setAssessmentResult(result);
    fetchAssessments();
  }

  function handleCloseAssessment() {
    setActiveAssessment(null);
    setAssessmentResult(null);
  }

  if (activeAssessment) {
    if (assessmentResult) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar user={user} />
          <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <ResultsView
              assessment={activeAssessment}
              result={assessmentResult}
              onClose={handleCloseAssessment}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <AssessmentRunner
            assessment={activeAssessment}
            onComplete={handleAssessmentComplete}
            onCancel={handleCloseAssessment}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-gray-500">
              {isInstitutionOrAdmin
                ? "Create and manage skill assessments"
                : "Test your skills and earn verified credentials"}
            </p>
          </div>

          {isInstitutionOrAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Assessment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assessment</DialogTitle>
                  <DialogDescription>
                    Build a new skill assessment for candidates to complete.
                  </DialogDescription>
                </DialogHeader>
                <CreateAssessmentForm
                  onSuccess={() => {
                    setCreateDialogOpen(false);
                    fetchAssessments();
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
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No assessments available
              </h3>
              <p className="mt-1 text-gray-500">
                {isInstitutionOrAdmin
                  ? "Create your first assessment to get started"
                  : "Check back later for new assessments"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => {
              const diff = difficultyConfig[assessment.difficulty] || difficultyConfig.beginner;
              const questionCount = assessment.questions?.length ?? 0;

              return (
                <Card
                  key={assessment.id}
                  className="hover:shadow-md transition-shadow flex flex-col"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                          <FileCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-snug">
                            {assessment.title}
                          </CardTitle>
                          <CardDescription className="mt-0.5">
                            {questionCount} question{questionCount !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={diff.variant} className="shrink-0">
                        {diff.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    {assessment.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {assessment.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{assessment.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span>Pass: {assessment.passingScore}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span>{assessment.totalAttempts ?? 0} attempts</span>
                      </div>
                      {assessment.averageScore !== null && assessment.averageScore !== undefined ? (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span>Avg: {Math.round(assessment.averageScore)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs col-span-1">
                          {formatDate(assessment.createdAt)}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <Button
                        className="w-full"
                        onClick={() => handleStartAssessment(assessment)}
                      >
                        Take Assessment
                      </Button>
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

function AssessmentRunner({
  assessment,
  onComplete,
  onCancel,
}: {
  assessment: Assessment;
  onComplete: (result: SubmissionResult) => void;
  onCancel: () => void;
}) {
  const questions = assessment.questions ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(assessment.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/assessments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId: assessment.id,
        answers,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to submit assessment");
      setSubmitting(false);
      return;
    }

    const result: SubmissionResult = {
      score: data.data.result.score,
      passed: data.data.result.passed,
      analysis: data.data.result.analysis,
    };

    onComplete(result);
  }, [assessment.id, answers, onComplete]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSubmit]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isTimeWarning = timeRemaining < 120;

  function handleSelectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handlePrev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No questions available</h3>
          <Button className="mt-4" onClick={onCancel}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{assessment.title}</h2>
              <p className="text-sm text-gray-500">
                Question {currentIndex + 1} of {totalQuestions}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                isTimeWarning
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Clock className="h-4 w-4" />
              {timeDisplay}
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{answeredCount} of {totalQuestions} answered</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {currentIndex + 1}
            </span>
            <CardTitle className="text-base leading-relaxed font-medium">
              {currentQuestion.question}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion.id, idx)}
                  className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 text-gray-500"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {currentQuestion.points && (
            <p className="mt-4 text-xs text-gray-400">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                idx === currentIndex
                  ? "bg-blue-600 text-white"
                  : answers[q.id] !== undefined
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Assessment
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Cancel and exit assessment
        </button>
      </div>
    </div>
  );
}

function ResultsView({
  assessment,
  result,
  onClose,
}: {
  assessment: Assessment;
  result: SubmissionResult;
  onClose: () => void;
}) {
  const { score, passed, analysis } = result;

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className={passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            {passed ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
            <h2 className="mt-3 text-2xl font-bold text-gray-900">
              {passed ? "Congratulations! You Passed!" : "Assessment Not Passed"}
            </h2>
            <p className="mt-1 text-gray-600">{assessment.title}</p>

            <div className="mt-6 flex items-end gap-1">
              <span className="text-6xl font-bold text-gray-900">{score}</span>
              <span className="mb-2 text-2xl font-semibold text-gray-500">%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Passing score: {assessment.passingScore}%
            </p>

            <div className="mt-4 w-full max-w-xs">
              <Progress value={score} />
            </div>

            {passed && (
              <Badge variant="success" className="mt-4 text-sm px-3 py-1">
                <Trophy className="mr-1.5 h-3.5 w-3.5" />
                Skill Verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="strengths" className="flex-1">Strengths</TabsTrigger>
          <TabsTrigger value="improvements" className="flex-1">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{score}%</p>
                  <p className="mt-1 text-sm text-gray-500">Your Score</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {analysis.confidenceScore}%
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Confidence Score</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Score achieved</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <Progress value={score} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Confidence rating</span>
                  <span className="font-medium">{analysis.confidenceScore}%</span>
                </div>
                <Progress value={analysis.confidenceScore} />
              </div>

              {analysis.recommendations.length > 0 && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Recommendation
                      </p>
                      <p className="mt-1 text-sm text-blue-700">
                        {analysis.recommendations[0]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strengths">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Strength Areas
              </CardTitle>
              <CardDescription>
                Topics where you demonstrated solid understanding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.strengthAreas.length === 0 ? (
                <p className="text-sm text-gray-500">No strength areas recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {analysis.strengthAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Areas for Improvement
              </CardTitle>
              <CardDescription>
                Topics to focus on for better performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.weaknessAreas.length === 0 ? (
                <p className="text-sm text-gray-500">No weakness areas identified.</p>
              ) : (
                <ul className="space-y-3">
                  {analysis.weaknessAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span className="text-sm text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              )}

              {analysis.recommendations.length > 1 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Additional Recommendations
                  </p>
                  <ul className="mt-2 space-y-1">
                    {analysis.recommendations.slice(1).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button onClick={onClose} className="flex-1">
          Back to Assessments
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Try Another
        </Button>
      </div>
    </div>
  );
}

function CreateAssessmentForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillId: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: 30,
    passingScore: 70,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setSkills(data.data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create assessment");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input
          placeholder="e.g., JavaScript Fundamentals"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Skill</label>
        <Select
          value={formData.skillId}
          onValueChange={(value) => setFormData({ ...formData, skillId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a skill" />
          </SelectTrigger>
          <SelectContent>
            {skills.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {skills.length === 0 && (
          <p className="text-xs text-amber-600">No skills found. Add skills to the platform first via the API.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Difficulty</label>
        <Select
          value={formData.difficulty}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              difficulty: value as "beginner" | "intermediate" | "advanced",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <Input
            type="number"
            min={5}
            max={180}
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Passing Score (%)
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={formData.passingScore}
            onChange={(e) =>
              setFormData({ ...formData, passingScore: Number(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Description{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <Input
          placeholder="Brief description of the assessment"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Assessment"}
      </Button>
    </form>
  );
}
