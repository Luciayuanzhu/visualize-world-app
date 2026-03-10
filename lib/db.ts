import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __visualizePrisma__: PrismaClient | undefined;
}

export const db =
  global.__visualizePrisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__visualizePrisma__ = db;
}
