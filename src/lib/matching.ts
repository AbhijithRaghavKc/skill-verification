type CandidateProfile = {
  skills: {
    skillId: string;
    skillName: string;
    proficiencyLevel: number;
    isVerified: boolean;
  }[];
};

type JobRequirements = {
  requiredSkills: { skillId: string; skillName: string; minLevel: number }[];
  preferredSkills: { skillId: string; skillName: string; minLevel: number }[];
};

type MatchResult = {
  overallScore: number;
  skillBreakdown: {
    skillName: string;
    matchScore: number;
    isVerified: boolean;
    candidateLevel: number;
    requiredLevel: number;
  }[];
  verifiedBonus: number;
  recommendation: string;
  confidence: number;
};

export function calculateJobMatch(
  candidate: CandidateProfile,
  job: JobRequirements
): MatchResult {
  const requiredWeight = 0.7;
  const preferredWeight = 0.3;
  const verifiedMultiplier = 1.25;

  let requiredScore = 0;
  let preferredScore = 0;
  let verifiedCount = 0;
  const breakdown: MatchResult["skillBreakdown"] = [];

  for (const req of job.requiredSkills) {
    const candidateSkill = candidate.skills.find(
      (s) => s.skillId === req.skillId
    );

    if (candidateSkill) {
      let skillScore =
        Math.min(candidateSkill.proficiencyLevel / req.minLevel, 1.2) * 100;

      if (candidateSkill.isVerified) {
        skillScore = Math.min(skillScore * verifiedMultiplier, 100);
        verifiedCount++;
      }

      requiredScore += skillScore;
      breakdown.push({
        skillName: req.skillName,
        matchScore: Math.round(skillScore),
        isVerified: candidateSkill.isVerified,
        candidateLevel: candidateSkill.proficiencyLevel,
        requiredLevel: req.minLevel,
      });
    } else {
      breakdown.push({
        skillName: req.skillName,
        matchScore: 0,
        isVerified: false,
        candidateLevel: 0,
        requiredLevel: req.minLevel,
      });
    }
  }

  for (const pref of job.preferredSkills) {
    const candidateSkill = candidate.skills.find(
      (s) => s.skillId === pref.skillId
    );

    if (candidateSkill) {
      let skillScore =
        Math.min(candidateSkill.proficiencyLevel / pref.minLevel, 1.2) * 100;

      if (candidateSkill.isVerified) {
        skillScore = Math.min(skillScore * verifiedMultiplier, 100);
        verifiedCount++;
      }

      preferredScore += skillScore;
      breakdown.push({
        skillName: pref.skillName,
        matchScore: Math.round(skillScore),
        isVerified: candidateSkill.isVerified,
        candidateLevel: candidateSkill.proficiencyLevel,
        requiredLevel: pref.minLevel,
      });
    }
  }

  const maxRequired = job.requiredSkills.length * 100;
  const maxPreferred = job.preferredSkills.length * 100;

  const normalizedRequired =
    maxRequired > 0 ? requiredScore / maxRequired : 0;
  const normalizedPreferred =
    maxPreferred > 0 ? preferredScore / maxPreferred : 0;

  const totalSkills =
    job.requiredSkills.length + job.preferredSkills.length;
  const verifiedBonus =
    totalSkills > 0 ? (verifiedCount / totalSkills) * 10 : 0;

  const overallScore = Math.min(
    Math.round(
      (normalizedRequired * requiredWeight +
        normalizedPreferred * preferredWeight) *
        100 +
        verifiedBonus
    ),
    100
  );

  const confidence =
    totalSkills > 0
      ? Math.round(
          (breakdown.filter((b) => b.candidateLevel > 0).length /
            totalSkills) *
            100
        )
      : 0;

  let recommendation: string;
  if (overallScore >= 85) {
    recommendation = "Excellent match. Candidate strongly recommended.";
  } else if (overallScore >= 70) {
    recommendation = "Good match. Candidate meets most requirements.";
  } else if (overallScore >= 50) {
    recommendation =
      "Partial match. Candidate may need additional skill development.";
  } else {
    recommendation =
      "Low match. Significant skill gaps identified.";
  }

  return {
    overallScore,
    skillBreakdown: breakdown,
    verifiedBonus: Math.round(verifiedBonus),
    recommendation,
    confidence,
  };
}

export function rankCandidatesForJob(
  candidates: { id: string; profile: CandidateProfile }[],
  job: JobRequirements
): { candidateId: string; match: MatchResult }[] {
  return candidates
    .map((c) => ({
      candidateId: c.id,
      match: calculateJobMatch(c.profile, job),
    }))
    .sort((a, b) => b.match.overallScore - a.match.overallScore);
}

export function recommendJobsForCandidate(
  candidate: CandidateProfile,
  jobs: { id: string; requirements: JobRequirements }[]
): { jobId: string; match: MatchResult }[] {
  return jobs
    .map((j) => ({
      jobId: j.id,
      match: calculateJobMatch(candidate, j.requirements),
    }))
    .sort((a, b) => b.match.overallScore - a.match.overallScore);
}
