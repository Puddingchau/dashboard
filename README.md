# dashboard

布丁仔個人工作台（GitHub Pages）。

## 只睇連結

`https://puddingchau.github.io/dashboard/?view=1`

連結本身冇密碼。朋友打開之後要輸入分享密碼，先至會顯示待辦同活動。密碼唔啱、未輸入，或者分享已關閉，畫面會鎖住，唔會顯示待辦、活動或 Drive 資料，亦唔會寫入本機 dashboard 狀態或 Google Drive。

閘門放喺 [`sync-data.json`](sync-data.json) 的 `share`（只有開關、salt、SHA-256，冇明文密碼）。雜湊係 `SHA-256(salt + 換行 + 密碼)`。朋友頁面先讀呢個欄；如果同步檔未有 `share`，先至讀後備檔 [`share-config.json`](share-config.json)。

頁底只有三個控制：

- 「允許只睇分享」
- 「分享密碼」（留空代表唔改現有密碼）
- 「儲存並複製連結」：寫入本機；已連接 Drive 就即時上傳同步檔；並複製上面條只睇連結

預設關閉。改密碼會換新 salt 同雜湊；關掉分享就令舊密碼入唔到。朋友下次開啟，或者個分頁返到前景，都會重新讀閘門。

### Drive → Pages

平日每小時把 Google Drive 的 `布丁仔-sync.json` 寫上網站時，必須原樣保留 `share`，寫入 Pages 的 `sync-data.json`：

```json
"share": { "enabled": false, "salt": "", "passwordHash": "", "updatedAt": 0 }
```

呢個就係朋友讀的閘門，一個檔案就夠。同步程序可以選擇同時覆寫 `share-config.json`（只作後備）：

```json
{
  "shareEnabled": false,
  "shareSalt": "",
  "sharePasswordHash": "",
  "updatedAt": 0
}
```

`shareEnabled` ← `share.enabled`，`shareSalt` ← `share.salt`，`sharePasswordHash` ← `share.passwordHash`。而家倉庫入面的閘門係關閉，所以公開連結會顯示「分享已關閉」，直到你開啟分享，而 Drive 同步把新閘門寫上 Pages。
