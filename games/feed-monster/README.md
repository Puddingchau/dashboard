# 餵餵小怪獸 · 共用計分板

登入任何 Google 帳戶之後，大家讀寫**同一份**課堂計分板。未登入只可以喺呢部電腦玩，唔會寫入 Firestore。登出之後，之後嘅改動都只留喺呢部電腦。

儀表板同步仍然係 `users/{uid}/dashboard/sync`，呢個遊戲唔會寫去嗰度。

## Firestore 文件

`shared/feed-monster`

（collection `shared`，document `feed-monster`。Firestore 文件路徑要成雙數段，所以唔係 `shared/feed-monster/state`。）

欄位：`className`、`names`、`todayScores`、`soundOn`、`cumulativeByClass`、`updatedAt`。

如果共用文件**仲未存在**，第一次登入會用呢個帳戶舊嘅 `users/{uid}/games/feed-monster` 種一次上去。共用文件已經存在就唔會再讀舊個人文件。

本機離線快取仍然係 `localStorage` key `feed-the-monster-classroom-v2`。

## 要貼上 Firebase Console 嘅規則

專案：`pudding-dashboard-5d8c8`

打開 [Firestore 規則](https://console.firebase.google.com/project/pudding-dashboard-5d8c8/firestore/rules)，**加**下面呢段。唔好刪走現有嘅 `users/{uid}` 規則，亦唔好刪走如果已經有嘅 `cell_quiz_scores` 規則。未登入唔可以讀寫。

```
match /shared/feed-monster {
  allow read, write: if request.auth != null;
}
```

`firestore.rules` 重申咗擁有者先可以讀寫 `users/{uid}/{document=**}`，再加上面呢段。如果 Console 仲有其他 match（包括細胞解密嘅 `cell_quiz_scores`），先抄返入檔案先好將成份規則發佈，否則發佈會抹走 Console 獨有嘅 match。

對應嘅擁有者規則（儀表板同舊個人計分板，保持不變）：

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
