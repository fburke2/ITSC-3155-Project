import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules", "prisma", "build", "index.js"),
    "generate",
    "--schema",
    "prisma/schema.prisma",
  ],
  {
    env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: "1" },
    stdio: "inherit",
  }
)

if (result.error) {
  console.error("Could not run Prisma Client generation:", result.error)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
