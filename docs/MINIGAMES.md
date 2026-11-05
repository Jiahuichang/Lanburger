# Mini-games — Lanburger

> **狀態：已核准（2026-11-05）。** 核准後取代 `MINIGAME_DESIGN.md`。
> 舊版的共用框架（`src/minigames/types.ts`：`MiniGameConfig`、`MiniGameResult`、`MiniGame`）方向正確，會保留並擴充「村莊主題」。

## 1. 設計原則

1. **一套核心邏輯，多種村莊主題。** 每個小遊戲只寫一次規則。不同村莊只換「主題資料」（美術、道具、音樂、文字）和「內容」（題目來自哪個主題的詞彙）。
2. **從世界裡進入。** 透過 NPC 或地點進入（Burger Bistro 的櫃台、Racing Garage 的賽車），結束後回到原地。
3. **只考教過的內容。** 題目只來自已經學過的詞，而且優先選複習到期的詞。
4. **輸了也有收穫。** 沒有「遊戲結束就什麼都沒有」。每場都有結算、說明和 XP。
5. **0 體力也能玩**：練習模式，不扣體力，XP 減半。

## 2. 共用框架

```ts
/** 每個村莊為每個小遊戲提供一份主題資料（純資料，不含邏輯）。 */
interface MiniGameTheme {
  id: string;                    // 'hello-town.cooking'
  gameId: MiniGameId;
  tileset: string;               // 場地美術的 manifest key
  props: Record<string, string>; // 角色和道具的 sprite key（食材、賽車、蛇的造型……）
  music?: string;
  palette?: Partial<PaletteAccent>; // 只能從 tokens 色票選擇
  strings: Record<string, string>;  // UI 用的英文標題，例如 'Burger Rush'
}

interface MiniGameConfig {
  gameId: MiniGameId;
  theme: MiniGameTheme;          // 新增：村莊主題
  topicIds: string[];            // 新增：從哪些主題出題
  itemPool: string[];            // 已學過的詞彙 id（優先到期的）
  targetLanguage: TargetLanguage;
  difficulty: Difficulty;
  mode: 'normal' | 'practice';
  questId?: string;
  questStepIndex?: number;
  returnPoint: ReturnPoint;      // 方向改成 'up' | 'down' | 'left' | 'right'
}
```

**流程**：NPC 或地點 → **Briefing**（目標、會用到的詞、體力花費或練習模式）→ 遊戲 → **Results**（分數、答對答錯的詞和說明、XP、物品）→ 回到原地，存檔、任務、精通度都更新。

**共用元件**：Briefing 面板、Results 面板、題目卡、分數和時間標籤、暫停選單、答對答錯的回饋效果。全部來自 `src/ui/`，跟 RPG 的 UI 是同一套風格。

**共用操作**：左拇指移動或轉向，右拇指確認或動作，暫停在右上。跟 RPG 一樣的位置。

**每一個答案**都回報給學習系統（精通度和複習佇列）。

## 3. Vocabulary Snake

- **Hello Town 主題**：「Garden Snake」。地點在 Town Square 旁的花園，由 Town Square 的鎮民 NPC 帶入。
- **視角**：俯視角格子場地，跟主世界同一套像素地磚。
- **規則**：
  - 上方顯示提示：圖片、UI 語言的意思，或語音。
  - 場上出現 3–4 個標著**目標語言**詞的物件（Hello Town 是水果和麵包）。
  - 吃到正確的 → 變長、加分、閃光。吃到錯的 → 變短一節，加上一張說明小卡（「*manzana* = apple」），**不會直接死掉**。
  - 撞到自己或邊界 → 扣一顆心（每場 3 顆）。心用完就結算，不是失敗畫面。
- **難度**：選項數量、速度、提示類型（圖 → 意思 → 語音）。
- **操作**：搖桿或方向鍵轉向。右拇指是短衝刺。
- **其他村莊換什麼**：場地地磚、可以吃的物件造型、蛇的造型、背景音樂。

## 4. Language Kart Racing

- **Hello Town 主題**：「Town Loop」。從 Racing Garage 的技師 NPC 進入，賽道繞著 Hello Town 外圍跑。
- **視角**：**俯視角**賽道。跟主世界的鏡頭和地磚系統一致，這樣可以共用地圖格式和渲染。
- **規則**：
  - 賽道上有**題目門**：前方三條車道各標一個答案，開進正確的車道 → 加速。
  - **方向題**（Directions 主題）：路口出現目標語言指示（*Gira a la izquierda*），轉對方向 → 走捷徑。轉錯 → 走一般路線（只是比較慢，不會迷路）。
  - 道具箱：答對一題情境題，拿到道具（護盾、彈跳）。
  - 對手是友善的鎮民。比賽一定跑得完，名次只影響獎勵。
- **操作**：左拇指轉向，右拇指加速或使用道具。選答案靠開進車道。
- **其他村莊換什麼**：賽道地圖（資料檔）、賽車造型、路邊道具、對手 NPC。

## 5. Language Cooking

- **Hello Town 主題**：「Burger Rush」。在 Burger Bistro 的廚房，由 Chef Patty 帶入。
- **視角**：固定的廚房畫面（3/4 俯視角），前方櫃台有客人，下方是食材列。
- **規則**：
  - 客人用**目標語言**點餐：*Quisiera una hamburguesa con queso y sin cebolla.*
  - 玩家點選或拖曳食材，依順序疊漢堡，然後出餐。
  - 錯的食材 → 客人溫和反應（Thinking 表情），說明會標出誤會的那個詞，然後可以修正。
  - 難度：數量（*dos*）、否定（*sin*）、禮貌用語、多位客人排隊。
- **操作**：手機用點選和拖曳；桌機用方向鍵選食材、Enter 放上去；右拇指出餐。
- **其他村莊換什麼**：菜單（漢堡 → 壽司、塔可……）、廚房地磚、客人 NPC、餐點組合規則（資料）。

## 6. 每個小遊戲的檢查清單

- [ ] 顏色只用 `tokens.ts` 色票，UI 只用共用元件，UI 文字全部英文。
- [ ] 核心邏輯裡沒有任何村莊專屬的內容。換一份 `MiniGameTheme` 和主題清單就能變成另一個村莊的版本。
- [ ] 從世界裡的 NPC 或地點進入，結束後回到同一個位置。
- [ ] 0 體力時可以用練習模式玩。
- [ ] 每個答錯都有說明。
- [ ] 結果透過共用存檔更新 XP、物品、任務和精通度。
- [ ] 在 812×375 的橫向手機上可以玩，觸控範圍夠大。

## 7. 開發順序（建議）

1. **Language Cooking**：Burger Bistro 是 Hello Town 的招牌，也最貼近「食物與點餐」主題，最能展現「在情境中學」。
2. **Vocabulary Snake**：規則最單純，適合拿來驗證「一套邏輯、多個主題」的框架。
3. **Language Kart Racing**：最複雜，需要賽道地圖和方向主題的內容，放最後。

這跟舊版順序（Snake → Cooking → Kart）不同。如果你偏好先做 Snake（比較快完成），也可以調換。
