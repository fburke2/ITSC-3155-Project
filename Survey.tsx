import { useEffect, useId, useState, type FormEvent } from "react"
import Course_Selection from "./Course_Selection"
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
]

const interestOptions = [
  { value: "game development", label: "Game development" },
  { value: "web development", label: "Web development" },
  { value: "software development", label: "Software development" },
  { value: "general programming", label: "General programming" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "teaching", label: "Teaching and education" },
]

function publishSurvey(data: SurveyData | null) {
  window.dispatchEvent(
    new CustomEvent(SURVEY_UPDATED_EVENT, { detail: { data } })
  )
}

export default function Survey() {
  const degreeGoalId = useId()
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [degreeGoal, setDegreeGoal] = useState(surveyData?.degreeGoal ?? "")
  const [interests, setInterests] = useState<string[]>(
    surveyData?.interests ?? []
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
          setInterests(data.interests)
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

    const nextSurvey: SurveyData = {
      version: 1,
      completed: true,
      degreeGoal,
      interests,
    }
    void saveSurvey(nextSurvey)
      .then(() => {
        publishSurvey(nextSurvey)
        setSurveyData(nextSurvey)
        setIsEditing(false)
        setErrorMessage("")
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
        setInterests([])
        setIsEditing(true)
        setErrorMessage("")
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not reset survey."
        )
      })
  }

  return (
    <div className="survey-flow">
      <section className="survey-panel" aria-labelledby="survey-title">
        <header className="survey-header">
          <h1 id="survey-title">Find your direction</h1>
          <p>
            Answer two quick questions to explore degree goals and interests.
          </p>
          <p className="survey-note">
            Responses are saved to the development database for this session.
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
                    setInterests(surveyData.interests)
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

      <Course_Selection />
    </div>
  )
}