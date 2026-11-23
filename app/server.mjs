import "dotenv/config"
import { createServer } from "node:http"
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const port = Number(process.env.API_PORT ?? 3001)
const maxBodyBytes = 1024 * 1024
const maxClasses = 100

class RequestError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify(data))
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBodyBytes) {
      throw new RequestError(413, "Request body is too large.")
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new RequestError(400, "Request body must be valid JSON.")
  }
}

function requireText(value, field, maxLength) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    throw new RequestError(
      400,
      `${field} is required and must be no more than ${maxLength} characters.`
    )
  }
  return value.trim()
}

function parseDegreeSurvey(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError(400, "A degree survey object is required.")
  }

  const school = requireText(value.school, "School", 255)
  const degree = requireText(value.degree, "Degree", 255)

  if (
    !Array.isArray(value.classes) ||
    value.classes.length === 0 ||
    value.classes.length > maxClasses
  ) {
    throw new RequestError(
      400,
      `Add between 1 and ${maxClasses} classes.`
    )
  }

  const classes = value.classes.map((classEntry, index) => {
    if (!classEntry || typeof classEntry !== "object" || Array.isArray(classEntry)) {
      throw new RequestError(400, `Class ${index + 1} must be an object.`)
    }

    const name = requireText(classEntry.name, `Class ${index + 1} name`, 255)
    const credits = classEntry.credits
    if (
      typeof credits !== "number" ||
      !Number.isFinite(credits) ||
      credits < 0 ||
      credits > 9999.9 ||
      Math.abs(credits * 2 - Math.round(credits * 2)) > 1e-8
    ) {
      throw new RequestError(
        400,
        `Class ${index + 1} credits must be a non-negative number in half-credit increments.`
      )
    }

    const description =
      classEntry.description === undefined
        ? ""
        : requireTextOrEmpty(classEntry.description, `Class ${index + 1} description`, 2000)

    return { name, credits, description }
  })

  return { school, degree, classes }
}

function requireTextOrEmpty(value, field, maxLength) {
  if (typeof value !== "string" || value.length > maxLength) {
    throw new RequestError(
      400,
      `${field} must be no more than ${maxLength} characters.`
    )
  }
  return value.trim()
}

function requireEmail(value) {
  if (typeof value !== "string") {
    throw new RequestError(400, "Email is required.")
  }
  const email = value.trim().toLowerCase()
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestError(400, "Enter a valid email address.")
  }
  return email
}

function requirePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new RequestError(
      400,
      "Password must be at least 8 characters and no more than 128 characters."
    )
  }
  return value
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("base64")
  const derivedKey = scryptSync(password, salt, 64)
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("base64")}`
}

export function verifyPassword(password, storedHash) {
  try {
    const [algorithm, n, r, p, salt, hash] = storedHash.split("$")
    if (algorithm !== "scrypt" || !salt || !hash) return false
    const derivedKey = scryptSync(password, salt, 64, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
    const suppliedKey = Buffer.from(hash, "base64")
    return (
      suppliedKey.length === derivedKey.length &&
      timingSafeEqual(suppliedKey, derivedKey)
    )
  } catch {
    return false
  }
}

async function handleAuth(request, response, url) {
  if (!["POST", "DELETE"].includes(request.method)) {
    response.setHeader("allow", "POST, DELETE")
    throw new RequestError(405, "Method not allowed.")
  }
  if (!request.headers["content-type"]?.includes("application/json")) {
    throw new RequestError(415, "Content-Type must be application/json.")
  }
  if (!process.env.DATABASE_URL) {
    throw new RequestError(
      503,
      "Database is not configured. Set DATABASE_URL in app/.env and restart the API."
    )
  }

  const body = await readJsonBody(request)
  const email = requireEmail(body.email)

  if (url.pathname === "/api/auth/register") {
    const password = requirePassword(body.password)
    await prisma.$connect()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new RequestError(409, "An account with this email already exists.")
    }

    const user = await prisma.user.create({
      data: { email, passwordHash: hashPassword(password) },
      select: { id: true, email: true },
    })
    sendJson(response, 201, user)
    return
  }

  if (url.pathname === "/api/auth/login") {
    const password = requirePassword(body.password)
    await prisma.$connect()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new RequestError(401, "Invalid email or password.")
    }
    sendJson(response, 200, { id: user.id, email: user.email })
    return
  }

  if (url.pathname === "/api/auth/account" && request.method === "DELETE") {
    const password = requirePassword(body.password)
    await prisma.$connect()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new RequestError(401, "Incorrect password.")
    }
    await prisma.user.delete({ where: { id: user.id } })
    sendJson(response, 200, { deleted: true })
    return
  }

  throw new RequestError(404, "Not found.")
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")
  try {
    if (
      url.pathname === "/api/auth/login" ||
      url.pathname === "/api/auth/register" ||
      url.pathname === "/api/auth/account"
    ) {
      await handleAuth(request, response, url)
      return
    }

    if (url.pathname !== "/api/degree-surveys") {
      throw new RequestError(404, "Not found.")
    }
    if (request.method !== "POST") {
      response.setHeader("allow", "POST")
      throw new RequestError(405, "Method not allowed.")
    }
    if (!request.headers["content-type"]?.includes("application/json")) {
      throw new RequestError(415, "Content-Type must be application/json.")
    }

    const data = parseDegreeSurvey(await readJsonBody(request))
    if (!process.env.DATABASE_URL) {
      throw new RequestError(
        503,
        "Database is not configured. Set DATABASE_URL in app/.env and restart the API."
      )
    }

    await prisma.$connect()
    const savedSurvey = await prisma.degreeSurvey.create({
      data: {
        school: data.school,
        degree: data.degree,
        classes: {
          create: data.classes.map(({ name, credits, description }) => ({
            name,
            credits,
            description: description || null,
          })),
        },
      },
      select: { id: true },
    })
    sendJson(response, 201, { id: savedSurvey.id })
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(response, error.status, { error: error.message })
      return
    }
    console.error("Database or request operation failed:", error)
    if (url.pathname.startsWith("/api/auth/")) {
      sendJson(response, 503, {
        error: "Database unavailable or not migrated. Check DATABASE_URL and run npm run db:deploy.",
      })
      return
    }
    sendJson(response, 503, {
      error:
        "Database unavailable or not migrated. Check DATABASE_URL and run npm run db:deploy.",
    })
  }
})

server.on("error", (error) => {
  console.error("Degree survey API could not listen:", error)
  process.exitCode = 1
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Degree survey API listening on http://127.0.0.1:${port}`)
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not configured; SQL sync will return 503. Browser saving remains available."
    )
  }
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      prisma.$disconnect().catch((error) => {
        console.error("Could not disconnect from SQL:", error)
      })
    })
  })
}
