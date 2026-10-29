import {
    type CSSProperties,
    type FocusEvent,
    type KeyboardEvent,
    startTransition,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"

interface CourseOption {
    name: string
    category: string
    value: string
}

interface CourseSelectionStoredData {
    version: number
    value: string
    name: string
    category: string
}

interface SurveyPrototypeStoredData {
    version: number
    completed: boolean
    degreeGoal: string
    interests: string[]
}

interface SurveyPrototypeUpdatedDetail {
    data?: SurveyPrototypeStoredData | null
}

interface Course_SelectionProps {
    options?: CourseOption[] | null
    categoryLabel?: string
    allCategoriesLabel?: string
    searchLabel?: string
    searchPlaceholder?: string
    interestsHeading?: string
    recommendationsHeading?: string
    selectedLabel?: string
    noResultsLabel?: string
    selectPromptLabel?: string
    accentColor?: string
    surfaceColor?: string
    textColor?: string
    borderColor?: string
    radius?: string
    font?: {
        fontSize?: string | number
        lineHeight?: string | number
        letterSpacing?: string | number
        textAlign?: "left" | "center" | "right"
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        fontFamily?: string
    }
    onChange?: (value: string) => void
    style?: CSSProperties
}

const SURVEY_STORAGE_VERSION = 1
const SURVEY_STORAGE_KEY = `surveyPrototype.v${SURVEY_STORAGE_VERSION}`
const COURSE_SELECTION_STORAGE_VERSION = 1
const COURSE_SELECTION_STORAGE_KEY = `courseSelection.v${COURSE_SELECTION_STORAGE_VERSION}`

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hasTokenMatch(haystack: string, token: string): boolean {
    const normalizedToken = normalizeText(token)
    if (!normalizedToken) return false
    const pattern = `\\b${escapeRegex(normalizedToken).replace(/\s+/g, "\\s+")}\\b`
    return new RegExp(pattern, "i").test(haystack)
}

function isValidSurveyData(value: unknown): value is SurveyPrototypeStoredData {
    if (!value || typeof value !== "object") return false
    const data = value as Partial<SurveyPrototypeStoredData>
    return (
        data.version === SURVEY_STORAGE_VERSION &&
        data.completed === true &&
        typeof data.degreeGoal === "string" &&
        Array.isArray(data.interests) &&
        data.interests.every((item) => typeof item === "string")
    )
}

export default function Course_Selection(props: Course_SelectionProps) {
    const {
        options = [
            {
                name: "Game Development Fundamentals",
                category: "Development",
                value: "game-dev-fundamentals",
            },
            {
                name: "Modern Web Development",
                category: "Development",
                value: "web-dev-modern",
            },
            {
                name: "Software Engineering Foundations",
                category: "Development",
                value: "software-eng-foundations",
            },
            {
                name: "General Programming Basics",
                category: "Development",
                value: "general-programming-basics",
            },
            {
                name: "Science Communication Essentials",
                category: "Science",
                value: "science-communication",
            },
            {
                name: "English Literature Survey",
                category: "English",
                value: "english-literature-survey",
            },
            {
                name: "Teaching & Education Methods",
                category: "Education",
                value: "teaching-education-methods",
            },
        ],
        categoryLabel = "Category",
        allCategoriesLabel = "All categories",
        searchLabel = "Search Course",
        searchPlaceholder = "Type course name...",
        interestsHeading = "Your interests",
        recommendationsHeading = "Recommended for you",
        selectedLabel = "Selected:",
        noResultsLabel = "No matching courses",
        selectPromptLabel = "No course selected",
        accentColor = "#000000",
        surfaceColor = "#FFFFFF",
        textColor = "#000000",
        borderColor = "#EEEEEE",
        radius = "12px",
        font = {
            fontSize: "15px",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
            fontWeight: 500,
        },
        onChange,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)
    const inputId = useId()
    const listboxId = useId()

    const [category, setCategory] = useState<string>("all")
    const [query, setQuery] = useState<string>("")
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
    const [selectedValue, setSelectedValue] = useState<string>("")
    const [surveyData, setSurveyData] =
        useState<SurveyPrototypeStoredData | null>(null)
    const previousSelectedValueRef = useRef<string>("")

    const normalizedOptions = useMemo(() => {
        const sourceOptions = Array.isArray(options) ? options : []
        const seenValues = new Set<string>()
        return sourceOptions
            .map((option) => ({
                name: String(option?.name ?? "").trim(),
                category: String(option?.category ?? "").trim(),
                value: String(option?.value ?? "").trim(),
            }))
            .filter((option) => {
                if (!option.name || !option.category || !option.value)
                    return false
                if (seenValues.has(option.value)) return false
                seenValues.add(option.value)
                return true
            })
    }, [options])

    const categories = useMemo(() => {
        const unique = new Set(
            normalizedOptions.map((option) => option.category)
        )
        return Array.from(unique)
    }, [normalizedOptions])

    const recommendationKeywords = useMemo<Record<string, string[]>>(
        () => ({
            "game development": ["game", "game development"],
            "web development": ["web", "web development"],
            "software development": [
                "software",
                "software development",
                "engineering",
            ],
            "general programming": [
                "programming",
                "coding",
                "computer science",
            ],
            science: ["science"],
            english: ["english", "literature"],
            teaching: ["teaching", "education"],
        }),
        []
    )

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        return normalizedOptions.filter((option) => {
            const matchesCategory =
                category === "all" || option.category === category
            const matchesQuery =
                normalizedQuery.length === 0 ||
                option.name.toLowerCase().includes(normalizedQuery)
            return matchesCategory && matchesQuery
        })
    }, [category, normalizedOptions, query])

    const selectedOption = useMemo(() => {
        return normalizedOptions.find(
            (option) => option.value === selectedValue
        )
    }, [normalizedOptions, selectedValue])

    const activeInterests = useMemo(() => {
        if (!surveyData?.completed) return []
        return surveyData.interests
            .map((interest) => String(interest ?? "").trim())
            .filter(Boolean)
    }, [surveyData])

    const recommendedOptions = useMemo(() => {
        if (activeInterests.length === 0) return []

        const interestTokens = new Set<string>()
        for (const interest of activeInterests) {
            const key = normalizeText(interest)
            const mappedTokens = recommendationKeywords[key] || []
            for (const token of mappedTokens) {
                interestTokens.add(normalizeText(token))
            }
        }
        if (interestTokens.size === 0) return []

        const primaryMatches = normalizedOptions.filter((option) => {
            const optionText = normalizeText(
                `${option.name} ${option.category}`
            )
            for (const token of interestTokens) {
                if (hasTokenMatch(optionText, token)) return true
            }
            return false
        })

        const normalizedQuery = query.trim().toLowerCase()
        return primaryMatches.filter((option) => {
            const matchesCategory =
                category === "all" || option.category === category
            const matchesQuery =
                normalizedQuery.length === 0 ||
                option.name.toLowerCase().includes(normalizedQuery)
            return matchesCategory && matchesQuery
        })
    }, [
        activeInterests,
        category,
        normalizedOptions,
        query,
        recommendationKeywords,
    ])

    const recommendationsAreFiltered =
        category !== "all" || query.trim().length > 0

    useEffect(() => {
        if (typeof window === "undefined") return

        const readFromStorage = (): SurveyPrototypeStoredData | null => {
            try {
                const raw = window.localStorage.getItem(SURVEY_STORAGE_KEY)
                if (!raw) return null
                const parsed: unknown = JSON.parse(raw)
                return isValidSurveyData(parsed) ? parsed : null
            } catch (_error) {
                return null
            }
        }

        startTransition(() => {
            setSurveyData(readFromStorage())
        })

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== SURVEY_STORAGE_KEY) return
            if (!event.newValue) {
                startTransition(() => setSurveyData(null))
                return
            }
            try {
                const parsed: unknown = JSON.parse(event.newValue)
                startTransition(() =>
                    setSurveyData(isValidSurveyData(parsed) ? parsed : null)
                )
            } catch (_error) {
                startTransition(() => setSurveyData(null))
            }
        }

        const handlePrototypeEvent = (event: Event) => {
            const custom = event as CustomEvent<SurveyPrototypeUpdatedDetail>
            const payload = custom.detail?.data
            if (payload === null) {
                startTransition(() => {
                    setSurveyData(null)
                })
                return
            }
            if (payload) {
                startTransition(() => {
                    setSurveyData(isValidSurveyData(payload) ? payload : null)
                })
                return
            }
            startTransition(() => {
                setSurveyData(readFromStorage())
            })
        }

        window.addEventListener("storage", handleStorage)
        window.addEventListener(
            "surveyPrototypeUpdated",
            handlePrototypeEvent as EventListener
        )

        return () => {
            window.removeEventListener("storage", handleStorage)
            window.removeEventListener(
                "surveyPrototypeUpdated",
                handlePrototypeEvent as EventListener
            )
        }
    }, [])

    useEffect(() => {
        if (!selectedValue) return
        const stillVisible = filteredOptions.some(
            (option) => option.value === selectedValue
        )
        if (!stillVisible) {
            startTransition(() => {
                setSelectedValue("")
            })
            onChange?.("")
        }
    }, [filteredOptions, onChange, selectedValue])

    useEffect(() => {
        if (!isOpen) return
        if (filteredOptions.length === 0) {
            startTransition(() => setHighlightedIndex(-1))
            return
        }
        startTransition(() => {
            setHighlightedIndex((prev) => {
                if (prev < 0 || prev >= filteredOptions.length) return 0
                return prev
            })
        })
    }, [filteredOptions, isOpen])

    const handleSelect = useCallback(
        (option: CourseOption, syncCategory = false) => {
            startTransition(() => {
                if (syncCategory) {
                    setCategory(option.category)
                }
                setSelectedValue(option.value)
                setQuery(option.name)
                setIsOpen(false)
                setHighlightedIndex(-1)
            })
            if (onChange) onChange(option.value)
        },
        [onChange]
    )

    const publishCourseSelection = useCallback(
        (option: CourseOption | null) => {
            if (typeof window === "undefined") return
            if (!option) {
                try {
                    window.localStorage.removeItem(COURSE_SELECTION_STORAGE_KEY)
                } catch (_error) {}
                window.dispatchEvent(
                    new CustomEvent("courseSelectionUpdated", {
                        detail: { data: null },
                    })
                )
                return
            }

            const payload: CourseSelectionStoredData = {
                version: COURSE_SELECTION_STORAGE_VERSION,
                value: option.value,
                name: option.name,
                category: option.category,
            }
            try {
                window.localStorage.setItem(
                    COURSE_SELECTION_STORAGE_KEY,
                    JSON.stringify(payload)
                )
            } catch (_error) {}
            window.dispatchEvent(
                new CustomEvent("courseSelectionUpdated", {
                    detail: { data: payload },
                })
            )
        },
        []
    )

    useEffect(() => {
        const previous = previousSelectedValueRef.current
        if (!previous && !selectedValue) return

        if (!selectedValue) {
            publishCourseSelection(null)
            previousSelectedValueRef.current = selectedValue
            return
        }

        if (selectedOption) {
            publishCourseSelection(selectedOption)
        }
        previousSelectedValueRef.current = selectedValue
    }, [publishCourseSelection, selectedOption, selectedValue])

    const handleInputKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "ArrowDown") {
                event.preventDefault()
                if (!isOpen) {
                    startTransition(() => {
                        setIsOpen(true)
                        setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
                    })
                    return
                }
                startTransition(() => {
                    setHighlightedIndex((prev) => {
                        if (filteredOptions.length === 0) return -1
                        const next = prev + 1
                        return next >= filteredOptions.length ? 0 : next
                    })
                })
                return
            }

            if (event.key === "ArrowUp") {
                event.preventDefault()
                if (!isOpen) {
                    startTransition(() => {
                        setIsOpen(true)
                        setHighlightedIndex(
                            filteredOptions.length > 0
                                ? filteredOptions.length - 1
                                : -1
                        )
                    })
                    return
                }
                startTransition(() => {
                    setHighlightedIndex((prev) => {
                        if (filteredOptions.length === 0) return -1
                        const next = prev - 1
                        return next < 0 ? filteredOptions.length - 1 : next
                    })
                })
                return
            }

            if (event.key === "Enter") {
                if (
                    isOpen &&
                    highlightedIndex >= 0 &&
                    filteredOptions[highlightedIndex]
                ) {
                    event.preventDefault()
                    handleSelect(filteredOptions[highlightedIndex])
                }
                return
            }

            if (event.key === "Escape") {
                if (isOpen) {
                    event.preventDefault()
                    startTransition(() => {
                        setIsOpen(false)
                        setHighlightedIndex(-1)
                    })
                }
            }
        },
        [filteredOptions, handleSelect, highlightedIndex, isOpen]
    )

    const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
        const nextTarget = event.relatedTarget as Node | null
        if (
            rootRef.current &&
            nextTarget &&
            rootRef.current.contains(nextTarget)
        )
            return
        startTransition(() => {
            setIsOpen(false)
            setHighlightedIndex(-1)
        })
    }, [])

    const accent = accentColor || "#000000"

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: surfaceColor,
                border: `1px solid ${borderColor}`,
                borderRadius: radius,
                padding: 12,
                color: textColor,
                fontFamily: font?.fontFamily || "Inter, sans-serif",
                fontSize: font?.fontSize,
                lineHeight: font?.lineHeight,
                letterSpacing: font?.letterSpacing,
                textAlign: font?.textAlign,
                fontWeight: font?.fontWeight,
                fontStyle: font?.fontStyle,
                boxSizing: "border-box",
                ...style,
            }}
            onBlur={handleBlur}
        >
            <div
                style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: `calc(${radius} - 4px)`,
                    padding: 10,
                    display: "grid",
                    gap: 10,
                    background: surfaceColor,
                }}
            >
                <div style={{ display: "grid", gap: 6 }}>
                    <strong>{interestsHeading}</strong>
                    {activeInterests.length > 0 ? (
                        <>
                            {surveyData?.degreeGoal ? (
                                <span style={{ opacity: 0.72 }}>
                                    Degree goal: {surveyData.degreeGoal}
                                </span>
                            ) : null}
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                {activeInterests.map((interest) => (
                                    <span
                                        key={interest}
                                        style={{
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: 999,
                                            padding: "4px 8px",
                                            background:
                                                "rgba(127,127,127,0.12)",
                                            fontSize: "0.9em",
                                        }}
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <span style={{ opacity: 0.72 }}>
                            Complete the survey to get personalized
                            recommendations.
                        </span>
                    )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                    <strong>
                        {recommendationsHeading}
                        {recommendationsAreFiltered
                            ? " (within current filters)"
                            : ""}
                    </strong>
                    {activeInterests.length === 0 ? (
                        <span style={{ opacity: 0.72 }}>
                            Recommendations will appear after the survey is
                            completed.
                        </span>
                    ) : recommendedOptions.length === 0 ? (
                        <span style={{ opacity: 0.72 }}>
                            No recommendations match your current filters yet.
                        </span>
                    ) : (
                        <div style={{ display: "grid", gap: 6 }}>
                            {recommendedOptions.map((option) => (
                                <button
                                    key={`recommended-${option.value}`}
                                    type="button"
                                    onClick={() => handleSelect(option, true)}
                                    style={{
                                        width: "100%",
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: `calc(${radius} - 6px)`,
                                        padding: "8px 10px",
                                        background:
                                            selectedValue === option.value
                                                ? "rgba(127,127,127,0.16)"
                                                : surfaceColor,
                                        color: textColor,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        font: "inherit",
                                    }}
                                >
                                    <span
                                        style={{
                                            minWidth: 0,
                                            whiteSpace: "normal",
                                        }}
                                    >
                                        {option.name}
                                    </span>
                                    <span style={{ opacity: 0.68 }}>
                                        {option.category}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <label htmlFor={`${inputId}-category`} style={{ fontWeight: 600 }}>
                {categoryLabel}
            </label>
            <select
                id={`${inputId}-category`}
                value={category}
                onChange={(event) => {
                    const next = event.target.value
                    startTransition(() => {
                        setCategory(next)
                        setQuery("")
                        setIsOpen(true)
                        setHighlightedIndex(-1)
                    })
                }}
                style={{
                    width: "100%",
                    border: `1px solid ${borderColor}`,
                    borderRadius: `calc(${radius} - 4px)`,
                    padding: "8px 10px",
                    background: surfaceColor,
                    color: textColor,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    letterSpacing: "inherit",
                    fontWeight: "inherit",
                }}
            >
                <option value="all">{allCategoriesLabel}</option>
                {categories.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>

            <label htmlFor={inputId} style={{ fontWeight: 600 }}>
                {searchLabel}
            </label>
            <input
                id={inputId}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                    isOpen && highlightedIndex >= 0
                        ? `${listboxId}-option-${highlightedIndex}`
                        : undefined
                }
                value={query}
                placeholder={searchPlaceholder}
                onFocus={() => {
                    startTransition(() => setIsOpen(true))
                }}
                onChange={(event) => {
                    const nextValue = event.target.value
                    startTransition(() => {
                        setQuery(nextValue)
                        setIsOpen(true)
                    })
                }}
                onKeyDown={handleInputKeyDown}
                style={{
                    width: "100%",
                    border: `1px solid ${borderColor}`,
                    borderRadius: `calc(${radius} - 4px)`,
                    padding: "8px 10px",
                    color: textColor,
                    background: surfaceColor,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    letterSpacing: "inherit",
                    fontWeight: "inherit",
                }}
            />

            {isOpen && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Course options"
                    style={{
                        margin: 0,
                        padding: 4,
                        listStyle: "none",
                        border: `1px solid ${borderColor}`,
                        borderRadius: `calc(${radius} - 4px)`,
                        background: surfaceColor,
                        maxHeight: 180,
                        overflowY: "auto",
                        boxSizing: "border-box",
                    }}
                >
                    {filteredOptions.length === 0 && (
                        <li
                            style={{
                                padding: "8px 10px",
                                color: textColor,
                                opacity: 0.7,
                            }}
                        >
                            {noResultsLabel}
                        </li>
                    )}
                    {filteredOptions.map((option, index) => {
                        const isHighlighted = index === highlightedIndex
                        const isSelected = selectedValue === option.value
                        return (
                            <li
                                id={`${listboxId}-option-${index}`}
                                key={option.value}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={-1}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: `calc(${radius} - 8px)`,
                                    background:
                                        isHighlighted || isSelected
                                            ? "rgba(127, 127, 127, 0.16)"
                                            : "transparent",
                                    borderLeft: `2px solid ${isHighlighted || isSelected ? accent : "transparent"}`,
                                    color: textColor,
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    boxSizing: "border-box",
                                }}
                            >
                                <span>{option.name}</span>
                                <span style={{ opacity: 0.65 }}>
                                    {option.category}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}

            <div
                aria-live="polite"
                style={{
                    borderTop: `1px solid ${borderColor}`,
                    paddingTop: 8,
                    color: textColor,
                }}
            >
                <strong>{selectedLabel}</strong>{" "}
                {selectedOption ? selectedOption.name : selectPromptLabel}
            </div>
        </div>
    )
}
