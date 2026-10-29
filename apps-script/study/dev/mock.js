// 本機預覽用的假後端：行為照 Code.gs，資料存在瀏覽器的 localStorage（只有這台電腦看得到）。
// 網址加 ?fail=1 可以模擬送出失敗；在 console 執行 MOCK_RESET() 清空資料。
// 本機的施測者密碼是 test。
(function () {
  const KEY = "spec-study-mock-db";
  const DAYS = 7;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { sessions: [], cards: [] }; } catch (e) { return { sessions: [], cards: [] }; } };
  const save = db => localStorage.setItem(KEY, JSON.stringify(db));
  const isReal = (s, pid) => s.participantId === pid && !s.isTest && s.flag !== "duplicate";
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const failSubmit = new URLSearchParams(location.search).get("fail") === "1";
  const learnedIds = (db, sessions) => {
    const ids = new Set(sessions.map(s => s.sessionId));
    return db.cards.filter(c => ids.has(c.sessionId)).map(c => c.cardId);
  };

  const handlers = {
    getStatus(pid, today) {
      const p = CONFIG.participants[pid];
      if (!p) return { known: false };
      const db = load();
      const real = db.sessions.filter(s => isReal(s, pid));
      return { known: true, group: p.group, sequence: p.sequence, learnedCardIds: learnedIds(db, real), completedDays: real.length,
        nextDay: Math.min(real.length + 1, DAYS + 1), doneToday: real.some(s => s.localDate === today), allDone: real.length >= DAYS };
    },
    submitSession(rec) {
      if (failSubmit) throw new Error("（模擬）網路錯誤");
      const db = load();
      if (db.sessions.some(s => s.sessionId === rec.sessionId)) return { ok: true, duplicateSubmit: true };
      const isTest = /^TEST/i.test(rec.participantId);
      if (!isTest && !CONFIG.participants[rec.participantId]) throw new Error("不認識的受試者編號：" + rec.participantId);
      let flag = "", expectedDay = "";
      if (!isTest) {
        const real = db.sessions.filter(s => isReal(s, rec.participantId));
        expectedDay = Math.min(real.length + 1, DAYS + 1);
        if (real.some(s => s.localDate === rec.localDate) || real.length >= DAYS) flag = "duplicate";
        else if (Number(rec.day) !== expectedDay) flag = "day-mismatch";
        else {
          const allowed = CONFIG.words[CONFIG.participants[rec.participantId].group] || [];
          const learned = learnedIds(db, real);
          if (rec.cards.some(c => !allowed.includes(c.cardId) || learned.includes(c.cardId))) flag = "card-mismatch";
        }
      }
      const receivedAt = new Date().toISOString();
      const { cards, ...rest } = rec;
      db.sessions.push(Object.assign({ receivedAt }, rest, { isTest, expectedDay, flag }));
      cards.forEach(c => db.cards.push(Object.assign({ receivedAt, sessionId: rec.sessionId, participantId: rec.participantId, isTest, day: rec.day }, c)));
      save(db);
      return { ok: true, flag };
    },
    verifyStaff(password) {
      if (password !== "test") throw new Error("密碼不對");
      const token = "dev-" + Date.now().toString(36);
      sessionStorage.setItem("mock-staff-token", token);
      return { token, hours: 6 };
    },
    clearData(token, scope, pid, confirmText) {
      if (!token || token !== sessionStorage.getItem("mock-staff-token")) throw new Error("需要重新輸入密碼");
      const phrase = { test: "刪除", participant: "刪除", all: "刪除全部" }[scope];
      if (!phrase) throw new Error("不認識的清除範圍");
      if (String(confirmText || "").trim() !== phrase) throw new Error("確認文字不對，沒有刪除任何資料");
      if (scope === "participant" && !pid) throw new Error("請選擇受試者");
      const match = r => scope === "all" || (scope === "test" ? !!r.isTest : r.participantId === pid);
      const db = load();
      const removedS = db.sessions.filter(match).length, removedC = db.cards.filter(match).length;
      if (!removedS && !removedC) return { sessions: 0, cards: 0, backups: [] };
      const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
      const backups = JSON.parse(localStorage.getItem(KEY + "-backups") || "[]");
      backups.push({ stamp, db: JSON.parse(JSON.stringify(db)) });
      localStorage.setItem(KEY + "-backups", JSON.stringify(backups));
      db.sessions = db.sessions.filter(r => !match(r));
      db.cards = db.cards.filter(r => !match(r));
      save(db);
      return { sessions: removedS, cards: removedC, backups: ["備份 Sessions " + stamp, "備份 Cards " + stamp] };
    },
    getProgress(token) {
      if (!token || token !== sessionStorage.getItem("mock-staff-token")) throw new Error("需要重新輸入密碼");
      const db = load();
      return { sheetUrl: "#", sessions: db.sessions, cards: db.cards };
    }
  };

  window.MOCK_API = {
    mode: "mock",
    async call(fn, ...args) {
      await wait(250);
      if (!handlers[fn]) throw new Error("沒有這個函式：" + fn);
      return JSON.parse(JSON.stringify(handlers[fn](...args)));
    },
    params: () => Promise.resolve(Object.fromEntries(new URLSearchParams(location.search)))
  };

  window.MOCK_RESET = () => { localStorage.removeItem(KEY); localStorage.removeItem("spec-study-pending"); };
  // 測試用：把所有紀錄的當地日期往前推 n 天，不用等到明天就能試下一天
  window.MOCK_SHIFT_DAYS = n => {
    const db = load();
    db.sessions.forEach(s => {
      const d = new Date(s.localDate + "T12:00:00");
      d.setDate(d.getDate() - n);
      s.localDate = d.toISOString().slice(0, 10);
    });
    save(db);
  };
})();
