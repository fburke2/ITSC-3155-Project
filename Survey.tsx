import { useEffect, useId, useState, type FormEvent } from "react"
import "./app/src/Survey.css"
import {
  clearPersistedSurvey,
  readPersistedSurvey,
  saveSurvey,
  type SurveyData,
} from "./app/src/persistence"

const SURVEY_UPDATED_EVENT = "surveyPrototypeUpdated"

const degreeGoals = [
  "Explore degree paths and career options",
  "Choose or refine my major",
  "Plan courses toward graduation",
  "Further course development",
  "Graduate planning",
]

const interestOptions = [
  { value: "game development", label: "Game development" },
  { value: "web development", label: "Web development" },
  { value: "software development", label: "Software development" },
  { value: "general programming", label: "General programming" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "teaching", label: "Teaching and education" },
  { value: "certifications", label: "Certifications" },
]

const salaryRanges = [
  "Under $25,000",
  "$25,000-$49,999",
  "$50,000-$74,999",
  "$75,000-$99,999",
  "$100,000-$114,999",
  "$115,000-$129,999",
  "$130,000-$144,999",
  "$145,000-$159,999",
  "$160,000-$174,999",
  "$175,000-$189,999",
  "$190,000-$199,999",
  "$200,000+",
]

const degreeTypes = [
  "Certificate",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctoral degree",
  "Professional degree",
  "Other",
]

function publishSurvey(data: SurveyData | null) {
  window.dispatchEvent(
    new CustomEvent(SURVEY_UPDATED_EVENT, { detail: { data } })
  )
}

function needsCareerDetails(degreeGoal: string, interests: string[]) {
  return (
    degreeGoal === "Graduate planning" ||
    interests.includes("certifications")
  )
}

interface SurveyProps {
  onComplete?: () => void
}

export default function Survey({ onComplete }: SurveyProps) {
  const degreeGoalId = useId()
  const hasDegreeName = useId()
  const salaryId = useId()
  const plannedDegreeId = useId()
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [degreeGoal, setDegreeGoal] = useState(surveyData?.degreeGoal ?? "")
  const [hasDegree, setHasDegree] = useState<boolean | null>(
    surveyData?.hasDegree ?? null
  )
  const [interests, setInterests] = useState<string[]>(
    surveyData?.interests ?? []
  )
  const [averageAnnualSalary, setAverageAnnualSalary] = useState(
    surveyData?.averageAnnualSalary ?? ""
  )
  const [plannedDegree, setPlannedDegree] = useState(
    surveyData?.plannedDegree ?? ""
  )
  const [isEditing, setIsEditing] = useState(!surveyData)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    void readPersistedSurvey()
      .then((data) => {
        setSurveyData(data)
        publishSurvey(data)
        if (data) {
          setDegreeGoal(data.degreeGoal)
          setHasDegree(data.hasDegree ?? null)
          setInterests(data.interests)
          setAverageAnnualSalary(data.averageAnnualSalary ?? "")
          setPlannedDegree(data.plannedDegree ?? "")
          setIsEditing(false)
        }
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load saved survey."
        )
      })
  }, [])

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((interest) => interest !== value)
        : [...current, value]
    )
    setErrorMessage("")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (interests.length === 0) {
      setErrorMessage("Choose at least one field of interest.")
      return
    }

    if (hasDegree === null) {
      setErrorMessage("Choose yes or no to indicate whether you have a degree.")
      return
    }

    const includeCareerDetails = needsCareerDetails(degreeGoal, interests)
    const includeSalary = hasDegree
    if (
      (includeSalary && !averageAnnualSalary.trim()) ||
      (includeCareerDetails && !plannedDegree.trim())
    ) {
      setErrorMessage(
        "Complete the required salary range and degree follow-up questions."
      )
      return
    }

    const nextSurvey: SurveyData = {
      version: 1,
      completed: true,
      degreeGoal,
      hasDegree,
      interests,
      ...(includeSalary
        ? {
            averageAnnualSalary: averageAnnualSalary.trim(),
          }
        : {}),
      ...(includeCareerDetails
        ? { plannedDegree: plannedDegree.trim() }
        : {}),
    }
    void saveSurvey(nextSurvey)
      .then(() => {
        publishSurvey(nextSurvey)
        setSurveyData(nextSurvey)
        setIsEditing(false)
        setErrorMessage("")
        onComplete?.()
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save survey."
        )
      })
  }

  function handleReset() {
    void clearPersistedSurvey()
      .then(() => {
        publishSurvey(null)
        window.dispatchEvent(
          new CustomEvent("courseSelectionUpdated", { detail: { data: null } })
        )
        setSurveyData(null)
        setDegreeGoal("")
        setHasDegree(null)
        setInterests([])
        setAverageAnnualSalary("")
        setPlannedDegree("")
        setIsEditing(true)
        setErrorMessage("")
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not reset survey."
        )
      })
  }

  const includeCareerDetails = needsCareerDetails(degreeGoal, interests)
  const showSalaryRange = hasDegree === true

  return (
    <section className="survey-panel" aria-labelledby="survey-title">
        <header className="survey-header">
          <h1 id="survey-title">Find your direction</h1>
          <p>
            Share your degree goals and interests to explore recommendations.
          </p>
          <p className="survey-note">
            Responses are saved in this browser for this prototype.
          </p>
        </header>

        {isEditing ? (
          <form className="survey-form" onSubmit={handleSubmit}>
            <div className="survey-field">
              <label htmlFor={degreeGoalId}>What is your degree goal?</label>
              <select
                id={degreeGoalId}
                required
                value={degreeGoal}
                onChange={(event) => setDegreeGoal(event.target.value)}
              >
                <option value="" disabled>
                  Select a degree goal
                </option>
                {degreeGoals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="interest-fieldset">
              <legend>Do you have a degree?</legend>
              <div className="interest-options">
                <label className="interest-option">
                  <input
                    type="radio"
                    name={hasDegreeName}
                    value="yes"
                    required
                    checked={hasDegree === true}
                    onChange={() => setHasDegree(true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="interest-option">
                  <input
                    type="radio"
                    name={hasDegreeName}
                    value="no"
                    required
                    checked={hasDegree === false}
                    onChange={() => setHasDegree(false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="interest-fieldset">
              <legend>Which fields interest you?</legend>
              <div className="interest-options">
                {interestOptions.map((option) => (
                  <label className="interest-option" key={option.value}>
                    <input
                      type="checkbox"
                      checked={interests.includes(option.value)}
                      onChange={() => toggleInterest(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {showSalaryRange || includeCareerDetails ? (
              <div className="survey-follow-up">
                {showSalaryRange ? (
                  <div className="survey-field">
                    <label htmlFor={salaryId}>
                      What is your average annual salary range?
                    </label>
                    <select
                      id={salaryId}
                      required
                      value={averageAnnualSalary}
                      onChange={(event) =>
                        setAverageAnnualSalary(event.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select a salary range
                      </option>
                      {salaryRanges.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {includeCareerDetails ? (
                  <div className="survey-field">
                    <label htmlFor={plannedDegreeId}>
                      What type of degree are you pursuing or planning?
                    </label>
                    <select
                      id={plannedDegreeId}
                      required
                      value={plannedDegree}
                      onChange={(event) => setPlannedDegree(event.target.value)}
                    >
                      <option value="" disabled>
                        Select a degree type
                      </option>
                      {degreeTypes.map((degree) => (
                        <option key={degree} value={degree}>
                          {degree}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="survey-actions">
              <button className="survey-primary" type="submit">
                {surveyData ? "Save changes" : "Show my recommendations"}
              </button>
              {surveyData ? (
                <button
                  className="survey-secondary"
                  type="button"
                  onClick={() => {
                    setDegreeGoal(surveyData.degreeGoal)
                    setHasDegree(surveyData.hasDegree ?? null)
                    setInterests(surveyData.interests)
                    setAverageAnnualSalary(
                      surveyData.averageAnnualSalary ?? ""
                    )
                    setPlannedDegree(surveyData.plannedDegree ?? "")
                    setIsEditing(false)
                    setErrorMessage("")
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
            <p className="survey-error" aria-live="polite">
              {errorMessage}
            </p>
          </form>
        ) : surveyData ? (
          <div className="survey-complete" aria-live="polite">
            <div className="survey-complete-copy">
              <strong>Survey complete</strong>
              <span>{surveyData.degreeGoal}</span>
              {surveyData.hasDegree !== undefined ? (
                <span>Has a degree: {surveyData.hasDegree ? "Yes" : "No"}</span>
              ) : null}
              {surveyData.hasDegree === true &&
              surveyData.averageAnnualSalary !== undefined ? (
                <span>
                  Average annual salary: {surveyData.averageAnnualSalary}
                </span>
              ) : null}
              {surveyData.plannedDegree ? (
                <span>Planned degree: {surveyData.plannedDegree}</span>
              ) : null}
              <div className="survey-tags">
                {surveyData.interests.map((interest) => (
                  <span className="survey-tag" key={interest}>
                    {interestOptions.find((option) => option.value === interest)
                      ?.label ?? interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="survey-actions">
              <button
                className="survey-primary"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Edit survey
              </button>
              <button
                className="survey-secondary"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}
    </section>
  )
}