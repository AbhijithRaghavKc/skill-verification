import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@skillchain.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set in your .env file.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log(`Seeding admin account: ${ADMIN_EMAIL}`);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });

  if (existing) {
    if (existing.role === "admin") {
      console.log("Admin account already exists. Nothing to do.");
    } else {
      const [updated] = await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.email, ADMIN_EMAIL))
        .returning({ id: users.id, email: users.email, role: users.role });
      console.log(`Existing user promoted to admin:`, updated);
    }
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [admin] = await db
    .insert(users)
    .values({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: "admin",
      isVerified: true,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  console.log("Admin account created successfully:", admin);
  console.log(`\nSign in at /auth/signin with:`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
