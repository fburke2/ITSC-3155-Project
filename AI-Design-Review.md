# AI Design Review

## Overview

During Sprint 2, GitHub Copilot Agent Mode was used to assist in generating the application's persistence model, Prisma schema, database documentation, and UML diagrams. The generated artifacts provided a strong starting point for development, but the team reviewed the output to verify that it accurately reflected the application's requirements and data relationships.

## AI-Generated Design Decision Reviewed

### Generated Relationship Model

GitHub Copilot generated a data model that connected user survey responses to academic interests using a many-to-many relationship. The generated schema introduced the entities SurveyResponse, Interest, and a junction table named SurveyInterest.

The generated design allowed each survey response to be associated with multiple interests while also allowing the same interest to be referenced by multiple survey responses.

### Review and Validation

The team reviewed this design against the application's survey workflow and determined that the many-to-many structure accurately represented how users interact with the system. Users are expected to select multiple interests during the survey process, and individual interests must be reusable across many different survey submissions.

The team verified that:

- Each Interest is stored only once.
- Multiple survey responses can reference the same interest.
- Duplicate relationships are prevented through the composite primary key (surveyResponseId, interestId).
- Referential integrity is maintained through Prisma foreign\-key relationships and cascade deletion rules.

### Additional Refinement

The team also reviewed the relationship between User and CourseSelection. The generated schema enforced a unique constraint on userId, limiting each user to one active course selection. This decision was reviewed and retained because it matched the current application requirements and user workflow.

The team confirmed that the generated UML class diagram accurately reflected the final Prisma schema, including:

- User to SurveyResponse (one-to-many)
- SurveyResponse to Interest (many-to-many through SurveyInterest)
- User to CourseSelection (one-to-one)
- Course to CourseSelection (one-to-many)

## Result

After review, the generated schema was accepted with minor refinions and documentation updates. The final design provides a normalized database structure that reduces data duplication, preserves referential integrity, and supports future expansion of the Course Explorer application.

## Lessons Learned

This review demonstrated that AI-generated database models can significantly accelerate system design; however, generated relationships, constraints, and assumptions must still be validated against real application requirements.

GitHub Copilot successfully generated the initial persistence architecture, but human review remained necessary to verify business rules, cardinality constraints, and consistency between the Prisma schema, UML diagrams, and application functionality.

## Recommendation

Future AI-generated designs should continue to be reviewed for:

- Entity relationships and multiplicity
- Unique constraints and indexing
- Foreign-key behavior and cascade rules
- Alignment between UML diagrams and implementation
- Compatibility with evolving application requirements

AI is an effective development assistant, but final software design decisions should always be validated by the development team.

