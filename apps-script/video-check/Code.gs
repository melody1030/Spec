/**
 * 影片播放檢查 — Google Apps Script Web App
 *
 * 用途：在受試者（台灣、美國）的電腦上試播 9 支 Shorts，
 * 確認放在 Apps Script 網址底下時 YouTube 會不會擋，結果寫進這份試算表的「video_check」分頁。
 * 部署步驟見同資料夾的 DEPLOY.md。
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('影片播放檢查')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

const HEADERS = ['receivedAt', 'participant', 'runId', 'timezone', 'localTime', 'userAgent',
                 'screen', 'pageOrigin', 'host', 'videoId', 'title', 'status', 'errorCode', 'ms'];

/** 由 index.html 呼叫：一次寫入一輪檢查的所有結果（每支影片 × 每個 host 一列） */
function logResults(run) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('video_check') || ss.insertSheet('video_check');
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const now = new Date();
  const rows = run.results.map(r => [
    now, run.participant, run.runId, run.timezone, run.localTime, run.userAgent,
    run.screen, run.pageOrigin, r.host, r.videoId, r.title, r.status, r.errorCode, r.ms
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  return rows.length;
}
