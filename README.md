# dashboard

布丁仔個人工作台（GitHub Pages）。

## 只睇連結

`https://puddingchau.github.io/dashboard/?view=1`

連結本身冇密碼。朋友打開之後要輸入分享密碼，先至會載入 `sync-data.json`。密碼唔啱、未輸入，或者分享已關閉，畫面會鎖住，唔會顯示待辦、活動或 Drive 資料，亦唔會寫入本機 dashboard 狀態或 Google Drive。

閘門檔係 [`share-config.json`](share-config.json)（只有開關、salt、SHA-256，冇明文密碼，亦冇待辦／活動）。雜湊係 `SHA-256(salt + 換行 + 密碼)`。

擁有者喺平常頁面可以：

- 剔選或取消「允許只睇分享」
- 設定或更改分享密碼，再按「儲存分享設定」（寫入本機同 Drive 同步檔的 `share`，唔會把明文密碼寫入網頁）
- 「複製只睇連結」複製 `origin + pathname + ?view=1`
- 「複製閘門設定」複製要貼上 `share-config.json` 的 JSON

### 點樣撤銷

1. 喺自己的頁面取消「允許只睇分享」，或者輸入新密碼再儲存（會換新 salt 同雜湊，舊密碼即刻對唔上）。
2. 按「複製閘門設定」，用嗰段 JSON 覆蓋網站上的 `share-config.json` 再部署。
3. 朋友下次開啟、或者個分頁返到前景，都會重新讀閘門。`shareEnabled` 係 false，或者雜湊變咗，舊密碼就入唔到。已開住的內容會收起。

而家倉庫入面的閘門係關閉，所以公開連結會顯示「分享已關閉」，直到你開啟分享並更新 `share-config.json`。
