import { useEffect, useState } from "react"
import "./app/src/ClassInformation.css"

interface SelectedCourse {
  version: 1
  value: string
  name: string
  category: string
}

interface CourseDetails {
  code: string
  type: string
  hours: number
  description: string
  topics: string[]
  format: string
  prerequisites: string
}

const COURSE_SELECTION_STORAGE_KEY = "courseSelection.v1"
const COURSE_UPDATED_EVENT = "courseSelectionUpdated"

const courseDetailsByValue: Record<string, CourseDetails> = {
  "game-dev-fundamentals": {
    code: "ITSC 3688",
    type: "Major elective",
    hours: 3,
    description: "Learn the fundamentals of designing and building interactive games.",
    topics: ["Game mechanics", "Level design", "Interactive media"],
    format: "Lecture and project-based lab",
    prerequisites: "General Programming Basics",
  },
  "web-dev-modern": {
    code: "ITSC 3155",
    type: "Major core",
    hours: 3,
    description: "Build responsive web experiences with current frontend development practices.",
    topics: ["HTML and CSS", "JavaScript", "Accessible interfaces"],
    format: "Lecture and coding projects",
    prerequisites: "General Programming Basics",
  },
  "software-eng-foundations": {
    code: "ITSC 2214",
    type: "Major core",
    hours: 3,
    description: "Practice the planning, collaboration, and testing techniques used by software teams.",
    topics: ["Requirements", "Version control", "Testing and design"],
    format: "Seminars and team projects",
    prerequisites: "General Programming Basics",
  },
  "general-programming-basics": {
    code: "ITSC 1212",
    type: "Major core",
    hours: 3,
    description: "Develop a foundation in problem solving and writing reliable programs.",
    topics: ["Variables and control flow", "Functions", "Debugging"],
    format: "Lecture and programming exercises",
    prerequisites: "No prerequisites",
  },
  "science-communication": {
    code: "SCIE 1201",
    type: "General education",
    hours: 3,
    description: "Learn to explain scientific ideas clearly to technical and general audiences.",
    topics: ["Research communication", "Data storytelling", "Presentations"],
    format: "Seminars and presentations",
    prerequisites: "No prerequisites",
  },
  "english-literature-survey": {
    code: "ENGL 1101",
    type: "General education",
    hours: 3,
    description: "Explore major literary works, genres, and methods of critical reading.",
    topics: ["Close reading", "Literary history", "Written analysis"],
    format: "Discussion-based seminar",
    prerequisites: "No prerequisites",
  },
  "teaching-education-methods": {
    code: "ITSC 3720",
    type: "Major elective",
    hours: 3,
    description: "Examine practical approaches for planning instruction and supporting learners.",
    topics: ["Lesson planning", "Assessment", "Inclusive teaching"],
    format: "Workshop and applied activities",
    prerequisites: "General Programming Basics",
  },
}

function isValidSelectedCourse(value: unknown): value is SelectedCourse {
  if (!value || typeof value !== "object") return false
  const course = value as Partial<SelectedCourse>
  return (
    course.version === 1 &&
    typeof course.value === "string" &&
    typeof course.name === "string" &&
    typeof course.category === "string"
  )
}

function readSelectedCourse(): SelectedCourse | null {
  try {
    const stored = window.localStorage.getItem(COURSE_SELECTION_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    return isValidSelectedCourse(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default function ClassInformation() {
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(
    () => (typeof window === "undefined" ? null : readSelectedCourse())
  )

  useEffect(() => {
    function updateSelectedCourse() {
      setSelectedCourse(readSelectedCourse())
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === COURSE_SELECTION_STORAGE_KEY) updateSelectedCourse()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(COURSE_UPDATED_EVENT, updateSelectedCourse)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(COURSE_UPDATED_EVENT, updateSelectedCourse)
    }
  }, [])

  const details = selectedCourse
    ? courseDetailsByValue[selectedCourse.value]
    : undefined

  return (
    <section className="class-information-page" aria-labelledby="class-information-title">
      <header className="class-information-header">
        <span className="page-eyebrow">Selected course</span>
        <h1 id="class-information-title">Class information</h1>
        <p>Review the requirements and topics for the course you selected.</p>
      </header>

      {!selectedCourse || !details ? (
        <section className="class-information-empty" aria-live="polite">
          <h2>Select a course to see its information</h2>
          <p>Choose a course from Course Selection to view its hours, topics, format, and prerequisites.</p>
          <a href="#courses">Go to Course Selection</a>
        </section>
      ) : (
        <article className="selected-course-details">
          <header className="selected-course-header">
            <div>
              <span className="course-code">{details.code}</span>
              <h2>{selectedCourse.name}</h2>
              <p>{details.description}</p>
            </div>
            <a href="#courses">Change course</a>
          </header>

          <dl className="course-detail-summary">
            <div>
              <dt>Course type</dt>
              <dd>{details.type}</dd>
            </div>
            <div>
              <dt>Credit hours</dt>
              <dd>{details.hours} hours</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{selectedCourse.category}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{details.format}</dd>
            </div>
          </dl>

          <section className="course-detail-section">
            <h3>What you will learn</h3>
            <ul>
              {details.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </section>

          <section className="course-detail-section">
            <h3>Prerequisites</h3>
            <p>{details.prerequisites}</p>
          </section>
        </article>
      )}

      <p className="class-information-disclaimer">
        Course details are illustrative prototype data. Confirm official hours, prerequisites, and
        course requirements with your academic advisor.
      </p>
    </section>
  )
}
