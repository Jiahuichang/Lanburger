# Spanish Curriculum — Lanburger（R6A 草案）

> **狀態：草案（2026-11-06），尚未定案。**
> - §6 的教學流程要等收到 Airlearn 課程目錄和教學畫面後才定案。
> - §7 的關鍵決定請使用者回覆。在那之前，所有標示 ⏳ 的項目都不算決定。
> - 所有西文例句和題目都是原創。PCIC 只用來界定程度範圍，不照抄它的例句當教材。

圖例：
- ✅ 已實際驗證（在遊戲中操作確認，或已讀過原始文件）
- 🧪 需要再測（尚未在實機上，或在真實時間尺度下驗證）
- 👩‍🏫 需要西文教師校對
- ⏳ 待決定

## 1. 參考依據（R6A 已讀過）

| 來源 | 用途 | 狀態 |
| ---- | ---- | ---- |
| CEFR Global scale Table 1（Council of Europe） | A1 的總體能力描述 | ✅ 已讀，2026-11-06 |
| PCIC《Niveles de referencia》A1–A2：Funciones 5 | A1 和 A2 的語言功能與例示 | ✅ 讀的是封存版，見下方說明 |
| PCIC A1–A2：Gramática 2 | A1 文法範圍 | ✅ 讀的是封存版 |
| PCIC A1–A2：Nociones específicas 9 | A1 詞彙主題 | ✅ 讀的是封存版 |
| PCIC A1–A2：Pronunciación 3 | 發音項目的架構 | ✅ 讀的是封存版。這份清單 A1 和 A2 合在一起，沒有分欄 |
| PCIC Introducción general | 參考的語言變體 | ✅ 讀的是封存版 |

**來源狀態**：2026-11-06 時，官方 Centro Virtual Cervantes（cvc.cervantes.es）整站回應 404。以上 PCIC 內容是從 Wayback Machine 2026 年 4–10 月的封存版讀取的。官方網站恢復後，應該再核對一次。

**CEFR A1 總體描述（摘要）**：A1 學習者能做到：
- 理解並使用熟悉的日常用語和非常基本的句子，滿足具體需求。
- 介紹自己和別人。
- 詢問和回答個人資料，例如住哪裡、認識誰、有什麼東西。
- 在對方說得慢、說得清楚、願意幫忙時，進行簡單的互動。

**PCIC 的語言變體**：
- 以「西班牙中北部」的西文為基礎，另外附上其他變體的說明。
- 例句大致採用「norma culta」（受過教育者的標準用法）。
- 文法清單裡會標出拉丁美洲的 voseo 等變化。

## 2. 現況盤點：Greetings（西班牙文）

### 2.1 已完成

| 項目 | 現況 | 狀態 |
| ---- | ---- | ---- |
| 句子 | 共 9 句：¡Hola! · ¡Buenos días! · ¡Adiós! · ¡Gracias! · Me llamo Lanburger. · ¿Cómo te llamas? · Mucho gusto. · ¿Cómo estás? · Estoy bien, gracias. | ✅ 遊戲中可上課；👩‍🏫 未經教師校對（`reviewed: false`） |
| 課程 | 3 課：Hello & Goodbye、Introductions、How are you? | ✅ |
| 解說 | 每課有一段情境說明，加一則西文專屬提示（¡¿ 符號、Me llamo 的字面意思、tú／usted），都有英文和繁中兩版 | ✅ 顯示正常；👩‍🏫 內容未校對 |
| 題型 | 3 種：看西文選意思、看意思選西文、NPC 說一句後選回應（dialogue-reply） | ✅ |
| 答錯回饋 | 用模板說明「你選的意思是…，這題要的是…」；錯 2 次直接揭示答案；選對才能繼續 | ✅ |
| 情境應用 | Remy 的 Chat：4 題情境回應，不扣體力 | ✅ R5 用腳本走過 |
| 音訊 | Listen 按鈕使用裝置內建語音（Web Speech API，`es-ES`，語速 0.85），沒有錄音檔 | ✅ 桌機按鈕存在；🧪 未在手機上實聽，各裝置的聲音品質不同 |
| 完成條件 | 走到結算卡就記錄完成（`lesson:greetings-N`），全答錯也算 | ✅ |
| 複習 | Leitner 0–5 箱，每句依語言分開記錄（`es:hello`）。Learn 按鈕複習到期的句子，Practice Corner 免費練習並回復體力 | ✅ 腳本驗證；🧪 未用真實的多天間隔驗證 |
| 熟練度 | ★ 等於上完課程；★★／★★★ 看複習箱數 | ✅ |

### 2.2 缺漏與問題

**對照 PCIC 的程度**：
- PCIC 把 **¿Cómo estás?**（Funciones 3.11 詢問心情）和 **Mucho gusto**（5.5 回應介紹）列在 **A2**。
- A1 回應介紹的例示是 **Encantado**，以及 **Hola, ¿qué tal?**。
- 這兩句可以當高頻固定語塊教，但不能標成「A1 核心」。⏳ 見 §7-6。

**和 PCIC A1 社交功能相比還缺**：
- Buenas tardes／noches
- Hasta mañana／Hasta el + 星期
- ¿Qué tal?
- Encantado／a
- Soy + 名字
- Señor／Señora + 姓氏
- Perdón
- Muchas gracias
- 介紹別人：Este es… / Esta es…

**沒有教到的語言點**：
- tú 和 usted 的使用時機：目前只在提示裡提到一句，沒有練習。
- 形容詞陰陽性，例如 encantado／encantada：⏳ 取決於 Lanburger 的性別（§7-2）。
- 發音：母音、ñ、ll、r／rr、重音符號都沒有內容。
- 時段：buenos días、buenas tardes、buenas noches 各用在什麼時候。

**題型只到「辨認」**：
- 目前全是三選一，沒有任何需要學生自己產出的題目，例如排序、填空、輸入、聽寫、口說。
- 從「引導」到「獨立作答」的進程還不存在。

**答案判定**：
- 一題只能有一個正確答案。
- 「¿Cómo te llamas?」的回答，Me llamo… 和 Soy… 都合理，但系統只接受一種。
- 「Encantado／Encantada／Mucho gusto」也是同樣的情況。

**答錯說明是通用模板**：只說「意思不同」，不會針對常見錯誤說明，例如：
- 時段用錯
- 正式和非正式語氣搞混
- 告別語和問候語混淆

**誘答選項**：
- 誘答來自同一課，有時與正確答案語意相近。例如在「Hello!」的題目中，¡Buenos días! 也是合理的招呼語。
- 目前靠題型（找「意思相同」的句子）避開，但還沒有逐題檢查。👩‍🏫

**名字固定為 Lanburger**：Me llamo Lanburger. 無法換成玩家的名字。

**聽力**：
- 沒有聽音選答的題型。
- 目前用的是 `es-ES` 語音，但已決定以拉丁美洲西文為主（§7.1），R6B 要改成拉丁美洲的語音。

**完成與熟練沒有清楚分開**：
- 故事完成（任務旗標）和學習熟練（箱數）在資料上已經分開。
- 但 UI 沒有分開呈現；而且 ★ 同時代表「上完」和「熟練度第一級」。R6B 要拆開（§6.3）。

**解說篇幅**：每課只有一段說明，沒有「先看規則、再看對比例子」的結構。

## 3. 範圍界定

**從零基礎到 A1，A1 的意思是**：學生能用 §4 的 12 個單元達到 CEFR A1 的總體描述。目前的遊戲在以下幾個方面還不足以宣稱達到 A1：
- **聽**：只有裝置內建語音，沒有聽力題。
- **說**：沒有口說。
- **寫**：沒有輸入題。
- **讀**：只有單句，沒有短文。

所以，課綱完成不等於 A1 完成：§5 的對應表會清楚標出哪些單元目前遊戲還放不進去。

## 4. 課綱草案：12 個單元（零基礎 → A1）

每個單元約 3 課。每課 2–4 分鐘，新句子最多 5 個。

PCIC 編號的寫法：
- 「F」是 Funciones（語言功能）
- 「G」是 Gramática（文法）
- 「N」是 Nociones específicas（詞彙主題）

| # | 單元 | 能力目標（Can-do） | 主要語言點 | PCIC 對照 | 先備 |
| - | ---- | ------------------ | ---------- | --------- | ---- |
| 0 | **Sonidos**：發音與拼寫入門 | 能讀出常見單字、看懂 ¡¿ 和重音符號 | 5 個母音、ñ、ll、r／rr、h 不發音、重音符號 | 發音 3、5 | 無（也可以拆散到各單元） |
| 1 | **Saludos**：打招呼與道別 | 能依時段打招呼，並能道別 | Hola、buenos días／buenas tardes／noches、adiós、hasta mañana、¿qué tal? | F 5.1、5.2、5.21 | 0 |
| 2 | **Presentarse**：自我介紹 | 能介紹自己、問別人名字、回應介紹 | Me llamo／Soy、¿Cómo te llamas?、Encantado／a、tú 與 usted、señor／señora | F 5.3–5.5、1.2；G ser | 1 |
| 3 | **¿De dónde eres?**：國籍與語言 | 能說自己從哪裡來、說哪些語言 | Soy de…、國籍形容詞的陰陽性、hablo… | F 1.2、1.3；N 3.1；G 2.2 | 2 |
| 4 | **Números**：數字、年齡、電話 | 能說 0–20、年齡、電話號碼（之後再擴大數字範圍；PCIC A1 的基數詞涵蓋到上千） | ¿Cuántos años tienes?（當固定語塊教）、mi teléfono es… | F 1.2、1.3；G 6.1 | 2 |
| 5 | **La gente**：家人與朋友 | 能介紹身邊的人並做簡單描述 | Este／Esta es…、mi／tu／su、ser + 形容詞（陰陽性、單複數）、tengo un hermano | F 1.1、5.4；G 1.2、2.2、5；N 4 | 2、4 |
| 6 | **Comer y beber**：點餐 | 能在餐廳點餐、說喜好、要帳單 | Un café, por favor；Quiero…；¿Algo más?；La cuenta；me gusta／no me gusta | F 4.3、3.2、3.8；N 5 | 4 |
| 7 | **De compras**：購物 | 能問價錢、選擇、付款 | ¿Cuánto cuesta？；este／esta；euros；pagar con tarjeta；顏色和衣物（基本） | N 12；G 4、6.1 | 4、6 |
| 8 | **En el pueblo**：地點與位置 | 能問某地在哪裡、說明位置 | Hay…／Está…、¿Dónde está…?、cerca／lejos、a la derecha／izquierda（不用命令式） | F 1.2、1.3；N 14.3；G hay／estar | 1、7 |
| 9 | **El día**：時間與日常 | 能說時間、星期、日常作息 | ¿Qué hora es? Son las…；星期；-ar／-er／-ir 現在式規則變化 | G 9.1.1；F 1.3 | 4 |
| 10 | **Tiempo libre**：興趣與喜好 | 能說喜歡和不喜歡的活動 | Me gusta + 原形動詞、también／tampoco、運動與休閒 | F 3.2、3.4、3.5；N 8；G 6.2 | 6、9 |
| 11 | **Mi casa**：住處 | 能說住在哪裡，簡單描述住處 | Vivo en…、casa／piso、房間名稱、hay | N 10；G hay | 8 |
| 12 | **Planes**：計畫與天氣 | 能說簡單計畫，並用現在式加時間詞表示未來 | Esta noche…、el domingo…、quiero + 原形動詞；天氣（基本） | F 3.9、3.10、3.8 | 9、10 |

**文法範圍的界線（依 PCIC Gramática A1）**：
- **時態**：只有直陳式現在式，包括規則變化，以及 ser、estar、haber、ir 的不規則變化。
- **固定語塊**：tengo、quiero 等常見母音變化動詞，PCIC 把它們的變化規則放在 A2。A1 只把這些形式當固定語塊教，不講變化表。
- **過去時態**：pretérito perfecto、indefinido、imperfecto 都是 A2，**不放進 A1**。
- **命令式**：A2。所以問路單元只教「está a la derecha」這類說法，不教「gire a la derecha」。

**單元順序**：
- 1→2→3／4 是核心線。
- 5 以後可以依村莊進度調整，但要遵守「先備」欄。
- 每 3 個單元安排一次累積複習（§6.2）。

## 5. 對應 Hello Town 的地點與 NPC

| 單元 | 建議地點／NPC | 是否已有 | 備註 |
| ---- | ------------- | -------- | ---- |
| 0 發音 | Language Academy／Maggie | ✅ 有 | 也可以拆成每單元開頭的「Sound tip」 |
| 1 打招呼 | Academy／Maggie，再到廣場和鎮民練習 | ✅ 有（現有 Greetings L1） | R6B 要補時段和道別 |
| 2 自我介紹 | Academy／Maggie；Mayor Bun 示範 usted | ✅ 有 | 鎮長是 usted 的自然例子 |
| 3 國籍與語言 | Travel Station 前的 Jonas（德國背景，適合談國籍和語言） | 🟡 NPC 有，站內鎖著 | 只在站外對話，不必開放車站 |
| 4 數字 | General Store／Summy，或 Academy | 🟡 店還沒開 | ⏳ 可以先放在 Academy |
| 5 家人朋友 | Town Square 的朋友 NPC（Noah 和 Mochi 談寵物） | 🟡 NPC 有 | 家庭主題需要新的情境 |
| 6 點餐 | Burger Bistro／主廚（暫名 Chef Patty） | 🟡 建築有，室內和 NPC 還沒做 | 原定 Food & Ordering |
| 7 購物 | General Store／Summy | 🟡 室內還沒做 | 原定 Shopping |
| 8 地點與位置 | Racing Garage／Jeremy，或整個城鎮 | 🟡 | 原定 Directions；不用命令式 |
| 9 時間與日常 | **目前沒有適合的地點** | ❌ | ⏳ Town Hall 的大鐘？或新地點 |
| 10 興趣 | Town Square：Remy（畫畫）、Ash（音樂）、Noah（游泳）、Theo（星星） | ✅ NPC 都有 | 原定 Everyday Talk |
| 11 住處 | **目前沒有** | ❌ | ⏳ 新地點，例如 Lanburger 的家，或第二個村莊 |
| 12 計畫與天氣 | Town Square 閒聊，或第二個村莊 | 🟡 | ⏳ |

**誠實說明**：
- Hello Town 原定的 5 個主題（Greetings、Food、Shopping、Directions、Everyday Talk），大約只涵蓋單元 1、2、6、7、8、10 的部分內容。
- 單元 3、4、5、9、11、12 需要新的情境、NPC 或地點，或放到第二個村莊。
- 所以「Hello Town 完成」不等於「A1 完成」。⏳ §7-4

## 6. 教學流程與複習（草案，等 Airlearn 參考後定案）

### 6.1 每課從「引導」到「獨立作答」

| 階段 | 做什麼 | 題型 | 現況 |
| ---- | ------ | ---- | ---- |
| 1 看與聽 | 情境、短規則、範例卡（可播放語音） | 範例卡 | ✅ 已有 |
| 2 辨認 | 看西文選意思 | choose-meaning | ✅ |
| 3 反向辨認 | 看意思選西文 | choose-target | ✅ |
| 4 聽辨 | 聽語音選答案 | listen-choose | ❌ 要新增 |
| 5 組句 | 詞塊排序、填空 | order-words、fill-blank | ❌ 要新增 |
| 6 產出 | 輸入，或拼出關鍵詞，容忍大小寫和重音的小錯 | type-answer | ❌ ⏳ 手機上是否要輸入 |
| 7 情境應用 | NPC 對話，可以有多個合理答案 | dialogue-reply（多正解） | 🟡 有，但只接受單一答案 |
| 8 之後複習 | 間隔複習，題型會隨熟練度升級 | 混合 | 🟡 目前複習只出題型 2 和 3 |

### 6.2 複習安排

- **課內**：新句子在同一課至少出現 3 次，分別出現在階段 2、3、7。
- **間隔**：沿用 Leitner。複習題型隨箱數升級：箱 0–1 用辨認題，箱 2–3 用組句或聽辨，箱 4–5 用產出或情境題。
- **累積複習**：每完成 3 個單元，安排一場「Town Check-in」。這是 NPC 情境的混合題，**不擋劇情**，只影響熟練度和獎勵。
- **螺旋重用**：新單元的 NPC 對話裡，至少 30% 的句子用前面學過的內容。

### 6.3 故事完成和學習熟練分開記錄

| 記錄 | 意義 | 來源 | 擋劇情嗎 |
| ---- | ---- | ---- | -------- |
| 課程完成 | 上完這一課 | `lesson:*` 旗標 | 只擋同主題的下一課 |
| 單元完成 | 單元的課和情境應用都做完 | 新增 `unit:*` 旗標 | 推進任務 |
| 熟練度 | 每句的箱數，以及單元平均 | `vocabulary` 的箱數 | **不擋** |
| 檢核 | 累積複習的成績 | 新增，不擋路 | **不擋** |

UI 會分別顯示「已完成」和「熟練度」。燈籠代表故事進度，星星代表熟練度，兩者不再混在一起。

## 7. 需要你決定的關鍵問題

| # | 問題 | 選項 | 我的建議 | 狀態 |
| - | ---- | ---- | -------- | ---- |
| 1 | **主要的西文變體** | A. 西班牙；B. 拉丁美洲；C. 選一種為主，另一種只當註記 | — | ✅ **已決定（2026-11-06）：以拉丁美洲西文為主**，西班牙用法只當註記。細節見 §7.1 |
| 2 | **Lanburger 的語法性別** | 陽性、陰性、讓玩家選、盡量避開 | — | ✅ **已決定（2026-11-06）：讓玩家選擇。**細節見 §7.2 |
| 3 | **tú 和 usted 的預設** | 鎮民和朋友用 tú；鎮長和陌生大人用 usted；是否教 vos | 照這個分法，vos 只當註記 | ⏳ |
| 4 | **A1 和村莊的關係** | Hello Town 等於 A1 前半（A1.1），第二個村莊等於 A1.2；或 Hello Town 增加地點，完整涵蓋 A1 | 前者：燈籠數不用改，故事也合理 | ⏳ |
| 5 | **音訊和產出題** | 只用裝置語音，或錄製母語音檔；手機上是否出輸入題；口說題是否納入（之後再說） | 先用裝置語音加聽辨題；輸入題只出短詞並容錯；口說之後再做 | ⏳ |
| 6 | **超出 A1 的高頻句**（¿Cómo estás?、Mucho gusto 是 A2） | 保留並標成「常用語塊」，或移到之後的單元 | 保留並標註，因為它們太常用 | ⏳ |
| 7 | **西文教師校對** | 誰來校對、何時校對（也包含繁中說明的用語） | R6B 驗收前至少校對單元 1、2 | ⏳ |

### 7.1 拉丁美洲西文為主：影響與做法

**已確定**：
- **人稱**：
  - 複數「你們」一律用 **ustedes**，正式和非正式都一樣；不教 vosotros 的變化。
  - vosotros 只在西班牙用法註記中出現，讓學生**看得懂、不必會用**。
- **發音**：
  - 採 **seseo**：z、ce、ci 和 s 同音。
  - 採 **yeísmo**：ll 和 y 同音。
  - 西班牙的 z／c 發音只放在註記。
- **voseo**：阿根廷、烏拉圭、中美洲等地用 vos（例如 vos sos）。A1 只做「認得」的註記，不放進練習。
- **對 PCIC 的調整**：
  - PCIC 以西班牙中北部為基礎（§1）。它的例示如果是西班牙特有的，課綱改用拉丁美洲的對應說法並加註。
  - 文法範圍不變，仍然只到現在式。只差在複數第二人稱：只教 ustedes 的變化。
- **貨幣**：遊戲內用 Sesame Coins 或數字，不用歐元，也不綁定任何一國的貨幣。
- **音訊**：R6B 把 Listen 的語音從 `es-ES` 改成拉丁美洲語音。
  - 語音的選擇順序見下方「音訊和用詞是兩回事」。
  - 🧪 各手機有哪些語音，要實機確認。

**用詞以墨西哥為主**：✅ 已決定（2026-11-06）。原本選了「泛拉丁美洲」，後來改成墨西哥。

**為什麼是墨西哥**：使用者想以「carro 和 autobús 都是日常用語」的國家為主。符合的主要是**墨西哥**和**委內瑞拉**。
- 墨西哥的市區公車口語也常說 camión。
- 選墨西哥的原因：使用人口最多，裝置也較常內建 `es-MX` 語音。
- 這是一般語言知識的判斷，👩‍🏫 請老師確認。

**規則如下**：
1. 主要說法採用墨西哥的標準日常用語，教學、例句、NPC 對話都用它。
2. 墨西哥本身有兩種常用說法時，兩種都教，練習時都算正確（R6B 的多正解功能）。
3. 其他拉丁美洲地區的常見說法放進註記，讓學生認得；練習時是否也算正確，⏳ 由老師逐詞判斷。
4. 西班牙用法只放在註記。
5. 避免只有墨西哥人懂的俚語，例如 güey、chido。A1 只用標準日常用語。

**音訊**：
- 依序找 `es-MX`、`es-US`、`es-419`，最後才用任何非 `es-ES` 的 `es` 語音。
- 🧪 各手機有哪些語音，要實機確認。

| 意思 | 主要說法（墨西哥） | 一起教、都算對 | 其他拉丁美洲（註記） | 西班牙（只當註記） |
| ---- | ------------------ | -------------- | -------------------- | ------------------ |
| 手機 | celular | — | — | móvil |
| 電腦 | computadora | — | computador（智利、哥倫比亞） | ordenador |
| 汽車 | carro | coche（墨西哥也常用） | auto（阿根廷、智利、烏拉圭） | coche |
| 果汁 | jugo | — | — | zumo |
| 馬鈴薯、薯條 | papas、papas fritas | — | — | patatas |
| 公寓 | departamento | — | apartamento（哥倫比亞、委內瑞拉） | piso |
| 公車 | autobús | camión（墨西哥市區口語，聽到要認得） | colectivo（阿根廷）、bus、guagua（加勒比海） | autobús |

👩‍🏫 上表要請熟悉墨西哥西文的老師確認。之後每個單元的詞彙表都要加一欄「地區差異」。

### 7.2 語法性別：讓玩家選擇（R6B 實作）

**範圍**：只影響玩家「說自己」時會變化的字。例如：
- encantado／encantada
- cansado／cansada
- (Soy) mexicano／mexicana

**選項**：
- 兩個選項，在介面上寫成「Spanish forms: -o (encantado) / -a (encantada)」。介面文字照例用英文。
- **隨時可以改**，在 Settings 裡。
- 不跟角色外觀綁定。Lanburger 是漢堡生物，沒有性別外觀。

**什麼時候問**：
- 第一次上西文課、遇到第一個會變化的字之前，由 Maggie 在課堂裡問。
- 問的時候順便解釋：西文有些字會依說話者的性別變化。這本身就是一個教學點。
- 沒選之前，題目只用不變化的說法，例如 Mucho gusto。

**題目怎麼判定**：
- 玩家選的形式算正確。
- 中性說法（例如 Mucho gusto）在合適的題目也算正確。
- 選到另一個性別的形式：⏳ 暫定**算對**，並附一句溫和的提示，也不扣體力。理由是語法沒錯，只是跟玩家設定的性別不一致。
- 👩‍🏫 是否改成要求重選，請老師判斷。

**存檔**：
- 需要在 profile 新增一個欄位，例如 `grammaticalGender: 'm' | 'f' | null`。
- 依 CLAUDE.md 規則 9，要把 `SAVE_VERSION` 升到 3 並寫 migration。舊存檔預設為 `null`，等第一次遇到會變化的字時再問。
- 這個欄位與學習語言無關，之後其他有性別變化的語言也能沿用。

**不教的形式**：A1 不教非標準的中性寫法（例如 -e、-x）。需要的玩家可以盡量用中性說法回答。

## 8. R6A 和 R6B 的範圍

**R6A（本階段）**：
- 只有本文件、現況盤點、決定清單。
- 不新增教材、題型、地點或任務。

**R6B（等 §7 決定，並收到 Airlearn 參考後）**：把 Greetings 重做成第一個完整的西文單元，也就是單元 1 和 2：
- 清楚的學習目標和短解說。
- §6.1 的階段 1–8，需要新增題型 4、5、6 和多正解。
- 針對常見錯誤的答錯說明，例如時段、正式和非正式、問候和道別。
- NPC 情境應用：Remy 加上用 usted 的鎮長。
- 間隔複習時題型升級。
- 故事完成和學習熟練分開記錄。

其他語言保留現有功能，不同步大量新增教材。選單維持英文，解說沿用玩家選的語言。

## 9. 來源

- Council of Europe：CEFR Global scale, Table 1。https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale
- Instituto Cervantes：《Plan curricular del Instituto Cervantes. Niveles de referencia para el español》（2006）。這頁是官方介紹，內容包括三冊、A1–A2 為第一冊、12 份清單。https://cervantes.org/es/sobre-nosotros/publicaciones/plan-curricular-instituto-cervantes-niveles-referencia-espanol
- PCIC 線上版。官方站 cvc.cervantes.es 在 2026-11-06 時打不開，以下是 Wayback Machine 的封存版：
  - Funciones A1–A2（封存於 2026-04-27）：https://web.archive.org/web/20260427175354/https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/05_funciones_inventario_a1-a2.htm
  - Gramática A1–A2（封存於 2026-10-12）：https://web.archive.org/web/20261012071035/https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_a1-a2.htm
  - Nociones específicas A1–A2（封存於 2026-10-05）：https://web.archive.org/web/20261005071653/https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/09_nociones_especificas_inventario_a1-a2.htm
  - Pronunciación A1–A2（封存於 2026-10-05）：https://web.archive.org/web/20261005232422/https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/03_pronunciacion_inventario_a1-a2.htm
  - Introducción general（封存於 2026-10-07）：https://web.archive.org/web/20261007124743/https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/introduccion.htm
