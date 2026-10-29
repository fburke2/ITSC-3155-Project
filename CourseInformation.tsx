import { useEffect, useMemo, useState } from "react"
import "./app/src/CourseInformation.css"

interface CourseSelectionData {
  version: 1
  value: string
  name: string
  category: string
}

interface CourseSelectionUpdatedDetail {
  data?: CourseSelectionData | null
}

interface CourseEstimate {
  value: string
  name: string
  credits?: number
  semesters?: number
  salary?: number
  currency: string
}

const STORAGE_KEY = "courseSelection.v1"
const COURSE_UPDATED_EVENT = "courseSelectionUpdated"
const NOT_PROVIDED = "Not provided"

const estimates: CourseEstimate[] = [
  {
    value: "game-dev-fundamentals",
    name: "Game Development Fundamentals",
    credits: 120,
    semesters: 8,
    salary: 76000,
    currency: "USD",
  },
  {
    value: "web-dev-modern",
    name: "Modern Web Development",
    credits: 120,
    semesters: 8,
    salary: 74000,
    currency: "USD",
  },
  {
    value: "software-eng-foundations",
    name: "Software Engineering Foundations",
    credits: 120,
    semesters: 8,
    salary: 82000,
    currency: "USD",
  },
  {
    value: "general-programming-basics",
    name: "General Programming Basics",
    credits: 120,
    semesters: 8,
    salary: 70000,
    currency: "USD",
  },
  {
    value: "science-communication",
    name: "Science Communication Essentials",
    credits: 120,
    semesters: 8,
    salary: 65000,
    currency: "USD",
  },
  {
    value: "english-literature-survey",
    name: "English Literature Survey",
    credits: 120,
    semesters: 8,
    salary: 58000,
    currency: "USD",
  },
  {
    value: "teaching-education-methods",
    name: "Teaching & Education Methods",
    credits: 120,
    semesters: 8,
    salary: 56000,
    currency: "USD",
  },
  { value: "design-intro", name: "Intro to Product Design", currency: "USD" },
  { value: "figma-foundations", name: "Figma Foundations", currency: "USD" },
  { value: "react-basics", name: "React Basics", currency: "USD" },
  {
    value: "typescript-essentials",
    name: "TypeScript Essentials",
    currency: "USD",
  },
  {
    value: "growth-marketing-101",
    name: "Growth Marketing 101",
    currency: "USD",
  },
]

function isValidSelection(value: unknown): value is CourseSelectionData {
  if (!value || typeof value !== "object") return false
  const selection = value as Partial<CourseSelectionData>
  return (
    selection.version === 1 &&
    typeof selection.value === "string" &&
    typeof selection.name === "string" &&
    typeof selection.category === "string"
  )
}

function readSelection(): CourseSelectionData | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    return isValidSelection(parsed) ? parsed : null
  } catch {
    return null
  }
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`
  }
}

export default function CourseInformation() {
  const [selection, setSelection] = useState<CourseSelectionData | null>(() =>
    typeof window === "undefined" ? null : readSelection()
  )

  const estimatesByValue = useMemo(
    () => new Map(estimates.map((estimate) => [estimate.value, estimate])),
    []
  )
  const estimate = selection
    ? estimatesByValue.get(selection.value)
    : undefined

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setSelection(readSelection())
    }

    function handleSelectionUpdated(event: Event) {
      const detail = (event as CustomEvent<CourseSelectionUpdatedDetail>).detail
      if (detail?.data === null) {
        setSelection(null)
      } else if (isValidSelection(detail?.data)) {
        setSelection(detail.data)
      } else {
        setSelection(readSelection())
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(COURSE_UPDATED_EVENT, handleSelectionUpdated)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(COURSE_UPDATED_EVENT, handleSelectionUpdated)
    }
  }, [])

  const metrics = [
    {
      label: "Credits to complete",
      value:
        typeof estimate?.credits === "number"
          ? `Sample: ${estimate.credits}`
          : NOT_PROVIDED,
    },
    {
      label: "Average semesters",
      value:
        typeof estimate?.semesters === "number"
          ? `Sample: ${estimate.semesters}`
          : NOT_PROVIDED,
    },
    {
      label: "Sample annual salary",
      value:
        typeof estimate?.salary === "number"
          ? `Sample: ${formatCurrency(estimate.salary, estimate.currency)}`
          : NOT_PROVIDED,
    },
  ]

  return (
    <section className="course-info-panel" aria-live="polite">
      <h2>Course information</h2>
      {!selection ? (
        <p className="course-info-empty">Select a course to see its details</p>
      ) : (
        <>
          <div className="course-info-summary">
            <strong>{selection.name || estimate?.name || NOT_PROVIDED}</strong>
            <span>Category: {selection.category || NOT_PROVIDED}</span>
            <span className="course-info-estimate-label">
              Illustrative program-path estimates
            </span>
          </div>

          <div className="course-info-metrics">
            {metrics.map((metric) => (
              <article className="course-info-metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <p className="course-info-disclaimer">
            Illustrative only for prototype program pathways tied to these
            sample course labels, not accredited degree requirements. Figures
            are not verified course requirements or salary averages. Actual
            credits, duration, and pay vary by school, degree, role, and
            location.
          </p>
        </>
      )}
    </section>
  )
}