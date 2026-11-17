import { useId, useState, type FormEvent } from "react"
import "./app/src/Survey.css"

interface ClassEntry {
  id: number
  name: string
  credits: string
  description: string
}

interface DegreeSurveyData {
  version: 1
  school: string
  degree: string
  classes: Array<Omit<ClassEntry, "id" | "credits"> & { credits: number }>
}

const STORAGE_KEY = "degreeSurvey.v1"

function isDegreeSurveyData(value: unknown): value is DegreeSurveyData {
  if (!value || typeof value !== "object") return false
  const data = value as {
    version?: unknown
    school?: unknown
    degree?: unknown
    classes?: unknown
  }
  return (
    data.version === 1 &&
    typeof data.school === "string" &&
    typeof data.degree === "string" &&
    Array.isArray(data.classes) &&
    data.classes.every((classEntry: unknown) => {
      if (!classEntry || typeof classEntry !== "object") return false
      const entry = classEntry as Record<string, unknown>
      return (
        typeof entry.name === "string" &&
        typeof entry.credits === "number" &&
        Number.isFinite(entry.credits) &&
        typeof entry.description === "string"
      )
    })
  )
}

function readSavedDegreeSurvey(): {
  data: DegreeSurveyData | null
  errorMessage: string
} {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { data: null, errorMessage: "" }

    const parsed: unknown = JSON.parse(stored)
    if (!isDegreeSurveyData(parsed)) {
      throw new Error("Saved degree details have an invalid format.")
    }
    return { data: parsed, errorMessage: "" }
  } catch (error) {
    return {
      data: null,
      errorMessage:
        error instanceof Error
          ? `Could not load saved degree details: ${error.message}`
          : "Could not load saved degree details.",
    }
  }
}

export default function DegreeSurvey() {
  const schoolId = useId()
  const degreeId = useId()
  const [savedSurvey] = useState(readSavedDegreeSurvey)
  const [school, setSchool] = useState(savedSurvey.data?.school ?? "")
  const [degree, setDegree] = useState(savedSurvey.data?.degree ?? "")
  const [classes, setClasses] = useState<ClassEntry[]>([
    ...(savedSurvey.data?.classes.map((classEntry, index) => ({
      ...classEntry,
      credits: String(classEntry.credits),
      id: index + 1,
    })) ?? [{ id: 1, name: "", credits: "", description: "" }]),
  ])
  const [nextClassId, setNextClassId] = useState(
    (savedSurvey.data?.classes.length ?? 1) + 1
  )
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState(savedSurvey.errorMessage)
  const [isSaving, setIsSaving] = useState(false)

  function updateClass(id: number, field: keyof Omit<ClassEntry, "id">, value: string) {
    setClasses((current) =>
      current.map((classEntry) =>
        classEntry.id === id ? { ...classEntry, [field]: value } : classEntry
      )
    )
    setMessage("")
    setErrorMessage("")
  }

  function addClass() {
    setClasses((current) => [
      ...current,
      { id: nextClassId, name: "", credits: "", description: "" },
    ])
    setNextClassId((current) => current + 1)
    setMessage("")
    setErrorMessage("")
  }

  function removeClass(id: number) {
    setClasses((current) => current.filter((classEntry) => classEntry.id !== id))
    setMessage("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const submission = {
      school: school.trim(),
      degree: degree.trim(),
      classes: classes.map(({ name, credits, description }) => ({
        name: name.trim(),
        credits: Number(credits),
        description: description.trim(),
      })),
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, ...submission })
      )
      setMessage("Saved in this browser.")
      setErrorMessage("")
    } catch (error) {
      setMessage("")
      setErrorMessage(
        error instanceof Error
          ? `Could not save degree details in this browser: ${error.message}`
          : "Could not save degree details in this browser."
      )
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/degree-surveys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const errorMessage =
          result && typeof result === "object" && "error" in result
            ? result.error
            : null
        throw new Error(
          typeof errorMessage === "string"
            ? errorMessage
            : "Could not save degree information."
        )
      }

      setMessage("Saved in this browser and the SQL database.")
      setErrorMessage("")
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Could not save to SQL."
      setMessage("Saved in this browser.")
      setErrorMessage(
        `SQL sync failed: ${reason}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="survey-panel" aria-labelledby="degree-survey-title">
      <header className="survey-header">
        <h1 id="degree-survey-title">Degree survey</h1>
        <p>Tell us about your school, degree, and completed classes.</p>
      </header>
      <form className="survey-form" onSubmit={handleSubmit}>
        <div className="survey-field">
          <label htmlFor={schoolId}>What school did you attend?</label>
          <input
            id={schoolId}
            required
            maxLength={255}
            value={school}
            onChange={(event) => {
              setSchool(event.target.value)
              setMessage("")
              setErrorMessage("")
            }}
          />
        </div>

        <div className="survey-field">
          <label htmlFor={degreeId}>What degree have you earned?</label>
          <input
            id={degreeId}
            required
            maxLength={255}
            value={degree}
            onChange={(event) => {
              setDegree(event.target.value)
              setMessage("")
              setErrorMessage("")
            }}
          />
        </div>

        <div className="degree-classes">
          <h2>Classes you have taken</h2>
          {classes.map((classEntry, index) => {
            const nameId = `degree-class-${classEntry.id}-name`
            const creditsId = `degree-class-${classEntry.id}-credits`
            const descriptionId = `degree-class-${classEntry.id}-description`

            return (
              <fieldset className="degree-class-entry" key={classEntry.id}>
                <legend>Class {index + 1}</legend>
                <div className="survey-field">
                  <label htmlFor={nameId}>Class name</label>
                  <input
                    id={nameId}
                    required
                    maxLength={255}
                    value={classEntry.name}
                    onChange={(event) =>
                      updateClass(classEntry.id, "name", event.target.value)
                    }
                  />
                </div>
                <div className="survey-field">
                  <label htmlFor={creditsId}>Credits earned</label>
                  <input
                    id={creditsId}
                    type="number"
                    min="0"
                    max="9999.9"
                    step="0.5"
                    required
                    value={classEntry.credits}
                    onChange={(event) =>
                      updateClass(classEntry.id, "credits", event.target.value)
                    }
                  />
                </div>
                <div className="survey-field">
                  <label htmlFor={descriptionId}>Class description</label>
                  <textarea
                    id={descriptionId}
                    rows={3}
                    maxLength={2000}
                    value={classEntry.description}
                    onChange={(event) =>
                      updateClass(
                        classEntry.id,
                        "description",
                        event.target.value
                      )
                    }
                  />
                </div>
                {classes.length > 1 ? (
                  <button
                    className="survey-secondary"
                    type="button"
                    onClick={() => removeClass(classEntry.id)}
                  >
                    Remove class
                  </button>
                ) : null}
              </fieldset>
            )
          })}
          <button className="survey-secondary" type="button" onClick={addClass}>
            Add another class
          </button>
        </div>

        <div className="survey-actions">
          <button className="survey-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save degree details"}
          </button>
          <a className="survey-secondary survey-link-button" href="#survey">
            Back to the main survey
          </a>
        </div>
        <p className="survey-success" aria-live="polite">
          {message}
        </p>
        <p className={errorMessage.startsWith("SQL sync failed:") ? "survey-warning" : "survey-error"} aria-live="polite">
          {errorMessage}
        </p>
      </form>
    </section>
  )
}
