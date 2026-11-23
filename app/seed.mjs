import "dotenv/config"
import { randomBytes, scryptSync } from "node:crypto"
import { PrismaClient } from "@prisma/client"

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64")
  const derivedKey = scryptSync(password, salt, 64)
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("base64")}`
}

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.")
  }

  const email = (
    process.env.DEMO_USER_EMAIL ?? "demo@courseexplorer.local"
  ).toLowerCase()
  const password = process.env.DEMO_USER_PASSWORD ?? "Presentation1!"

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password) },
    create: { email, passwordHash: hashPassword(password) },
  })

  console.log(`Seeded presentation account: ${email}`)
}

main()
  .catch((error) => {
    console.error("Could not seed the presentation account:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
