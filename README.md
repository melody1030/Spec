# Spec — 字幕生字學習測試台

Specialization team project by **Jessica, Melody & Jay** (Fall 2026).

We're testing whether short subtitled video clips help people learn English vocabulary. In a within-subjects design, each participant learns half of 28 target words with our flashcard website and the other half with Duolingo, and we compare pre-test and post-test scores.

## Status

The study website is built and tested locally, but **it hasn't been deployed to Apps Script yet.**

**Next steps:**

1. Deploy the video check and run it from Taiwan and the US.
2. Deploy the study website and run every day of both groups in preview.
3. Have each participant run the video check on the computer they'll use.

## How the study works

1. **Day 0:** screening, consent, placement test, video check, and the pre-test (28 words).
2. **Days 1–7:** each day the participant does one Prototype session and one Duolingo session. They alternate which comes first:
   - sequence A (P01, P03, P05) does Prototype first on days 1, 3, 5 and 7;
   - sequence B (P02, P04) does Prototype first on days 2, 4 and 6.
3. **A Prototype session:**
   1. The participant opens their personal link.
   2. They pick a video category: stand-up, TV series or lyrics.
   3. They learn 2 words that are still unlearned in their group, using flashcards that show the clip and the subtitle line on the front and the meaning on the back.
   4. The record is sent to a Google Sheet automatically.
4. **Day 8:** the post-test, covering all 28 words.

Each group learns 14 words on the website. The other group's 14 words are the untaught control.

| Group | Participants | Stand-up | TV series | Lyrics |
| --- | --- | --- | --- | --- |
| X | P01, P04, P05 | architecture, import, married, make sense | embarrassing, pass on, terrific, distance, be supposed to, sneeze | lead, meet, wisdom, trail |
| Y | P02, P03 | prison, inconvenient, divorce | rude, couple, rough, weird, pretend | shadow, sail, light, darkness, whisper, fade away |

Within a category, words come in the order listed in `apps-script/study/config.html`. If the chosen category has only one word left, the second word comes from the category with the most words left.

## Repo contents

| Path | What it is |
| --- | --- |
| [`apps-script/study/`](apps-script/study/) | **The study website** (Google Apps Script web app). It has three pages:<br>• a home page where you pick participant or researcher;<br>• the participant page;<br>• the password-protected researcher page: progress, daily messages, preview, data, and clear data.<br>Deploy steps are in [`DEPLOY.md`](apps-script/study/DEPLOY.md). |
| [`apps-script/video-check/`](apps-script/video-check/) | Tries all 9 Shorts on a participant's computer and logs whether YouTube allows them. Deploy steps are in [`DEPLOY.md`](apps-script/video-check/DEPLOY.md). |
| [`vocab-study-prototype.html`](vocab-study-prototype.html) | The original single-file prototype (setup → learn → quiz → result). **Its `DATA` is the source for all card content.** |
| [`W1_技術方案與頁面流程v2.md`](W1_技術方案與頁面流程v2.md) | Week 1 front-end spec: requirements, tech choice, timing metrics, privacy, page flow |
| [`docs/Specialization-Team-Project-Proposal.pdf`](docs/Specialization-Team-Project-Proposal.pdf) | Team proposal, the original source of the clips, words, definitions and CEFR levels |

## Running locally

**Study website.** This uses a mock backend; the data stays in your browser.

```bash
node apps-script/study/dev/server.mjs
```

Then open:

- <http://localhost:8100/> for the home page;
- <http://localhost:8100/participant?p=P01> for a participant page;
- <http://localhost:8100/staff> for the researcher page (local password `test`).

**Prototype:**

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/vocab-study-prototype.html>.

Always use `localhost`, not `127.0.0.1`: YouTube blocks two of the music clips on `127.0.0.1`. Opening the `.html` files directly doesn't work, because YouTube needs a page served over http.

## Changing card content

1. Edit the card in `vocab-study-prototype.html`: sentence, definitions, example, or clip `start`/`end`.
2. Regenerate the website's copy:
   ```bash
   node apps-script/study/dev/build-cards.mjs
   ```
3. Paste the new `cards.html` into the Apps Script editor and deploy a new version.

## What gets recorded

Records go to the Google Sheet behind the web app. No names are collected, only participant IDs.

- **`Sessions`** has one row per session:
  - day, group, sequence, chosen category;
  - local date and time zone;
  - start, end and duration;
  - browser and screen;
  - `flag`: `duplicate`, `day-mismatch` or `card-mismatch`.
- **`Cards`** has one row per card: time on card, flips, time to first flip, play count, play time, and video error code.

## Progress log

Newest first. Click an entry to expand it.

<details>
<summary><b>2026-10-29</b> — 7 definitions changed to the meaning used in the clip</summary>

- *couple*, *rough*, *be supposed to*, *lead*, *meet*, *distance* and *sail* now use the sense in their clip line. For example, *sail* is now the noun 船帆 (a boat's sail), not the verb 航行 (to sail). *be supposed to be sth* became *be supposed to*.
- The definitions, examples, translations and the prototype's quiz items were rewritten. The team checked them against the pre- and post-test options. The CEFR levels stay as in the PDF.
- Removed the stray `data.js`, which was a copy of the prototype's `DATA`.
</details>

<details>
<summary><b>2026-10-28</b> — Subtitles, prototype fixes, and the study website for remote participants</summary>

- **Content:**
  - Subtitle lines for stand-up and TV series were taken from the YouTube caption files and checked against the subtitles in the video. The team typed in the lyric lines.
  - Each card plays only a segment around its target word, about 3–13 s for speech and 4–30 s for songs.
- **Prototype fixes (UX/HCI review):**
  - Participants no longer see the correct answers.
  - The quiz order is shuffled and recorded.
  - The browser warns before the tab is closed with unsaved data.
  - The card controls stay at the bottom of the screen, and a 「再播一次」 (replay) overlay appears when a clip ends.
  - Quiz answers are submitted with a button.
  - Text is at least 15 px and meets WCAG AA contrast.
  - Fixed `playCount` counting one play as two. Earlier test exports have doubled counts.
- **Video check (`apps-script/video-check/`):**
  - It plays the 9 Shorts on a participant's computer and logs whether each one plays.
  - It correctly reported *Let It Be* and *Faded* as blocked on `127.0.0.1`.
- **Study website (`apps-script/study/`, Google Apps Script):**
  - **Home page:** asks whether you're a participant (enter your ID) or a researcher (enter the password).
  - **Participant page:**
    - one fixed link per participant;
    - the day number comes from their progress, and only one session is allowed per local date;
    - each day the participant picks a video category and learns 2 of their group's 14 words that they haven't learned yet. The choice is saved as `chosenCategory`.
    - the record is uploaded automatically, with retry and a backup file if that fails.
  - **Researcher page (password protected):**
    - progress grid;
    - daily messages built from each participant's progress;
    - TEST preview and a config check;
    - clear data with safeguards: a summary, a typed confirmation phrase, a second check on the server, and automatic backup sheets.
  - The password is stored in Script Properties and never appears in the page source. A login lasts 6 hours, and login pauses after 10 wrong tries.
  - Only one deployment is needed.
  - **Tested:** locally with a mock backend; the server code passes 44 checks in Node. It hasn't run on Apps Script yet.
</details>

<details>
<summary><b>2026-10-27</b> — Draft quiz</summary>

- 43 cloze questions, one per card, with new stem sentences.
- The wrong options never use another target word. The correct answer's position rotates.
</details>

<details>
<summary><b>2026-10-05 – 10-06</b> — Real content and embedded Shorts</summary>

- Loaded the 43 words from the proposal PDF.
- Embedded the 9 Shorts on the card front with the YouTube IFrame API, and the layout now fits the 9:16 video.
- Each clip's `start`/`end` is recorded, plus `playCount` and `playMs`.
- Note: the clips have bilingual subtitles burned into the video.
</details>

<details>
<summary><b>2026-09-15</b> — Week 1: tech plan and page flow</summary>

- Chose a single HTML file over React, Next.js or a Google Form hybrid. It keeps the learning and quiz timeline in one place and needs no build step.
- Built the first prototype, with timing metrics and JSON/CSV export.
</details>
