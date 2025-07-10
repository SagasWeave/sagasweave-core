# 🧠 SagasWeave: Et AI-drevet narrativt system

**SagasWeave** er et nyt paradigme for at skrive, strukturere og afvikle narrative spil og interaktive oplevelser — helt og holdent bygget på tekst, AI og automatisering. Det kombinerer Markdown, semantiske tags, TypeScript og AI-assisteret kompilering for at skabe en kontinuerlig kreativ udviklingscyklus uden traditionel IDE eller GUI.

---

## 🎯 Formål

At give forfattere og udviklere en *tekstbaseret DSL (domain-specific language)* til at:

* 📖 Skrive scener, UI, logik og spilverden i frit sprog
* 🤖 Uddelegere gentagelser, validering og kodning til AI
* 🛠️ Generere spilstruktur og komponenter automatisk
* 🌍 Udkomme på web, desktop og mobil uden ændring af kildekode

---

## 🧩 Grundprincipper

| Princip                           | Forklaring                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| **::TAGs**                        | Semantiske blokke som `::SCENE`, `::AI`, `::UI`, `::NOTE`, `::STATE` styrer parsing og AI-arbejde |
| **Naming book**                   | Én central `sw-naming-book.json` definerer navne- og strukturkonventioner                         |
| **Everything is a file**          | Output er `.ts`, `.tsx`, `.json` og `.md` – ingen binære formater                                 |
| **AI = Redaktør, ikke forfatter** | AI bruges kun til korrektion, udbedring og forslag                                                |
| **KISS / DRY / SOLID / SPR**      | Hele systemet bygger på softwareprincipper men med kreativ anvendelse                             |
| **Terminal first**                | Alt kører over SSH og CLI – ingen IDE krævet                                                      |
| **Fejl er evolution**             | Hver AI-fix er en forbedring, ikke en afbrydelse                                                  |

---

## 🔄 Arbejdscyklus

```text
1. Du skriver i Markdown (Textastic, VSCode, CLI)
2. CLI (`sw-compile`) parser og genererer struktur
3. `sw-validate` tjekker naming, links, UI, topologi
4. `sw-ai-fix` retter fejl og udvider med AI
5. `sw-run` afvikler narrativet i CLI/web/native
```

---

## 📦 Filtyper og komponenter

| Fil                   | Rolle                                               |
| --------------------- | --------------------------------------------------- |
| `*.md`                | Dit eneste skrivefelt – alt sker her                |
| `::TAGS::`            | Styrer parsing og AI-behandling                     |
| `sw-naming-book.json` | Regler for navne, komponentstruktur og formattering |
| `script-tags.json`    | Metadata om tags: typer, targets, AI-forståelse     |
| `game.json`           | Samlet topologi                                     |
| `levels/*.json`       | Underopdelinger (klynger, kapitler, missions, etc.) |
| `*.ts / *.tsx`        | Genereret kode til scenes, UI og logic              |

---

## 🌐 Målplatforme

* **Web (React + MUI)**
* **iOS / Android (React Native + Paper)**
* **Desktop (Tauri + React)**
* **macOS / Windows (React Native Out-of-Tree)**
* **Terminal preview (CLI Simulator)**

---

## 🔗 Eksempel: Markdown med AI, UI og scene

```md
::SCENE Hjemme hos mig selv
:position: home
:world: Deadistan
:time: tyear 1864
:who: player
::

Det er nat. Regnen siler ned udenfor vinduet.

[[Gå i seng]] → scene:soevn_start
[[Tænd radioen]] → scene:radio_start

::UI RadioKnappanel::
- Button: "Tænd for radio"
- Button: "Skift kanal"

::AI << Vi mangler lidt stemning i teksten ovenfor. Kan du foreslå 2-3 linjer? >>
```

---

## 🧬 Fremtid

* 🔁 AI bliver dygtigere for hver fejl du laver
* 📲 Udgivelse sker via `npx sw-export` som PWA, native app eller Tauri
* 🔄 Du kan genindlæse strukturen fra `.json` og iterere uden UI
* 🤝 Mulighed for samarbejde, modding og inkorporering af billeder, lyde, stemmer

---

## 🧠 Konklusion

SagasWeave er et værktøj, en metode og en filosofi. Det forvandler fejl til fremdrift og tekst til handling. Det er et kompilérbart univers, hvor du er arkitekten og AI er dit værktøj.

Det handler ikke om at erstatte kreativitet med kode.
Det handler om at lade **kode og AI hjælpe kreativitet til at vokse**.

> "Skriv frit, og lad maskinen bygge med dig."

---
