# dashboard

小布丁個人工作台（GitHub Pages）。

## 只睇連結

擁有者按頁底「分享」，頁面複製一條只睇連結，並顯示「已複製連結」。連結形狀：

`https://puddingchau.github.io/dashboard/?view=1&exp=<到期>&t=<開始>#s=<當時的待辦同活動>`

整條連結保持喺 4096 字以內。iPhone Safari 複製或貼上超過呢個長度會切走後面，`#s=` 就會壞。所以連結只帶待辦，同埋同頁面種子唔同的活動，再用純 JS 壓縮。唔使 GitHub token，亦唔使 `CompressionStream`。如果放唔入 4096 字，會即刻顯示「未能帶上待辦，未有複製連結」，唔會交一條空白分享畀朋友。

朋友打開就可以睇按下「分享」當下的待辦同活動，唔使密碼。畫面係只睇：唔會寫入本機 dashboard 狀態，亦唔會寫入 Firebase 或 GitHub Pages。只睇畫面用雨窗咖啡。擁有者仍然可以用頁頂圓點揀返普羅旺斯田野、陽光海灘同其他主題。今次更新會將未到 schema 13 的裝置轉返雨窗咖啡一次；之後再揀的主題會留低。

連結由按下「分享」起計 3 小時失效（`exp`）。未過期時按鈕會變成「停止分享」。朋友頁面會再讀 [`share-config.json`](share-config.json)；如果閘門已關閉，而且 `updatedAt` 新過或等於呢次連結的 `t`，畫面會鎖住。`updatedAt` 為 0 唔算停止，所以一份關閉中的閘門唔會擋著更新的連結。

頁底冇 GitHub token 欄，亦冇「記住並更新」。唔使喺頁面貼上 `ghp_` token。按「分享」會先等緊進行中的 Firebase／日曆同步，再把當時的待辦同活動寫進連結的 `#s=`。朋友睇呢份快照；如果 Pages 上的 `sync-data.json` 比呢次 `t` 更舊，就唔會用佢。如果這部裝置之前已經記低 `dash-hub-pages-token`，分享同停止仍然會靜靜更新 `share-config.json`，並把同一份快照寫入 `sync-data.json`。冇 token 都一樣，連結本身已經有清單。

頁頂右側「推上線」同「立即同步」同一樣式。一按就用已記住的 `dash-hub-pages-token`，把而家畫面的待辦、活動等同步快照寫入 `sync-data.json`。成功顯示「已推上線」；冇 token 顯示「未有 token，無法推」，唔會彈出 token 表單。

冇 `exp` 的舊連結 `?view=1`：閘門如果仲有 salt 同密碼雜湊，仍然要輸入密碼。雜湊係 `SHA-256(salt + 換行 + 密碼)`，明文唔會寫入閘門或同步檔。新的「分享」唔再產生密碼。

### 點樣撤銷

1. 按「停止分享」，或者等 3 小時，擁有者頁面會自動停止。
2. 連結過咗 `exp` 就會顯示「分享已結束」。停止分享如果更新到公開閘門（裝置上已有 token），朋友下次開啟或返到前景都會收起內容。

## 遊戲

- [三年級「五位數」大冒險](https://puddingchau.github.io/dashboard/games/p3-five-digit/)
- [三年級「時間」大冒險](https://puddingchau.github.io/dashboard/games/p3-time/)
- [小學數學科三年級 - 乘法大對決](https://puddingchau.github.io/dashboard/games/p3-multiply/)
- [天水圍官立小學 - 虛擬顯微鏡實驗室 (6LF2)](https://puddingchau.github.io/dashboard/games/p6-microscope/)
- [六年級 科學科 辨識動植物細胞 (6LF3)](https://puddingchau.github.io/dashboard/games/p6-cell-id/)
- [六年級 科學科 使用顯微鏡觀察動植物的細胞 (6LF2)](https://puddingchau.github.io/dashboard/games/p6-observe-cells/)
- [三年級「長度」大冒險](https://puddingchau.github.io/dashboard/games/p3-length/)
- [三年級「公里和毫米」大冒險](https://puddingchau.github.io/dashboard/games/p3-km-mm/)
- [細胞解密大挑戰](https://puddingchau.github.io/dashboard/games/p6-cell-quiz/)
- [餵餵小怪獸 · 共用計分板](https://puddingchau.github.io/dashboard/games/feed-monster/)
- [害羞動物園 · Quiet Habitat](https://puddingchau.github.io/dashboard/quiet-habitat/)
- [彈床倒數](https://puddingchau.github.io/dashboard/games/bed-timer/)

## 活動附件

個人活動同學校活動可以上載原本的檔案（PDF、圖片、文件等）。檔案放喺已連接 Google 帳戶的「我的雲端硬碟」，資料夾名叫「小布丁活動附件」，每個活動一個子資料夾。檔案保持私人，唔會設成「知道連結的任何人」。

待辦同活動清單仍然只經 Firebase／Firestore 同步。Firestore 同本機 `dash-hub-v1` 只記檔名、類型、大小、上載時間同 Drive 檔案 id。檔案內容、data URL、base64 同下載網址唔會寫入同步文件。每個檔案上限 10MB，每個活動最多 5 個。

要登入 Firebase，先可以上載，清單先可以跨裝置同步。未登入唔會把檔案留喺該瀏覽器。上載同開啟另外要按「連接 Drive（附件）」；呢個授權只在按下上載、開啟或連接時先要求 `drive.file`，同 Calendar 的登入分開。第一次使用要自己按一次連接，並揀用於放附件的 Google 帳戶。

個人活動同學校活動的清單會把圖片顯示成縮圖。按縮圖或檔名就開原本的檔案，唔使先入編輯。未連接 Drive 時，縮圖位置仍然可以按，按一下先要求連接。非圖片就仍然是檔名按鈕。

刪除活動或移除附件時，如果 Drive 已連接，會把檔案丟進垃圾桶。Google Calendar 仍然只同步名稱、時間同工作備註。`?view=1` 分享連結同公開 `sync-data.json` 最多顯示檔名（圖片只是不能按的佔位），唔帶 Drive 檔案 id 或下載網址，亦唔可以從分享頁下載。

`ENABLE_DRIVE_SYNC` 維持關閉。清單唔會再經「布丁仔-sync.json」同步。唔使開通 Firebase Storage，亦唔使升級 Blaze。

## Notes

培訓卡片上面有 Notes。呢度用正方格放經常要開的圖片或文件，唔係記事簿。按「上載」選檔之後要先輸入 Note 名，留空唔會儲存。已經有標籤的項目會用該標籤做名。標籤留空的舊項目會顯示「未命名」，要自己輸入名稱，唔會自動用檔名。之後畫面只顯示 Note 名，可以隨時改。

圖片的方格顯示縮圖，PDF 或其他文件用簡單方格加名稱。按方格開啟原本。長按或拖曳可以調位，次序用 `sortOrder` 同 `orderUpdatedAt` 經 Firebase 同步，較新的次序為準，所以重新整理或其他裝置唔會打亂剛排好的次序。刪除前會先問一次。

檔案放喺同一個私人 Google Drive 資料夾「小布丁活動附件」裡面的「Notes」，每個檔案一個子資料夾，唔會設成「知道連結的任何人」。上載同開啟用返活動附件那個「連接 Drive（附件）」／「轉換 Drive 帳戶」，已連接就唔會再登入一次。清單（Note 名、檔名、Drive 檔案 id、次序）經 Firebase 同步，畫面本身唔顯示檔名。刪除會寫入 `deletedIds`，所以重新整理或其他裝置唔會把已刪的檔案帶回。

每個檔案上限 10MB，最多 30 個。`?view=1` 同公開 `sync-data.json` 只顯示 Note 名，沒有檔名、沒有開啟連結，亦沒有上載、刪除或調位。分享連結放得下的時候亦只帶 Note 名。Notes 唔會寫入 Google Calendar。`ENABLE_DRIVE_SYNC` 維持關閉。
