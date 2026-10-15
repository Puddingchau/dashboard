# dashboard

布丁仔個人工作台（GitHub Pages）。

## 只睇連結

`https://puddingchau.github.io/dashboard/?view=1`

連結本身冇密碼。朋友打開之後要輸入分享密碼，先至會載入 `sync-data.json`。密碼唔啱、未輸入、分享已關閉，或者超過 `shareExpiresAt`，畫面會鎖住，唔會顯示待辦、活動或 Drive 資料，亦唔會寫入本機 dashboard 狀態或 Google Drive。

閘門檔係 [`share-config.json`](share-config.json)（開關、salt、SHA-256、`shareExpiresAt`，冇明文密碼，亦冇待辦／活動）。雜湊係 `SHA-256(salt + 換行 + 密碼)`。

擁有者喺頁底可以：

- 按「分享」：開啟只睇、沿用已有密碼或自動產生一組 4 位密碼、設定 3 小時後到期，並複製 `?view=1` 連結
- 分享緊時按「停止分享」：即刻設 `shareEnabled` 為 false，舊連結失效

到期時間寫入本機同 Drive 同步檔的 `share.expiresAt`，以及閘門的 `shareExpiresAt`。朋友頁面同閘門都會檢查呢個時間。

要把閘門寫上 GitHub Pages，瀏覽器需要有 repo token（`localStorage` 鍵 `dash-hub-pages-token`）。有 token 時「分享」／「停止分享」會更新 `main` 上的 `share-config.json`。冇 token 時連結仍會複製，本機同 Drive 的分享狀態會更新，但公開頁要等 `share-config.json` 部署後朋友先會見到新閘門。

### 點樣撤銷

1. 按「停止分享」，或者等開啟後 3 小時自動停止。
2. 公開的 `share-config.json` 要變成 `shareEnabled: false`，或者 `shareExpiresAt` 已過。朋友下次開啟、或者個分頁返到前景，都會重新讀閘門。已開住的內容會收起。

而家倉庫入面的閘門係關閉，所以公開連結會顯示「分享已關閉」，直到你開啟分享並更新 `share-config.json`。
