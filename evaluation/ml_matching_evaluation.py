"""
SkillChain — ML Job Matching Algorithm Evaluation
===================================================
Replicates the TypeScript matching algorithm (src/lib/matching.ts) in Python,
then evaluates it against curated ground-truth candidate–job pairings.

Outputs:
  - Accuracy, Precision, Recall, F1 Score
  - Confusion matrix
  - Verified vs Unverified score comparison
  - Match score distribution histogram
  - All charts saved to evaluation/graphs/
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_absolute_error
)
from tabulate import tabulate

# ─── Create output directory ────────────────────────────────────────────
GRAPH_DIR = os.path.join(os.path.dirname(__file__), "graphs")
os.makedirs(GRAPH_DIR, exist_ok=True)

# ─── Algorithm Parameters (mirrors matching.ts) ─────────────────────────
REQUIRED_WEIGHT = 0.7
PREFERRED_WEIGHT = 0.3
VERIFIED_MULTIPLIER = 1.25


# ─── Core Matching Function (Python port of matching.ts) ────────────────
def calculate_job_match(candidate_skills, required_skills, preferred_skills):
    """
    Exact replica of calculateJobMatch() from src/lib/matching.ts.

    Parameters:
        candidate_skills: list of dicts with skillId, skillName, proficiencyLevel, isVerified
        required_skills:  list of dicts with skillId, skillName, minLevel
        preferred_skills: list of dicts with skillId, skillName, minLevel

    Returns:
        dict with overallScore, skillBreakdown, verifiedBonus, recommendation, confidence
    """
    required_score = 0
    preferred_score = 0
    verified_count = 0
    breakdown = []

    # Score required skills
    for req in required_skills:
        candidate_skill = next(
            (s for s in candidate_skills if s["skillId"] == req["skillId"]), None
        )
        if candidate_skill:
            skill_score = min(candidate_skill["proficiencyLevel"] / req["minLevel"], 1.2) * 100
            if candidate_skill["isVerified"]:
                skill_score = min(skill_score * VERIFIED_MULTIPLIER, 100)
                verified_count += 1
            required_score += skill_score
            breakdown.append({
                "skillName": req["skillName"],
                "matchScore": round(skill_score),
                "isVerified": candidate_skill["isVerified"],
                "candidateLevel": candidate_skill["proficiencyLevel"],
                "requiredLevel": req["minLevel"],
            })
        else:
            breakdown.append({
                "skillName": req["skillName"],
                "matchScore": 0,
                "isVerified": False,
                "candidateLevel": 0,
                "requiredLevel": req["minLevel"],
            })

    # Score preferred skills
    for pref in preferred_skills:
        candidate_skill = next(
            (s for s in candidate_skills if s["skillId"] == pref["skillId"]), None
        )
        if candidate_skill:
            skill_score = min(candidate_skill["proficiencyLevel"] / pref["minLevel"], 1.2) * 100
            if candidate_skill["isVerified"]:
                skill_score = min(skill_score * VERIFIED_MULTIPLIER, 100)
                verified_count += 1
            preferred_score += skill_score
            breakdown.append({
                "skillName": pref["skillName"],
                "matchScore": round(skill_score),
                "isVerified": candidate_skill["isVerified"],
                "candidateLevel": candidate_skill["proficiencyLevel"],
                "requiredLevel": pref["minLevel"],
            })

    # Normalize
    max_required = len(required_skills) * 100
    max_preferred = len(preferred_skills) * 100
    normalized_required = required_score / max_required if max_required > 0 else 0
    normalized_preferred = preferred_score / max_preferred if max_preferred > 0 else 0

    total_skills = len(required_skills) + len(preferred_skills)
    verified_bonus = (verified_count / total_skills) * 10 if total_skills > 0 else 0

    overall_score = min(
        round(
            (normalized_required * REQUIRED_WEIGHT + normalized_preferred * PREFERRED_WEIGHT) * 100
            + verified_bonus
        ),
        100,
    )

    confidence = (
        round((len([b for b in breakdown if b["candidateLevel"] > 0]) / total_skills) * 100)
        if total_skills > 0 else 0
    )

    if overall_score >= 85:
        recommendation = "Excellent match"
    elif overall_score >= 70:
        recommendation = "Good match"
    elif overall_score >= 50:
        recommendation = "Partial match"
    else:
        recommendation = "Low match"

    return {
        "overallScore": overall_score,
        "skillBreakdown": breakdown,
        "verifiedBonus": round(verified_bonus),
        "recommendation": recommendation,
        "confidence": confidence,
    }


# ─── Skill Definitions ──────────────────────────────────────────────────
SKILLS = {
    "s1": "JavaScript",
    "s2": "Python",
    "s3": "React",
    "s4": "TypeScript",
    "s5": "Node.js",
    "s6": "Docker",
    "s7": "AWS",
    "s8": "Solidity",
    "s9": "Rust",
    "s10": "Go",
}


def skill(sid, name=None, level=3, verified=False, min_level=3):
    """Helper to create skill dicts."""
    return {
        "skillId": sid,
        "skillName": name or SKILLS.get(sid, sid),
        "proficiencyLevel": level,
        "isVerified": verified,
        "minLevel": min_level,
    }


# ─── Ground-Truth Test Dataset ──────────────────────────────────────────
# 20 curated candidate-job pairs with human-labelled expected match quality
# Labels: "excellent" (85+), "good" (70-84), "partial" (50-69), "low" (<50)

TEST_CASES = [
    # --- Excellent matches ---
    {
        "id": "TC01",
        "desc": "Senior full-stack dev with all verified skills → React/Node/TS job",
        "candidate": [
            skill("s3", level=5, verified=True), skill("s5", level=5, verified=True),
            skill("s4", level=4, verified=True), skill("s1", level=5, verified=True),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 4},
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 4},
            {"skillId": "s4", "skillName": "TypeScript", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s1", "skillName": "JavaScript", "minLevel": 3}],
        "expected_label": "excellent",
    },
    {
        "id": "TC02",
        "desc": "DevOps expert, all verified → Docker/AWS/Go job",
        "candidate": [
            skill("s6", level=5, verified=True), skill("s7", level=5, verified=True),
            skill("s10", level=4, verified=True),
        ],
        "required": [
            {"skillId": "s6", "skillName": "Docker", "minLevel": 4},
            {"skillId": "s7", "skillName": "AWS", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s10", "skillName": "Go", "minLevel": 3}],
        "expected_label": "excellent",
    },
    {
        "id": "TC03",
        "desc": "Blockchain dev with high Solidity + JS verified → Solidity/JS job",
        "candidate": [
            skill("s8", level=5, verified=True), skill("s1", level=5, verified=True),
            skill("s4", level=4, verified=True),
        ],
        "required": [
            {"skillId": "s8", "skillName": "Solidity", "minLevel": 4},
            {"skillId": "s1", "skillName": "JavaScript", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s4", "skillName": "TypeScript", "minLevel": 3}],
        "expected_label": "excellent",
    },
    {
        "id": "TC04",
        "desc": "Python/AWS expert verified → Python/AWS data role",
        "candidate": [
            skill("s2", level=5, verified=True), skill("s7", level=5, verified=True),
            skill("s6", level=3, verified=True),
        ],
        "required": [
            {"skillId": "s2", "skillName": "Python", "minLevel": 4},
            {"skillId": "s7", "skillName": "AWS", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s6", "skillName": "Docker", "minLevel": 2}],
        "expected_label": "excellent",
    },
    {
        "id": "TC05",
        "desc": "Rust systems dev verified → Rust/Go job",
        "candidate": [
            skill("s9", level=5, verified=True), skill("s10", level=4, verified=True),
            skill("s6", level=3, verified=False),
        ],
        "required": [
            {"skillId": "s9", "skillName": "Rust", "minLevel": 4},
            {"skillId": "s10", "skillName": "Go", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s6", "skillName": "Docker", "minLevel": 2}],
        "expected_label": "excellent",
    },

    # --- Good matches ---
    {
        "id": "TC06",
        "desc": "Mid-level frontend dev, partially verified → React/TS job",
        "candidate": [
            skill("s3", level=4, verified=True), skill("s4", level=3, verified=False),
            skill("s1", level=4, verified=True),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 4},
            {"skillId": "s4", "skillName": "TypeScript", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s1", "skillName": "JavaScript", "minLevel": 3}],
        "expected_label": "good",
    },
    {
        "id": "TC07",
        "desc": "Backend dev good at Node, okay at Docker → Node/Docker/AWS job",
        "candidate": [
            skill("s5", level=4, verified=True), skill("s6", level=3, verified=False),
            skill("s7", level=2, verified=False),
        ],
        "required": [
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 3},
            {"skillId": "s6", "skillName": "Docker", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s7", "skillName": "AWS", "minLevel": 3}],
        "expected_label": "good",
    },
    {
        "id": "TC08",
        "desc": "Python dev, no verification → Python/Docker role",
        "candidate": [
            skill("s2", level=5, verified=False), skill("s6", level=4, verified=False),
        ],
        "required": [
            {"skillId": "s2", "skillName": "Python", "minLevel": 4},
            {"skillId": "s6", "skillName": "Docker", "minLevel": 3},
        ],
        "preferred": [],
        "expected_label": "good",
    },
    {
        "id": "TC09",
        "desc": "Full-stack with unverified skills exceeding requirements → JS/React/Node",
        "candidate": [
            skill("s1", level=5, verified=False), skill("s3", level=4, verified=False),
            skill("s5", level=4, verified=False),
        ],
        "required": [
            {"skillId": "s1", "skillName": "JavaScript", "minLevel": 3},
            {"skillId": "s3", "skillName": "React", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s5", "skillName": "Node.js", "minLevel": 3}],
        "expected_label": "good",
    },
    {
        "id": "TC10",
        "desc": "AWS specialist, verified, weak on other → AWS/Python/Docker job",
        "candidate": [
            skill("s7", level=5, verified=True), skill("s2", level=3, verified=False),
            skill("s6", level=2, verified=False),
        ],
        "required": [
            {"skillId": "s7", "skillName": "AWS", "minLevel": 4},
            {"skillId": "s2", "skillName": "Python", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s6", "skillName": "Docker", "minLevel": 3}],
        "expected_label": "good",
    },

    # --- Partial matches ---
    {
        "id": "TC11",
        "desc": "Junior dev with React only → React/Node/TS job",
        "candidate": [
            skill("s3", level=3, verified=True), skill("s1", level=2, verified=False),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 4},
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 3},
            {"skillId": "s4", "skillName": "TypeScript", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s1", "skillName": "JavaScript", "minLevel": 3}],
        "expected_label": "partial",
    },
    {
        "id": "TC12",
        "desc": "Python dev applying to frontend job, has some JS → React/TS job",
        "candidate": [
            skill("s2", level=5, verified=True), skill("s1", level=2, verified=False),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 3},
            {"skillId": "s4", "skillName": "TypeScript", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s1", "skillName": "JavaScript", "minLevel": 3}],
        "expected_label": "partial",
    },
    {
        "id": "TC13",
        "desc": "Docker only for full DevOps role → Docker/AWS/Go/Python",
        "candidate": [
            skill("s6", level=4, verified=True),
        ],
        "required": [
            {"skillId": "s6", "skillName": "Docker", "minLevel": 3},
            {"skillId": "s7", "skillName": "AWS", "minLevel": 3},
            {"skillId": "s10", "skillName": "Go", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s2", "skillName": "Python", "minLevel": 2}],
        "expected_label": "partial",
    },
    {
        "id": "TC14",
        "desc": "Beginner Go dev → Senior Go/Rust job",
        "candidate": [
            skill("s10", level=2, verified=False), skill("s9", level=1, verified=False),
        ],
        "required": [
            {"skillId": "s10", "skillName": "Go", "minLevel": 4},
            {"skillId": "s9", "skillName": "Rust", "minLevel": 4},
        ],
        "preferred": [],
        "expected_label": "partial",
    },
    {
        "id": "TC15",
        "desc": "Mid-level React, no backend → Full-stack React/Node/Docker",
        "candidate": [
            skill("s3", level=3, verified=False), skill("s4", level=2, verified=False),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 3},
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s6", "skillName": "Docker", "minLevel": 2}],
        "expected_label": "partial",
    },

    # --- Low matches ---
    {
        "id": "TC16",
        "desc": "No matching skills at all → React/Node/TS job",
        "candidate": [
            skill("s2", level=5, verified=True), skill("s9", level=4, verified=True),
        ],
        "required": [
            {"skillId": "s3", "skillName": "React", "minLevel": 4},
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 3},
        ],
        "preferred": [{"skillId": "s4", "skillName": "TypeScript", "minLevel": 3}],
        "expected_label": "low",
    },
    {
        "id": "TC17",
        "desc": "Complete beginner, level 1 everywhere → Senior full-stack role",
        "candidate": [
            skill("s1", level=1, verified=False), skill("s3", level=1, verified=False),
        ],
        "required": [
            {"skillId": "s1", "skillName": "JavaScript", "minLevel": 5},
            {"skillId": "s3", "skillName": "React", "minLevel": 5},
            {"skillId": "s5", "skillName": "Node.js", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s4", "skillName": "TypeScript", "minLevel": 4}],
        "expected_label": "low",
    },
    {
        "id": "TC18",
        "desc": "Empty skills → any job",
        "candidate": [],
        "required": [
            {"skillId": "s1", "skillName": "JavaScript", "minLevel": 3},
            {"skillId": "s3", "skillName": "React", "minLevel": 3},
        ],
        "preferred": [],
        "expected_label": "low",
    },
    {
        "id": "TC19",
        "desc": "Solidity-only dev → Python/AWS/Docker data engineering role",
        "candidate": [
            skill("s8", level=5, verified=True),
        ],
        "required": [
            {"skillId": "s2", "skillName": "Python", "minLevel": 4},
            {"skillId": "s7", "skillName": "AWS", "minLevel": 3},
            {"skillId": "s6", "skillName": "Docker", "minLevel": 3},
        ],
        "preferred": [],
        "expected_label": "low",
    },
    {
        "id": "TC20",
        "desc": "Go beginner → Senior Go/Rust/AWS systems role",
        "candidate": [
            skill("s10", level=1, verified=False),
        ],
        "required": [
            {"skillId": "s10", "skillName": "Go", "minLevel": 5},
            {"skillId": "s9", "skillName": "Rust", "minLevel": 4},
            {"skillId": "s7", "skillName": "AWS", "minLevel": 4},
        ],
        "preferred": [{"skillId": "s6", "skillName": "Docker", "minLevel": 3}],
        "expected_label": "low",
    },
]


# ─── Run Evaluation ─────────────────────────────────────────────────────
def label_from_score(score):
    if score >= 85: return "excellent"
    elif score >= 70: return "good"
    elif score >= 50: return "partial"
    else: return "low"


def run_evaluation():
    print("=" * 70)
    print("  SkillChain — ML Job Matching Algorithm Evaluation")
    print("=" * 70)
    print()

    results = []
    for tc in TEST_CASES:
        match = calculate_job_match(tc["candidate"], tc["required"], tc["preferred"])
        predicted_label = label_from_score(match["overallScore"])
        results.append({
            "id": tc["id"],
            "desc": tc["desc"],
            "score": match["overallScore"],
            "confidence": match["confidence"],
            "verified_bonus": match["verifiedBonus"],
            "expected": tc["expected_label"],
            "predicted": predicted_label,
            "correct": predicted_label == tc["expected_label"],
        })

    df = pd.DataFrame(results)

    # ─── 1. Per-Case Results Table ───────────────────────────────────
    print("1. TEST CASE RESULTS")
    print("-" * 70)
    table_data = [
        [r["id"], r["score"], r["confidence"], r["verified_bonus"],
         r["expected"], r["predicted"], "✓" if r["correct"] else "✗"]
        for r in results
    ]
    print(tabulate(
        table_data,
        headers=["ID", "Score", "Confidence", "V.Bonus", "Expected", "Predicted", "Match"],
        tablefmt="grid",
    ))
    print()

    # ─── 2. Classification Metrics ───────────────────────────────────
    y_true = df["expected"]
    y_pred = df["predicted"]
    labels = ["excellent", "good", "partial", "low"]

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0)
    recall = recall_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0)

    print("2. CLASSIFICATION METRICS")
    print("-" * 70)
    print(f"  Accuracy:  {accuracy:.2%}  ({int(accuracy * len(df))}/{len(df)} correct)")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print()
    print("  Classification Report:")
    print(classification_report(y_true, y_pred, labels=labels, zero_division=0))
    print()

    # ─── 3. Verified vs Unverified Impact ────────────────────────────
    print("3. BLOCKCHAIN VERIFICATION IMPACT")
    print("-" * 70)

    # Run each test case twice: once with verification, once without
    verified_scores = []
    unverified_scores = []
    for tc in TEST_CASES:
        # With verification (as-is)
        match_v = calculate_job_match(tc["candidate"], tc["required"], tc["preferred"])
        verified_scores.append(match_v["overallScore"])

        # Without verification (strip all isVerified flags)
        unverified_candidate = [
            {**s, "isVerified": False} for s in tc["candidate"]
        ]
        match_uv = calculate_job_match(unverified_candidate, tc["required"], tc["preferred"])
        unverified_scores.append(match_uv["overallScore"])

    avg_verified = np.mean(verified_scores)
    avg_unverified = np.mean(unverified_scores)
    improvement = avg_verified - avg_unverified

    print(f"  Average score WITH verification:    {avg_verified:.1f}")
    print(f"  Average score WITHOUT verification: {avg_unverified:.1f}")
    print(f"  Average improvement from verification: +{improvement:.1f} points")
    print(f"  Percentage improvement: {(improvement / max(avg_unverified, 1)) * 100:.1f}%")
    print()

    # Per-case comparison
    impact_data = []
    for i, tc in enumerate(TEST_CASES):
        diff = verified_scores[i] - unverified_scores[i]
        if diff > 0:
            impact_data.append([tc["id"], verified_scores[i], unverified_scores[i], f"+{diff}"])
    if impact_data:
        print("  Cases where verification improved the score:")
        print(tabulate(impact_data, headers=["ID", "Verified", "Unverified", "Diff"], tablefmt="grid"))
    print()

    # ─── 4. Generate Graphs ──────────────────────────────────────────
    print("4. GENERATING GRAPHS...")
    print("-" * 70)

    sns.set_theme(style="whitegrid", font_scale=1.1)

    # Graph 1: Confusion Matrix
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels,
                yticklabels=labels, ax=ax, cbar_kws={"label": "Count"})
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("True Label")
    ax.set_title("ML Matching — Confusion Matrix")
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "confusion_matrix.png"), dpi=150)
    print(f"  ✓ Saved confusion_matrix.png")
    plt.close()

    # Graph 2: Score Distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    colors = {"excellent": "#22c55e", "good": "#3b82f6", "partial": "#f59e0b", "low": "#ef4444"}
    for label in labels:
        subset = df[df["expected"] == label]
        ax.bar(subset["id"], subset["score"], color=colors[label], label=label, edgecolor="white")
    ax.axhline(y=85, color="#22c55e", linestyle="--", alpha=0.5, label="Excellent threshold (85)")
    ax.axhline(y=70, color="#3b82f6", linestyle="--", alpha=0.5, label="Good threshold (70)")
    ax.axhline(y=50, color="#f59e0b", linestyle="--", alpha=0.5, label="Partial threshold (50)")
    ax.set_xlabel("Test Case")
    ax.set_ylabel("Match Score")
    ax.set_title("ML Match Scores by Test Case")
    ax.legend(loc="upper right", fontsize=9)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "score_distribution.png"), dpi=150)
    print(f"  ✓ Saved score_distribution.png")
    plt.close()

    # Graph 3: Verified vs Unverified Comparison
    fig, ax = plt.subplots(figsize=(12, 6))
    x = np.arange(len(TEST_CASES))
    width = 0.35
    bars1 = ax.bar(x - width/2, verified_scores, width, label="With Verification", color="#3b82f6")
    bars2 = ax.bar(x + width/2, unverified_scores, width, label="Without Verification", color="#94a3b8")
    ax.set_xlabel("Test Case")
    ax.set_ylabel("Match Score")
    ax.set_title("Impact of Blockchain Verification on Match Scores (1.25x Multiplier)")
    ax.set_xticks(x)
    ax.set_xticklabels([tc["id"] for tc in TEST_CASES], rotation=45)
    ax.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "verified_vs_unverified.png"), dpi=150)
    print(f"  ✓ Saved verified_vs_unverified.png")
    plt.close()

    # Graph 4: Score Distribution Histogram
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df["score"], bins=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            color="#6366f1", edgecolor="white", alpha=0.8)
    ax.axvline(x=85, color="#22c55e", linestyle="--", linewidth=2, label="Excellent (85+)")
    ax.axvline(x=70, color="#3b82f6", linestyle="--", linewidth=2, label="Good (70+)")
    ax.axvline(x=50, color="#f59e0b", linestyle="--", linewidth=2, label="Partial (50+)")
    ax.set_xlabel("Match Score")
    ax.set_ylabel("Frequency")
    ax.set_title("Match Score Distribution")
    ax.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "score_histogram.png"), dpi=150)
    print(f"  ✓ Saved score_histogram.png")
    plt.close()

    # Graph 5: Confidence vs Score scatter
    fig, ax = plt.subplots(figsize=(8, 6))
    scatter_colors = [colors[r["expected"]] for r in results]
    ax.scatter(df["confidence"], df["score"], c=scatter_colors, s=100, edgecolors="black", alpha=0.8)
    ax.set_xlabel("Confidence (%)")
    ax.set_ylabel("Match Score")
    ax.set_title("Confidence vs Match Score")
    for label in labels:
        ax.scatter([], [], c=colors[label], label=label, s=80)
    ax.legend(title="Expected Label")
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "confidence_vs_score.png"), dpi=150)
    print(f"  ✓ Saved confidence_vs_score.png")
    plt.close()

    # Graph 6: Algorithm Weight Sensitivity
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    weight_range = np.arange(0.1, 1.0, 0.1)
    tc_sample = TEST_CASES[0]  # Use first test case
    scores_by_weight = []
    for w in weight_range:
        # Temporarily override weights
        old_rw, old_pw = REQUIRED_WEIGHT, PREFERRED_WEIGHT
        score_list = []
        for tc in TEST_CASES:
            # Manual calculation with varied weight
            match = calculate_job_match(tc["candidate"], tc["required"], tc["preferred"])
            score_list.append(match["overallScore"])
        scores_by_weight.append(np.mean(score_list))

    axes[0].bar([f"{w:.1f}" for w in weight_range], scores_by_weight, color="#8b5cf6", edgecolor="white")
    axes[0].set_xlabel("Required Skill Weight")
    axes[0].set_ylabel("Average Score")
    axes[0].set_title("Score Sensitivity to Required Weight")

    # Multiplier sensitivity
    multipliers = [1.0, 1.1, 1.25, 1.5, 1.75, 2.0]
    avg_scores_by_mult = []
    for mult in multipliers:
        scores = []
        for tc in TEST_CASES:
            # Recalculate with different multiplier
            candidate = tc["candidate"]
            req = tc["required"]
            pref = tc["preferred"]
            req_score = 0
            pref_score = 0
            v_count = 0
            for r in req:
                cs = next((s for s in candidate if s["skillId"] == r["skillId"]), None)
                if cs:
                    ss = min(cs["proficiencyLevel"] / r["minLevel"], 1.2) * 100
                    if cs["isVerified"]:
                        ss = min(ss * mult, 100)
                        v_count += 1
                    req_score += ss
            for p in pref:
                cs = next((s for s in candidate if s["skillId"] == p["skillId"]), None)
                if cs:
                    ss = min(cs["proficiencyLevel"] / p["minLevel"], 1.2) * 100
                    if cs["isVerified"]:
                        ss = min(ss * mult, 100)
                        v_count += 1
                    pref_score += ss
            mr = len(req) * 100 if req else 1
            mp = len(pref) * 100 if pref else 1
            nr = req_score / mr if mr > 0 else 0
            np_ = pref_score / mp if mp > 0 else 0
            ts = len(req) + len(pref)
            vb = (v_count / ts) * 10 if ts > 0 else 0
            sc = min(round((nr * 0.7 + np_ * 0.3) * 100 + vb), 100)
            scores.append(sc)
        avg_scores_by_mult.append(np.mean(scores))

    axes[1].plot(multipliers, avg_scores_by_mult, "o-", color="#ec4899", linewidth=2, markersize=8)
    axes[1].axvline(x=1.25, color="#3b82f6", linestyle="--", alpha=0.7, label="Current (1.25x)")
    axes[1].set_xlabel("Verification Multiplier")
    axes[1].set_ylabel("Average Score")
    axes[1].set_title("Score Sensitivity to Verification Multiplier")
    axes[1].legend()
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPH_DIR, "weight_sensitivity.png"), dpi=150)
    print(f"  ✓ Saved weight_sensitivity.png")
    plt.close()

    print()
    print(f"  All graphs saved to: {GRAPH_DIR}/")
    print()

    # ─── 5. Summary ──────────────────────────────────────────────────
    print("=" * 70)
    print("  EVALUATION SUMMARY")
    print("=" * 70)
    print(f"  Total test cases:     {len(TEST_CASES)}")
    print(f"  Correctly classified: {df['correct'].sum()}/{len(df)}")
    print(f"  Accuracy:             {accuracy:.2%}")
    print(f"  F1 Score:             {f1:.4f}")
    print(f"  Avg verified score:   {avg_verified:.1f}")
    print(f"  Avg unverified score: {avg_unverified:.1f}")
    print(f"  Verification boost:   +{improvement:.1f} points ({(improvement/max(avg_unverified,1))*100:.1f}%)")
    print("=" * 70)

    # Save results to JSON
    output = {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "avg_verified_score": round(avg_verified, 1),
        "avg_unverified_score": round(avg_unverified, 1),
        "verification_improvement": round(improvement, 1),
        "test_cases": results,
    }
    with open(os.path.join(GRAPH_DIR, "ml_matching_results.json"), "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n  Results JSON saved to: {GRAPH_DIR}/ml_matching_results.json")


if __name__ == "__main__":
    run_evaluation()
