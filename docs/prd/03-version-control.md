# PRD 03: Version Control Integration

**Version:** 0.1
**Status:** Draft

## 1. Introduction

This document outlines the Product Requirements for integrating version control systems (VCS), primarily Git and cloud services like GitHub, into the SagasWeave platform. The goal is to provide seamless, integrated version control to users, enabling robust project management, collaboration, and history tracking directly within the application.

## 2. Core User Stories

-   **As a writer,** I want to connect a SagasWeave project to a new or existing GitHub repository so that my work is securely backed up and versioned.
-   **As a writer,** I want to be guided through the process of setting up version control when I create a new project, so I don't have to do it manually later.
-   **As a writer,** I want to commit my changes with a message directly from the editor so I can save milestones in my work.
-   **As a collaborator,** I want to see the history of changes for a project so I can understand its evolution.
-   **As a collaborator,** I want to work on different branches to experiment with story ideas without affecting the main storyline.
-   **As a project owner,** I want to manage pull requests from collaborators within SagasWeave to review and merge changes.

## 3. Key Features

### 3.1. Project Creation Wizard Integration

-   When creating a new project, the user should be presented with an optional step to configure version control.
-   **Options:**
    1.  **Create a new GitHub repository:** The application will create a new public or private repository on the user's linked GitHub account.
    2.  **Link to an existing GitHub repository:** The user can provide the URL of an existing repository to connect the project to.
    3.  **Skip:** The user can choose to manage the project locally without cloud-based version control for now.

### 3.2. Core Git Operations

-   **Commit:** A dedicated UI panel will allow users to stage changes and commit them with a message.
-   **Push/Pull:** Simple one-click buttons to push local commits to the remote repository and pull updates.
-   **History/Log:** A visual log viewer to see the commit history of the current branch.

### 3.3. Branching and Merging

-   **Branch Management:** Users should be able to create, switch between, and delete branches from a simple UI.
-   **Pull Requests:** A dedicated view for creating, reviewing, and merging pull requests. This is a key feature for collaboration.

### 3.4. Authentication

-   The application must securely handle authentication with GitHub (or other services) using OAuth.
-   User tokens must be stored securely.

## 4. Technical Considerations

-   **Backend:** The backend (Node.js on a Linux VPS) will handle the server-side logic for communicating with the GitHub API.
-   **Frontend:** The frontend (React/MUI) will provide the UI components for all version control interactions.
-   **Filesystem:** The integrated WASM filesystem must work in concert with the Git logic to manage file status (e.g., modified, new, staged).

## 5. Out of Scope (for initial MVP)

-   Integration with other Git providers (e.g., GitLab, Bitbucket).
-   Complex merge conflict resolution UI. Initial implementation will rely on users to resolve complex conflicts locally if they arise.
-   Rebasing and other advanced Git commands.