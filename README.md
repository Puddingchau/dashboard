# dashboard

布丁仔個人工作台（GitHub Pages）。

## 只睇連結

`https://puddingchau.github.io/dashboard/?view=1`

連結本身冇密碼。朋友打開之後要輸入分享密碼，先至會載入 `sync-data.json`。密碼唔啱、未輸入、分享已關閉，或者超過 `shareExpiresAt`，畫面會鎖住，唔會顯示待辦、活動或 Drive 資料，亦唔會寫入本機 dashboard 狀態或 Google Drive。

閘門檔係 [`share-config.json`](share-config.json)（開關、salt、SHA-256、`shareExpiresAt`，冇明文密碼，亦冇待辦／活動）。雜湊係 `SHA-256(salt + 換行 + 密碼)`。

擁有者喺頁底可以：

- 按「分享」：每次都做齊兩件事。開新一組 4 位密碼、設定 3 小時後到期，複製 `?view=1` 連結同密碼，並且把而家的待辦、活動（個人同學校）、巴士站、捷徑同分類寫入 `sync-data.json` 推上 `main`。明文密碼只會出現喺你複製到的狀態，唔會寫入 `sync-data.json` 或 `share-config.json`。已連接 Google 時會先走「立即同步」，再用最新資料發佈；Google 離線就用本機資料。
- 分享緊時按「停止分享」：即刻設 `shareEnabled` 為 false，舊連結失效。停止分享唔會清走上次發佈的 `sync-data.json`；下一次按「分享」先會再發佈一份新快照。

到期時間寫入本機同 Drive 同步檔的 `share.expiresAt`，以及閘門的 `shareExpiresAt`。朋友頁面同閘門都會檢查呢個時間。

公開閘門同分享快照都要寫上 GitHub Pages，用同一個 `dash-hub-pages-token`。第一次按「分享」或「停止分享」若未有 repo token，頁面會問一次，並記在 `localStorage` 鍵 `dash-hub-pages-token`。之後同一部裝置每次按「分享」都會更新 `main` 上的 `share-config.json` 同 `sync-data.json`，並顯示連結同密碼。閘門推送失敗時狀態會寫明閘門未更新，唔會當成已經分享。快照推送失敗時狀態會寫明分享資料未更新。

### 點樣核對分享快照

1. 擁有者有待辦同個人活動，按「分享」（token 有效）。
2. 打開 `https://puddingchau.github.io/dashboard/sync-data.json`，確認 `todos` 有項目，`events` 入面有 `kind: "personal"`。
3. 用 `?view=1` 加剛複製的密碼解鎖，待辦列表同「個人活動」應見到同一批資料。

### 點樣撤銷

1. 按「停止分享」，或者等開啟後 3 小時自動停止。
2. 公開的 `share-config.json` 要變成 `shareEnabled: false`，或者 `shareExpiresAt` 已過。朋友下次開啟、或者個分頁返到前景，都會重新讀閘門。已開住的內容會收起。

而家倉庫入面的閘門係關閉，所以公開連結會顯示「分享已關閉」，直到你開啟分享並更新 `share-config.json`。
