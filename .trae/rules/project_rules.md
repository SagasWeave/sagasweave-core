# SagasWeave Project Rules for AI-Driven Development

This document outlines the core principles and mandatory rules for any AI assistant involved in the development of the SagasWeave project. These rules ensure consistency, quality, and alignment with the project's vision.

--- 

## 1. The Golden Rule: Context is King

**NEVER** write or modify code without first understanding the existing context. This means you **MUST**:

1.  **Read Before You Write**: Always read the contents of a file before you suggest changes to it. Avoid code duplication at all costs.
2.  **Analyze Existing Patterns**: Study the existing code, architecture, and patterns in the module you are working on. New code must follow the established conventions.
3.  **Ask for Clarification**: If a task is ambiguous or you lack sufficient context, you **MUST** ask for clarification before proceeding. Do not make assumptions.

---

## 2. Core Informational Sources

When performing any task, you **MUST** base your work on the information contained within the following key documents. They are your single source of truth for architecture, tech stack, and project structure.

| File | Purpose |
| --- | --- |
| `docs/project/SagasWeave-Project-Overview.md` | The high-level vision, architectural principles, and UX/UI philosophy. |
| `docs/project/projectstructuredefinition.md` | The **mandatory** folder and file structure. All new files and code must adhere to this definition. |
| `docs/techstack/01-techstack-toolbox.md` | The official list of approved technologies, libraries, and tools. Do not introduce new dependencies without approval. |
| `docs/contract/contract-rules.md` | Defines the rules and templates for creating sprint contracts. |

---

## 3. Sprint & Contract Workflow

Your primary function is to assist in executing development sprints by generating and fulfilling contracts. The process is as follows:

1.  **Receive a Sprint Assignment**: You will be given a task to build a specific sprint (e.g., "Build Sprint 3"). This task will be guided by a `contract-assign.md` document.
2.  **Consult the Sprint Definition**: Your first step is to read the corresponding `sprintX.md` file (e.g., `sprint3.md`). This file contains the specific user stories and tasks for the sprint.
3.  **Generate the Sprint Contract**: Using the information from the core documents and the specific sprint definition, you will generate a `sprintX-contract.md` and an `expectations-sprintX.md` file.
4.  **Execute the Contract**: You will then implement the tasks defined in the contract, following all rules in this document.

---

## 4. Code Contribution & Quality Standards

-   **No Redundant Code**: Never add code that already exists. If a utility function or component is needed, first search the existing codebase to see if one already exists.
-   **Adhere to the Tech Stack**: Only use libraries and frameworks defined in `01-techstack-toolbox.md`.
-   **Follow the File Structure**: All new files **MUST** be placed according to the layout in `projectstructuredefinition.md`.
-   **Keep It Simple (KISS)**: Write clean, simple, and maintainable code. Avoid over-engineering.
-   **Separation of Concerns**: Strictly separate logic, styling, and components into their own files as per the project structure.
-   **No Inline Styles**: **NEVER** use inline `style` attributes in HTML/JSX. All styling must be done via external CSS stylesheets.
-   **Unique Naming**: Use descriptive and unique names for variables, functions, and components to avoid conflicts and improve readability.
-   **Test Integration**: When adding new features, consider how they will be tested. Place test files in the appropriate `tests/` directory as defined in the project structure.