# Code Quality and Coding Style Guide

This document outlines the mandatory coding standards and quality guidelines for the SagasWeave project. Adherence to these rules is non-negotiable and will be enforced through code reviews and automated checks.

---

## 1. Naming Conventions

Clarity and consistency are key. Use descriptive names that reveal intent.

-   **Variables & Functions**: Use `camelCase`. 
    -   *Example*: `let userProfile = {};`
    -   *Example*: `function calculateTotalScore() {}`
-   **Classes & Components**: Use `PascalCase`.
    -   *Example*: `class UserSessionManager {}`
    -   *Example*: `function ProfileCard() {}`
-   **Constants**: Use `UPPER_SNAKE_CASE` for constants that are hard-coded and globally available.
    -   *Example*: `const API_BASE_URL = 'https://api.sagasweave.com';`
-   **Files**: Use `kebab-case` for all filenames except for components which should be `PascalCase`.
    -   *Example*: `user-authentication.service.ts`
    -   *Example*: `UserProfile.tsx`
-   **Avoid Generic Names**: Never use vague names like `data`, `item`, `handle`, or `temp`. Be specific.

---

## 2. Code Formatting & Style

We use **Prettier** for automated code formatting. All code must be formatted according to the project's `.prettierrc` configuration before being committed.

-   **Indentation**: 4 spaces.
-   **Line Length**: Maximum 120 characters.
-   **Semicolons**: Always use semicolons.
-   **Quotes**: Use single quotes (`'`) for strings unless double quotes (`"`) are required (e.g., in JSON).

---

## 3. Comments and Documentation

Code should be as self-documenting as possible, but comments are crucial for explaining the *why*, not the *what*.

-   **TSDoc for Public APIs**: All public functions, classes, and methods MUST have TSDoc comments.
-   **Complex Logic**: Add comments to explain complex algorithms, business logic, or workarounds.
-   **NO Commented-Out Code**: Dead code should be deleted, not commented out. Use version control to retrieve old code if needed.

---

## 4. Error Handling

Robust error handling is critical for a stable application.

-   **Be Specific**: Catch specific errors instead of generic `Error` objects where possible.
-   **Descriptive Messages**: Error messages should be clear, concise, and provide context to help with debugging.
-   **No `console.log` in Production Code**: Use a dedicated logging library (to be defined in the tech stack). `console.log` is acceptable for local debugging but must be removed before merging to the main branch.

---

## 5. Best Practices

-   **KISS (Keep It Simple, Stupid)**: Write the simplest code that works. Avoid premature optimization and over-engineering.
-   **DRY (Don't Repeat Yourself)**: If you write the same code three times, refactor it into a reusable function or component.
-   **Immutability**: Prefer immutable data structures. Do not mutate objects or arrays directly; create new ones with the updated values.
-   **Pure Functions**: Create pure functions whenever possible. They are easier to test and reason about.