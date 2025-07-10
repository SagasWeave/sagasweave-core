# AI Contract Rules and Definition

## 1. Introduction

An AI Contract is a formal, machine-readable document (typically JSON) that defines a specific, isolated, and completable task for an AI agent. Its primary purpose is to provide a clear, unambiguous, and safe set of instructions that allows the AI to execute complex development tasks efficiently without deviating from the intended scope.

The contract acts as a secure sandbox, ensuring that the AI's powerful capabilities are harnessed productively while minimizing risks like code-spaghetti, scope creep, or unintended side effects.

## 2. Core Principles

A contract MUST adhere to the following principles:

-   **Isolated:** The task must be self-contained and have minimal dependencies on other ongoing tasks.
-   **Clear:** The objectives, steps, and success criteria must be unambiguous.
-   **Constrained:** The scope is strictly limited to what is defined in the contract. The AI is not permitted to explore or implement anything outside of these boundaries.
-   **Completable:** The task must have a definite end-state, which can be verified through automated checks.

## 3. Key Components of a Contract

Every AI contract MUST include the following components:

### 3.1. Task Definition & Scope
-   **Objective:** A clear, concise description of the task's purpose and the value it delivers.
-   **Scope Boundaries:** Explicit statements about what is **in scope** and, just as importantly, what is **out of scope**. This prevents the AI from making assumptions.

### 3.2. Restrictive Instructions
-   **Directive Language:** The contract MUST use firm, commanding language. Use directives like `ALWAYS`, `NEVER`, `MUST`, `MUST NOT` to establish non-negotiable rules.
-   **Example:** `"NEVER use inline styling; ALWAYS use the dedicated stylesheet specified in `stylePath`."`

### 3.3. Definition of Completion (DoD)
-   **Success Criteria:** A clear, verifiable list of conditions that must be met for the task to be considered complete.
-   This MUST be binary (true/false) and machine-verifiable.

### 3.4. Mandatory, Automated Testing
-   **Test Suite:** Every contract that involves code generation or modification MUST include a set of tests (e.g., unit, integration, linting).
-   **100% Pass Rate:** The contract is only fulfilled when **ALL** tests pass without any errors or warnings. There is no partial credit.

BUN
PUPPETEER
GITHUB LINT/ERRORS

### 3.5. Input/Output Specification
-   **Inputs:** A clear definition of all required inputs, including file paths, data structures, or environment variables.
-   **Outputs:** A precise description of the expected artifacts to be produced, such as new files, modified code, or API responses.

### 3.6. Sequential Task Execution
-   **Step-by-Step Logic:** The contract should lay out the required tasks in a strict sequence. The AI must follow this sequence without deviation.
-   **Example:** `1. Create file. 2. Add imports. 3. Implement function. 4. Write tests. 5. Run tests. 6. On success, report completion.`

### 3.7. Idempotency
-   **Repeatable Execution:** Where possible, tasks should be designed to be idempotent. This means that running the same contract multiple times should result in the same end-state without causing errors. This is crucial for recovery from failed runs.

### 3.8. Error Handling Protocol
-   **Failure Definition:** The contract must specify what constitutes a failure (e.g., test failure, compilation error, timeout).
-   **Reporting:** It must define how the AI should report the failure, including providing logs, error messages, and the state at the time of failure.