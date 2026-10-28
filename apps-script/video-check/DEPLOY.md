# 影片播放檢查：部署成 Apps Script Web App

這個頁面會在使用者的電腦上試播研究用的 9 支 Shorts。它要回答一個問題：**把 prototype 放在 Google Apps Script Web App 上，YouTube 會不會擋影片？**

- 每支影片會用兩種播放器各試一次：
  - **播放器 A**：`youtube-nocookie.com`，也就是 prototype 現在用的。
  - **播放器 B**：一般的 `youtube.com`，當作備案。
- 結果自動寫進試算表的 `video_check` 分頁，每支影片 × 每種播放器一列。內容包括受試者編號、時區、瀏覽器、頁面網址和播放結果。

## 部署（約 10 分鐘，做一次就好）

1. 在 Google 雲端硬碟新增一份試算表，例如「Spec video check」。
2. 打開試算表，點選單「擴充功能 → Apps Script」。
3. 把編輯器裡的 `Code.gs` 內容全部刪掉，貼上這個資料夾的 [`Code.gs`](Code.gs)。
4. 在左邊「檔案」旁點「＋ → HTML」，檔名輸入 `index`（不要加 .html），把裡面的內容換成這個資料夾的 [`index.html`](index.html)。
5. 按儲存。
6. 右上角點「部署 → 新增部署作業」，左邊齒輪選「網頁應用程式」，然後設定：
   - **執行身分：我**（結果才能寫進你的試算表）
   - **誰可以存取：任何人**（受試者不用登入 Google）
7. 按「部署」並授權：
   - 第一次部署會要求授權存取試算表。
   - 如果出現「Google 尚未驗證這個應用程式」，點「進階 → 前往（不安全）」。這是你自己寫的程式，所以可以放心。
8. 複製「網頁應用程式」的網址，結尾是 `/exec`。

> **如果第 6 步沒有「任何人」可選：** 學校帳號（例如 cornell.edu）的管理員可能限制只能給同校的人使用。這時請改用個人 Gmail 帳號，從第 1 步重做一次。

## 測試和發送

1. **自己先測一次。** 在網址後面加上 `?p=TEST`，例如 `https://script.google.com/macros/s/……/exec?p=TEST`，打開後按「開始檢查」，大約 2 分鐘跑完。跑完到試算表確認多了 18 列。
2. **請在台灣和美國的團隊成員各測一次。**
3. **傳給受試者。** 每個人的網址後面加上自己的編號，例如 `…/exec?p=P01`，請他們用之後實際做研究的那台電腦、那個瀏覽器打開。

## 怎麼判讀結果

| 結果 | 代表什麼 | 下一步 |
| --- | --- | --- |
| 播放器 A 全部「可以播放」 | YouTube 不擋 Apps Script 的網址 | prototype 可以直接做成 Apps Script Web App |
| 有影片「被擋（錯誤 150 或 101）」 | 版權方不允許在這個網址嵌入（常見於音樂影片） | 看播放器 B 是不是可以播；兩個都被擋的話，改放 GitHub Pages，資料一樣用 Apps Script 送進試算表 |
| 「沒有開始播放」 | 通常是瀏覽器擋了自動播放，不一定是影片的問題 | 請那位受試者換一個瀏覽器（Chrome）再跑一次 |
| 其他錯誤代碼 | 影片被刪除、設為私人，或網路問題 | 截圖傳給 Melody |

`pageOrigin` 欄位記錄的是頁面實際所在的網址。Apps Script 頁面會顯示在 `….googleusercontent.com` 底下，YouTube 看到的也是這個網址。

## 本機預覽

這個 `index.html` 也可以在本機打開。在 repo 根目錄執行 `python3 -m http.server 8000`，然後打開 <http://localhost:8000/apps-script/video-check/index.html?p=TEST>。本機版本不會送出結果，只會印在瀏覽器的 console。
