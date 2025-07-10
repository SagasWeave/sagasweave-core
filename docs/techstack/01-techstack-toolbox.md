# SagasWeave Tech Stack & Toolbox

This document outlines the core technologies, tools, and architectural principles for the SagasWeave project. It is based on the initial brainstorming and architectural planning.

---

## 🧰 Core Technology Stack

| Layer                               | Technology                                   | Role & Purpose                                                                 |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| ⚙️ **Backend Runtime**              | **Node.js**                                  | A stable and widely-used JavaScript runtime for the server-side application.   |
| 🌐 **API Framework**                | **Express.js**                               | A minimal and flexible Node.js web application framework for the API.          |
| 🚀 **Frontend Build Tool**          | **Vite**                                     | A modern, fast build tool for the React frontend, offering a great dev experience. |
| 🧾 **Language**                     | **TypeScript (ESM)**                         | The primary language for the entire project (backend, frontend, bindings).     |
| 🖥️ **UI Framework**                 | **React + MUI**                              | A component-based UI with a modern, flexible design and integrated themes.     |
| ✍️ **Editor Component**             | **React-ACE**                                | An embedded code editor with Ink syntax highlighting and custom events.        |
| 🧵 **Ink Runtime**                  | **InkJS**                                    | Parses and runs narrative Ink files directly in the browser (React integrated).|
| 💾 **Local Data Structure**         | **SQLite in WASM (sql.js)**                  | Provides a local "file and versioning system" within the PWA for offline use.  |
| 🛠️ **Cloud/AI Backend**             | **Node.js on Linux VPS**                     | Hosted endpoints for the AI agent, linter, and GitHub synchronization.         |
| ☁️ **Git Repository**               | **GitHub API**                               | Manages version control, sharing, and potential CI/CD deployments.             |
| 📱 **App Delivery**                 | **PWA** (Web App Manifest + Service Worker)  | An offline-capable, installable, and mobile-friendly development platform.     |
| 🧠 **AI Assistance**                | **Cloudflare Workers AI / OpenAI**           | An agentic assistant for writing, analysis, suggestions, and commit metadata.  |
| 🔒 **Network & Security**           | **Tailscale**                                | Creates a secure network tunnel (VPN) to the Linux VPS for safe, direct access. |

---

## 🧪 Testing & Quality Stack

| Category                 | Technology                               | Role & Purpose                                                                      |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| **Unit/Integration**     | **Vitest**                               | A fast and modern test runner for unit and integration tests, native to the Vite ecosystem. |
| **Static Code Analysis** | **ESLint**                               | Identifies and fixes problems in JavaScript/TypeScript code.                        |
| **Code Formatting**      | **Prettier**                             | An opinionated code formatter that enforces a consistent style.                     |
| **E2E Testing**          | **Puppeteer**                            | A Node library for controlling headless Chrome, used for end-to-end testing of the PWA. |
| **Git Hooks**            | **Husky & lint-staged**                  | Runs linters and tests on staged files before they are committed to ensure code quality. |

---

## 🐛 Debugging & Tooling

| Environment | Tool                     | Role & Purpose                                                                          |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------- |
| **IDE**     | **VSCode/Trae Debugger** | Integrated, full-stack debugging with breakpoints for both Node.js and React.           |
| **Frontend**| **React Developer Tools**| A browser extension for inspecting the React component hierarchy, props, and state.     |
| **Backend** | **Node.js Inspector**    | Allows attaching Chrome DevTools to the Node.js process for advanced memory/CPU profiling. |
| **Backend** | **Pino / Winston**       | Structured logging libraries for generating parseable, production-grade logs.           |

---

## 🧱 Architectural Principles & Methodology

### 1. **Offline-First Development**
- The entire application (editor, preview, project structure) runs in the browser as a PWA.
- SQLite via WASM manages files and metadata in a single database, enabling full offline functionality.
- ACE Editor combined with InkJS provides a local, live story preview without server dependency.

### 2. **WASM-Powered Local File System**
- The application uses a WebAssembly-based file system to emulate a local file structure within the browser, enabling full offline capabilities.
- This allows for robust handling of project files, metadata, version history, and snapshots, all stored persistently in IndexedDB.

#### Potential Building Blocks
While `sql.js` is the primary choice for the MVP, the initial brainstorming identified several viable technologies for this layer:

| Technique                        | Description                                                                     | Suitability                                      |
| -------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| **`sql.js`** (SQLite in WASM)    | A single database file stored in IndexedDB, managing the entire file structure. | Metadata, project structure, versions, snapshots. |
| **`BrowserFS`** + WASM Backend | Emulates a POSIX-like file system in memory or IndexedDB.                       | Files, folders, complex project structures.      |
| **`MemFS` / `FATFS` in WASM**  | A simulated FAT/EXT file system with blob storage, acting as a mini-FS.         | User-managed data, autosave, multi-file projects.|

### 3. **Node.js Backend Architecture**
- **Development & Production**: A standard Node.js and Express.js server runs on a Linux VPS, providing a consistent environment for both development and deployment.
- This setup simplifies the architecture by using a traditional, stateful server model, which is robust and well-understood.

### 4. **Automated & Manual GitHub Sync**
- The system tracks all local changes in the WASM-based SQLite database.
- Commits and synchronization to the GitHub repository can be triggered manually by the user or automatically.
- The Node.js backend acts as a secure intermediary to protect access tokens and manage commit logic.

### 5. **AI as a Collaborative Partner**
- The AI assistant is integrated via a `/api/chat` endpoint, running on the Node.js server.
- It receives the Ink file and its context to provide suggestions, structural summaries, and narrative feedback.
- **Context Provision**: The AI does not directly access the frontend. Instead, the React application is responsible for gathering the relevant context (e.g., editor content, cursor position, selected files) and sending it to the AI's API endpoint. This ensures a clear and secure data flow.

---

## 🎮 Core User Experience

The final product is a **complete, IDE-like web application** for creating interactive narratives and games with Ink.

> **Core Concept**: An Offline-First PWA combined with a Node.js/Express API, React-ACE/InkJS editing, AI assistance, and native GitHub version control.