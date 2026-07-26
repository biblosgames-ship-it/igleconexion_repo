import { defineConfig } from "prisma/config";

const dbUrl = process.env["DATABASE_URL"] ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: dbUrl,
  },
});
