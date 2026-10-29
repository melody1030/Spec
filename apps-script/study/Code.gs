/**
 * Spec 字幕生字學習 — Google Apps Script Web App
 *
 * 受試者頁：/exec?p=P01            每天打開同一條連結，依進度決定今天是第幾天；受試者選影片類別，
 *                                  程式從這組還沒學的字裡挑 2 個
 * 施測者頁：/exec?view=staff       要輸入密碼（Script Properties 的 STAFF_PASSWORD）才看得到資料
 * 首頁：  /exec                    沒有帶編號時，先問是受試者還是施測者
 * 資料：這份試算表的 Sessions（每次一列）和 Cards（每張卡一列）分頁
 *
 * 部署步驟見同資料夾的 DEPLOY.md。
 */

const SESSION_HEADERS = ['receivedAt', 'sessionId', 'participantId', 'isTest', 'day', 'expectedDay', 'group', 'sequence',
  'firstActivity', 'chosenCategory', 'localDate', 'timezone', 'startedAt', 'endedAt', 'durationMs', 'flag', 'userAgent', 'screen', 'pageOrigin'];
const CARD_HEADERS = ['receivedAt', 'sessionId', 'participantId', 'isTest', 'day', 'position', 'cardId', 'targetWord',
  'dwellMs', 'flipCount', 'firstFlipMs', 'playCount', 'playMs', 'videoError'];
const DAYS = 7;

/* ───────── 頁面 ───────── */

function doGet(e) {
  const view = String((e && e.parameter && e.parameter.view) || '').toLowerCase();
  if (view === 'staff') return page_('staff', '施測者 · Spec');   // 頁面本身不含資料，資料要密碼換到的通行碼才拿得到
  if (e && e.parameter && e.parameter.p) return page_('participant', '今天的單字');
  return page_('home', 'Spec 單字學習研究');
}

function page_(name, title) {
  const tpl = HtmlService.createTemplateFromFile(name);
  tpl.baseUrl = ScriptApp.getService().getUrl();   // 首頁用來組出受試者和施測者頁的網址
  return tpl.evaluate()
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 在 HTML 裡用 <?!= include('config'); ?> 把共用檔案嵌進來 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ───────── 設定 ───────── */

// HtmlService 讀檔時會拿掉註解（包括 /*CONFIG*/ 和 /*END*/），所以直接執行 <script> 裡的程式取出 CONFIG
function config_() {
  const html = include('config');
  const a = html.indexOf('>', html.indexOf('<script')) + 1;
  const b = html.indexOf('</script>', a);
  return new Function(html.slice(a, b) + '\nreturn CONFIG;')();
}

/* ───────── 施測者密碼 ───────── */

const TOKEN_HOURS = 6;
const MAX_FAILS = 10;        // 10 分鐘內錯 10 次就暫停 10 分鐘

/** 施測者輸入密碼；對了就回傳通行碼（6 小時內有效），之後讀資料都帶著它 */
function verifyStaff(password) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('staff-fails') || 0);
  if (fails >= MAX_FAILS) throw new Error('密碼錯太多次，請 10 分鐘後再試');
  const expected = String(PropertiesService.getScriptProperties().getProperty('STAFF_PASSWORD') || '');
  if (!expected) throw new Error('還沒設定施測者密碼（STAFF_PASSWORD）');
  if (String(password || '') !== expected) {
    cache.put('staff-fails', String(fails + 1), 600);
    throw new Error('密碼不對');
  }
  const token = Utilities.getUuid();
  cache.put('staff:' + token, '1', TOKEN_HOURS * 3600);
  return { token: token, hours: TOKEN_HOURS };
}

function checkToken_(token) {
  if (!token || !CacheService.getScriptCache().get('staff:' + token)) throw new Error('需要重新輸入密碼');
}

/* ───────── 試算表 ───────── */

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(name, headers) {
  const sh = sheet_(name, headers);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const values = sh.getRange(2, 1, n - 1, headers.length).getValues();
  const tz = Session.getScriptTimeZone();
  return values.map(r => {
    const o = {};
    headers.forEach((h, i) => {
      const v = r[i];
      if (!(v instanceof Date)) o[h] = v;
      else if (h === 'localDate') o[h] = Utilities.formatDate(v, tz, 'yyyy-MM-dd');   // 萬一被轉成日期，轉回當地日期文字
      else o[h] = v.toISOString();
    });
    return o;
  });
}

/** 正式紀錄：不是測試、也不是重複的那一次 */
function isReal_(s, pid) {
  return s.participantId === pid && s.isTest !== true && String(s.isTest).toUpperCase() !== 'TRUE' && s.flag !== 'duplicate';
}

function realSessions_(pid) {
  return rows_('Sessions', SESSION_HEADERS).filter(s => isReal_(s, pid));
}

/** 這些正式紀錄裡已經學過的卡片 id */
function learnedCardIds_(sessions) {
  const ids = {};
  sessions.forEach(s => { ids[s.sessionId] = true; });
  return rows_('Cards', CARD_HEADERS).filter(c => ids[c.sessionId]).map(c => String(c.cardId));
}

/* ───────── 受試者頁呼叫 ───────── */

/**
 * 回傳受試者的進度：今天是第幾天、今天（當地日期）做過了沒。
 * localDate 由瀏覽器送來（受試者當地的 YYYY-MM-DD）。
 */
function getStatus(pid, today) {
  const cfg = config_();
  const p = cfg.participants[pid];
  if (!p) return { known: false };
  const sessions = realSessions_(pid);
  const completedDays = sessions.length;
  return {
    known: true,
    group: p.group,
    sequence: p.sequence,
    learnedCardIds: learnedCardIds_(sessions),
    completedDays: completedDays,
    nextDay: Math.min(completedDays + 1, DAYS + 1),
    doneToday: sessions.some(s => String(s.localDate) === String(today)),
    allDone: completedDays >= DAYS
  };
}

/** 收一次學習紀錄。sessionId 由瀏覽器產生，重送同一筆不會寫兩次。 */
function submitSession(rec) {
  if (!rec || !rec.sessionId || !rec.participantId || !Array.isArray(rec.cards)) throw new Error('紀錄格式不對');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sessionsSheet = sheet_('Sessions', SESSION_HEADERS);
    const existing = rows_('Sessions', SESSION_HEADERS);
    if (existing.some(s => s.sessionId === rec.sessionId)) return { ok: true, duplicateSubmit: true };

    const cfg = config_();
    const isTest = /^TEST/i.test(rec.participantId);
    if (!isTest && !cfg.participants[rec.participantId]) throw new Error('不認識的受試者編號：' + rec.participantId);

    let flag = '';
    let expectedDay = '';
    if (!isTest) {
      const real = existing.filter(s => isReal_(s, rec.participantId));
      expectedDay = Math.min(real.length + 1, DAYS + 1);
      if (real.some(s => String(s.localDate) === String(rec.localDate)) || real.length >= DAYS) flag = 'duplicate';
      else if (Number(rec.day) !== expectedDay) flag = 'day-mismatch';
      else {
        // 卡片必須是這組的字，而且還沒學過
        const allowed = (cfg.words[cfg.participants[rec.participantId].group] || []);
        const learned = learnedCardIds_(real);
        if (rec.cards.some(c => allowed.indexOf(c.cardId) < 0 || learned.indexOf(c.cardId) >= 0)) flag = 'card-mismatch';
      }
    }

    const now = new Date();
    // 開頭的 ' 讓試算表把日期和時間存成文字，不會自動轉成日期（轉了會依時區跑掉一天）
    sessionsSheet.appendRow([now, rec.sessionId, rec.participantId, isTest, rec.day, expectedDay, rec.group, rec.sequence,
      rec.firstActivity, rec.chosenCategory || '', "'" + rec.localDate, rec.timezone, "'" + rec.startedAt, "'" + rec.endedAt, rec.durationMs, flag,
      rec.userAgent, rec.screen, rec.pageOrigin]);

    const cardRows = rec.cards.map(c => [now, rec.sessionId, rec.participantId, isTest, rec.day, c.position, c.cardId,
      c.targetWord, c.dwellMs, c.flipCount, c.firstFlipMs, c.playCount, c.playMs, c.videoError || '']);
    if (cardRows.length) {
      const cardsSheet = sheet_('Cards', CARD_HEADERS);
      cardsSheet.getRange(cardsSheet.getLastRow() + 1, 1, cardRows.length, CARD_HEADERS.length).setValues(cardRows);
    }
    return { ok: true, flag: flag };
  } finally {
    lock.releaseLock();
  }
}

/* ───────── 施測者頁呼叫 ───────── */

function getProgress(token) {
  checkToken_(token);
  return {
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    sessions: rows_('Sessions', SESSION_HEADERS),
    cards: rows_('Cards', CARD_HEADERS)
  };
}

/* ───────── 清除資料（施測者頁） ───────── */

const CLEAR_PHRASE = { test: '刪除', participant: '刪除', all: '刪除全部' };

/**
 * 刪除 Sessions 和 Cards 裡符合範圍的列。
 * scope：'test'（只刪 TEST）、'participant'（某位受試者的全部紀錄，含他的 TEST 以外的）、'all'（全部）
 * confirmText 必須和頁面上要求輸入的字一樣，伺服器再檢查一次。
 * 刪除前會先把兩個分頁整份複製成備份分頁，誤刪時可以從備份貼回來。
 */
function clearData(token, scope, pid, confirmText) {
  checkToken_(token);
  if (!CLEAR_PHRASE[scope]) throw new Error('不認識的清除範圍');
  if (String(confirmText || '').trim() !== CLEAR_PHRASE[scope]) throw new Error('確認文字不對，沒有刪除任何資料');
  if (scope === 'participant' && !pid) throw new Error('請選擇受試者');

  const isTestRow = v => v === true || String(v).toUpperCase() === 'TRUE';
  const match = (participantId, isTest) =>
    scope === 'all' || (scope === 'test' ? isTestRow(isTest) : String(participantId) === String(pid));

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targets = [
      { sheet: sheet_('Sessions', SESSION_HEADERS), width: SESSION_HEADERS.length,
        pidCol: SESSION_HEADERS.indexOf('participantId'), testCol: SESSION_HEADERS.indexOf('isTest') },
      { sheet: sheet_('Cards', CARD_HEADERS), width: CARD_HEADERS.length,
        pidCol: CARD_HEADERS.indexOf('participantId'), testCol: CARD_HEADERS.indexOf('isTest') }
    ];
    // 先算要刪幾列；一列都沒有就不動試算表、也不做備份
    targets.forEach(t => {
      const n = t.sheet.getLastRow() - 1;
      t.rows = n > 0 ? t.sheet.getRange(2, 1, n, t.width).getValues() : [];
      // 寫回時，像日期的文字（localDate、startedAt…）前面加 ' ，不然會被試算表轉成日期
      t.keep = t.rows.filter(r => !match(r[t.pidCol], r[t.testCol]))
        .map(r => r.map(v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) ? "'" + v : v));
      t.removed = t.rows.length - t.keep.length;
    });
    const result = { sessions: targets[0].removed, cards: targets[1].removed, backups: [] };
    if (!result.sessions && !result.cards) return result;

    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    targets.forEach(t => {
      const name = '備份 ' + t.sheet.getName() + ' ' + stamp;
      t.sheet.copyTo(ss).setName(name);
      result.backups.push(name);
    });
    targets.forEach(t => {
      if (!t.rows.length) return;
      t.sheet.getRange(2, 1, t.rows.length, t.width).clearContent();
      if (t.keep.length) t.sheet.getRange(2, 1, t.keep.length, t.width).setValues(t.keep);
    });
    return result;
  } finally {
    lock.releaseLock();
  }
}
