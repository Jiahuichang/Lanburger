# R6B 截圖：第一個完整西文單元（Greetings → 單元 1–2）

拍攝日期：2026-11-08。來源：雲端環境的 headless Chromium（Playwright 腳本操作真實遊戲）。桌機 1280×720（說明語言 English），手機橫向 812×375（`?touch=1`，說明語言繁中）。原圖縮小並轉成 JPEG。

| 檔案 | 內容 |
| ---- | ---- |
| `01-desktop-intro-goal-rule.jpg` | 第一張卡：單元標題（Unit 1 · Saludos）、情境、Goal（學習目標）、How it works（短規則）、發音小提示 |
| `02-desktop-listen.jpg` | 聽辨題：自動播放一次，可以再播或放慢，也可以按「Can’t listen now? Show the words」改看文字 |
| `03-desktop-time-of-day-feedback.jpg` | 情境回應題答錯：說明時段用錯了（「¡Buenas noches! 是晚上用的，但現在是早上」） |
| `04-desktop-word-order.jpg` | 詞塊排序題：點詞塊組句，多了一個誘答詞（se） |
| `05-desktop-spanish-forms.jpg` | 第 5 課遇到 encantado／encantada 前，Maggie 問玩家要用 -o 還是 -a（截圖時選項尾端還有句點，之後已拿掉） |
| `06-desktop-collection.jpg` | Collection：Greetings 顯示 Lessons 6/6 和單元完成狀態，星星改成只代表熟練度；超出 A1 的句子有「Common phrase · beyond A1」標籤 |
| `07-mobile-fill-blank.jpg` | 手機：填空題，情境用繁中說明 |
| `08-mobile-typed-answer.jpg` | 手機：輸入題，下方有 á é í ó ú ñ ü ¿ ¡ 按鍵 |
| `09-mobile-usted-feedback.jpg` | 手機：和 Mayor Bun 的 usted 練習，選了 ¿Y tú? 會說明要用 usted |
| `10-mobile-settings.jpg` | 手機：Settings 多了「Spanish forms for Lanburger」和「Listening questions」，短螢幕改成兩欄 |

## 自動檢查的結果（2026-11-08）

- 6 課 × 英文和繁中說明 × 有聲和無聲 × 性別未選和已選，全部走完，沒有佔位符外露，每題都有正確選項、答錯都有說明。
- 輸入題判定：大小寫、¡¿、重音、ñ 打成 n 都算對並提示正確寫法；差一個字母顯示「Almost!」且不扣體力；Me llamo／Soy 後面可以接任何名字。
- 情境回應題可以有多個正確答案，答對後會列出「這些也對」。
- 選另一個性別的形式算對，並提示可以到 Settings 更改。
- 複習題型隨箱數升級：箱 0–1 辨認、箱 2–3 聽辨或排序、箱 4–5 輸入。
- 其他 4 種語言的 Greetings 照常可以上，不會出現排序或輸入題。
- Maggie 的課程選單依語言產生：西文 6 課、其他語言 3 課。
- 支線任務「Proper Introductions」只對西文玩家開啟。
- 存檔 v2 → v3：舊進度、旗標、複習箱數都保留，性別設為未選。
- 瀏覽器 console 沒有錯誤。

## 還沒驗證（🧪）

- 實機手機：橫向時螢幕鍵盤會不會擋住輸入框、iOS 的語音（es-MX）是否可用。
- 實際聽 es-MX 語音的品質。
- 西文內容和繁中解說都還沒經過教師校對（`reviewed: false`）。
