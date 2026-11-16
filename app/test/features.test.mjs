import assert from "node:assert/strict"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { after, afterEach, before, describe, it } from "mocha"
import { createServer } from "vite"

const COURSE_SELECTION_KEY = "courseSelection.v1"
let React
let App
let ClassInformation
let CourseInformation
let Course_Selection
let Survey
let vite

before(async () => {
  vite = await createServer({
    configFile: "./vite.config.ts",
    server: { middlewareMode: true },
    appType: "custom",
  })
  const [reactModule, appModule, classInfoModule, courseInfoModule, courseSelectionModule, surveyModule] =
    await Promise.all([
      import("react"),
      vite.ssrLoadModule("/src/App.tsx"),
      vite.ssrLoadModule("/../ClassInformation.tsx"),
      vite.ssrLoadModule("/../CourseInformation.tsx"),
      vite.ssrLoadModule("/../Course_Selection.tsx"),
      vite.ssrLoadModule("/../Survey.tsx"),
    ])
  React = reactModule.default
  App = appModule.default
  ClassInformation = classInfoModule.default
  CourseInformation = courseInfoModule.default
  Course_Selection = courseSelectionModule.default
  Survey = surveyModule.default
})

after(async () => {
  await vite?.close()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.history.replaceState(null, "", "/")
})

function selectOption(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function chooseInterest(label) {
  fireEvent.click(screen.getByLabelText(label))
}

describe("Survey", () => {
  it("shows a salary range only for users with a degree and saves the answers", async () => {
    render(React.createElement(Survey))
    await act(async () => {})

    selectOption("What is your degree goal?", "Choose or refine my major")
    fireEvent.click(screen.getByLabelText("Yes"))
    chooseInterest("Software development")

    const salarySelect = screen.getByLabelText(
      "What is your average annual salary range?"
    )
    assert.ok(salarySelect)
    selectOption("What is your average annual salary range?", "$75,000-$99,999")

    fireEvent.click(
      screen.getByRole("button", { name: "Show my recommendations" })
    )

    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem("surveyPrototype.v1") ?? "null"
      )
      assert.equal(saved.hasDegree, true)
      assert.equal(saved.averageAnnualSalary, "$75,000-$99,999")
      assert.equal(saved.plannedDegree, undefined)
    })
    assert.ok(await screen.findByText("Survey complete"))

    cleanup()
    render(React.createElement(Survey))
    assert.ok(await screen.findByText("Survey complete"))
    assert.ok(screen.getByText("Average annual salary: $75,000-$99,999"))
  })

  it("asks graduate planners about degree type without asking salary when they have no degree", async () => {
    render(React.createElement(Survey))
    await act(async () => {})

    selectOption("What is your degree goal?", "Graduate planning")
    fireEvent.click(screen.getByLabelText("No"))
    chooseInterest("Software development")

    assert.equal(
      screen.queryByLabelText("What is your average annual salary range?"),
      null
    )
    selectOption(
      "What type of degree are you pursuing or planning?",
      "Master's degree"
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Show my recommendations" })
    )

    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem("surveyPrototype.v1") ?? "null"
      )
      assert.equal(saved.hasDegree, false)
      assert.equal(saved.averageAnnualSalary, undefined)
      assert.equal(saved.plannedDegree, "Master's degree")
    })
    assert.ok(await screen.findByText("Survey complete"))
  })

  it("shows degree-type follow-up for certification interests", async () => {
    render(React.createElement(Survey))
    await act(async () => {})

    selectOption("What is your degree goal?", "Explore degree paths and career options")
    fireEvent.click(screen.getByLabelText("No"))
    chooseInterest("Certifications")

    assert.ok(
      screen.getByLabelText("What type of degree are you pursuing or planning?")
    )
    assert.equal(
      screen.queryByLabelText("What is your average annual salary range?"),
      null
    )
  })

  it("clears saved survey and course selections when reset", async () => {
    window.localStorage.setItem(
      "surveyPrototype.v1",
      JSON.stringify({
        version: 1,
        completed: true,
        degreeGoal: "Explore degree paths and career options",
        hasDegree: false,
        interests: ["game development"],
      })
    )
    window.localStorage.setItem(
      COURSE_SELECTION_KEY,
      JSON.stringify({
        version: 1,
        value: "game-dev-fundamentals",
        name: "Game Development Fundamentals",
        category: "Development",
      })
    )
    render(React.createElement(Survey))
    await screen.findByText("Survey complete")

    fireEvent.click(screen.getByRole("button", { name: "Reset" }))

    await waitFor(() => {
      assert.equal(window.localStorage.getItem("surveyPrototype.v1"), null)
      assert.equal(window.localStorage.getItem(COURSE_SELECTION_KEY), null)
    })
    assert.ok(
      screen.getByRole("button", { name: "Show my recommendations" })
    )
  })
})

describe("Course Selection", () => {
  it("filters courses and restores a selected course from browser storage", async () => {
    render(React.createElement(Course_Selection))

    fireEvent.change(screen.getByPlaceholderText("Type course name..."), {
      target: { value: "web" },
    })
    fireEvent.click(
      screen.getByRole("option", { name: /Modern Web Development/ })
    )

    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem(COURSE_SELECTION_KEY) ?? "null"
      )
      assert.equal(saved.value, "web-dev-modern")
    })

    cleanup()
    render(React.createElement(Course_Selection))

    await waitFor(() => {
      assert.match(
        screen.getByText("Selected:").parentElement?.textContent ?? "",
        /Modern Web Development/
      )
    })
    assert.match(
      screen.getByText(/Your selected course is saved in this browser/).textContent ??
        "",
      /restored when you return/
    )
  })

  it("filters by category and supports keyboard course selection", async () => {
    render(React.createElement(Course_Selection))

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "Science" },
    })
    const search = screen.getByPlaceholderText("Type course name...")
    fireEvent.focus(search)
    fireEvent.keyDown(search, { key: "ArrowDown" })
    fireEvent.keyDown(search, { key: "Enter" })

    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem(COURSE_SELECTION_KEY) ?? "null"
      )
      assert.equal(saved.value, "science-communication")
    })
  })
})

describe("Course Information", () => {
  it("shows prominent sample salary, credits, semesters, and class information link", () => {
    window.localStorage.setItem(
      COURSE_SELECTION_KEY,
      JSON.stringify({
        version: 1,
        value: "game-dev-fundamentals",
        name: "Game Development Fundamentals",
        category: "Development",
      })
    )
    render(React.createElement(CourseInformation))

    assert.ok(screen.getByText("Game Development Fundamentals"))
    const metricLabels = Array.from(
      document.querySelectorAll(".course-info-metric span"),
      (label) => label.textContent
    )
    assert.deepEqual(metricLabels, [
      "Sample annual salary",
      "Credits to complete",
      "Average semesters",
    ])
    assert.ok(screen.getByText("$76,000"))
    assert.ok(screen.getByText("Sample: 120"))
    assert.ok(screen.getByText("Sample: 8"))
    assert.equal(
      screen.getByRole("link", { name: "View Class Information" }).getAttribute(
        "href"
      ),
      "#class-information"
    )
  })

  it("identifies metrics that are not available for a selected course", () => {
    window.localStorage.setItem(
      COURSE_SELECTION_KEY,
      JSON.stringify({
        version: 1,
        value: "design-intro",
        name: "Intro to Product Design",
        category: "Design",
      })
    )
    render(React.createElement(CourseInformation))

    assert.equal(screen.getAllByText("Not provided").length, 3)
  })
})

describe("Class Information", () => {
  it("shows selected course details and prerequisites", () => {
    window.localStorage.setItem(
      COURSE_SELECTION_KEY,
      JSON.stringify({
        version: 1,
        value: "web-dev-modern",
        name: "Modern Web Development",
        category: "Development",
      })
    )
    render(React.createElement(ClassInformation))

    assert.ok(screen.getByRole("heading", { name: "Class information" }))
    assert.ok(screen.getByRole("heading", { name: "Modern Web Development" }))
    assert.ok(screen.getByText("ITSC 3155"))
    assert.ok(screen.getByText("Accessible interfaces"))
    assert.ok(screen.getByText("General Programming Basics"))
  })

  it("shows a prompt to select a course when there is no saved selection", () => {
    render(React.createElement(ClassInformation))

    assert.ok(
      screen.getByRole("heading", {
        name: "Select a course to see its information",
      })
    )
    assert.equal(
      screen.getByRole("link", { name: "Go to Course Selection" }).getAttribute(
        "href"
      ),
      "#courses"
    )
  })
})

describe("Application navigation", () => {
  it("opens Course Selection after the survey is submitted", async () => {
    window.location.hash = "#survey"
    render(React.createElement(App))

    selectOption("What is your degree goal?", "Explore degree paths and career options")
    fireEvent.click(screen.getByLabelText("No"))
    chooseInterest("Game development")
    fireEvent.click(
      screen.getByRole("button", { name: "Show my recommendations" })
    )

    await waitFor(() => {
      assert.ok(screen.getByRole("heading", { name: "Explore courses" }))
    })
    assert.ok(screen.getByText("Recommended for you"))
    assert.ok(await screen.findByText("Game Development Fundamentals"))
  })
})
