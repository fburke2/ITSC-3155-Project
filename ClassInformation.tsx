import { useEffect, useState } from "react"
import "./app/src/ClassInformation.css"

interface CourseSelectionData {
  version: 1
  value: string
  name: string
  category: string
}

interface ClassDetails {
  value: string
  name: string
  category: string
  description: string
  topics: string
  format: string
}

const STORAGE_KEY = "courseSelection.v1"
const COURSE_UPDATED_EVENT = "courseSelectionUpdated"

const classCatalog: ClassDetails[] = [
  {
    value: "game-dev-fundamentals",
    name: "Game Development Fundamentals",
    category: "Development",
    description: "Learn the core concepts used to design and build interactive games.",
    topics: "Game mechanics, level design, and interactive media",
    format: "Lecture and project-based lab",
  },
  {
    value: "web-dev-modern",
    name: "Modern Web Development",
    category: "Development",
    description: "Build responsive web experiences with current frontend development practices.",
    topics: "HTML, CSS, JavaScript, and accessible interfaces",
    format: "Lecture and coding projects",
  },
  {
    value: "software-eng-foundations",
    name: "Software Engineering Foundations",
    category: "Development",
    description: "Practice the planning, collaboration, and testing techniques used by software teams.",
    topics: "Requirements, version control, testing, and design",
    format: "Seminars and team projects",
  },
  {
    value: "general-programming-basics",
    name: "General Programming Basics",
    category: "Development",
    description: "Develop a foundation in problem solving and writing reliable programs.",
    topics: "Variables, control flow, functions, and debugging",
    format: "Lecture and programming exercises",
  },
  {
    value: "science-communication",
    name: "Science Communication Essentials",
    category: "Science",
    description: "Learn to explain scientific ideas clearly to technical and general audiences.",
    topics: "Research communication, data storytelling, and presentation",
    format: "Seminars and presentations",
  },
  {
    value: "english-literature-survey",
    name: "English Literature Survey",
    category: "English",
    description: "Explore major literary works, genres, and methods of critical reading.",
    topics: "Close reading, literary history, and written analysis",
    format: "Discussion-based seminar",
  },
  {
    value: "teaching-education-methods",
    name: "Teaching & Education Methods",
    category: "Education",
    description: "Examine practical approaches for planning instruction and supporting learners.",
    topics: "Lesson planning, assessment, and inclusive teaching",
    format: "Workshop and applied activities",
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

export default function ClassInformation() {
  const [selection, setSelection] = useState<CourseSelectionData | null>(() =>
    typeof window === "undefined" ? null : readSelection()
  )

  useEffect(() => {
    function updateSelection() {
      setSelection(readSelection())
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) updateSelection()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(COURSE_UPDATED_EVENT, updateSelection)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(COURSE_UPDATED_EVENT, updateSelection)
    }
  }, [])

  return (
    <section className="class-information-page" aria-labelledby="class-information-title">
      <header className="class-information-header">
        <h1 id="class-information-title">Class information</h1>
        <p>Review the classes available through course selection and what you will learn in each one.</p>
      </header>

      {selection && (
        <aside className="selected-class-banner" aria-live="polite">
          <span>Your selected course</span>
          <strong>{selection.name}</strong>
          <a href="#courses">Change course selection</a>
        </aside>
      )}

      <div className="class-information-grid">
        {classCatalog.map((classDetails) => {
          const isSelected = classDetails.value === selection?.value
          return (
            <article
              className={`class-information-card${isSelected ? " is-selected" : ""}`}
              key={classDetails.value}
            >
              <div className="class-information-card-heading">
                <span className="class-category">{classDetails.category}</span>
                {isSelected && <span className="class-selected-label">Selected</span>}
              </div>
              <h2>{classDetails.name}</h2>
              <p>{classDetails.description}</p>
              <dl>
                <div>
                  <dt>Topics</dt>
                  <dd>{classDetails.topics}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{classDetails.format}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>

      <p className="class-information-disclaimer">
        Class descriptions are illustrative information for this prototype. Confirm official course
        requirements, schedules, and delivery formats with your program.
      </p>
    </section>
  )
}
