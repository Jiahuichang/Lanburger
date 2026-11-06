# R5 截圖：任務與成長（垂直切片完成）

拍攝日期：2026-11-06。來源：Claude App 內建瀏覽器。桌機 1280×720，手機橫向 812×375（`?touch=1`）。

| 檔案 | 內容 |
| ---- | ---- |
| `01-desktop-quest-start.jpg` | 新遊戲：左上是任務追蹤面板（Main / Side），Mayor Bun 頭上有 `!`，右上是小地圖和任務目標標記 |
| `02-desktop-lantern-lit.jpg` | 回報鎮長後，廣場的 Greetings Word Lantern 亮起；Lanburger 升到 Lv.5 長成 Classic，頭上多了 Lettuce |
| `03-mobile-tracker-minimap.jpg` | 手機：追蹤面板只顯示目前和下一步；小地圖會跟著玩家捲動 |
| `04-mobile-quests-panel.jpg` | 手機：Quests 面板列出所有步驟、進度和獎勵 |

## R5 做了什麼

- **主線任務 "Welcome to Hello Town!"**，共 6 步：
  1. Talk to the Town Mayor
  2. Explore 3 Locations：走到 Academy、Bistro、Store 門口
  3. Visit the Language Academy
  4. Finish Maggie's Greetings lessons（0/3）
  5. Greet Remy by the fountain：用剛學的句子跟 Remy 聊天，全部是情境回應題
  6. Report back to Mayor Bun：NPC 頭上會出現 `?`
- **任務規則**：
  - 探索、上課這類步驟看存檔旗標判斷，所以可以先做、順序不拘，進度也不會倒退。
  - 對話步驟只有輪到它時才算。
  - 舊存檔載入時會自動補上已經做過的步驟。
- **完成主線的獎勵**：
  - 點亮 Greetings Word Lantern，廣場燈光亮起，小地圖顯示 Lanterns 1/5。
  - Lanburger 長出 Lettuce。
  - Burger Bistro 開門：門口文字換掉，並接上下一個任務 "A Taste of Hello Town"。
  - 另外有 60 XP、20 Sesame Coins，以及 Hello Town Badge。
- **XP 與等級**：
  - 第一次就答對 +3，重試後答對 +1。
  - 體力 0 時上課的答題 XP 減半。
  - 完成一課 +15，複習或聊天一輪 +10，任務每一步 +10，主題第一顆星 +40。
  - 升級會補滿體力；Lv.5 起 Lanburger 從 Slider 長成 Classic。
- **主題星等**：★ 上完全部課程；★★ 平均複習箱數達 60%；★★★ 每句都到第 4 箱以上。
- **新的 UI**：
  - 任務追蹤面板，步驟完成時會閃一下。
  - 小地圖：地面、建築、燈籠亮暗、玩家位置，以及閃爍的任務目標。目標在室內時，標記會指向門口。
  - 獎勵橫幅會依序顯示在畫面上方中央。
  - 答題回饋會顯示 `+3 XP`。
  - Quests、Bag、Collection 面板：Bag 可以開關配料；Collection 有燈籠、星等和學會的句子。
  - 按鈕上的紅點代表有新東西。

## 已知限制

- Burger Bistro 還沒有室內，Food & Ordering 課程是 R6 的內容；門口文字會說明這點。
- 隱藏的瀏覽器分頁會讓計時器變慢，所以測試時橫幅會排隊比較久。實際遊玩時每個橫幅約 2.3 秒。
