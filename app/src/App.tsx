import { useEffect, useState } from "react"
import Survey from "../../Survey"
import Course_Selection from "../../Course_Selection"
import CourseInformation from "../../CourseInformation"
import ClassInformation from "../../ClassInformation"
import "./App.css"

type AppPage = "survey" | "courses" | "class-information"

function getPageFromHash(): AppPage {
  if (window.location.hash === "#class-information") return "class-information"
  return window.location.hash === "#courses" ? "courses" : "survey"
}

function App() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

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
            href="#class-information"
            aria-current={page === "class-information" ? "page" : undefined}
          >
            Class Information
          </a>
        </nav>
      </header>

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
        ) : (
          <ClassInformation />
        )}
      </div>
    </main>
  )
}

export default App
