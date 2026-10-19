# dashboard

布丁仔個人工作台（GitHub Pages）。

## 只睇連結

擁有者按頁底「分享」，頁面複製一條只睇連結，並顯示「已複製連結」。連結形狀：

`https://puddingchau.github.io/dashboard/?view=1&exp=<到期>&t=<開始>#s=<當時的待辦同活動>`

整條連結保持喺 4096 字以內。iPhone Safari 複製或貼上超過呢個長度會切走後面，`#s=` 就會壞。所以連結只帶待辦，同埋同頁面種子唔同的活動，再用純 JS 壓縮。唔使 GitHub token，亦唔使 `CompressionStream`。如果放唔入 4096 字，會即刻顯示「未能帶上待辦，未有複製連結」，唔會交一條空白分享畀朋友。

朋友打開就可以睇按下「分享」當下的待辦同活動，唔使密碼。畫面係只睇：唔會寫入本機 dashboard 狀態，亦唔會寫入 Firebase 或 GitHub Pages。主題固定係雨窗咖啡。

連結由按下「分享」起計 3 小時失效（`exp`）。未過期時按鈕會變成「停止分享」。朋友頁面會再讀 [`share-config.json`](share-config.json)；如果閘門已關閉，而且 `updatedAt` 新過或等於呢次連結的 `t`，畫面會鎖住。`updatedAt` 為 0 唔算停止，所以一份關閉中的閘門唔會擋著更新的連結。

頁底冇 GitHub token 欄，亦冇「記住並更新」。唔使喺頁面貼上 `ghp_` token。按「分享」會先等緊進行中的 Firebase／日曆同步，再把當時的待辦同活動寫進連結的 `#s=`。朋友睇呢份快照；如果 Pages 上的 `sync-data.json` 比呢次 `t` 更舊，就唔會用佢。如果這部裝置之前已經記低 `dash-hub-pages-token`，分享同停止仍然會靜靜更新 `share-config.json`，並把同一份快照寫入 `sync-data.json`。冇 token 都一樣，連結本身已經有清單。

頁頂右側「推上線」同「立即同步」同一樣式。一按就用已記住的 `dash-hub-pages-token`，把而家畫面的待辦、活動等同步快照寫入 `sync-data.json`。成功顯示「已推上線」；冇 token 顯示「未有 token，無法推」，唔會彈出 token 表單。

冇 `exp` 的舊連結 `?view=1`：閘門如果仲有 salt 同密碼雜湊，仍然要輸入密碼。雜湊係 `SHA-256(salt + 換行 + 密碼)`，明文唔會寫入閘門或同步檔。新的「分享」唔再產生密碼。

### 點樣撤銷

1. 按「停止分享」，或者等 3 小時，擁有者頁面會自動停止。
2. 連結過咗 `exp` 就會顯示「分享已結束」。停止分享如果更新到公開閘門（裝置上已有 token），朋友下次開啟或返到前景都會收起內容。
