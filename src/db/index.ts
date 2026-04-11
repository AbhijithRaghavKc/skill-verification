import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const getDb = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
};

let _db: ReturnType<typeof getDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    if (!_db) {
      _db = getDb();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_db as any)[prop];
  },
});
