# Spec — 字幕生字學習測試台

Specialization team project by **Jessica, Melody & Jay** (Fall 2026).

We're running a within-subjects experiment on learning vocabulary from short video clips. Each participant learns half of the target words with Duolingo and the other half with our flashcard page, and we compare pre-test and post-test scores. This repo holds the front-end prototype, the study content, and a log of how the project develops.

## Repo contents

| Path | What it is |
| --- | --- |
| [`vocab-study-prototype.html`](vocab-study-prototype.html) | Single-file prototype covering setup → learn (embedded Short + flashcard) → quiz → result. It needs no build step. |
| [`W1_技術方案與頁面流程v2.md`](W1_技術方案與頁面流程v2.md) | Week 1 front-end spec: requirements R1–R8, the tech choice, timing metrics, privacy, and page flow |
| [`apps-script/study/`](apps-script/study/) | **The study website for remote participants.** It's a Google Apps Script web app with two pages:<br>• a participant page: one fixed link per person; each day the participant picks a video category, and 2 unlearned words from their group are chosen in it;<br>• a researcher page (password protected): progress, daily messages, preview and data.<br>Records go to a Google Sheet. Deploy steps are in [`DEPLOY.md`](apps-script/study/DEPLOY.md). |
| [`apps-script/video-check/`](apps-script/video-check/) | Video playback check: a Google Apps Script web app that tries the 9 Shorts on a participant's computer and writes the results to a Google Sheet. Deploy steps are in [`DEPLOY.md`](apps-script/video-check/DEPLOY.md). |
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

### 2026-10-28 — Clear-data button on the researcher page, with safeguards
- The data section of the researcher page now has a red **清除資料 (clear data)** box. It can delete test data (TEST rows) only, one participant's records, or everything.
- **Safeguards:**
  1. Choose the scope first.
  2. A summary shows how many session and card records will be deleted, with a red warning when real records are included.
  3. Type a confirmation phrase: 「刪除」, or 「刪除全部」 for everything. The delete button stays disabled until it matches.
  4. The server checks the access token and the phrase again.
  5. Before deleting, the server copies `Sessions` and `Cards` into timestamped backup sheets, so a mistake can be undone by pasting the rows back.
  - If nothing matches, nothing is deleted and no backup is made.
- Rows kept after a delete are written back with date-like text prefixed by `'`, so Google Sheets doesn't turn them into dates.
- **Tested:**
  - In Node: 44 checks, including no token, wrong phrase, missing participant, test only, one participant, nothing to delete, everything, and backup contents.
  - The fake sheet now converts date-like text like Google Sheets does. The write-back test fails if the `'` prefix is removed.
  - In the browser with the mock: wrong or partial phrase keeps the button disabled; 「刪除」 isn't enough for "everything"; cancel; deleting the TEST rows; the "nothing to delete" case.

### 2026-10-28 — Home page asks who you are; researchers log in with a password
- Opening the web app without an ID (`…/exec`) shows a home page (`home.html`) with two choices. Each one opens its own small form:
  - **我是受試者 (participant):** enter your ID (e.g. `p01`, case and spaces don't matter) to go to your own page.
  - **我是施測者 (researcher):** enter the researcher password to go to the researcher page.
- **Researchers no longer need a Google account.**
  - The password is stored in Script Properties (`STAFF_PASSWORD`), so it never appears in the page source.
  - The server checks it and returns an access token that is valid for 6 hours. The token is kept in the browser tab, so the researcher page doesn't ask again.
  - The researcher page itself also asks for the password if there's no valid token, for example when opened directly or after the token expires.
  - After 10 wrong attempts within 10 minutes, login pauses for 10 minutes.
  - There's a log-out button.
- **Deployment is simpler:** one deployment (run as me, anyone can access) serves all three pages. The second deployment, `STAFF_EMAILS`, `staffUrl` and sharing the sheet with the team are all gone.
- **Fixed:** opening one of these `.html` files directly (as the preview pane did) left buttons that did nothing, because the shared files aren't included that way. These pages now show a note explaining how to preview them instead.
- **Tested:**
  - In the browser, with the local mock (password `test`): wrong password, correct password → researcher page without a second prompt, log out, opening the researcher page directly.
  - In Node: 32 checks, including no token / fake token / wrong password / correct password / lockout after 10 failures.

### 2026-10-28 — Participants choose a video category each day
- The team wants participants to pick the topic they like.
- Each group still learns the same 14 words, so the pre- and post-tests don't change. Only the order is up to the participant.
- **How it works:**
  - Before each session, the participant picks stand-up, TV series or lyrics.
  - The page then takes the next 2 unlearned words in that category from their group's list (`words` in `config.html`, in list order).
  - If the category has only 1 word left, the second word comes from the category with the most words left.
  - A category with no words left can't be picked.
  - Group Y has 3 stand-up and 5 TV-series words, so this top-up will happen. The total is always 14, so every day still gets exactly 2 words.
- **Recorded data:**
  - The chosen category is saved as `chosenCategory` in `Sessions`, so preference can be analysed.
  - The server returns the words already learned.
  - The server flags a session `card-mismatch` if the words sent are from the other group or were already learned.
- `config.html` now lists each group's 14 words (`words`) instead of a fixed day-by-day `schedule`. The researcher page shows the words by group × category.
- **Tested:**
  - In Node: 28 checks, including returning learned words, `card-mismatch`, and `chosenCategory`.
  - With the mock backend: picked stand-up twice for P02 (the second day was topped up with a lyrics word, and stand-up then became unavailable), then ran all 7 days. All 14 Y words were learned exactly once.

### 2026-10-28 — Study website: participant and researcher pages
- The team chose:
  - **an Apps Script web app** for hosting, provided the video check passes;
  - a Prototype session that **ends after the 2 cards**, with the actual time recorded;
  - "which day" **based on progress**.
  - (How long the Duolingo part should be is not settled yet, so the pages only show which part comes first.)
- Built `apps-script/study/`.
- **Participant page** (`?p=P01`):
  - Each participant gets one fixed link.
  - The server looks up their progress. The day is the number of completed days + 1, and the group (X/Y) and sequence (A/B) come from `config.html`.
  - The page shows that day's 2 cards, using the same card design as the prototype, and says whether to do Prototype or Duolingo first.
  - When the participant finishes, the record is sent to the sheet automatically, along with time zone, local date, browser and video error codes.
  - Each local date allows only one session. A second one the same day is flagged `duplicate` and doesn't count.
  - If sending fails, the record is kept in the browser and resent the next time the link is opened. There's also a backup file to download.
- **Researcher page** (`?view=staff`, only for addresses in `STAFF_EMAILS`):
  - progress grid (participant × day);
  - daily reminder messages, generated from each participant's own progress;
  - preview of any day with a `TEST` ID;
  - data summary and a config check.
- The participant list and the 7-day × X/Y schedule are in `config.html`. Card content is generated from the prototype by `dev/build-cards.mjs`.
  - **wisdom uses the Lyrics card (`c-lyrics-01`).** The TV card shares its sentence with *pass on*, which X participants see on day 2.
- **Tested:**
  - `dev/server.mjs` + `dev/mock.js` run the pages locally with a mock backend. I went through day 1 → same-day reopen → next day → failed submit and resend → wrong ID / missing ID → TEST preview → all 7 days done → researcher page, on both desktop and a 375 px phone.
  - `Code.gs` was tested in Node with fake Google services: 22 checks covering progress, duplicates, day mismatch, TEST rows, staff access, and dates that Google Sheets might turn into date values.
  - **It has not been run on Apps Script yet.**

### 2026-10-28 — Video check page for remote participants
- Participants are in Taiwan and the US, each on their own computer. Before turning the prototype into a Google Apps Script web app, we need to know whether YouTube allows embedding there.
  - Apps Script pages are served from a `googleusercontent.com` address.
  - The music clips are already known to be blocked on some addresses.
- Added `apps-script/video-check/`. The page:
  - plays each of the 9 Shorts for a few seconds, muted, in two players: `youtube-nocookie.com` (what the prototype uses) and `youtube.com` (fallback);
  - records "plays", "blocked (error 101/150)", "other error" or "didn't start" (usually autoplay blocked);
  - writes one row per video × player to the sheet, with participant ID, time zone, browser and page address.
- Tested locally:
  - on `localhost`, all 18 checks played;
  - on `127.0.0.1`, it correctly reported *Let It Be* and *Faded* as blocked (error 150) in both players.
- **Next:** Jay deploys it (see `DEPLOY.md`), the team tests it from Taiwan and the US, then each participant runs it on the computer they'll use for the study.

### 2026-10-28 — Interface fixes (from the same UX/HCI review)
- **Card navigation stays on screen.**
  - The page counter and the previous/next buttons now stick to the bottom of the window, so participants don't have to scroll down on every card.
  - The "先看短片，再翻卡看定義" instructions only appear on the first card, and the card is slightly shorter.
  - At 800×724 and on a 375 px phone, from the second card on, the whole card and the buttons fit on one screen.
  - Phones and tablets don't show the keyboard shortcut hints.
- **"再播一次" (play again).**
  - When a clip reaches `source.end`, a dark overlay with a "再播一次" button covers the video. It also hides YouTube's end screen, so participants can't click through to other videos.
  - A replay counts as one more `playCount`.
- **Fixed `playCount` counting one play as two.**
  - When a clip starts from `source.start`, YouTube's player briefly reports "not started" between buffering and playing, and this was logged as a second play.
  - **Exports made before this fix have `playCount` roughly doubled.** So far those are test data only.
- **Quiz answers are confirmed with a button.**
  - Clicking an option (or pressing 1–4) only selects it. Participants can change it until they press "下一題" (or Enter). The last question's button says "完成測驗".
  - Each answer now records:
    - `responseMs`: question shown → "下一題" pressed;
    - `firstChoiceMs` (new): question shown → first click;
    - `answerChanges` (new): times the answer was changed before submitting.
  - `firstChoiceMs` and `answerChanges` are also new CSV columns.
- **Readability (spec R7).**
  - Text participants see on the learn, quiz and thank-you screens is now 15 px or larger, including small buttons, which are at least 44 px tall.
  - Grey text was darkened so it reaches at least 4.5:1 contrast (WCAG AA):
    - `--muted` is now `#5A6570`;
    - secondary text on the dark card is `#A3ADB7`.
  - Screens only the researcher sees (setup notices, results view) were left as they were.

### 2026-10-28 — Changes to protect the data (from a UX/HCI review)
- **Participants no longer see the answers.**
  - After the last question, the participant only sees a thank-you screen asking them to hand the device back.
  - Score, per-item review with correct answers, and the download buttons are behind a "hold for 2 seconds" button for the researcher, so a casual click won't open it.
  - Reason: showing the correct answers turns the results screen into a second round of learning and would contaminate any delayed post-test.
  - The quiz hint no longer promises that answers are shown at the end.
- **Quiz order is shuffled per participant.** Previously the questions followed the card order, so participants could use the order as a cue.
  - The order is shuffled randomly for each session.
  - The JSON has a new `quizOrder` field.
  - Each answer gets a `position` field (1 = first question shown), and `position` is a new CSV column.
- **Warning before data is lost.**
  - From "開始學習" until the record is downloaded or copied, closing or reloading the tab shows the browser's "leave this page?" prompt.
  - "換一位受試者" asks for confirmation if the record hasn't been saved.

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
