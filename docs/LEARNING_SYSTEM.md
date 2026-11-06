# Learning System — Lanburger

> **狀態：已核准（2026-11-05）。** 核准後取代 `LEARNING_DESIGN.md`。
> 舊版的好設計（先教後練、Leitner 間隔重複、題型、內容包）會保留，但改成由 NPC 和劇情帶出。

## 1. 原則

1. **先教，再練。** 沒教過的東西不考。
2. **情境優先。** 每次學習都從 NPC 和一個真實情境開始（點餐、問路、自我介紹），不會憑空跳出題目。
3. **短。** 一次學習片段 2–4 分鐘，新詞最多 5 個。
4. **答錯是學習的一部分。** 答錯會得到說明和重試，不會被罵，也不會卡住。
5. **UI 語言和學習語言分開。** 說明和指示用 UI 語言（初版是英文），學習內容用目標語言，兩者在畫面上分區顯示，不混在同一句話裡。

## 2. 學習片段（Learning Encounter）的 7 個步驟

| # | 步驟 | 畫面 | 範例（Burger Bistro，目標語言 Spanish） |
| - | ---- | ---- | -------------------------------------- |
| 1 | **情境**：NPC 介紹一個真實情況 | 對話框加頭像 | Chef Patty（Worried）："A customer only speaks Spanish! Can you help me take the order?" |
| 2 | **說明**：簡短解釋 | 對話框中的「Tip」卡 | "To order politely, say *Quisiera…* (I would like…)." |
| 3 | **範例**：看到（聽到）用法 | 範例卡，目標語言放大，可以播放語音 | *Quisiera una hamburguesa, por favor.* → "I would like a burger, please." |
| 4 | **練習**：互動題 | 題目面板 | 客人說：*Quisiera agua.* → 客人要什麼？（選圖） |
| 5 | **即時回饋** | 答對：綠色和 Celebrating 表情。答錯：暖橘色和 Thinking 表情 | — |
| 6 | **答錯時**：有幫助的說明，然後重試 | 說明卡加「Try again」 | "*Agua* means water. *Hamburguesa* is burger." 重試同一題（選項重新排列） |
| 7 | **完成**：計入任務、精通度、成長 | 結算卡：XP、新學的詞、燈籠進度 | 詞彙加入複習佇列 |

- 第 4–6 步會重複 3–6 題，題型漸進：先辨認（選擇題），再回想（排序、填空）。
- 最後一題通常是**情境對話題**：NPC 說一句話，玩家從 2–3 個回應中選一個，選完 NPC 會有對應反應。這讓練習感覺像在跟人說話。

## 3. 題型

| 題型 | 說明 | 適合 |
| ---- | ---- | ---- |
| `choose-meaning` | 看目標語言，選意思（文字或圖） | 辨認新詞 |
| `choose-target` | 看意思或圖，選目標語言 | 回想 |
| `listen-choose` | 聽語音選答案（有語音檔才出） | 聽力 |
| `dialogue-reply` | NPC 說一句話，選合適的回應 | 情境應用（主力題型） |
| `order-words` | 把詞塊排成句子 | 句型 |
| `fill-blank` | 句子挖空選詞 | 文法點 |
| `match-pairs` | 配對 4 組 | 複習 |

- 不連續出同一種題型超過 3 題。
- 選擇題的錯誤選項來自**已學過**的詞，而且盡量是容易混淆的（同主題、拼法相近）。

## 4. 回饋規則

- **答對**：綠色勾、短音效、NPC 開心，+XP。
- **答錯**：暖橘色（不用刺眼的紅），NPC 表情是 Thinking 或 Worried（不是生氣），顯示**為什麼錯**和正確答案的說明，然後重試。
  - 答錯會扣 1 點體力（見 `PROGRESSION_SYSTEM.md` §3）。重試答對可以拿到一半的 XP。
  - 同一題錯 2 次：直接顯示答案和說明，請玩家再選一次正確答案（確認看懂了），然後繼續。不會無限重試。
- 說明文字用 UI 語言，引用的目標語言用不同字體或顏色標示。

## 5. 複習與間隔重複

- 使用 **Leitner 6 箱**（0–5），沿用現有的 `MasteryRecord`。

| 箱 | 下次複習間隔 |
| -- | ------------ |
| 0（剛學） | 同一次遊玩稍後 |
| 1 | 1 天 |
| 2 | 2 天 |
| 3 | 4 天 |
| 4 | 7 天 |
| 5 | 14 天（精通） |

- 答對升一箱，答錯回到第 1 箱。
- **在哪裡複習**：
  - 右上角 **Learn** 按鈕：「Review (N due)」，一輪 8–10 題，不扣體力。
  - Language Academy 的 **Practice Corner**：免費練習，**可以補體力**。
  - 小遊戲：自動從到期的詞裡出題。
  - NPC 閒聊：鎮民偶爾會用到期的詞問你一句（選答，答錯不扣體力）。
- 詞彙收集進 **Collection** 的 Word Book，可以看每個詞的精通度。

## 6. 內容包格式

學習內容跟程式分開，跟 UI 字串也分開。

```
src/content/
  topics/greetings.ts          # 主題定義：詞彙 id、句型 id、所屬建築
  packs/
    es/greetings.json          # Spanish 的詞彙、例句、題目、對話
    de/greetings.json
    ja/greetings.json
    zh-TW/greetings.json
    en/greetings.json
  explanations/
    en/greetings.json          # 說明文字（UI 語言 = 說明語言）
```

- **主題**（topic）定義學什麼，跟語言無關：`greet.hello`、`greet.my-name-is`……
- **語言包**（pack）提供每種目標語言的實際文字、讀音、語音和文化註記。
- **說明**（explanation）用「說明語言」寫。初版說明語言等於 UI 語言（英文），之後可以加 zh-TW 等，不用改程式。
- 每個語言包都要經過**母語者校對**，才標記為 `reviewed: true`。沒校對的內容會在 debug 模式下標示出來。

## 7. 各語言注意事項

| 語言 | 注意 |
| ---- | ---- |
| Spanish | 性別（*el/la*）、正式和非正式（*tú/usted*），在說明裡標出 |
| German | 名詞大寫和三性（*der/die/das*）、*du/Sie* |
| Japanese | 顯示假名和漢字；選用的振假名（furigana）和羅馬拼音輔助（可在 Settings 切換）；敬語程度 |
| Traditional Chinese (Taiwan) | 台灣用語和正體字；注音或拼音輔助（可切換）；量詞 |
| English | 見下方待決問題 |

**待決問題**：UI 是英文時，選 English 當學習語言的玩家，看到的說明也是英文，沒有母語輔助。可能的做法：
1. 初版先不開放 English 當學習語言，等加入第二種說明語言（例如 zh-TW）再開。
2. 初版就加入 zh-TW「說明語言」（只翻譯學習說明，選單和按鈕仍是英文）。
3. 照現狀，English 學習者用全英文（沉浸式）。

建議是第 2 個：選單維持全英文，只把學習說明多做一種 zh-TW。請在 `IMPLEMENTATION_PLAN.md` §7 確認。

## 8. Hello Town 的學習主題

> 2026-11-06：西班牙文的單元順序和 A1 範圍，改由 `SPANISH_CURRICULUM.md` 規劃（R6A 草案）。下表是原本的村莊主題，不代表已經完整涵蓋 A1。

| 主題 | 建築 | 新詞和句型（每種語言約 8–12 項） |
| ---- | ---- | -------------------------------- |
| Greetings | Language Academy | 你好、早安、再見、謝謝、我叫…、你叫什麼名字、很高興認識你、你好嗎、我很好 |
| Food & Ordering | Burger Bistro | 漢堡、薯條、水、果汁、我想要…、請、多少錢（預告）、好吃 |
| Shopping | General Store | 數字 1–20、多少錢、我要兩個、太貴了、這個、那個 |
| Directions | Racing Garage | 左、右、直走、哪裡、車、公車、火車、靠近、遠 |
| Everyday Talk | Town Square | 天氣、開心、累、喜歡、今天、明天 |
