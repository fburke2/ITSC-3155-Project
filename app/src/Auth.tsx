import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import "./Auth.css"

type AuthUser = { id: number; email: string }

type AuthProps = {
  onAuthenticated: (user: AuthUser) => void
}

type LocalAccount = {
  email: string
  salt: string
  passwordHash: string
}

const LOCAL_ACCOUNTS_KEY = "courseExplorer.accounts.v1"
const DEMO_EMAIL = "demo@courseexplorer.local"
const DEMO_PASSWORD = "Presentation1!"

function bytesToBase64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function derivePassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(salt),
      iterations: 310000,
      hash: "SHA-256",
    },
    key,
    256
  )
  return bytesToBase64(derived)
}

function readLocalAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) ?? "[]")
  } catch {
    return []
  }
}

function writeLocalAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export async function ensureDemoAccount() {
  const accounts = readLocalAccounts()
  if (!accounts.some((account) => account.email === DEMO_EMAIL)) {
    const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)).buffer)
    accounts.push({
      email: DEMO_EMAIL,
      salt,
      passwordHash: await derivePassword(DEMO_PASSWORD, salt),
    })
    writeLocalAccounts(accounts)
  }
}

export async function verifyLocalCredentials(email: string, password: string) {
  await ensureDemoAccount()
  const account = readLocalAccounts().find(
    (candidate) => candidate.email === email.trim().toLowerCase()
  )
  if (!account) return false
  return (await derivePassword(password, account.salt)) === account.passwordHash
}

export async function registerLocalAccount(email: string, password: string) {
  await ensureDemoAccount()
  const normalizedEmail = email.trim().toLowerCase()
  const accounts = readLocalAccounts()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    return { ok: false, error: "An account with this email already exists." }
  }
  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)).buffer)
  accounts.push({
    email: normalizedEmail,
    salt,
    passwordHash: await derivePassword(password, salt),
  })
  writeLocalAccounts(accounts)
  return { ok: true, user: { id: 0, email: normalizedEmail } }
}

export async function deleteLocalAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!(await verifyLocalCredentials(normalizedEmail, password))) return false
  if (normalizedEmail === DEMO_EMAIL) return false
  writeLocalAccounts(
    readLocalAccounts().filter((account) => account.email !== normalizedEmail)
  )
  return true
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ensureDemoAccount().catch(() => {})
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      let response: Response | null = null
      try {
        response = await fetch(
          mode === "login" ? "/api/auth/login" : "/api/auth/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        )
      } catch {
        response = null
      }

      if (response) {
        const responseText = await response.text()
        let data: { error?: string; id?: number; email?: string } = {}
        if (responseText) {
          try {
            data = JSON.parse(responseText)
          } catch {
            setError(`The authentication service returned an invalid response (${response.status}).`)
            return
          }
        }

        if (response.status !== 503) {
          if (!response.ok) {
            setError(data.error ?? "Authentication failed.")
            return
          }
          if (typeof data.id !== "number" || typeof data.email !== "string") {
            setError("The authentication service returned an invalid response.")
            return
          }
          onAuthenticated({ id: data.id, email: data.email })
          return
        }
      }

      const normalizedEmail = email.trim().toLowerCase()
      if (mode === "login") {
        if (!(await verifyLocalCredentials(normalizedEmail, password))) {
          setError("Invalid email or password.")
          return
        }
        onAuthenticated({ id: 0, email: normalizedEmail })
        return
      }

      const registered = await registerLocalAccount(normalizedEmail, password)
      if (!registered.ok) {
        setError(registered.error ?? "Could not create account.")
        return
      }
      onAuthenticated(registered.user!)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? `Unable to reach the authentication service: ${requestError.message}`
          : "Unable to reach the authentication service."
      )
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode)
    setError("")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div>
          <p className="auth-kicker">Course Explorer</p>
          <h1 id="auth-title">{mode === "login" ? "Sign in" : "Create account"}</h1>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          {mode === "register" ? (
            <>
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                required
              />
            </>
          ) : null}

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>

        {mode === "login" ? (
          <p className="auth-demo">
            Presentation account: <strong>demo@courseexplorer.local</strong>
            {" "}/ <strong>Presentation1!</strong>
          </p>
        ) : null}
      </section>
    </main>
  )
}
