# Game Design — Lanburger

> **狀態：已核准（2026-11-05）。**
> 這份文件取代舊版的 Lingua Quest 橫向捲軸設計（舊版保留在 git 歷史 `8465ef7`）。
> 相關文件：`ART_DIRECTION.md`、`WORLD_MAP.md`、`LEARNING_SYSTEM.md`、`PROGRESSION_SYSTEM.md`、`MINIGAMES.md`、`IMPLEMENTATION_PLAN.md`。

## 1. 一句話

**Lanburger** 是一款以故事驅動的語言學習 RPG。玩家扮演漢堡主角 Lanburger，在俯視角的像素奇幻村莊裡自由走動、走進建築、跟有個性的 NPC 對話。玩家在真實情境的任務裡學會一門語言，並讓 Lanburger 一路「長大」。

它要感覺像一款真正的冒險遊戲，而不是套了遊戲外皮的學習儀表板。

## 2. 設計支柱

1. **先是冒險，再是課程。** 每個學習片段都由 NPC、地點和劇情引出，不會憑空跳出測驗。
2. **先教，再練。** 沒教過的內容不會拿來考（見 `LEARNING_SYSTEM.md`）。
3. **溫暖，不懲罰。** 答錯會得到說明和重試機會。體力歸零時，一定有免費的練習可以把體力補回來。永遠不會卡死。
4. **一個世界，一套系統。** RPG、三個小遊戲、存檔、成長都在同一個世界、同一套美術規範裡。
5. **手機橫向優先。** 所有系統都能用兩根拇指操作。桌機用鍵盤。

## 3. 核心循環

```
探索 → 遇見 NPC → 學習（Teach）→ 練習（Practice）→ 完成任務
  ▲                                                   │
  │                                                   ▼
解鎖新地區 ◀── 成長（等級、漢堡配料）◀── 獲得獎勵（XP、金幣、物品）
```

- 一次遊玩 5–15 分鐘，至少完成一個任務步驟。
- 複習（間隔重複）是循環中隨時可以插入的支線，不會擋住主線。

## 4. 主角：Lanburger

- 原創的漢堡主題主角，Q 版大頭比例。外型方向待核准，見 `ART_DIRECTION.md` §5。
- **成長看得見**：等級提升會改變漢堡的「階段」，精通主題會解鎖配料（生菜、起司、番茄……），直接顯示在角色身上。見 `PROGRESSION_SYSTEM.md` §5。
- 程式規則不變：角色美術只透過 `CharacterSpriteManifest` 進入遊戲，玩法程式碼不直接引用任何角色的圖檔。

## 5. 世界與探索

- **俯視角 RPG**：稍微抬高的俯視視角（3/4 俯視，看得到建築正面和屋頂）。**不是**橫向捲軸平台遊戲。
- 玩家可以八方向自由走動、走進建築（室內是獨立地圖）、跟 NPC 對話、調查物件、發現任務、解鎖道路和新區域、在村莊之間旅行。
- 每個**村莊**代表一個大的真實生活情境，每棟**建築**代表一個學習主題。起始村莊是 **Hello Town**，詳細配置見 `WORLD_MAP.md`。

## 6. 主線故事（Hello Town 篇）

> 草案，可以再調整語氣和細節。

Hello Town 廣場上有五盞 **Word Lanterns（話語燈籠）**，每盞燈代表一種日常對話的力量。某天燈籠全熄了，鎮民開始忘記怎麼打招呼、點餐、問路。Travel Station 也因此停駛，跟外面的村莊斷了聯繫。

Lanburger 剛從 Burger Bistro 的傳說烤爐誕生，還不太會說話。鎮長請 Lanburger 跟鎮上的人學習，重新點亮燈籠。

- 每精通一個主題（Greetings、Food、Shopping、Directions、Everyday Talk），就點亮一盞燈籠。
- 五盞全亮後，Travel Station 恢復運作，通往下一個村莊。
- 點亮的燈籠會改變廣場的光線，進度直接表現在世界裡。

## 7. 操作

| 動作 | 鍵盤 | 觸控（橫向） |
| ---- | ---- | ------------ |
| 移動（八方向） | 方向鍵 / WASD | 左拇指浮動搖桿 |
| 對話 / 調查 / 確認 | E / Enter / Space | 右拇指 **Talk**（靠近物件時顯示對應文字） |
| 取消 / 返回 | Esc / Backspace | 對話框外點擊或 **Back** |
| 快速選單（Quests、Bag、Learn、Collection、Settings） | Q、B、L、C、Esc | 右上角圖示按鈕 |
| 跑步（選用） | 按住 Shift | 搖桿推到底 |

舊版的「跳躍」和「穿越平台」會移除，因為俯視角用不到。

## 8. NPC

- 每個 NPC 有：id、英文顯示名稱、所在地圖與位置、sprite manifest、頭像 manifest（6 種表情）、對話圖、任務掛鉤、閒晃路徑。
- **表情**：Neutral、Happy、Surprised、Thinking、Worried、Celebrating。在對話框的頭像上完整呈現。在世界中用頭上的氣泡圖示（`!`、`?`、`…`、音符、汗滴、星星）暗示。
- 部分 NPC 以使用者朋友的外貌為基礎（已取得同意），轉成風格一致的 Q 版像素角色。流程見 `ART_DIRECTION.md` §6。
- NPC 頭上的 `!` 表示有新任務，`?` 表示任務可以回報，`…` 表示有閒聊可聊。

## 9. 系統總覽

| 系統 | 文件 |
| ---- | ---- |
| 學習：先教後練、回饋、重試、間隔重複 | `LEARNING_SYSTEM.md` |
| 任務、XP、等級、體力、精通度、村莊完成度、漢堡成長、存檔 | `PROGRESSION_SYSTEM.md` |
| Vocabulary Snake、Language Kart Racing、Language Cooking | `MINIGAMES.md` |
| 地圖、建築、解鎖路線 | `WORLD_MAP.md` |
| 美術、UI、光線、角色 | `ART_DIRECTION.md` |

## 10. 語言規則

- **學習語言**：English、Spanish、German、Japanese、Traditional Chinese (Taiwan)。舊版的 French 移除。
- **UI 語言**：初版**全部使用英文**，包括選單、按鈕、建築名稱、任務標籤。i18n 架構保留，之後可以加入其他 UI 語言。
- UI 語言和學習語言永遠分開：UI 字串放在 `src/i18n/`，學習內容放在內容包。
- 待決定：學習語言選 English 時，說明文字也是英文，等於沒有母語輔助。見 `IMPLEMENTATION_PLAN.md` §7 的待決問題。

## 11. 不做的事（目前範圍外）

- 戰鬥系統、HP 戰鬥。參考圖上的 HP/MP 條會換成 Energy/XP，見 `ART_DIRECTION.md` §7。
- 付費、等待計時器、抽卡。
- 多人連線、帳號系統（存檔只放在本機）。
