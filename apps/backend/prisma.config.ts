import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const isBuild =
  process.env.PRISMA_BUILD === '1' ||
  process.env.npm_lifecycle_event === 'prisma:generate'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'prisma/seed.ts' },
  datasource: {
    url: isBuild
      ? process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/dummy'
      : env('DATABASE_URL'),
  },
})
