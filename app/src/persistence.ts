export interface SurveyData {
  version: 1
  completed: true
  degreeGoal: string
  hasDegree?: boolean
  interests: string[]
  averageAnnualSalary?: string
  plannedDegree?: string
}

export interface CourseSelectionData {
  version: 1
  value: string
  name: string
  category: string
}

const SURVEY_STORAGE_KEY = "surveyPrototype.v1"
const COURSE_SELECTION_STORAGE_KEY = "courseSelection.v1"

function isSurveyData(value: unknown): value is SurveyData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<SurveyData>
  return (
    data.version === 1 &&
    data.completed === true &&
    typeof data.degreeGoal === "string" &&
    (data.hasDegree === undefined || typeof data.hasDegree === "boolean") &&
    Array.isArray(data.interests) &&
    data.interests.every((interest) => typeof interest === "string") &&
    (data.averageAnnualSalary === undefined ||
      typeof data.averageAnnualSalary === "string") &&
    (data.plannedDegree === undefined ||
      typeof data.plannedDegree === "string")
  )
}

function isCourseSelectionData(
  value: unknown
): value is CourseSelectionData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<CourseSelectionData>
  return (
    data.version === 1 &&
    typeof data.value === "string" &&
    typeof data.name === "string" &&
    typeof data.category === "string"
  )
}

function readStoredData<T>(
  key: string,
  isValid: (value: unknown) => value is T
): T | null {
  const stored = window.localStorage.getItem(key)
  if (!stored) return null

  const parsed: unknown = JSON.parse(stored)
  return isValid(parsed) ? parsed : null
}

export async function readPersistedSurvey(): Promise<SurveyData | null> {
  return readStoredData(SURVEY_STORAGE_KEY, isSurveyData)
}

export async function readPersistedCourseSelection(): Promise<CourseSelectionData | null> {
  return readStoredData(COURSE_SELECTION_STORAGE_KEY, isCourseSelectionData)
}

export async function saveSurvey(data: SurveyData): Promise<void> {
  window.localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(data))
}

export async function clearPersistedSurvey(): Promise<void> {
  window.localStorage.removeItem(SURVEY_STORAGE_KEY)
  window.localStorage.removeItem(COURSE_SELECTION_STORAGE_KEY)
}

export async function clearPersistedCourseSelection(): Promise<void> {
  window.localStorage.removeItem(COURSE_SELECTION_STORAGE_KEY)
}

export async function saveCourseSelection(
  data: CourseSelectionData
): Promise<void> {
  window.localStorage.setItem(COURSE_SELECTION_STORAGE_KEY, JSON.stringify(data))
}
