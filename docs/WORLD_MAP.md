# World Map — Lanburger

> **狀態：已核准（2026-11-05）。**

## 1. 世界結構

```
World
 └─ Village（一個大的生活情境，例如 Hello Town）
     ├─ Exterior map（村莊戶外，俯視角）
     │   ├─ District（區域，可以分開解鎖）
     │   └─ Building entrance（門口 → 室內地圖）
     └─ Interior maps（每棟建築一張，一個學習主題）
```

- **一個村莊 = 一個情境**，**一棟建築 = 一個主題**。
- 地圖都是資料檔（JSON），不寫死在程式裡。格式見 `IMPLEMENTATION_PLAN.md` §4.3。
- 村莊之間透過 **Travel Station** 移動，有一張世界地圖畫面可以選目的地（目前先做 Hello Town）。

## 2. Hello Town（起始村莊）

**情境**：剛搬到一個新城鎮的第一週，需要打招呼、吃飯、買東西、問路、跟鄰居閒聊。

### 2.1 配置（依參考圖）

```
                 [ Town Hall ]
                      │  石階、拱門
 [ Language Academy ] │            [ Burger Bistro ]
          \           │             /
           \     ( Town Square )   /
            \   噴水池、雕像、      /
             \  5 盞 Word Lanterns
             /                   \
 [ General Store ]            [ Racing Garage ]
             \                   /
          ~~~~ 溪流 ~~~~ 木橋 ~~~~
                      │
              [ Travel Station ]（南邊，橋過去）
```

- 地圖大小草案：約 80×60 格（1280×960 原生像素）。手機橫向一次大約看到地圖的 60% 寬、40% 高，需要走動才看得到全貌。
- 外圍用樹叢、櫻花樹和溪流圍起來，視覺上是自然邊界，同時也是碰撞邊界。
- 每棟建築門口有一條石磚路連到廣場。新玩家站在廣場就看得到每個入口。

### 2.2 地點與主題

| 地點（遊戲內英文名稱） | 學習主題 | 主要 NPC（暫定名稱） | 活動 | 初始狀態 |
| ---------------------- | -------- | -------------------- | ---- | -------- |
| **Town Square** | 日常對話（Everyday Talk）：天氣、感覺、閒聊 | 散步的鎮民（朋友 NPC 適合放這裡） | 情境對話、Vocabulary Snake 入口（之後） | 開放 |
| **Town Hall** | 主線劇情與進度 | Mayor Bun | 接主線、回報、查看燈籠進度 | 開放 |
| **Language Academy** | 打招呼與自我介紹（Greetings） | Maggie（老師，朋友 NPC） | 課程、Practice Corner（免費練習，補體力） | 開放 |
| **Burger Bistro** | 食物與點餐（Food & Ordering） | Chef Patty | 點餐對話、Language Cooking | 完成 Greetings 後開放 |
| **General Store** | 購物、價格、數量（Shopping） | Mr. Pickles（店長） | 購物對話、數字練習 | 完成 Food 後開放 |
| **Racing Garage** | 交通與方向（Directions） | Rusty（技師） | 問路對話、Language Kart Racing | 完成 Shopping 後開放 |
| **Travel Station** | 解鎖下一個村莊 | Station Master | 五盞燈全亮後可以出發 | 鎖住，有清楚的提示 |

NPC 名字都是暫定。朋友 NPC 的名字和角色定位，等收到照片後再一起決定。

### 2.3 解鎖順序與防卡關

```
Greetings（Academy）──▶ Food（Bistro）──▶ Shopping（Store）──▶ Directions（Garage）
        │                                                        │
        └──────── Everyday Talk（Town Square，隨時可以做）──────┘
                                   │
                    五盞燈全亮 ──▶ Travel Station 開放
```

- 鎖住的建築門口會有英文提示牌（例如 "Closed for prep — help Maggie first!"），玩家一定知道下一步要去哪。
- 解鎖條件只看「完成任務」，不看分數。只要完成就能前進，沒有任何條件會讓玩家永久卡住。
- 「探索 3 個地點」之類的任務只需要走到門口，不需要進去。

## 3. 地圖物件類型

| 物件 | 用途 |
| ---- | ---- |
| `spawn` | 出生點、從其他地圖進來時的位置 |
| `warp` | 門口、樓梯、地圖邊界 → 另一張地圖的某個 spawn |
| `npc` | NPC 的位置、朝向、閒晃範圍 |
| `sign` / `inspect` | 可以調查的物件（招牌、告示、燈籠） |
| `lantern` | Word Lantern，有熄滅和點亮兩種狀態 |
| `gate` | 依條件開關的阻擋物（鎖住的門、Travel Station 柵欄） |
| `trigger` | 走進去就觸發（任務的「探索」、劇情事件） |
| `light` | 光源（路燈、窗戶），燈籠點亮時也會新增光源 |

## 4. 之後的村莊（擴充，草案）

> 2026-11-06：西班牙文的 A1 分成兩段。Hello Town 負責 A1.1，第二個村莊負責 A1.2（時間與日常、興趣、住處、計畫與天氣）。詳見 `SPANISH_CURRICULUM.md` §5.1。下表的村莊順序和主題，之後要依此重新排。

| 村莊 | 情境 | 主題範例 |
| ---- | ---- | -------- |
| Harbor Market | 旅行與市場 | 殺價、問時間、住宿、天氣 |
| Clockwork City | 工作與學校 | 時間與約會、職業、電話、寫訊息 |
| Wellspring Valley | 健康與生活 | 身體、看醫生、感覺、運動 |
| Festival Isle | 文化與節慶 | 慶祝、邀請、送禮、表達意見 |

每個新村莊都**沿用同一套系統**（地圖格式、NPC、任務、三個小遊戲），只換內容包和美術主題。
