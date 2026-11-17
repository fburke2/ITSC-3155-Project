import "dotenv/config"
import { createServer } from "node:http"
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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")
  if (url.pathname !== "/api/degree-surveys") {
    sendJson(response, 404, { error: "Not found." })
    return
  }
  if (request.method !== "POST") {
    response.setHeader("allow", "POST")
    sendJson(response, 405, { error: "Method not allowed." })
    return
  }
  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, { error: "Content-Type must be application/json." })
    return
  }

  let data
  try {
    data = parseDegreeSurvey(await readJsonBody(request))
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(response, error.status, { error: error.message })
      return
    }
    console.error("Could not read degree survey request:", error)
    sendJson(response, 400, { error: "Could not read degree survey request." })
    return
  }

  if (!process.env.DATABASE_URL) {
    sendJson(response, 503, {
      error: "Database is not configured. Set DATABASE_URL in app/.env and restart the API.",
    })
    return
  }

  try {
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
    console.error("Could not save degree survey to SQL:", error)
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
