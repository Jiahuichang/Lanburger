# Progression System — Lanburger

> **狀態：已核准（2026-11-05）。** 數值都是初稿，玩測後再調整。

## 1. 總覽

| 系統 | 目的 | 看得見的地方 |
| ---- | ---- | ------------ |
| 任務（Quests） | 引導玩家下一步做什麼 | 左側任務追蹤面板、NPC 頭上的 `!` 和 `?` |
| XP 與等級 | 長期成就感 | HUD 的 Lv 和 XP 條 |
| 體力（Energy） | 讓答題有一點重量，但不擋路 | HUD 的 Energy 條 |
| 主題精通度（Mastery） | 學習成果 | Learn 畫面、建築招牌上的星星 |
| 村莊完成度 | 階段性目標 | Word Lanterns、小地圖 |
| 漢堡成長（Burger Growth） | 角色看得到的變化 | Lanburger 的外型 |
| 金幣與物品 | 小獎勵、收集 | Bag、Collection |

## 2. 任務

### 2.1 任務類型
- **Main Quest**：主線，推進劇情和解鎖。一次只有一個進行中的主線步驟。
- **Side Quest**：支線，NPC 的小請求，給額外 XP 和收藏品。
- **Building Quest**：每棟建築的主題課程，完成後點亮對應的燈籠。

### 2.2 步驟類型
沿用並擴充現有的 `QuestStepType`：

| 步驟 | 完成條件 |
| ---- | -------- |
| `talk` | 跟指定 NPC 對話 |
| `explore` | 走到指定地點（`trigger`） |
| `learn` | 完成一個學習片段 |
| `practice` | 完成一輪練習或情境對話 |
| `minigame` | 完成一場小遊戲（任何分數都算完成；高分有額外獎勵） |
| `deliver` | 把物品交給 NPC |
| `review` | 完成一輪複習 |
| `count` | 累計型，例如 "Explore 3 Locations 0/3" |

### 2.3 狀態
`locked → available → active(stepIndex, counters) → complete`，存在存檔裡。

### 2.4 防卡關規則
- 任何步驟都**不需要達到某個分數**才能完成。分數只影響獎勵多寡。
- 任務追蹤面板永遠顯示下一步，以及要去哪裡（小地圖上有標記）。
- 失敗或離開都不會讓任務退回前一步。

## 3. 體力（Energy）

| 規則 | 數值（草案） |
| ---- | ------------ |
| 上限 | 20 |
| 答錯一題 | −1 |
| 答對、對話、探索、教學步驟、複習 | 0（不扣） |
| 小遊戲一般模式 | −2 |
| 時間自然回復 | +1 / 3 分鐘（保留舊版設定，只是額外好處，**不是**唯一的回復方式） |
| 升級 | 補滿 |
| **Practice Corner / 免費練習** | 每完成一輪（8 題）+5，不需要等待、不需要付費 |

**體力歸零時**：
- 還是可以探索、對話、看教學、複習。
- 需要作答的任務步驟，會改成**練習模式**：一樣能完成任務，只是答錯不扣體力（因為已經是 0），XP 減半。
- 畫面會溫和提示："Out of energy! Practice at the Academy to recharge — it's free."，並在小地圖標出 Practice Corner。
- 永遠有路可以往前走，不需要等待，也不需要付費。

## 4. XP 與等級

| 來源 | XP（草案） |
| ---- | ---------- |
| 答對（第一次就答對） | 3 |
| 重試後答對 | 1 |
| 完成學習片段 | 15 |
| 完成複習一輪 | 10 |
| 完成任務步驟 | 10 |
| 完成 Building Quest | 40 |
| 完成 Main Quest | 60 |
| 小遊戲 | 依分數 10–40 |

- 升級所需：`xpToNext(level) = 40 + 20 × (level − 1)`（沿用現有公式）。
- 升級：補滿體力、慶祝動畫，每 5 級漢堡成長一階（見 §5）。
- 等級**不會**擋住學習內容，只解鎖外觀和少數支線。

## 5. 漢堡成長（Burger Growth）

假設主角走「漢堡生物」方向（`ART_DIRECTION.md` §5-A）。如果選人類方向，就改成服裝和配件。

### 5.1 階段（依等級）

| 階段 | 等級 | 外型 |
| ---- | ---- | ---- |
| Slider | 1–4 | 小小的迷你漢堡 |
| Classic | 5–9 | 標準大小，麵包有芝麻 |
| Double | 10–14 | 雙層肉排，比較高 |
| Deluxe | 15+ | 有廚師帽或小披風 |

### 5.2 配料（依主題精通）
每個 Hello Town 主題達到 1 星，就解鎖一種配料，直接疊在 Lanburger 身上：

| 主題 | 配料 |
| ---- | ---- |
| Greetings | Lettuce |
| Food & Ordering | Cheese |
| Shopping | Tomato |
| Directions | Pickle |
| Everyday Talk | Onion |

- 配料可以在 Bag 裡自由開關（外觀選擇）。
- 技術上用「紙娃娃」的疊圖：每種配料一張 sprite sheet，跟本體同樣的格子和動畫。

## 6. 主題精通度

- 每個主題的精通度 = 該主題所有詞彙的 Leitner 箱數平均。
- 星等：★ 完成 Building Quest；★★ 精通度 ≥ 60%；★★★ 所有詞彙都到第 4 箱以上。
- 建築招牌上顯示星星，Learn 畫面有詳細列表。

## 7. 村莊完成度

- Hello Town 完成 = 五個主題都 ≥ ★，而且主線完成。
- 進度以 **Word Lanterns** 呈現：每個主題 ★ 就點亮一盞。
- 五盞全亮：Travel Station 開放，加上一段劇情，前往下一個村莊。
- 小地圖標題旁顯示 `Lanterns 2/5` 之類的進度。

## 8. 金幣與物品

- 金幣（名稱暫定 **Sesame Coins**）：任務和小遊戲獎勵，可以在 General Store 買外觀道具和小遊戲裝飾。**不能**用來買學習內容或跳過任何東西。
- 物品類別：quest items（不能丟）、ingredients（Cooking）、kart parts（Kart）、keepsakes（收藏品）、cosmetics（外觀）。

## 9. 存檔

- 存在本機 `localStorage`，自動存檔（每幾秒、換場景時、分頁隱藏時）。
- 存檔結構會從 v1 升到 **v2**，需要 migration（`src/save/SaveSystem.ts`）。主要變更：
  - `location`：`mapId` 從 `mossbrook` 改成 `hello-town`；`facing` 從 `1 | -1` 改成 `'up' | 'down' | 'left' | 'right'`；舊座標不適用，會重設到出生點。
  - `profile.targetLanguage`：`fr` 已移除，舊存檔如果是 `fr`，會改成預設值並提示玩家重新選擇。
  - `profile.uiLanguage`：初版固定 `en`。
  - `stats.acorns` → `stats.coins`。
  - 新增：`lanterns`、`topicMastery`、`burger`（stage、toppings、equipped）、`flags`（劇情旗標）、`seenDialogues`、`unlockedBuildings`。
- 舊的 Phase 1 存檔只有位置和設定，沒有學習進度，所以 migration 只是保留設定，不會損失任何進度。
