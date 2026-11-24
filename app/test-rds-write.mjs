import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

try {
  await prisma.$executeRawUnsafe(
    "INSERT INTO `test` (`id`) VALUES (?)",
    8
  )

  const rows = await prisma.$queryRawUnsafe(
    "SELECT `id` FROM `test` WHERE `id` = ?",
    8
  )

  console.log("RDS write successful.")
  console.log(rows)
} catch (error) {
  console.error("RDS write failed.")
  console.error(error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
