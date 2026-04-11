import { NextResponse } from "next/server";
import { db } from "@/db";
import { skills } from "@/db/schema";

const SEED_SKILLS = [
  { name: "JavaScript", category: "Programming", description: "Core web programming language" },
  { name: "Python", category: "Programming", description: "General-purpose programming language" },
  { name: "Solidity", category: "Blockchain", description: "Smart contract programming language" },
  { name: "React", category: "Frontend", description: "UI component library" },
  { name: "TypeScript", category: "Programming", description: "Typed superset of JavaScript" },
  { name: "Node.js", category: "Backend", description: "JavaScript runtime for servers" },
  { name: "Docker", category: "DevOps", description: "Container platform" },
  { name: "AWS", category: "Cloud", description: "Amazon Web Services cloud platform" },
  { name: "Rust", category: "Programming", description: "Systems programming language" },
  { name: "Go", category: "Programming", description: "Fast compiled language by Google" },
];

export async function GET() {
  try {
    const existing = await db.query.skills.findMany();
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Skills already seeded (${existing.length} found)`,
        data: existing,
      });
    }

    const inserted = await db.insert(skills).values(SEED_SKILLS).returning();

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted.length} skills`,
      data: inserted,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to seed skills" },
      { status: 500 }
    );
  }
}
