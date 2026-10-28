# Spec — 字幕生字學習測試台

Specialization team project by **Jessica, Melody & Jay** (Fall 2026).

We're running a within-subjects experiment on learning vocabulary from short video clips. Each participant learns half of the target words with Duolingo and the other half with our flashcard page, and we compare pre-test and post-test scores. This repo holds the front-end prototype, the study content, and a log of how the project develops.

## Repo contents

| Path | What it is |
| --- | --- |
| [`vocab-study-prototype.html`](vocab-study-prototype.html) | Single-file prototype covering setup → learn (embedded Short + flashcard) → quiz → result. It needs no build step. |
| [`W1_技術方案與頁面流程v2.md`](W1_技術方案與頁面流程v2.md) | Week 1 front-end spec: requirements R1–R8, the tech choice, timing metrics, privacy, and page flow |
| [`docs/Specialization-Team-Project-Proposal.pdf`](docs/Specialization-Team-Project-Proposal.pdf) | Team proposal. **This is the source of truth for the study content** (clips, target words, definitions, examples). |

## Running the prototype

The learning screen embeds the YouTube Shorts, and YouTube only allows embedding from a page served over `http(s)://`. Double-clicking the file still works, but the videos won't play. To see the videos, serve the folder locally:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/vocab-study-prototype.html> in Chrome, Edge or Safari. Use `localhost`, **not** `127.0.0.1`: on `127.0.0.1`, two of the music clips are blocked (see the log below). Once the repo is on GitHub Pages, the Pages URL works the same way.

Session data stays in memory, so **download the JSON/CSV before closing the tab**.

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

### 2026-10-28 — Subtitle lines and clip ranges filled in
- Every card now has `source.start` / `source.end`, so each card plays only a segment around its target word instead of the whole Short. Playback stops by itself at `end`.
- After a first pass, every range was **doubled in length** (same midpoint, extended equally on both sides) to give more context. A range that hits the start or end of the Short extends on the other side instead. Ranges are now about 3–13 s for speech, and 4–30 s for lyrics.
- **Standup and TV series (29 cards):** `sentence` now holds the line spoken in the clip. To get them:
  - downloaded each Short's caption file with yt-dlp (captions only, no video);
  - checked the uncertain lines against the English subtitles burned into the video.
  - Lines are written as they appear on screen, including the clip's own spelling and censoring, e.g. *buildin'*, *f\*\*k*.
- **Lyrics (14 cards):** only the time ranges are filled in. The music Shorts have no caption file, so the ranges come from stepping through the video frame by frame:
  - *Let It Be* shows a whole verse at a time, so each word's range covers its verse.
  - The other two songs show one line at a time, so their ranges are tighter.
  - **`sentence` is still empty.** We didn't copy the song lyrics into the repo, so the front shows the PDF example sentence for now. If the team decides to use the lyric line, type it in from the subtitle on screen.
- **To review:**
  - *be supposed to be sth*: the clip only says "Supposed to go in the other direction", which isn't the same structure as the target phrase.
  - *smile*: the card is a verb, but the clip uses the noun ("A smile goes a long way").
  - Both *wisdom* (TV) and *pass on* use the same line, and so do *rude* and *sneeze*. Each pair is split across A/B, so a participant only sees one card of each pair.

### 2026-10-27 — Draft quiz added (needs review)
- Added 43 cloze questions to `DATA.quiz`, one per card, each with 4 options. Each question's set and category match its card, so set A gets 22 questions and set B gets 21.
- **The stems are new sentences, not the card's example sentence,** so the quiz tests the word rather than memory of the sentence.
- **Wrong options** are the same part of speech but don't make sense in the sentence. None of them is another target word, because a participant might have learned that word through Duolingo.
- The correct answer's position rotates through options 1–4 (11 / 11 / 11 / 10).
- Ran the full flow with all 43 words: no validation errors, and the score, review list and CSV (43 rows) were all correct.
- **To review (Jay / Jessica):** the difficulty of each item, especially options that might also fit the blank. Also decide whether questions should be shuffled, since they currently follow the same order as the cards.

### 2026-10-06 — Video moved onto the flashcard front
- The front of the card is now the Short itself, with the subtitle sentence next to it on desktop and below it on phones. The back still holds the definitions.
- Flipping to the back pauses the video. The front is hidden mid-flip so the video can't show through on Safari.
- **Embedding depends on the website address for music clips.** *Let It Be* (Lyrics Shorts 1) and *Faded* (Lyrics Shorts 3) play from `localhost` but return YouTube error 150 from `127.0.0.1`. That's the record label restricting which sites may embed them, so **they need checking again once the GitHub Pages URL exists.** When a clip is blocked, the card shows a clear message, or the screenshot if one has been added.

### 2026-10-05 — Embedded Shorts + vertical-video layout
- Checked all 9 Shorts: every one allows embedding and plays in YouTube's official player. Lengths are 19–60 s.
- All 9 come from English-learning channels, with **bilingual subtitles burned into the video**. This may confound the comparison with Duolingo. Raise it with Jay and the professor.
- Redesigned the learning screen around the 9:16 Short. On desktop, the player sits on the left and the flip card on the right, at the same height. On phones, the player is stacked above the card.
- Embedding uses the YouTube IFrame Player API (`youtube-nocookie.com`). It's one player reused for every card, and it loads each card's clip without autoplaying.
- New per-card fields:
  - `source.start` / `source.end` (seconds) play only the moment around the target word. They're `null` for now, so the whole Short plays.
  - `source.timestamp` was replaced by these.
  - `source.screenshot` is now only a fallback for when the video can't play (offline, or opened as a local file).
- New logged metrics per card: `playCount` (times the participant pressed play) and `playMs` (time actually spent playing). Both appear in the JSON and as two new CSV columns.

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
