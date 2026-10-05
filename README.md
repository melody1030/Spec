# Spec — 字幕生字學習測試台

Specialization team project by **Jessica, Melody & Jay** (Fall 2026).

We're running a within-subjects experiment on learning vocabulary from short video clips. Each participant learns half of the target words with Duolingo and the other half with our flashcard page, and we compare pre-test and post-test scores. This repo holds the front-end prototype, the study content, and a log of how the project develops.

## Repo contents

| Path | What it is |
| --- | --- |
| [`vocab-study-prototype.html`](vocab-study-prototype.html) | Single-file prototype covering setup → learn → quiz → result. It needs no build step and runs offline. |
| [`W1_技術方案與頁面流程v2.md`](W1_技術方案與頁面流程v2.md) | Week 1 front-end spec: requirements R1–R8, the tech choice, timing metrics, privacy, and page flow |
| [`docs/Specialization-Team-Project-Proposal.pdf`](docs/Specialization-Team-Project-Proposal.pdf) | Team proposal. **This is the source of truth for the study content** (clips, target words, definitions, examples). |

## Running the prototype

Open `vocab-study-prototype.html` in any recent browser (Chrome, Edge or Safari). It needs no install and no server. Session data stays in memory, so **download the JSON/CSV before closing the tab**.

## Study content (from the proposal PDF)

There are 3 categories × 3 YouTube Shorts, for **43 target words** in total. CEFR levels come from the [English Vocabulary Profile](https://englishprofile.org/?menu=evp-online).

### Category 1 — Standup (12 words)

| Clip | Link | Target words |
| --- | --- | --- |
| Shorts 1 | [tqvV1XzrWE0](https://www.youtube.com/shorts/tqvV1XzrWE0) | elaborate (C1), imaginary (C1), architecture (B1) |
| Shorts 2 | [COu4VGQ_ECI](https://youtube.com/shorts/COu4VGQ_ECI) | prison (B1), import (B2), inconvenient (B2) |
| Shorts 3 | [EN9wmq_kkos](https://youtube.com/shorts/EN9wmq_kkos) | married (B2), make sense (B2), divorce (B2), yield (C1), caution (C1), check out (C1) |

### Category 2 — American TV series (17 words)

| Clip | Link | Target words |
| --- | --- | --- |
| Shorts 1 | [hGZLnvEf4oA](https://youtube.com/shorts/hGZLnvEf4oA) | embarrassing (B1), waiter (A1), be supposed to be sth (B2), weird (B2) |
| Shorts 2 | [d0-1GfKNVVU](https://youtube.com/shorts/d0-1GfKNVVU) | pass on sth / pass sth on (B1), wisdom (B2), couple (B1), smile (B1), rude (B1), sneeze (B2), terrific (B1) |
| Shorts 3 | [J9cz9ajKEvY](https://youtube.com/shorts/J9cz9ajKEvY) | fantastic (A2), lean (C2), be close to sth (C1), distance (B1), pretend (B2), rough (B1) |

### Category 3 — Lyrics (14 words)

| Clip | Link | Target words |
| --- | --- | --- |
| Shorts 1 | [IotJ26My0mg](https://youtube.com/shorts/IotJ26My0mg) | wisdom (B2), darkness (B2), whisper (B2) |
| Shorts 2 | [R9q4bQvCUA0](https://youtube.com/shorts/R9q4bQvCUA0) | turn (B1), meet (B1), lead (B1), trail (B2), sail (B1), far (A2) |
| Shorts 3 | [4nfeAC6OiYM](https://youtube.com/shorts/4nfeAC6OiYM) | shadow (B1), light (B1), fade away (B2), afraid (A2), alive (C2) |

For each word, we also give the part of speech, an English definition, a Chinese definition (定義), an English example sentence, and a Chinese example sentence (例句). These map onto the `pos`, `definitionEn`, `definitionZh` and `example` fields of each card in the prototype's `DATA` constant.

> Note: "wisdom" appears in both TV series (Shorts 2) and Lyrics (Shorts 1).

## Process log

Newest entries go at the top.

### 2026-10-05 — Real content loaded into the prototype
- Replaced the 16 placeholder cards with the **43 words from the proposal PDF**. The 3 categories are now `standup`, `tvseries` and `lyrics`, and each card records its clip (1–3) and YouTube link.
- New card fields:
  - `exampleZh`: the Chinese example sentence from the PDF.
  - `exampleForm` / `sentenceForm`: the exact word form that appears in the sentence (e.g. *led*, *makes sense*, *is supposed to be*), so highlighting works for inflected forms.
- `sentence` (the subtitle line from the clip) is empty for now. Until it's filled, the card front shows the PDF example sentence.
- The setup screen now lists what's still missing (subtitles, timestamps, screenshots, quiz) as a to-do notice. Real errors still block the page as before.
- **A/B split is provisional:** words alternate A/B in order within each category (A = 22, B = 21). As a side effect, the two "wisdom" cards end up in different sets (TV = B, Lyrics = A). The team still needs to confirm the split, including CEFR balance.
- `DATA.quiz` is empty. Writing it is the next step (step 2). Until then, the flow goes learn → result, and only the JSON export contains dwell/flip data, because the CSV has one row per quiz item.

### 2026-10-05 — Repo created
- Created this repo and committed the W1 prototype and spec.
- Added the team proposal PDF under `docs/` as the content source.
- Feedback noted in the proposal:
  - **4**: default to English, with a switch to Chinese
  - **6**: not needed
- **Next:** replace the placeholder `DATA` in the prototype with the 43 words and 3 categories above (done, see the entry above).

### 2026-09-15 — Week 1: tech plan & page flow 
- Compared 4 options: single HTML file, React + Vite, Next.js + DB, and a Google Form hybrid. **Chose the single HTML file** because it keeps the learning and quiz timeline in one tab, has no build step, and lets us swap materials by editing one constant.
- Built `vocab-study-prototype.html` with placeholder data, load-time validation, dwell/flip/response timing, and JSON/CSV export.
