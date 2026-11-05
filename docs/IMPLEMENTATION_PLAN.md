# Implementation Plan — Lanburger 重新設計

> **狀態：已核准（2026-11-05）。R1 已完成。R2 美術垂直切片已完成，**等待美術審核**（見 `docs/screenshots/r2/README.md`）；下一階段：R3 NPC 與對話。** §7 的 8 項決定都採用建議方案。
> 盤點基準：commit `8465ef7`（Phase 1：可玩的 Mossbrook 橫向捲軸原型），`src/` 共約 4,400 行 TypeScript。

## 1. 現況盤點（Phase 0 稽核）

### 1.1 專案結構與相依套件
- Vite 8、TypeScript 7（strict）、Three.js r0.187、`@fontsource/fredoka`。開發用：`playwright-core`（選用的自動測試，需要 Chrome 權限）。
- 技術堆疊跟 brief 一致，**不需要換**，也不需要新增遊戲引擎。

### 1.2 逐一檢查

| 模組 | 檔案 | 現況 | 判定 |
| ---- | ---- | ---- | ---- |
| 遊戲迴圈 | `core/GameLoop.ts` | 60 Hz 固定步長，輸入邊緣在每步後清除 | ✅ 直接沿用 |
| 場景管理 | `core/SceneManager.ts`、`Scene.ts` | 淡入淡出轉場、`pushMiniGame`、`returnFromMiniGame` | ✅ 沿用；`ReturnPoint.facing` 要改成四方向 |
| 事件與服務 | `core/EventBus.ts`、`Services.ts` | 型別安全的事件匯流排 | ✅ 沿用，新增事件（quest、answer、lantern） |
| 渲染器設定 | `core/Game.ts` | `antialias: true`，pixel ratio ≤ 2，直接畫到螢幕 | 🔧 改成低解析度 render target 加整數縮放（像素完美） |
| 鏡頭 | `world/WorldScene.ts` | OrthographicCamera，固定高度 540，橫向跟隨加前視 | 🔧 沿用正交鏡頭，改成雙軸跟隨、整數像素對齊、地圖邊界限制 |
| 地圖 | `world/maps/*`、`ParallaxBackground.ts` | 寫死在 TS 的橫向地圖、7 層視差、道具用「出現座標」換算 | ❌ 換成 JSON 地磚地圖、區塊合併的地磚網格、Y 軸排序 |
| 物理與碰撞 | `world/Physics.ts` | 重力、AABB 固體、單向平台、土狼時間、跳躍緩衝 | ❌ 換成俯視角移動：碰撞格加物件腳底矩形、沿牆滑動 |
| 玩家控制 | `character/PlayerController.ts` | 跑、跳、下穿平台、表情 | 🔧 改寫成八方向移動和面向；保留「控制器不碰 mesh」的分層 |
| 角色顯示 | `character/CharacterView.ts`、`types.ts` | manifest 驅動、UV 切格、`scale.x` 左右翻轉、標籤 | 🔧 沿用架構；manifest 加入方向（down/up/left/right）、疊圖圖層（配料）、表情頭像 |
| 主角美術 | `character/placeholderCharacter.ts`、`heroManifest.ts` | 程式產生的灰色人偶 sheet | ❌ 換成 Lanburger 像素 sheet（manifest 接口不變） |
| 美術色票 | `art/tokens.ts`、`cssVars.ts`、`color.ts` | 單一來源，產生 CSS 變數 | 🔧 機制沿用，內容換成新色票（`ART_DIRECTION.md` §4） |
| 繪圖工具 | `art/painter.ts`、`assets/proceduralArt.ts`（904 行） | 平滑曲線、手繪描邊、紙紋、霧化 | ❌ 不適合像素風，移除；改成像素繪製工具（色票索引、網格對齊） |
| 素材註冊 | `assets/AssetRegistry.ts` | 依 key 快取，`override(key, url)` 換 PNG | 🔧 沿用；貼圖改用 `NearestFilter`、不用 mipmap；加入 manifest 和 atlas 載入 |
| 粒子 | `world/Particles.ts` | 花粉和落葉 | 🔧 改成像素粒子（櫻花花瓣、螢火蟲、水花） |
| 輸入 | `input/*` | 鍵盤加觸控浮動搖桿（多點觸控、safe area），按鈕 Jump、Talk、Emote | 🔧 搖桿已經是 2D，直接可用；移除 Jump，加入方向鍵上下、選單快捷鍵、對話推進 |
| UI 框架 | `ui/UiRoot.ts`、`Hud.ts`、`Prompt.ts`、`SettingsPanel.ts`、`styles.css` | HTML 疊層、轉向提示、淡入淡出、奶油色卡片風 | 🔧 架構沿用；視覺換成深色面板風格；HUD 改成參考圖的版面 |
| i18n | `i18n/*` | UI 字串 en、es、de、fr、zh-TW | 🔧 架構保留，初版只啟用 `en`；把 `LanguageCode` 拆成 `UiLanguage` 和 `TargetLanguage` |
| 存檔 | `save/*` | v1、migration 機制、自動存檔、體力回復 | 🔧 升到 v2（`PROGRESSION_SYSTEM.md` §9） |
| 學習 | `learning/types.ts` | **只有型別**：Question、VocabItem、MasteryRecord、LearningStage | 🔧 型別大致可用；語言清單 fr → ja；引擎還沒做 |
| NPC、任務 | `npc/types.ts` | **只有型別**：NpcDefinition（只有 x）、QuestDefinition | 🔧 型別要擴充（x/y、表情、對話圖、計數步驟）；系統還沒做 |
| 小遊戲 | `minigames/types.ts` | **只有型別** | 🔧 加入 `MiniGameTheme`、`topicIds` |
| 圖片素材 | `public/` | 只有 `favicon.svg`；所有美術都在執行時產生 | — 需要全新的像素素材 |
| 工具 | `scripts/playtest.mjs` | 29 項自動檢查，針對橫向捲軸 | 🔧 改寫成俯視角的檢查（選用，需要 Chrome 權限） |

圖例：✅ 直接沿用 · 🔧 需要重構 · ❌ 需要替換

### 1.3 結論
- **可以重用（約 40%）**：核心引擎（迴圈、場景、事件）、正交鏡頭、輸入系統（特別是觸控搖桿）、UI 疊層架構、色票轉 CSS 的機制、素材替換機制、manifest 驅動的角色顯示、存檔與 migration、i18n 架構、各系統的型別合約。
- **需要替換（約 45%）**：所有橫向捲軸的部分（物理、視差、地圖格式、Mossbrook 地圖）和手繪風繪圖程式。
- **完全缺少**：地磚地圖、Y 軸排序、建築進出、NPC、對話、任務、學習引擎、間隔重複、進度和成長、小地圖、任務追蹤 UI、像素素材、語音。

## 2. 需要的重構（依風險排序）

1. **像素渲染管線**：低解析度 `WebGLRenderTarget`（原生高度約 360）→ nearest 放大到畫面，整數縮放，鏡頭取整數。HTML UI 維持高解析度。
2. **地圖格式與渲染**：JSON 地圖（地磚層、裝飾層、碰撞層、物件層）→ 依區塊合併成少量 mesh（效能）。會動或會被遮住的物件（角色、樹、路燈）用 Y 軸排序。
3. **俯視角移動與碰撞**：碰撞格（每格可走或不可走）加上物件的腳底矩形。X、Y 分開解算，可以沿牆滑動。
4. **角色 manifest v2**：方向、疊圖圖層、頭像表情。舊的 7 個狀態裡 `jump` 和 `fall` 移除。
5. **語言型別拆分**：`UiLanguage`（初版只有 `en`）和 `TargetLanguage`（en、es、de、ja、zh-TW）。
6. **存檔 v2 和 migration。**
7. **色票和 UI 風格換新。**

舊的橫向捲軸程式碼（Mossbrook、視差、平台物理、手繪繪圖）會從執行時移除，保留在 git 歷史裡（`8465ef7`），不刪 repo 歷史。

## 3. MVP 範圍與之後的擴充

| | MVP（Hello Town 完整村莊） | 之後的擴充 |
| - | -------------------------- | ---------- |
| 世界 | Hello Town 戶外加 6 個室內 | 更多村莊（`WORLD_MAP.md` §4）、世界地圖 |
| 學習 | 5 個主題 × 5 種學習語言、7 種題型、Leitner 複習 | 語音辨識、更多說明語言、更多主題 |
| NPC | 約 8 位，包含朋友 NPC | 每個村莊各自的 NPC |
| 任務 | 主線加 5 個 Building Quest 加 5–8 個支線 | 每日任務、活動 |
| 小遊戲 | 三個都做，各有 Hello Town 主題 | 其他村莊主題 |
| 成長 | XP、等級、體力、精通度、漢堡階段和 5 種配料 | 更多外觀、成就 |
| 平台 | 桌機鍵盤加手機橫向觸控 | 手把、PWA 離線 |

## 4. 技術設計重點

### 4.1 分層（沿用現有原則）
```
content/（資料：地圖、NPC、對話、任務、課程、主題）
   ↓ 讀取
systems/（純邏輯：Movement、Collision、Dialogue、Quest、Learning、Progression、Save）
   ↓ 狀態
views/（Three.js：TileMapView、ActorView、LightView）    ui/（HTML：HUD、Dialogue、Lesson、Menus）
```
- 控制器和系統不碰 Three.js mesh。View 不決定玩法。
- 村莊專屬的內容只存在 `content/`。可重用的系統裡不寫死任何村莊的東西。

### 4.2 新的資料夾（草案）
```
src/
  core/        (沿用)
  render/      PixelRenderer（render target 加整數縮放）、YSort、LightLayer
  world/       TopDownScene、TileMap、TileMapView、Collision、Warp、Interactables
  actors/      ActorController、ActorView、NpcBrain（閒晃、面向玩家）
  dialogue/    DialogueRunner（對話圖）、DialogueView（UI）
  quests/      QuestSystem、QuestTracker
  learning/    LearningSession、QuestionRunner、Leitner、ContentLoader
  progression/ Xp、Energy、Mastery、BurgerGrowth
  minigames/   framework/、cooking/、snake/、kart/
  content/     maps/、npcs/、dialogues/、quests/、topics/、packs/<lang>/、themes/
  art/         tokens.ts（新色票）、pixel.ts（像素繪製工具）
  assets/      AssetRegistry（nearest、atlas、manifest）
  ui/          HUD、QuestTracker、Minimap、DialogueBox、LessonPanel、Menus
  save/        schema v2、migrations
```

### 4.3 地圖格式（草案）
```jsonc
{
  "id": "hello-town",
  "tileSize": 16, "width": 80, "height": 60,
  "tileset": "tiles.hello-town",
  "layers": {
    "ground":   [/* 地磚 id，長度 = width × height */],
    "detail":   [/* 裝飾地磚 */],
    "collision":[/* 0 = 可走，1 = 阻擋 */]
  },
  "objects": [
    { "type": "spawn", "id": "start", "x": 640, "y": 520, "facing": "down" },
    { "type": "warp", "x": 296, "y": 248, "w": 16, "h": 8, "to": "academy-interior", "spawn": "door" },
    { "type": "npc", "id": "mayor-bun", "x": 640, "y": 160 },
    { "type": "lantern", "id": "lantern-greetings", "x": 560, "y": 470 },
    { "type": "prop", "kind": "tree.blossom", "x": 120, "y": 300 }
  ]
}
```
初版的地圖檔可以用程式產生或手寫。之後如果需要編輯器，再加入 Tiled 格式匯入（Tiled 只是外部工具，不會變成執行時的相依套件）。

**R1 實際做法**：地圖寫成 `MapSource`（`src/world/map/types.ts`），內容在 `src/content/maps/hello-town.ts`。座標單位是格子，地面用「填矩形、橢圓、粗線」的指令描述，物件是一份清單。這些全都是可以存成 JSON 的純資料，`TileMap` 會把它轉成像素座標和碰撞格。

## 5. 建議的階段（取代舊 Roadmap 的 Phase 2–7）

每個階段都要通過品質關卡：`npm run build` 通過、桌機和手機橫向都能玩、符合美術規範、轉場正常、不會卡關、舊功能沒壞、截圖存檔並檢查。

| 階段 | 內容 | 完成時看得到什麼 |
| ---- | ---- | ---------------- |
| **R0** ✅ | 稽核、7 份設計文件、核准 | 文件 |
| **R1 俯視角基礎** ✅（待真機） | 像素渲染管線、JSON 地圖、地磚渲染、Y 軸排序、八方向移動和碰撞、鏡頭、輸入調整、存檔 v2、新色票、灰階版（greybox）Hello Town | 可以在 Hello Town 的灰階版地圖裡走動，撞得到牆和建築 |
| **R2 美術垂直切片** ✅（待審核） | Hello Town 地磚組、廣場和 4 棟建築外觀、樹和櫻花、水、燈光、Lanburger sprite（選定方向）、1 位範例 NPC、新 HUD 外觀 | **美術審核關卡**：跟參考圖並排比較，你確認後才大量產出 |
| **R3 NPC 與對話** | NPC 系統（閒晃、面向玩家、頭上圖示）、對話系統（頭像、6 表情、打字效果、選項）、建築進出（門 → 室內）、Language Academy 室內 | 可以跟 NPC 聊天、走進 Academy |
| **R4 學習引擎** | 學習片段 7 步驟、題型、回饋和重試、Leitner、內容包載入、Greetings 主題（5 種語言）、體力和 Practice Corner | 在 Academy 完成第一堂課 |
| **R5 任務與成長** | 任務系統和追蹤面板、XP、等級、精通度、Word Lanterns、漢堡成長（Lettuce）、小地圖 | **垂直切片完成**（見 §6） |
| R6 | 其他 4 個主題、其餘建築室內、支線、朋友 NPC | Hello Town 內容完整 |
| R7 | 小遊戲框架加 Language Cooking（Burger Rush） | 第一個小遊戲 |
| R8 | Vocabulary Snake（Garden Snake） | 第二個小遊戲 |
| R9 | Language Kart Racing（Town Loop） | 第三個小遊戲，MVP 完成 |
| R10+ | 第二個村莊、音樂音效、無障礙、效能 | — |

## 6. 垂直切片提案：Hello Town 的第一個小時

**目標**：用最小的範圍證明完整的核心循環（探索 → NPC → 學習 → 練習 → 任務 → 獎勵 → 成長 → 解鎖），而且畫面要接近參考圖的品質。

### 6.1 玩家會經歷的流程
1. 在 Town Square 醒來。旁邊是熄滅的 Word Lanterns 和 Lanburger 雕像。Mayor Bun 頭上有 `!`。
2. **Main Quest "Welcome to Hello Town!"**（參考圖的追蹤面板內容）：
   - Talk to the Town Mayor `0/1`
   - Explore 3 Locations `0/3`（走到 Academy、Bistro、Store 門口；後兩間顯示 "Closed for prep"）
   - Visit the Language Academy `0/1`
3. 在 Academy 裡，Ms. Sesame 教 **Greetings**：情境 → 說明 → 範例 → 練習 5–6 題 → 回饋 → 重試。
4. **情境練習**：回到廣場，跟一位鎮民（之後可以換成朋友 NPC）用剛學的句子對話（`dialogue-reply` 題）。
5. 回報鎮長 → **第一盞 Word Lantern 點亮**（光線變化和動畫）→ XP、升級、Lanburger 長出 **Lettuce**。
6. Burger Bistro 解鎖（門口提示改變），下一個任務出現。切片到此結束。

### 6.2 切片包含的系統
- 俯視角 Hello Town 戶外（完整版面，至少廣場和 4 棟建築外觀完成美術）加 Language Academy 室內。
- Lanburger（4 方向 idle 和 walk、celebrate、incorrect、learn）、3 位 NPC（Mayor Bun、Ms. Sesame、1 位鎮民），都有頭像 6 表情。
- 對話、學習片段、Greetings 內容包、Leitner 複習（Learn 按鈕）、體力（答錯 −1）、Practice Corner（0 體力時免費補）。
- 任務追蹤面板、HUD（頭像、Lv、Energy、XP）、右上圖示按鈕（Quests、Bag、Learn 可用；Collection、Settings 先做基本版）、小地圖。
- 存檔 v2：重新整理頁面會回到原位，進度保留。
- 桌機鍵盤加手機橫向觸控。

### 6.3 切片不包含
- 小遊戲、其他 4 個主題的課程、其他建築的室內、音樂（音效可以先放少量）、朋友 NPC（等照片和設定卡）、第二個村莊。

### 6.4 完成標準
- 一位新玩家不看說明，可以在 10–15 分鐘內走完 §6.1 的流程。
- 故意全部答錯也能走完，因為有說明、重試、免費補體力，不會卡住。
- 桌機（1280×720）和手機橫向（812×375）的截圖，跟 `references/lanburger-town.png` 並排比較時，視角、色調、像素密度、UI 結構是一致的。

## 7. 決定紀錄（2026-11-05 核准，全部採用建議）

| # | 問題 | 決定 |
| - | ---- | ---- |
| 1 | Lanburger 外型：**漢堡生物**或**漢堡主題的人類**？（參考圖兩種都有） | 漢堡生物，成長最明顯（`ART_DIRECTION.md` §5） |
| 2 | 美術來源：程式產生的像素美術（A）、外部美術師（B）、AI 草稿加清理（C） | 先 A，保留 B 的接口；朋友 NPC 最好用 B |
| 3 | English 當學習語言時沒有母語說明，要怎麼處理？ | 加入 zh-TW「說明語言」，選單仍是全英文（`LEARNING_SYSTEM.md` §7） |
| 4 | HUD 的 HP/MP 換成 Energy/XP 可以嗎？ | 可以，本遊戲沒有戰鬥 |
| 5 | 垂直切片的學習語言：5 種都做，還是先做 1–2 種？ | 5 種都做 Greetings（量很小），但要找母語者校對 |
| 6 | 小遊戲順序：Cooking → Snake → Kart，還是舊順序 Snake → Cooking → Kart？ | Cooking 先（`MINIGAMES.md` §7） |
| 7 | 舊的 Mossbrook 橫向捲軸原型，從執行時移除（保留在 git 歷史）可以嗎？ | 可以 |
| 8 | 請補上缺少的參考：NPC 風格參考、朋友照片（放 `references/private/`），以及其他村莊參考圖 | — |

第 8 項（缺少的參考圖）仍待使用者提供。`CLAUDE.md` 已改寫成新規則，舊文件已標示為歷史紀錄。
