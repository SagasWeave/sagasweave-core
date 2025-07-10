# 📦 SagasWeave Techstack

Denne techstack dækker hele det nødvendige setup til at skrive, kompilere, afvikle og udgive narrative spil og apps med AI-assistance, uden behov for UI-IDE eller traditionel kode. Alt styres via Markdown, naming-regler, CLI-scripts og AI.

---

## ✍️ 1. Forfatning & Input

* **Markdown (`.md`)**: Alt narrativ, UI, logik og AI-anmodninger skrives i én fil.
* **`::TAG` syntaks**: Bruger `::SCENE`, `::UI`, `::AI`, `::STATE`, etc. som semantisk markup.
* **Textastic (iPad) / VSCode / Obsidian**: Fritekst-editorer uden afhængighed af UI.
* **`sw-naming-book.json`**: Navngivningsregler for filer, funktioner, klasser, komponenter.
* **`script-tags.json`**: Definition af `::`-tags, deres formål og output-type.

---

## 🧠 2. AI Layer

* **LLM: GPT-4o / Claude 3.5 / Phi-2 / lokale LLMs**
* **AI bruges KUN** til:

  * Fortolkning af `::AI` blokke
  * Fejlkorrektion
  * Supplerende valg, tekster, UI-komponenter
* **`ai-task-runner.ts`**: CLI-komponent der scanner AI-opgaver og returnerer genereret output.

---

## 🛠️ 3. Kompilering & Parser

* **`sw-compile`**: CLI der parser `.md`, splitter tags og genererer `.ts`/`.tsx` filer.
* **`md-parser.ts`**: Ekstraherer `::TAG` blokke og strukturer.
* **`validate-structure.ts`**: Checker linking, naming, state, UI-kompletheder.
* **`generate-files.ts`**: Skriver TypeScript-kode baseret på tag-type og naming rules.

---

## 🌐 4. UI & Runtime Targets

| Platform        | Framework          | UI Library             |
| --------------- | ------------------ | ---------------------- |
| **Web**         | React (TS)         | **Material UI (MUI)**  |
| **iOS/Android** | React Native       | **React Native Paper** |
| **macOS**       | React Native macOS | Paper / NativeBase     |
| **Windows**     | React Native Win   | Paper / NativeBase     |
| **Web+Native**  | `react-native-web` | Shared komponenter     |

Alle UI-komponenter genereres fra `::UI` tagget og placeres i korrekt platform-mappe afhængigt af CLI-flag (`--target`).

---

## 📦 5. Runtime & Deployment

* **Bundler**: Bun / Vite
* **State Management**: Zustand eller TS-baseret filstate
* **Routing/Topologi**: Automatisk genereret fra `game.json`
* **Test**: Puppeteer, `sw-run-test`, MPC test-server
* **Export / Platform**:

  * Web: Vite + PWA
  * iOS/Android: Expo + React Native
  * Desktop: Tauri
* **Runtime Preview**: `sw-run` (CLI simulator + web + native preview)

---

## 🔄 6. Workflow CLI

```bash
# Parser og kompilerer alle .md filer til TS
npx sw-compile md/

# Validerer topologi, navngivning og flow
npx sw-validate

# Løser fejl og AI-opgaver via ::AI blokke
npx sw-ai-fix

# Kører spillet i browser/native/cli preview
npx sw-run
```

---

## 🧩 7. Strukturfiler

* `sw-naming-book.json` → Navngivningskonventioner
* `script-tags.json` → Definition af ::TAGs og AI-instruktioner
* `game.json` → Global topologi og flow mapping
* `levels/*.json` → Lokale sceneklynger eller chapters

---

## 🧠 Principper

* **KISS**: Du skriver kun tekst og struktur.
* **AI-as-fallback**: AI retter, foreslår, kompletterer – men styrer aldrig.
* **Everything is a file**: Alle outputs er `.ts`, `.tsx`, `.json`, `.md`
* **Portable**: Alt virker i CLI over SSH – ingen afhængighed af GUI eller IDE.
* **Composable**: Systemet virker til narrative spil, UI flows, læring, dokumentation, AI-agents og meget mere.

---

## 📎 Fremtidssikret

* **Multi-platform out-of-tree support** (React Native Mac/Win/Web)
* **AI-integration på tekstligt niveau**
* **PWA / Desktop / Native / Terminal support**
* **Customizable compiler pipeline (f.eks. `sw-compile-web`, `sw-compile-native`)**
