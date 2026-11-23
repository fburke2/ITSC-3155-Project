import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import Survey from "../../Survey"
import Course_Selection from "../../Course_Selection"
import CourseInformation from "../../CourseInformation"
import ClassInformation from "../../ClassInformation"
import DegreeSurvey from "../../DegreeSurvey"
import Auth, { deleteLocalAccount } from "./Auth"
import "./App.css"

type AppPage = "survey" | "courses" | "class-information" | "degree-survey"

function getPageFromHash(): AppPage {
  if (window.location.hash === "#class-information") return "class-information"
  if (window.location.hash === "#degree-survey") return "degree-survey"
  return window.location.hash === "#courses" ? "courses" : "survey"
}

function App() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)
  const [deleteError, setDeleteError] = useState("")
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [user, setUser] = useState<{ id: number; email: string } | null>(() => {
    try {
      const saved = window.localStorage.getItem("courseExplorer.auth.v1")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  function authenticate(authUser: { id: number; email: string }) {
    window.localStorage.setItem(
      "courseExplorer.auth.v1",
      JSON.stringify(authUser)
    )
    setUser(authUser)
  }

  function logout() {
    window.localStorage.removeItem("courseExplorer.auth.v1")
    setUser(null)
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeleteError("")

    if (user.id === 0) {
      if (await deleteLocalAccount(user.email, deletePassword)) {
        window.localStorage.removeItem("courseExplorer.auth.v1")
        setUser(null)
        setShowDelete(false)
        setDeletePassword("")
      } else {
        setDeleteError(
          user.email === "demo@courseexplorer.local"
            ? "The presentation account cannot be deleted."
            : "Incorrect password."
        )
      }
      return
    }

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: deletePassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setDeleteError(data.error ?? "Could not delete account.")
        return
      }
      window.localStorage.removeItem("courseExplorer.auth.v1")
      setUser(null)
      setShowDelete(false)
      setDeletePassword("")
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? `Unable to reach the authentication service: ${error.message}`
          : "Unable to reach the authentication service."
      )
    }
  }

  if (!user) {
    return <Auth onAuthenticated={authenticate} />
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="app-brand" href="#survey">
          Course Explorer
        </a>
        <nav className="app-navigation" aria-label="Main navigation">
          <a
            href="#survey"
            aria-current={page === "survey" ? "page" : undefined}
          >
            Survey
          </a>
          <a
            href="#courses"
            aria-current={page === "courses" ? "page" : undefined}
          >
            Course Selection
          </a>
          <a
            href="#degree-survey"
            aria-current={page === "degree-survey" ? "page" : undefined}
          >
            Degree Survey
          </a>
          <a
            href="#class-information"
            aria-current={page === "class-information" ? "page" : undefined}
          >
            Class Information
          </a>
        </nav>
        <div className="app-user-actions">
          <span>{user.email}</span>
          <button type="button" onClick={logout}>
            Sign out
          </button>
          <button type="button" onClick={() => setShowDelete(true)}>
            Delete account
          </button>
        </div>
      </header>

      {showDelete ? (
        <section className="delete-account-dialog" aria-labelledby="delete-account-title">
          <form onSubmit={deleteAccount}>
            <h2 id="delete-account-title">Delete account</h2>
            <p>
              Enter your password to permanently delete {user.email}.
            </p>
            <label htmlFor="delete-account-password">Password</label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              required
            />
            {deleteError ? <p className="delete-account-error" role="alert">{deleteError}</p> : null}
            <div className="delete-account-actions">
              <button type="submit">Delete permanently</button>
              <button type="button" onClick={() => {
                setShowDelete(false)
                setDeleteError("")
                setDeletePassword("")
              }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className={`app-page app-page-${page}`}>
        {page === "survey" ? (
          <Survey
            onComplete={() => {
              window.location.hash = "courses"
            }}
          />
        ) : page === "courses" ? (
          <section className="course-page" aria-labelledby="course-page-title">
            <header className="course-page-header">
              <h1 id="course-page-title">Explore courses</h1>
              <p>
                Browse recommendations, filter the course list, and view
                illustrative program information.
              </p>
            </header>
            <Course_Selection />
            <CourseInformation />
          </section>
        ) : page === "degree-survey" ? (
          <DegreeSurvey />
        ) : (
          <ClassInformation />
        )}
      </div>
    </main>
  )
}

export default App
