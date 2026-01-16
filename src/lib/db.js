// import { PrismaClient } from '@prisma/client';

// const db = globalThis.prisma || new PrismaClient({
//     log: ['query', 'error', 'warn', 'info'],
// });

// if(process.env.NODE_ENV !== 'development') globalThis.prisma = db;

// export default db;


import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
