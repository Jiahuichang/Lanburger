# R1 截圖：俯視角基礎（灰階版 Hello Town）

拍攝日期：2026-11-05。來源：Claude 桌面 App 內建的瀏覽器面板（不是自動化 Chrome），
桌機用 1280×720、手機橫向用 812×375 加 `?touch=1`。檔案是面板縮小後輸出的 JPEG（800 寬）。

| 檔案 | 內容 |
| ---- | ---- |
| `desktop-01-town-square.jpg` | 出生點：南邊的路、廣場、噴水池和 Lanburger 雕像、熄滅的 Word Lantern、路燈光暈 |
| `desktop-02-academy-door.jpg` | 在 Language Academy 門口按 E：英文名稱和介紹 |
| `desktop-03-town-hall.jpg` | Town Hall、石階、紫色旗幟 |
| `desktop-04-burger-bistro.jpg` | Burger Bistro（漢堡圓頂和廚師帽） |
| `desktop-05-garage-stream.jpg` | Racing Garage、溪流、櫻花樹 |
| `desktop-06-travel-station.jpg` | 木橋和南岸的 Travel Station（鎖住的柵門） |
| `desktop-07-word-lantern.jpg` | 調查 Word Lantern：說明怎麼點亮 |
| `desktop-08-settings.jpg` | Settings：學習語言和說明語言（選單固定英文） |
| `desktop-09-debug-collision.jpg` | `?debug=1`：紅色是碰撞範圍，藍色是玩家腳底的碰撞框 |
| `mobile-01-landscape-touch.jpg` | 手機橫向：搖桿、Talk 和 Emote 按鈕、精簡版 HUD |
| `mobile-02-sign-read.jpg` | 靠近告示牌時，Talk 按鈕變成「Read」，點了顯示內容 |
| `mobile-03-portrait-rotate.jpg` | 手機直向：請轉成橫向 |

## 美術檢查（ART_DIRECTION §10）

- [x] 所有顏色都來自 `tokens.ts`。`src/` 裡除了 `tokens.ts` 以外沒有任何色碼（用 grep 確認過）。
- [x] 像素對齊網格：低解析度 render target 加整數縮放，nearest 取樣，鏡頭和 sprite 都取整數。
- [x] 中等亮度的黃昏：整張地圖疊一層冷紫色調（multiply），路燈有暖色光暈。沒有大面積的粉彩或過亮的白。
- [x] 角色描邊用深色 `ink`，環境物件用各自色票最暗的那一階。
- [x] UI 全部英文。深色面板、金色標題、木框圖示按鈕，跟參考圖的結構一致。
- [x] 文字最小 14px。在 812×375 的畫面上看得清楚。
- [x] 沒有通用示範圖、寫實 3D 或 emoji 角色。

## 已知的灰階版落差（R2 美術階段處理）

- 地磚之間沒有過渡邊（石磚路和草地交界是方塊狀），水面沒有動畫。
- 建築招牌只有圖示，沒有文字。窗戶的光沒有額外的光暈。
- Lanburger 是灰階版的「Slider」造型，還沒有頭像表情和配料圖層。
- 細節密度還不到參考圖的精緻度。這是預期中的，R2 會跟參考圖並排比較後再加工。
