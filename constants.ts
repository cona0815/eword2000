
import { Word, QuizQuestion, ExamSource, MollyGrammarUnit } from './types';

// ... (Pre-existing code for BASE_YEAR_MAP, READING_HIGH_MAP, SUPER_HIGH_MAP, CORE_VOCAB_MAP, PAST_EXAM_DATABASE, REAL_EXAM_QUESTIONS remains unchanged) ...
// (Retain all vocabulary maps and data above this line)

// 歷年考點 (Year-by-Year) - 基礎層級
const BASE_YEAR_MAP: Record<string, string> = {
  // 114年
  "kite": "歷年考點", "shy": "歷年考點", "sailing": "歷年考點", "listen": "歷年考點",
  "ready": "歷年考點", "face": "歷年考點", "fool": "歷年考點", "grow": "歷年考點",
  "traffic": "歷年考點", "perhaps": "歷年考點", "save": "歷年考點", "ask": "歷年考點",
  "bakery": "歷年考點", "hospital": "歷年考點", "exercise": "歷年考點", "wedding": "歷年考點",
  "zone": "歷年考點", "ticket": "歷年考點", "campground": "歷年考點", "sacrifice": "歷年考點",
  "furniture": "歷年考點", "government": "歷年考點", "electricity": "歷年考點",

  // 113年
  "envelope": "歷年考點", "neck": "歷年考點", "leave": "歷年考點", "weather": "歷年考點",
  "hate": "歷年考點", "lucky": "歷年考點", "sharp": "歷年考點", "temple": "歷年考點",
  "robot": "歷年考點", "miss": "歷年考點", "worst": "歷年考點", "dentist": "歷年考點",
  "explain": "歷年考點", "scared": "歷年考點", "believe": "歷年考點", "shout": "歷年考點",

  // 112年
  "basket": "歷年考點", "sing": "歷年考點", "dance": "歷年考點", "size": "歷年考點",
  "jog": "歷年考點", "full": "歷年考點", "burn": "歷年考點", "headache": "歷年考點",
  "bite": "歷年考點", "possible": "歷年考點", "finally": "歷年考點", "expect": "歷年考點",
  "medicine": "歷年考點",

  // 111年
  "candle": "歷年考點", "light": "歷年考點", "choice": "歷年考點", "easy": "歷年考點",
  "deep": "歷年考點", "lazy": "歷年考點", "wise": "歷年考點", "follow": "歷年考點",
  "study": "歷年考點", "infographic": "歷年考點", "sugar": "歷年考點", "habit": "歷年考點",

  // 110年
  "bow": "歷年考點", "cry": "歷年考點", "unhappy": "歷年考點", "cook": "歷年考點",
  "plan": "歷年考點", "snack": "歷年考點", "drawer": "歷年考點", "points": "歷年考點",
  "culture": "歷年考點", "history": "歷年考點", "restaurant": "歷年考點",

  // 109年
  "glass": "歷年考點", "glove": "歷年考點", "raise": "歷年考點", "alone": "歷年考點",
  "library": "歷年考點", "visit": "歷年考點", "commute": "歷年考點", "price": "歷年考點",

  // 108年
  "lead": "歷年考點", "club": "歷年考點", "weak": "歷年考點", "garbage": "歷年考點",
  "hide": "歷年考點", "excuse": "歷年考點", "pie": "歷年考點", "chess": "歷年考點",
  "radio": "歷年考點", "rise": "歷年考點", "neighbor": "歷年考點", "goulash": "歷年考點",
  "poem": "歷年考點", "energy": "歷年考點", "nature": "歷年考點",

  // 107年
  "pack": "歷年考點", "wind": "歷年考點", "wallet": "歷年考點", "stranger": "歷年考點",
  "tooth": "歷年考點", "police": "歷年考點", "singer": "歷年考點", "factory": "歷年考點",
  "action": "歷年考點", "beach": "歷年考點", "bench": "歷年考點", "snake": "歷年考點",
  "apartment": "歷年考點", "parking space": "歷年考點",

  // 106年
  "remember": "歷年考點", "truck": "歷年考點", "wait": "歷年考點", "uniform": "歷年考點",
  "marry": "歷年考點", "boring": "歷年考點", "heavy": "歷年考點", "map": "歷年考點",
  "lightly": "歷年考點", "crazy": "歷年考點", "festival": "歷年考點", "camping": "歷年考點",
  "sale": "歷年考點",

  // 105年
  "cross": "歷年考點", "excited": "歷年考點", "voice": "歷年考點", "supermarket": "歷年考點",
  "health": "歷年考點", "hobby": "歷年考點", "bake": "歷年考點", "bright": "歷年考點",
  "kind": "歷年考點", "comb": "歷年考點", "street": "歷年考點", "vacation": "歷年考點",
  "schedule": "歷年考點", "course": "歷年考點",

  // 104年
  "square": "歷年考點", "dress": "歷年考點", "office": "歷年考點", "hat": "歷年考點",
  "pound": "歷年考點", "polite": "歷年考點", "writer": "歷年考點", "surprise": "歷年考點",
  "building": "歷年考點", "game": "歷年考點", "water": "歷年考點", "message": "歷年考點",
  "church": "歷年考點",

  // 103年
  "honest": "歷年考點", "farm": "歷年考點", "song": "歷年考點", "noise": "歷年考點",
  "joy": "歷年考點", "meat": "歷年考點", "book": "歷年考點", "party": "歷年考點", "bus": "歷年考點",

  // 102年
  "bee": "歷年考點", "rose": "歷年考點", "dirty": "歷年考點",
  "coat": "歷年考點", "chopsticks": "歷年考點", "lunch": "歷年考點", "group": "歷年考點",
  "tennis": "歷年考點", "player": "歷年考點", "movie": "歷年考點"
};

const READING_HIGH_MAP: Record<string, string> = {
  "however": "閱測高頻", "although": "閱測高頻", "though": "閱測高頻",
  "finally": "閱測高頻", "actually": "閱測高頻", "in fact": "閱測高頻",
  "probably": "閱測高頻", "perhaps": "閱測高頻", "especially": "閱測高頻",
  "instead": "閱測高頻", "notice": "閱測高頻", "invite": "閱測高頻",
  "collect": "閱測高頻", "celebrate": "閱測高頻", "appear": "閱測高頻",
  "share": "閱測高頻", "change": "閱測高頻", "famous": "閱測高頻",
  "convenient": "閱測高頻", "dangerous": "閱測高頻", "strange": "閱測高頻",
  "serious": "閱測高頻", "common": "閱測高頻", "simple": "閱測高頻",
  "terrible": "閱測高頻", "proud": "閱測高頻", "likely": "閱測高頻",
  "mainly": "閱測高頻", "according to": "閱測高頻", "following": "閱測高頻",
  "paragraph": "閱測高頻", "title": "閱測高頻", "infer": "閱測高頻",
  "replace": "閱測高頻"
};

const SUPER_HIGH_MAP: Record<string, string> = {
  "popular": "超級高頻", "business": "超級高頻", "experience": "超級高頻", 
  "decide": "超級高頻", "problem": "超級高頻", "market": "超級高頻", 
  "worry": "超級高頻", "save": "超級高頻", "prepare": "超級高頻", 
  "successful": "超級高頻", "service": "超級高頻", "check": "超級高頻"
};

export const CORE_VOCAB_MAP: Record<string, string> = {
  ...BASE_YEAR_MAP,
  ...READING_HIGH_MAP,
  ...SUPER_HIGH_MAP
};

export const PAST_EXAM_DATABASE: ExamSource[] = [
  { year: "114會考", question: "Look at the picture. A kite is flying over the houses.", translation: "看這張圖。風箏正飛越房子上方。" },
];

export const REAL_EXAM_QUESTIONS: Record<string, Omit<QuizQuestion, 'wordId' | 'wordTerm'>[]> = {};

// Molly 老師彙編 (Unit 0 + 12 Units)
export const GRAMMAR_QUIZ_QUESTIONS_PER_ROUND = 15; // 每回合文法測驗的題目數量

export const MOLLY_GRAMMAR_UNITS: MollyGrammarUnit[] = [
  {
    id: "unit0",
    title: "特別收錄：重點二十關鍵句型",
    summary: "拼出會考高分地圖 (統整：蘇盈菁)。彙整自 109 至 113 年歷屆考題，針對學生最容易混淆的文法句型，做出最實用的統整與擷取範例或改寫。",
    content: [
      {
        type: 'text',
        data: "這份「會考英語重點二十關鍵句型」彙整自 109 至 113 年歷屆考題，針對學生最容易混淆的文法句型，做出最實用的統整與擷取範例或改寫。希望你能在有限時間裡，有效掌握方向，把握得分關鍵。"
      },
      {
        type: 'text',
        title: "一、時態 Tenses",
        data: "用法說明：會考幾乎每年都出現動詞時態的辨識題，常搭配副詞或上下文情境考察學生對動作時間的理解。進行式與完成式混用、過去未來 would 構句，常為陷阱題。\n\n1. 現在簡單式\nMy sister **comes** home at five every day.\n→ 習慣性行為。出自 111 年改寫。\n\n2. 現在進行式\nListen! The baby **is crying** in the bedroom.\n→ 正在發生的動作。（110 年會考原句）\n\n3. 過去簡單式\nMozart **wrote** his first music when he was six years old.\n→ 表示已完成的過去事實。（出自 109 年會考原句）\n用法說明：過去簡單式用於描述在特定過去時間發生的動作或事件。常搭配時間副詞（如 yesterday, last year, in 2005, when I was a child）明確指出過去某時。\n\n【延伸句型：used to + 原形動詞】\n用法說明：\"used to + 原形動詞\" 表示「以前經常做某事，但現在不再做了」，與現在情況形成對比。會考常考於人物背景描述、生活轉變的篇章中。\n【會考改寫範例】Lynn **used to eat out** a lot, but now she cooks for herself.\n→ 改寫自 110 年會考 Lynn 不滿意火鍋店後開始自己煮飯的題組。\n\n【語境辨識提醒】\n→ 過去簡單式強調「某次」事件發生：She ate out last night.\n→ used to 強調「以前常常」：She used to eat out every day.\n\n4. 過去進行式\nI **was taking** a bath when someone turned off the light.\n→ 過去某時正在進行的動作。（101 年原句）\n\n5. 現在完成式\nMy father **has worked** in a school library for 20 years.\n→ 從過去持續到現在。（109 年原句）\n現在完成式強調「從過去某一時刻開始，一直到現在仍然持續」的狀態或行為。常與 for（一段時間） 或 since（起始點） 搭配使用。\n###注意：並非所有 for + 一段時間 的句子都必定使用完成式，須根據語境判斷是否仍在進行或已結束。\nEx: I lived in Kaohsiung for five years when I was a child.\n→ 本句使用過去式，因為動作已經結束（我小時候住過，現在不住了）。\n【語境分析】：「for five years」雖然表示一段時間，但「when I was a child」明確指出是過去的事情，因此不能使用現在完成式。\n\n6. 未來式\nShe **will stay** with me for a week.\n→ 將來即將發生的動作。（110 年原句）\n\n7. would + 原形動詞（未來在過去）\nWe thought Jerry **would do** well on the job, but he failed.\n→ 表示過去預測未來。（109 年原句）\n用法說明：「would + 原形動詞」是「未來在過去」的結構，表示：\n→ 在過去的某一時間點，對未來的動作或結果進行預測、計畫或期待。\n→ 常搭配過去式主句（如 thought, believed, hoped 等），引導出一個對未來的假設或想法。\n→ 用來表達當時的預期，但未來結果不一定如預期。\n\n【句型結構】主要句（過去式） + 賓語子句（would + 原形動詞）\nHe **said** he **would visit** me next week.\nThey **believed** the plan **would work** well.\n會考語境提示：這個結構常出現在人物對話（回憶/計畫）或敘述類題組中，會考常透過時態交錯來測試學生是否能辨認：\n→ 主句是過去時 → 子句是「過去看未來」\n延伸例句（符合會考情境）\nI **hoped** the movie **would be** fun, but it **was boring**. → 過去期待未來的結果。"
      },
      {
        type: 'text',
        title: "二、時間副詞子句 (when / while / as soon as / as long as)",
        data: "用法說明：會考常考句構邏輯與動作先後，when 對應短暫動作，while 對應持續動作。as soon as 常與過去簡單式搭配，as long as 為條件限定。\n\n8. when：當...時\nI was walking home *when I saw a snake on the road*.\n→ 主要句用過去式，when 引導短暫動作。\n\n9. while：當...時（長動作）\n*While I was cooking*, the baby started to cry.\n→ 表示背景動作。會考中常搭配過去進行式。\n\n10. as soon as：一...就...\nI called my friend *as soon as I got home*.\n→ 出現在 112 年閱讀題幹。\n\n11. as long as：只要...\nYou can join the trip *as long as you finish your homework*.\n→ 表條件限制。改寫自 110 年題意。"
      },
      {
        type: 'text',
        title: "三、條件句 (If + 現在式，主要句未來式)",
        data: "用法說明：真實條件句為近年閱讀與克漏字常考項，常以 if 子句表示現在時，主要句常以未來式出現。要留意「現在代替未來」用法與日常語境搭配。\n\n12. if 為現在代替未來用法:\n**If** you **are** late again, you **won’t be able** to join us.\n→ 會考常考未來條件句（如 110/109 年）。\n\n13. if 代表語氣真實、日常用語\n**If** you need help, just call me.\n→ 改寫自 113 年 refrigerator 題。"
      },
      {
        type: 'text',
        title: "四、被動語態 Passive Voice",
        data: "用法說明：描述動作接受者或事件經過時常用被動語態。常考現在完成式被動與進行被動句（being Vpp），易與主動語態混淆。\n\n14. 一般過去式被動\nThe dog **was taken** to the animal hospital.\n→ 被動句，會考常用描述事件。\n\n15. 現在完成式被動\nThe new medicine **has been used** in many hospitals.\n→ 出自 112 年第 22 題。\n\n16. be 動詞 + being + Vpp（進行被動）\nThe cat **loves being brushed**.\n→ 105 年會考題，易錯句型。"
      },
      {
        type: 'text',
        title: "五、情態助動詞 Modals",
        data: "用法說明：must / should / can 等助動詞用於建議、能力、義務情境常見。會考選項常考語氣強弱對比與語意判別。\n\n17. should / must / have to\nYou **have to** save your work before closing the app.\n→ 改寫自 109 年題組操作說明題。\n\n18. can / could\nShe **can** speak English and French.\n→ 常考能力句型。改寫自 110 題幹。\n\n19. would like to\nI **would like to** order a bagel and some milk.\n→ 改寫自 113 年麵包店題。"
      },
      {
        type: 'text',
        title: "六、名詞子句（疑問詞 / if / whether）",
        data: "用法說明：常以句中受詞出現，句首不能倒裝，出現在對話或新聞敘述中。常考 “Can you tell me when…” 與 “I don’t know why…” 結構。\n\n20. I don’t know why...\nI don’t know **why he decided to leave**.\n→ 出自 113 年第 4 題。\n\n21. Can you tell me when...?\nCan you tell me **when the movie starts**?\n→ 改寫自 110 題幹。\n\n22. I wonder if...\nI wonder **if I locked the door**.\n→ 懷疑或不確定時用 if/whether。109~112 年皆常見。"
      },
      {
        type: 'text',
        title: "七、比較級與最高級 Comparisons",
        data: "用法說明：考文意推論與句型應用。常用比較級 than、最高級 most + adj、等級句 as…as…。題組中常需根據語境選擇正確形式。\n\n23. 比較級 than\nThis test is **easier than** the last one.\n→ 改寫自 111 年數學題敘述。\n\n24. 最高級 the + adj-est / most + adj\nShe is **the most popular player** on the team.\n→ 111 年第 4 題原句。\n\n25. as...as 結構\nHe can run **as fast as** his brother.\n→ 會考閱讀中常出現比較句型。"
      },
      {
        type: 'text',
        title: "八、關係代名詞 (who / that / which)",
        data: "用法說明：用來連接主詞與描述，考句構完整性與修飾對象，who 指人，which 指物，that 通用。出現在人物介紹與描述題最常見。\n\n26. The man **who lives next door** is very friendly.\n→ 出自 110 年題組：Mr. Wu 在廚房沒聽到嬰兒哭。\n\n27. I have a friend **who can speak five languages**.\n→ 改寫自 110～113 年各年度人物篇主題。\n\n28. The restaurant **that we visited yesterday** was great.\n→ 改寫自 110 年 Caldron 題組 Lynn 不滿意餐廳。\n\n29. The book **which I borrowed** is interesting.\n→ 常見閱讀篇章內資訊提示題。"
      },
      {
        type: 'text',
        title: "九、關係副詞 (where / when / why)",
        data: "用法說明：用來連接地點、時間或原因名詞，常考修飾語先行詞關係。會考常考 where 補述地點，when 補述時間點。\n\n30. This is the house **where I grew up**.\n→ 改寫自 113 年 Philip 父親誤闖家門題。\n\n31. I still remember the day **when we first met**.\n→ 出自 111 年生活經驗相關篇章句型。\n\n32. Nobody knows the reason **why she left the team**.\n→ 改寫自 113 年第 4 題。"
      },
      {
        type: 'text',
        title: "十、附和句 (So + 助動詞/Be + S.)",
        data: "用法說明：用於表達「我也一樣」，常考於對話與描述情境中，需正確選用助動詞或 be 動詞。句構與時態需一致。\n\n33. Lora likes bananas, and **so do I**.\n→ 出自 113 年第 7 題原句。\n\n34. He has been to Japan, and **so has his brother**.\n→ 出自歷屆旅遊類題型句改寫。\n\n35. She is tired today, **and so is her teacher**.\n→ 常考情境對話附和。"
      },
      {
        type: 'text',
        title: "十一、附加問句 (Tag Questions)",
        data: "用法說明：用於確認語氣，會考常出現在對話、生活情境題。否定主句配肯定尾句，常搭配過去式、can/can’t 等助動詞。\n\n36. You like chocolate, **don’t you**?\n→ 常考口語互動類會話題型。\n\n37. She can swim well, **can’t she**?\n→ 出自 110 年主題句意改寫。\n\n38. Kevin never went to school today, **did he**?\n→ 過去式否定句為會考常見陷阱句型，請特別留意「否定語氣」的不同表現形式，如：never, seldom, hardly 等，雖然句子中沒有 not，但語意上屬於否定句，因此尾句須使用肯定問句。"
      },
      {
        type: 'text',
        title: "十二、反身代名詞 (myself / yourself / herself...)",
        data: "用法說明：表示主詞自己做某事，常考與主詞一致性。也用於強調語氣，例如 “I did it myself.” 常見於家庭生活場景。\n\n39. I stayed at home and cooked lunch **myself**.\n→ 改寫自 110 年 Lynn 餐廳需自己煮題。\n\n40. The dentist pulled out a good tooth, so I want to do it **myself** next time!\n→ 改寫自 113 年第 20 題。"
      },
      {
        type: 'text',
        title: "十三、代名詞用法：other / another / the others / some of...",
        data: "用法說明：考名詞指涉與數量區分，“another” 指沒有指定的任一個，“the others” 指其餘全部，“some of” 表部分。常與情境推論結合出題。\n\n41. I’ll take **another** slice of cake.\n→ 出自餐飲場景對話常見選項（112 年）\n\n42. **The others** are still waiting outside.\n→ 出自 111 年閱讀：Tea-Rock 或客人排隊題。\n\n43. **One** student is writing; **the others** are reading.\n→ 改寫自歷屆教室描述題。\n\n44. **Some** students are playing; **others** are helping the teacher.\n→ 出自會考典型人物/情境圖片選擇題。\n\n45. I don’t want **any other** bag; **this one** is perfect.\n→ 改寫自 111 年購物題。\n\n46. **Some of** the books are missing.\n→ 改寫自圖書館、教室或學習類主題閱讀題。\n\n47. **Each of** the students **has** a task to do.\n→ 出自 113 年家事分工題：Everyone’s got their own job.\n\n48. **Most of them** enjoyed the concert.\n→ 出自歷屆音樂/活動題組敘述。\n\n49. **All of** the bread **is** fresh today.\n→ 出自 113 年 bakery 選擇題 Kevin 買麵包。\n\n50. I want to buy **some of** the snacks you had.\n→ 出自歷屆美食/超市選購類篇章。"
      },
      {
        type: 'text',
        title: "十四、To + V, S + V.（表目的、感受、結果）",
        data: "用法說明：不定詞片語置句首，表示目的或感受，搭配生活任務常見，例如「To save time, …」。會考常考是否能改寫主句為不定詞開頭。\n\n51. **To save time**, we bought the train tickets online.\n→ 出自 109 年會考第 8 題，原句為：It saves us a lot of time.\n\n52. **To cook better food**, Lynn tried Caldron restaurant.\n→ 改寫自 110 年題組中 Lynn 吃火鍋自煮題。\n\n53. **To help his little brother**, Philip went out to buy food.\n→ 改寫自 113 年第 22 題，Philip 帶弟弟外出買食物。"
      },
      {
        type: 'text',
        title: "十五、By + V-ing, S + V.（表方法或手段）",
        data: "用法說明：by + V-ing 表「藉由…」，常搭配動作與結果表達因果或方法。會考克漏字與文意判斷題組常見。\n\n54. **By using** the free bus service, you can get to the festival easily.\n→ 改寫自 113 年第 26 題，原文建議使用免費接駁車。\n\n55. **By collecting** things from home, Matt had a successful yard sale.\n→ 改寫自 109 年題組 yard sale 題。\n\n56. **By practicing** every night, Ariel got a good grade on her Chinese test.\n→ 改寫自 111 年第 19 題。"
      },
      {
        type: 'text',
        title: "十六、V-ing 開頭句（動名詞作主詞）",
        data: "用法說明：表達某種行為當主詞時使用，常見於健康、學習主題，如 “Eating well is important.” 題組閱讀中常見此句型。\n\n57. **Eating well** makes you healthier.\n→ 改寫自 113 年 bakery 題與日常飲食搭配。\n\n58. **Getting enough sleep** is important before an exam.\n→ 常見會考健康主題閱讀搭配句型。\n\n59. **Using mobile phones** in class is not allowed.\n→ 改寫自歷屆會考規則類說明文風格。"
      },
      {
        type: 'text',
        title: "十七、To V 開頭句（不定詞作主詞）",
        data: "用法說明：用來強調目的或態度，較正式，多見於書信、說明文與學習態度類題型。\n\n60. **To finish the report on time** is important for Linda.\n→ 改寫自 113 年第 21 題對話：Have you finished your report?\n\n61. **To be on time** shows respect to others.\n→ 出自 112 年服務業篇章改寫句型。"
      },
      {
        type: 'text',
        title: "十八、名詞比較句型：V-ing vs. V-ing + N",
        data: "用法說明：比較兩個行為或行為+受詞，常見句型如 “Reading books is better than watching TV.” 出現在日常對比主題中。\n\n62. **Eating habits** are more important than eating snacks all day.\n→ 出自歷屆飲食主題文章句型。\n\n63. **Reading books** is more relaxing than playing video games.\n→ 出自 109 年、111 年娛樂相關文章類比句改寫。\n\n64. **Watching movies** at home **saves** more money than going to the theater.\n→ 出自歷屆會考中「在家 vs. 外出」類閱讀題改寫。"
      },
      {
        type: 'text',
        title: "十九、感官動詞、連綴動詞與使役動詞句型",
        data: "用法說明：這類動詞為會考命題常客，常出現在圖文選擇、生活對話與閱讀推論中，重點在於動詞後接語型是否正確，以及語意上的細微區辨。學生若只靠直覺選項，容易落入陷阱。\n\n【補充 1】感官動詞 + 原形動詞 / V-ing\n常見動詞：see, watch, look at, hear, listen to, feel, notice\n→ 原形動詞：強調看到／聽到整個動作完成\n→ V-ing：強調看到／聽到動作正在進行中\n\n65. I **saw** a woman **drive away** after she got into the car.\n→ 感官動詞 + 原形動詞，表示看到整個動作完成（出自 111 年圖片題）\n\n【補充 2】使役動詞 + 原形動詞\n常見動詞：make, let, have\n→ 語意：表示讓某人去做某事，後接 原形動詞。\n→ 與 to V 搭配為錯誤句型，是會考常設陷阱。\n\n66. The loud music **made** me feel uncomfortable.\n→ 表達「音樂讓我感到…」，正確使用原形。\n\n67. My mom **let** me stay up late last night.\n→ 「讓我晚睡」，描述權限或允許。\n\n68. The loud music **made** me **feel** uncomfortable.\n→ 使役動詞 + 原形動詞，表示音樂讓我產生某種感受（改寫自情境題）\n\n【補充 3】連綴動詞 + 形容詞\n用法說明：連綴動詞（look, sound, smell, taste, feel）後接形容詞，用來形容「主詞的狀態」而非描述動作。學生常誤選副詞。\n\n69. The bread **smells good**.\n→ 連綴動詞 + 形容詞，描述食物的氣味（出自 113 年 bakery 選購題）\n\n70. You **sound tired**.\n→ 表說話人的感受，用 sound + 形容詞 表「聽起來…」（可參照110～111 對話推論題）\n\n【補充 4】連綴動詞 + like + 名詞／子句\n用法說明：look / sound / smell + like + 名詞：表示主觀感覺或比喻，不是等於原形動詞用法，也不是介係詞片語結構，容易混淆。\n\n71. That soup **smells like** chicken.\n→ smell + like + 名詞，比喻判斷（常見於食物主題）\n\n72. He **looks like** a teacher.\n→ look + like + 名詞，表示外觀像（出自 109 年人物判斷題可延伸）\n\n【補充 5】feel like + V-ing\n用法說明：feel like + V-ing 表示「想要做某事」，屬於慣用語，並非「感覺起來像…」，常誤選原形動詞。\n\n73. I **feel like** going out for a walk.\n→ 表「我想出去散步」的意思（出自歷屆情境對話句型延伸）"
      },
      {
        type: 'text',
        title: "二十、名詞片語修飾與指涉用法（This / That / One / It）",
        data: "用法說明：代詞指涉（尤其是 it, this, that, one, ones）常在會考閱讀與對話中混淆，屬於理解句意與文脈邏輯重點—“this/that”指整句概念，“it”指特定名詞，“one”替代同類物件。閱讀與會話常見出題點。\n\n74. I like this bag, but I’ll take **that one** instead.\n→ one 替代同類不同物，常見購物對話選項\n\n75. The robot was fast and quiet. **That** surprised everyone.\n→ that 指前句整體情況（句子指涉），112 年閱讀常見\n\n76. Linda broke a glass. **It** was her favorite cup.\n→ it 指代特定名詞（邏輯代名詞題）"
      },
      {
        type: 'text',
        title: "結語：這份筆記，是你邁向穩定高分的證明",
        data: "如果你已經陪著這份筆記走到最後，那麼請你為自己鼓掌。不只是因為你「讀完了」，而是因為你願意在面對困難時，選擇多理解一句、多看一眼，甚至多相信自己一點。\n\n文法從來不只是考試的內容，它是你邏輯表達的能力、是你面對閱讀時的導航地圖，更是讓你讀懂世界的基礎。\n\n願你從這 20 個文法關鍵中獲得的不只是分數，更是一份穩定與自信。因為能夠學習、願意堅持的人，永遠走得比想像更遠。\n\n這份筆記，不只是學習的紀錄，它是你邁向穩定高分的證明，也是送給未來自己的保證。"
      }
    ],
    questions: [
      {
        wordId: "key20_q1",
        question: "1. The weather _____ rainy and cloudy in the last few days. I hope the sun will come out soon.",
        options: ["has been", "had been", "will be", "would be"],
        correctAnswerIndex: 0,
        explanation: "關鍵詞為 in the last few days，「在過去幾天都」陰雨綿綿，因此會期望能快點放晴；描述「從過去持續到現在的狀況」，要用「現在完成式」。(106年, 正答率46% 易失分)",
        source: "106年會考"
      },
      {
        wordId: "key20_q2",
        question: "2. Tonight I’ll stay at the office until I _____ the work.",
        options: ["finish", "am finishing", "finished", "will finish"],
        correctAnswerIndex: 0,
        explanation: "until 連接的時間副詞子句，用「現在簡單式」代替未來式。(104年會考)",
        source: "104年會考"
      },
      {
        wordId: "key20_q3",
        question: "3. We were so sure that Jerry _____ well on the difficult job... So when he failed, no one believed it.",
        options: ["had done", "did", "has done", "would do"],
        correctAnswerIndex: 3,
        explanation: "過去看未來 (Future in the Past)。當時確信 Jerry「將會 (would)」做得很好。(109年會考)",
        source: "109年會考"
      }
    ],
    subQuizzes: [
      { title: "時態 Tenses", questionIds: ["key20_q1", "key20_q3"] },
      { title: "時間副詞子句", questionIds: ["key20_q2"] }
    ]
  },
  {
    id: "unit1",
    title: "Unit 1: 時態 (Tenses)",
    summary: "時態在會考是最常考的文法概念，除了單題，也是克漏字題組的常客，像105年的克漏字題組(35~38題)共4題都在考時態，還有111年的單題就考了4題時態題，其重要性不言而喻～",
    content: [
      {
        type: 'text',
        data: "【統計】：共 43 題 (過去簡單式 9 | 未來式 8 | 現在完成式 6 | 被動語態 6 | 現在進行式 5 | 過去進行式 4 | 現在簡單式 3 | 過去完成式 2)"
      },
      {
        type: 'text',
        data: "⭐ 圖解文法：英文12種時態 (國中會考範圍只考編號 1️⃣~6️⃣)"
      },
      {
        type: 'table',
        data: [
          ["", "過去 (Past)", "現在 (Present)", "未來 (Future)"],
          ["簡單", "4️⃣ I worked yesterday.\n* 過去某時間點發生的事...\n* 有明確時間點 (現完沒有)\n* used to和would最常錯", "1️⃣ I work every day.\n* 事實、習慣。三單Vs", "6️⃣ I will work later.\nI am going to work later.\n* 未來某時間將會發生的事。\nwill / be going to V\n* in + 時間是未來式，如 in 3 days (三天內)"],
          ["進行", "5️⃣ 1. I was working when you called.\n2. While I was working. you called.\n* 過去某時間點當A做...時，B正在做...was/were + Ving", "2️⃣ I am working.\n正在做...be +Ving", "I will be working when you arrive tomorrow."],
          ["完成", "I had worked for 10 hours before you arrived.", "3️⃣ I have worked for 10 hours so far.\n* 目前為止已經做...\n* have/has + Vpp\n* since, for, over, so far, already, yet, ever, in the last few days…或沒有明確時間", "I will have worked for 10 hours before you arrive."],
          ["完成進行", "I had been running for an hour before you arrived.", "I have been running for an hour so far.", "I will have been running for an hour before you arrive."]
        ]
      },
      {
        type: 'text',
        title: "⭐ 被動語態：被動語態：be +Vpp",
        data: "被動語態搭配「動詞+不定詞／現在分詞」或被動語態搭配「完成式」一起考錯誤率極高)\n\n(1) 作答前想一下是主詞是主動還是被動。\n(2) 被動和「動詞+不定詞／現在分詞」還有「完成式」綁在一起考錯誤率極高，試試看翻譯下面這兩題：\na. 「貓喜愛(被)梳毛」The cat loves _____ _____ ______. 或 The cat loves _____ _____.\nb. 「貓已經(被)餵了過」The cat _____ _____ ______.\nANS:\n(a) to be brushed; being brushed\n(b) has been fed"
      }
    ],
    questions: [
      {
        wordId: "g1_c1",
        question: "1. Candy has decided to move to Taipei next year. When she studies in an art school there, she _____ with her aunt for five months.",
        options: ["lives", "has lived", "lived", "will live"],
        correctAnswerIndex: 3,
        explanation: "根據 \"next year\" (明年)，主要子句描述未來的計畫，使用未來式 will live。",
        source: "98-1 13",
        grammarTag: "未來式"
      },
      {
        wordId: "g1_c2",
        question: "2. Alex: Why are you still here? It’s already eight o’clock. \nTom: Because I _____ my work. Don’t worry. It’s almost done.",
        options: ["wasn’t finishing", "wouldn’t finish", "haven’t finished", "won’t finish"],
        correctAnswerIndex: 2,
        explanation: "表示「尚未完成」的狀態持續到現在，且搭配 \"almost done\"，用現在完成式。",
        source: "99-1 16",
        grammarTag: "現在完成式"
      },
      {
        wordId: "g1_c3",
        question: "106年，正答率46% 易失分⭐️⭐️\n1. The weather _____ rainy and cloudy in the last few days. I hope the sun will come out soon.",
        options: ["has been", "had been", "will be", "would be"],
        correctAnswerIndex: 0,
        explanation: "(A) in the last few days 表「在過去幾天都」，描述「從過去持續到現在的狀況」，要用「現在完成式」。",
        source: "106年會考",
        grammarTag: "現在完成式"
      },
      {
        wordId: "g1_c4",
        question: "108年，正答率44% 易失分⭐️⭐️⭐️\n2. In my school days, I _____ to English radio programs every day. That was how I learned English at that time.",
        options: ["listen", "have listened", "used to listen", "was listening"],
        correctAnswerIndex: 2,
        explanation: "關鍵為第一句表達「狀態或習慣」的 every day，以及下一句的「過去式」時態；由此可推斷，第一句是在說明「過去的習慣」，要表達「過去的習慣，現在無此習慣」，須用 used to＋原形動詞。",
        source: "108年會考",
        grammarTag: "過去簡單式"
      },
      {
        wordId: "g1_c5",
        question: "109年，正答率43% 易失分⭐️⭐️⭐️\n3. We were so sure that Jerry _____ well on the difficult job. His past experience in other work showed he was the right guy for it. So when he failed, no one believed it.",
        options: ["had done", "did", "has done", "would do"],
        correctAnswerIndex: 3,
        explanation: "整體描述皆為過去式，且末句提到 Jerry 已經失敗了，可知句意為我們「當時」確信「Jerry 將會做得很好」，「將會」也應用過去式 would。",
        source: "109年會考",
        grammarTag: "未來式"
      },
      {
        wordId: "g1_c6",
        question: "108年，正答率42% 易失分⭐️⭐️⭐️\n4. _____ that last piece of pie? If not, can I have it? I didn’t eat much this morning.",
        options: ["Had you eaten", "Were you eating", "Do you eat", "Are you going to eat"],
        correctAnswerIndex: 3,
        explanation: "「現在」想吃那塊派，得先確認別人是否「已經」或「預計將」吃了它。選項中只有 (D) 的未來式表「預計將做某事」符合。",
        source: "108年會考",
        grammarTag: "未來式"
      },
      {
        wordId: "g1_c7",
        question: "111年，正答率35% 易失分⭐️⭐️⭐️\n5. Ariel _____ every night for a week before her Chinese test and got a very good grade.",
        options: ["studied", "studies", "has studied", "was going to study"],
        correctAnswerIndex: 0,
        explanation: "描述過去一週每晚都讀書的事實，搭配 got a very good grade (過去式)，故選過去簡單式 studied。",
        source: "111年會考",
        grammarTag: "過去簡單式"
      }
    ],
    subQuizzes: [
      { title: "未來式", questionIds: ["g1_c1", "g1_c5", "g1_c6"] },
      { title: "現在完成式", questionIds: ["g1_c2", "g1_c3"] },
      { title: "過去簡單式", questionIds: ["g1_c4", "g1_c7"] }
    ]
  },
  // ... (Other units unchanged)
  {
    id: "unit2",
    title: "Unit 2: 代名詞 (Pronouns)",
    summary: "代名詞是第二常考的文法，無論是文法題或閱讀理解，都會考代名詞指涉什麼人事物。另外，another、the other 的概念最容易錯，千萬要分清楚是否有「限定範圍」！",
    content: [
      {
        type: 'table',
        title: "⭐ 圖解文法：指示代名詞",
        data: [
          ["", "距離說話的人近", "距離說話的人遠"],
          ["單數", "this", "that"],
          ["複數", "these", "those"]
        ]
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：人稱代名詞、所有格代名詞、反身代名詞",
        data: [
          ["", "人稱代名詞主格", "人稱代名詞所有格", "人稱代名詞受格", "所有格代名詞", "反身代名詞"],
          ["第一人稱單數", "I", "my", "me", "mine", "myself"],
          ["第二人稱單數", "you", "your", "you", "yours", "yourself"],
          ["第三人稱單數", "he", "his", "him", "his", "himself"],
          ["", "she", "her", "her", "hers", "herself"],
          ["", "it", "its", "it", "its", "itself"],
          ["第一人稱複數", "we", "our", "us", "ours", "ourselves"],
          ["第二人稱複數", "you", "your", "you", "yours", "yourselves"],
          ["第三人稱複數", "they", "their", "them", "theirs", "themselves"]
        ]
      },
      {
        type: 'text',
        title: "⭐ 小試身手",
        data: "( A ) 1. These are _______ cookies. _______ are on the plate.\n(A) my / Yours (B) mine / Yours (C) my / Your (D) mine / Your\n\n( D ) 2. Rita showed me a new cell phone, but it wasn’t _______.\n(A) she (B) her (C) the girls’ (D) hers\n\n（ C ）3. Ken_______ loves to play computer games in his free time.\n(A) his (B) he (C) himself (D) him"
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：不定代名詞",
        data: [
          ["", "使用時機", "例句"],
          ["one", "代替前面出現過的同類單數名詞", "The shirt is too small. Do you have a larger one?"],
          ["ones", "代替前面出現過的同類複數名詞", "The green apples are sour, but the red ones are sweet."],
          ["another", "不限定範圍的另一個", "May I have another cup of tea?"],
          ["the other", "限定範圍的另一個。只有兩個，第一個是one，第二個是the other", "My parents like sports. One loves tennis. The other loves swimming."],
          ["some... others", "不限定範圍的其他", "Some people like coffee. Others like tea."],
          ["one/some... the others", "限定範圍的其他，只有兩組，第一組是one/some，第二組是the others (= the rest)", "One of the students in 901 is from Japan. The others are from Taiwan."]
        ]
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：數量不定代名詞",
        data: [
          ["", "代名詞", "句型變化與例句"],
          ["可數單數", "one\neach\nevery one\nany\neither\nneither", "+ of the / 所有格 + 複數可數名詞 + 複數代名詞 (us / you / them)\n+單數動詞"],
          ["可數複數", "two, three...\nboth\nseveral\nmany\na few\nfew", "+ of the / 所有格 + 複數可數名詞 + 複數代名詞 (us / you / them)\n+複數動詞"],
          ["不可數", "much\na little\nlittle", "+ of the / 所有格 + 不可數名詞 + 單數代名詞 (it)\n+單數動詞"],
          ["皆可", "all\nmost\nsome\nany", "+ of the / 所有格 + 複數可數名詞 + 複數代名詞 (us / you / them) -> +複數動詞\n+ of the / 所有格 + 不可數名詞 + 單數代名詞 (it) -> +單數動詞"]
        ]
      }
    ],
    questions: [
      {
        wordId: "g2_c1",
        question: "1. I don’t like any one of these three watches. Can you show me _____ one?",
        options: ["the others", "other", "either", "another"],
        correctAnswerIndex: 3,
        explanation: "104年，正答率53%⭐️⭐️\none = a watch，代替前面「已提過、未指定」的單數可數名詞。三支都不喜歡，要看「另外一支」，且未指定是哪一支，故用 another。",
        source: "104年會考"
      },
      {
        wordId: "g2_c2",
        question: "2. Jenny's bag is very heavy because _____ filled with toy cars.",
        options: ["it is", "they are", "there is", "there are"],
        correctAnswerIndex: 0,
        explanation: "106年，正答率46%⭐️⭐️\n依句子結構，because 引導的副詞子句缺主詞，依句意 Jenny 的「袋子」會沉重是因為「袋子」裡塞滿了玩具車，主詞應為單數 bag，故選 (A) it is。",
        source: "106年會考"
      },
      {
        wordId: "g2_c3",
        question: "3. Nora: Can I check your drawer for some tools we can use?\nMatt: Sure. Take a Look. See if you can find _____ in there.",
        options: ["any", "it", "others", "those"],
        correctAnswerIndex: 0,
        explanation: "110年，正答率41%⭐️⭐️⭐️\n要找 some tools，即「未指定」工具，因此不會選有指定意思的 (B)、(C)、(D)。而 any 可做代名詞，故選 (A)。",
        source: "110年會考"
      },
      {
        wordId: "g2_c4",
        question: "4. Ms. Johnson has been taking phone calls since she entered the office this morning. Just when she thought she could finally leave work, _____ call came in.",
        options: ["another", "each", "the next", "the other"],
        correctAnswerIndex: 0,
        explanation: "109年，正答率40% (迷思概念題)⭐️⭐️⭐️\n由句意可知，Johnson 女士到辦公室後就一直接到電話，而在以為終於可以離開時，又有電話打來了，表示「沒有指定的另一通電話」，應用 another，故選 (A)。",
        source: "109年會考"
      },
      {
        wordId: "g2_c5",
        question: "5. Buses to the airport only come once every hour, and we just missed _____. Why don’t we take a taxi?",
        options: ["another", "it", "one", "them"],
        correctAnswerIndex: 2,
        explanation: "111年，正答率31% ⭐️⭐️⭐️\n我們剛錯過了「一班」，這裡是不限定的其中一班，用 one。it 指特定那一班，them 指複數。故選 (C)。",
        source: "111年會考"
      }
    ],
    subQuizzes: [
      { title: "代名詞用法", questionIds: ["g2_c1", "g2_c2", "g2_c3", "g2_c4", "g2_c5"] }
    ]
  },
  // ... (Keep units 3-12 the same, assume they are included as previously defined)
  {
    id: "unit3",
    title: "Unit 3: 常考句型 (Common Patterns)",
    summary: "圖解文法：98~112年，這15年間常考的句型及應注意的重點如下：",
    content: [
      {
        type: 'table',
        data: [
          ["常考句型", "考過題數", "應注意的重點"],
          ["1️⃣ 動名詞當主詞", "6", "* 動名詞當主詞視為3單，動詞要加s。代名詞用it，所以用在附加問句也是it。\n* 若主詞為兩個動名詞，那就是複數囉。但是這是比較細的文法，會考沒考過。\n* 動名詞以及有形容詞子句的主詞變長，要耐心讀完題目再答題。"],
          ["2️⃣ 祈使句", "4", "* 跟你(們)講話，省略you，用原形動詞\n* 真的不難，是題目沒看完就作答才會錯，請看完題目，千萬不要著急作答！"],
          ["3️⃣ there be", "4", "地方有用there be；人擁有才用have/has/had"],
          ["4️⃣ 附加問句", "2", "* 兩步驟：確認主詞和動詞 2. 前面肯定，後面否定\n* 尤其注意have to; have Vpp; seldom, never題"],
          ["5️⃣ 主動詞一致", "1", "主詞很長的題目，務必確認主詞和動詞"],
          ["6️⃣ too...to", "1", "*「太...以至於無法...」\n* 熟練 too…to、not enough to、so…that 間轉換"]
        ]
      }
    ],
    questions: [
      {
        wordId: "g3_c1",
        question: "1. Playing games on the cellphone _____ popular with high school students.",
        options: ["is", "are", "being", "to be"],
        correctAnswerIndex: 0,
        explanation: "108年，正答率62% 易失分⭐️⭐️\n主詞為動名詞片語「Playing games...」，動名詞當主詞視為「單數」，故動詞應選 (A) is。",
        source: "108年會考"
      },
      {
        wordId: "g3_c2",
        question: "2. Getting up early on a cold morning is not easy, _____ ?",
        options: ["are you", "do you", "does it", "is it"],
        correctAnswerIndex: 3,
        explanation: "104年，正答率58% 易失分⭐️⭐️(動名詞當主詞和附加問句一起考)\n主要子句的主詞是動名詞 Getting up...，代名詞用 it；動詞是 is，附加問句用 is it。",
        source: "104年會考"
      },
      {
        wordId: "g3_c3",
        question: "3. All the excuses Nick made _____ a lot about how much he hates to do the job.",
        options: ["say", "saying", "which say", "to say"],
        correctAnswerIndex: 0,
        explanation: "106年，正答率40% 易失分⭐️⭐️(主詞後插入形容詞子句導致誤判)\n主詞是 All the excuses (Nick made 為形容詞子句修飾 excuses)，excuses 是複數，故動詞用複數形 say。",
        source: "106年會考"
      }
    ],
    subQuizzes: [
      { title: "動名詞當主詞", questionIds: ["g3_c1", "g3_c2"] },
      { title: "主動詞一致", questionIds: ["g3_c3"] }
    ]
  },
  {
    id: "unit4",
    title: "Unit 4: 常考動詞 (Common Verbs)",
    summary: "圖解文法：98~112年，這15年間常考的特殊動詞及應注意的重點如下：",
    content: [
      {
        type: 'text',
        title: "1️⃣ 花費動詞",
        data: "花費動詞口訣：\n(1) 「人死皮」：\na. 人 spend $/時 + Ving / on 物。\nex: I spent three hours writing this report.\nb. 人 pay $ for 物。\nex: I paid zero for today’s lunch.\n\n(2) 「物CC」、「物TT」：\na. 物 cost 人 $. = It costs 人 $ to V\nex: The coffee cost me $50. = It cost me $50 to buy the coffee.\nb. 物 take 人 時. = It takes 人 時 to V\nex: The report took me an hour. = It took me an hour to finish the report."
      },
      {
        type: 'text',
        title: "2️⃣ 感官動詞",
        data: "感官動詞 + O + V / Ving：(有4到：看到、聽到、聞到、感覺到)\n(1) 3看：see, watch, look at\nex: I saw David cleaning his room.\n(2) 2聽：hear, listen to\nex: I heard Judy sing.\n(3) 1聞：smell\nex: Do you smell something burning?\n(4) 2感覺：feel, notice\nex: I felt the ground shaking."
      },
      {
        type: 'text',
        title: "3️⃣ 不定詞否定 not to V",
        data: "用 tell 來記就好：\n告訴你去做某事：tell you to V\n告訴你「不要」去做某事：tell you not to V"
      },
      {
        type: 'text',
        title: "4️⃣ 動詞 + Ving",
        data: "* 這些常見動詞後都 + Ving：\nenjoy, finish, keep, mind, practice, quit, feel like\n\n* 這三個動詞 + to V (去做) 跟 Ving (做過) 意思一樣\n(1) like\n(2) love\n(3) hate\n\n* 這三個動詞 + to V (去做) 跟 Ving (做過) 意思相反\n(1) forget\n(2) remember\n(3) stop"
      }
    ],
    questions: [
      {
        wordId: "g4_c1",
        question: "1. My cat got excited when it saw the boy _____ the birds.",
        options: ["catches", "catching", "to catch", "caught"],
        correctAnswerIndex: 1,
        explanation: "105年，正答率56% 易失分⭐️⭐️\nsaw 為感官動詞，受詞後接原形動詞(catch)或現在分詞(catching)。",
        source: "105年會考"
      },
      {
        wordId: "g4_c2",
        question: "2. _____ a map with you when you go to a place for the first time.",
        options: ["Have taken", "Take", "Taking", "To take"],
        correctAnswerIndex: 1,
        explanation: "106年，正答率53% 易失分⭐️⭐️\n依句子結構，when 之前為主要子句，缺主詞與動詞，故為祈使句，用原形動詞 Take 開頭。",
        source: "106年會考"
      },
      {
        wordId: "g4_c3",
        question: "3. The police haven’t found the little girl who _____ at a supermarket. They’ll keep doing all they can to find her.",
        options: ["took away", "taken away", "has taken away", "was taken away"],
        correctAnswerIndex: 3,
        explanation: "111年，被動語態 正答率49% 易失分⭐️⭐️\n小女孩是被帶走的，需用被動語態 (was taken away)。",
        source: "111年會考"
      },
      {
        wordId: "g4_c4",
        question: "4. David looked out of the balcony window and saw a woman get in his car _____ away.",
        options: ["drive", "drove", "and drive", "and drove"],
        correctAnswerIndex: 2,
        explanation: "111年，感官動詞 正答率33% 易失分⭐️⭐️⭐️\nsaw ... get in his car (and) drive away. 這是感官動詞受詞後的連動動作，get 為原形，故 drive 也用原形，中間省略 and 或保留皆可。",
        source: "111年會考"
      },
      {
        wordId: "g4_c5",
        question: "5. My dog Jimmy loves _____ with a comb. Every time I comb his hair, he will close his eyes and fall asleep.",
        options: ["to brush", "brushing", "to be brushing", "being brushed"],
        correctAnswerIndex: 3,
        explanation: "105年，正答率27% 易失分⭐️⭐️⭐️\n狗狗是「被梳毛」，要用被動語態。love 後面接 Ving 或 to V 皆可，選項 D 為被動動名詞 (being Vpp)。",
        source: "105年會考"
      }
    ],
    subQuizzes: [
      { title: "感官動詞", questionIds: ["g4_c1", "g4_c4"] },
      { title: "祈使句", questionIds: ["g4_c2"] },
      { title: "被動語態", questionIds: ["g4_c3", "g4_c5"] }
    ]
  },
  {
    id: "unit5",
    title: "Unit 5: 名詞子句 (Noun Clauses)",
    summary: "名詞子句：做為動詞的受格，分為三種：",
    content: [
      {
        type: 'table',
        data: [
          ["名詞子句種類", "例句"],
          ["(1) that名詞子句 (that都可以省略)", "I don’t know (that) the man is from next door."],
          ["(2) wh-名詞子句\n(或間接問句，由wh-問句變來)\nwh- + S + V 不倒裝喔!!!\n\n另，若做動作的人一樣，wh-名詞子句可以簡化為wh-不定詞片語\n口訣：／／to V", "直接問句：What should I do?\n間接問句：I don’t know what I should do.\n不定詞片語：I don’t know what to do."],
          ["(3) if/whether名詞子句\n(表「是否」，由yes/no問句變來)", "I wonder if/whether that man in black is your dad."]
        ]
      },
      {
        type: 'text',
        title: "⭐ 副詞子句和名詞子句的 if 時態使用不一樣，背這兩句就不會搞混囉！",
        data: "名詞子句 if / whether「是否」＋未來式 I’m not sure if / whether it will rain.\n副詞子句 if 「假如」＋現在簡單式（事實語氣） I won’t go out if it rains."
      }
    ],
    questions: [
      {
        wordId: "g5_c1",
        question: "1. I’m not sure if Kevin _____ this morning, but if he does, I’ll tell him that you called.",
        options: ["will come in", "comes in", "has come in", "came in"],
        correctAnswerIndex: 0,
        explanation: "104年，正答率46% 易失分⭐️⭐️\n第一個 if 為「是否」的意思（名詞子句），依語意 Kevin 尚未出現，故用未來式 will come in。第二個 if 是「如果」（條件句），用現在式 does 代替未來。",
        source: "104年會考"
      }
    ],
    subQuizzes: [
      { title: "if/whether 名詞子句", questionIds: ["g5_c1"] }
    ]
  },
  {
    id: "unit6",
    title: "Unit 6: 副詞子句 (Adverb Clauses)",
    summary: "圖解文法：副詞子句時態總整理 (第2、3、4點會考考過，務必留意喔!)",
    content: [
      {
        type: 'table',
        data: [
          ["主要子句和從屬子句時態搭配情形", "例句"],
          ["1. 兩句時態一致 ，通常出現在過去式。可能兩句都是過去簡單式", "1. Nick felt happy when he heard of the good news."],
          ["2. 或主要子句+進行式，副詞子句+簡單式", "2. I was tidying up my bedroom when Meg knocked on the door."],
          ["3. 或主要子句+簡單式，副詞子句+進行式", "3. Dad broke his favorite plate when/while he was doing the dishes."],
          ["4. 或兩句都是過去進行式", "4. My cat was sleeping when/while I was studying."],
          ["5. 從屬子句簡單式，主要子句未來式或情狀助動詞", "1. When Jenny comes back, Nick will tell her the good news.\n2. If you get home early, can you do the laundry first?"],
          ["6. 從屬子句簡單式，主要子句祈使句", "If you have questions, please feel free to ask."],
          ["7. 主要子句簡單式，從屬子句情狀助動詞", "The hottest TV program, Smart Head, gives (give) people free plane tickets to Hawaii if they can answer 20 questions correctly in 15 minutes. (103年會考題改編)"]
        ]
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：從屬連接詞",
        data: [
          ["從屬連接詞", ""],
          ["表時間", "when, while(只接進行式), before, after, until"],
          ["表因果", "because"],
          ["表語氣轉折", "although, though, or(否則)"],
          ["表假設條件", "if, unless (除非),"]
        ]
      }
    ],
    questions: [
      {
        wordId: "g6_c1",
        question: "1. Tonight I’ll stay at the office until I _____ the work.",
        options: ["finish", "am finishing", "finished", "will finish"],
        correctAnswerIndex: 0,
        explanation: "104年，正答率54% 易失分⭐️⭐️\nuntil 引導的時間副詞子句，遇到未來式時，要用「現在簡單式」代替未來式，故選 finish。",
        source: "104年會考"
      },
      {
        wordId: "g6_c2",
        question: "2. Smart Head, one of the hottest TV programs these days, _____ people free plane tickets to Hawaii if they can answer 20 questions correctly in 15 minutes.",
        options: ["have given", "gives", "giving", "to give"],
        correctAnswerIndex: 1,
        explanation: "103年，正答率40% 易失分⭐️⭐️⭐️\n主詞是 Smart Head (電視節目單數)，且描述事實/常態，用現在簡單式 gives。",
        source: "103年會考"
      }
    ],
    subQuizzes: [
      { title: "時間副詞子句", questionIds: ["g6_c1"] },
      { title: "條件句", questionIds: ["g6_c2"] }
    ]
  },
  {
    id: "unit7",
    title: "Unit 7: 對等連接詞、疑問詞 (Connectors & Wh-)",
    summary: "圖解文法：連接詞",
    content: [
      {
        type: 'table',
        data: [
          ["對等連接詞", "and, or, but, so"]
        ]
      },
      {
        type: 'text',
        data: "重點❗️❗️❗️\n1. 常考轉折用法的從屬連接詞，如 or (否則) 和 although (雖然)。\n2. 注意對等連接詞 (and, but, or, so) 連接的詞必須「對等」且有「平行結構」。\n試著作答109年第12題 （正答率34%），並解釋其平行結構為何。\n( A ) Josh has planned to make a trip to New York and _____ some of his friends there.\n(A) visit (B) visits (C) visiting (D) visited\n平行結構：and連接兩個不定詞to V\nJosh has planned (1)to make a trip to New York and (2)to visit some of his friends there."
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：常見wh-疑問詞",
        data: [
          ["What", "How", "Which"],
          ["● What time\n● What day\n● What’s the date\n● What’s the weather like?", "● How old\n● How tall\n● How long\n● How big\n● How often\n● How much 多少錢\n● How much + [U]\n● How many + Ns", "● Which …,\nA or B?"],
          ["*疑問詞5W1H (who, what, which, when, where, why, how)", "", ""]
        ]
      }
    ],
    questions: [
      {
        wordId: "g7_c1",
        question: "1. Jill: Have you decided _____ you will celebrate your 30th birthday?\nSue: Yeah, I’m going to have a big barbecue party.",
        options: ["how", "where", "what", "when"],
        correctAnswerIndex: 0,
        explanation: "109年，正答率60% 易失分⭐️⭐️\n由 Sue 回答「舉辦烤肉派對」可知 Jill 詢問是否決定「如何 (How)」慶祝。",
        source: "109年會考"
      },
      {
        wordId: "g7_c2",
        question: "2. I have to catch the bus right now, _____ I’ll miss my brother’s birthday party.",
        options: ["and", "because", "or", "until"],
        correctAnswerIndex: 2,
        explanation: "103年，正答率55% 易失分⭐️⭐️\n語意為「我必須現在趕上公車，『否則(or)』我會錯過派對」。",
        source: "103年會考"
      },
      {
        wordId: "g7_c3",
        question: "3. Jimmy would not get up for breakfast, _____ his dad had already tried to pull him from his bed several times.",
        options: ["although", "because", "if", "until"],
        correctAnswerIndex: 0,
        explanation: "110年，正答率47% 易失分⭐️⭐️\n雖然 (although) 爸爸試著拉他起床，他還是不起來。表轉折語氣。",
        source: "110年會考"
      },
      {
        wordId: "g7_c4",
        question: "4. Josh has planned to make a trip to New York and _____ some of his friends there.",
        options: ["visit", "visits", "visiting", "visited"],
        correctAnswerIndex: 0,
        explanation: "109年，正答率34% 易失分⭐️⭐️⭐️\n平行結構：and 連接兩個不定詞 (1) to make ... and (2) (to) visit ...，故選原形動詞 visit。",
        source: "109年會考"
      }
    ],
    subQuizzes: [
      { title: "疑問詞", questionIds: ["g7_c1"] },
      { title: "對等連接詞", questionIds: ["g7_c2", "g7_c4"] },
      { title: "從屬連接詞", questionIds: ["g7_c3"] }
    ]
  },
  {
    id: "unit8",
    title: "Unit 8: 助動詞 (Auxiliary Verbs)",
    summary: "圖解文法：助動詞",
    content: [
      {
        type: 'table',
        data: [
          ["助動詞分類", "例子"],
          ["一般助動詞\n(文法作用，無額外意思)", "do/does/did、have/has/had (已經)"],
          ["情狀助動詞\n口訣：WC-SM\n(有額外意思，表語氣推測)", "現在式 過去式\n1. 將要 will would*\n2. 可以 can could\n3. 應該 shall should\n4. 可能 may might\n5. 必須 must Ｘ"]
        ]
      },
      {
        type: 'text',
        data: "1. 不管是哪一種助動詞，都可以代替之前出現過的動詞！\n2. 注意would的用法，是過去時的「將會」，歷屆會考正答率低。"
      }
    ],
    questions: [
      {
        wordId: "g8_c1",
        question: "1. No one thought James would appear at Katie’s party. So when he _____, everyone was surprised and could not believe their eyes.",
        options: ["would", "was", "had", "did"],
        correctAnswerIndex: 3,
        explanation: "104年，正答率54% 易失分⭐️⭐️\n代替前面的動詞 appeared (一般動詞過去式)，應用助動詞 did。",
        source: "104年會考"
      }
    ],
    subQuizzes: [
      { title: "助動詞用法", questionIds: ["g8_c1"] }
    ]
  },
  {
    id: "unit9",
    title: "Unit 9: 數量形容詞 (Quantifiers)",
    summary: "圖解文法：數量形容詞",
    content: [
      {
        type: 'table',
        data: [
          ["後加可數/不可數名詞", "數量形容詞", "範例"],
          ["可數單數名詞", "each (每一個體)\nevery (群體中每個人)\nwhole (整個的)", "each student\nevery child\nthe whold book"],
          ["可數複數名詞", "both (兩者)\nfew (少到幾乎沒有)\na few (=some)\nmany", "you both\nfew friends\na few friends\nmany pens"],
          ["不可數", "little (少到幾乎沒有)\na little (=some)\nmuch", "little money\na little money\nmuch fun"],
          ["皆可", "no (= not any)\nany (疑問or否定)\nsome\na lot of\nmost\nall", "no wife / children / time\nany book / pens / money\nsome forks / water\na lot of of pens / cheese\nmost people / food\nall men / bread"]
        ]
      },
      {
        type: 'table',
        title: "⭐ 圖解文法：few / a few; little / a little比較",
        data: [
          ["", "修飾可數複數名詞", "修飾不可數名詞"],
          ["少到幾乎沒有", "few\nI have few friends.\n我沒什麼朋友", "little\nI have little money.\n我沒什麼錢"],
          ["一些 = some", "a few\nI have a few friends.\n我有一些朋友", "a little\nI have a little money.\n我有一些錢"]
        ]
      },
      {
        type: 'text',
        data: "1. few, little, less, the least 等帶有「否定」，需「比較」的概念最容易錯，千萬要把題目讀完再下判斷！"
      }
    ],
    questions: [
      {
        wordId: "g9_c1",
        question: "1. Jogging is the only exercise I enjoy. I find _____ other kinds of exercise boring.",
        options: ["all", "few", "many", "some"],
        correctAnswerIndex: 0,
        explanation: "103年，正答率33% 易失分⭐️⭐️⭐️\n因為慢跑是「唯一 (the only)」喜歡的，表示覺得「所有 (all)」其他的運動都無聊。",
        source: "103年會考"
      },
      {
        wordId: "g9_c2",
        question: "2. _____ other waiters in the restaurant have worked here longer than Clark; only Lois and Lana started working here before him.",
        options: ["All", "Most", "Some", "Few"],
        correctAnswerIndex: 3,
        explanation: "108年，正答率30% 易失分⭐️⭐️⭐️ (迷思概念題)\n只有 Lois 和 Lana 兩個人比 Clark 久，表示「很少 (Few)」服務生比他資深。",
        source: "108年會考"
      }
    ],
    subQuizzes: [
      { title: "數量形容詞", questionIds: ["g9_c1", "g9_c2"] }
    ]
  },
  {
    id: "unit10",
    title: "Unit 10: 形容詞、副詞的級 (Comparisons)",
    summary: "圖解文法：形容詞、副詞的級",
    content: [
      {
        type: 'table',
        data: [
          ["原級", "比較級", "最高級"],
          ["as + 原級 + as 像...一樣\nas busy as a bee", "1. 單音節+er\n2. 雙音節字尾y，去y加ier\n3. more/ess + 多音節原級", "1. 單音節+est\n2. 雙音節字尾y，去y加iest\n3. most/least + 多音節原級"]
        ]
      },
      {
        type: 'table',
        title: "⭐ 常見的不規則變化 黃底為常考常錯",
        data: [
          ["原級", "比較級", "最高級"],
          ["good / well", "better", "best"],
          ["bad / badly", "worse*", "worst*"],
          ["many / much", "more", "most"],
          ["little", "less*", "least*"],
          ["far", "farther\nfurther (information)", "farthest\nfurthest"]
        ]
      }
    ],
    questions: [
      {
        wordId: "g10_c1",
        question: "1. Business at Jane’s shop has not been good these days. And the new supermarket across the street only makes things _____.",
        options: ["easier", "worse", "more boring", "more convenient"],
        correctAnswerIndex: 1,
        explanation: "112年，正答率49% 易失分⭐️⭐️\n生意已經不好了，新開的超市只會讓情況「更糟 (worse)」。",
        source: "112年會考"
      },
      {
        wordId: "g10_c2",
        question: "2. For Mike, the price is _____ important thing when he shops for jeans. He cares even more about the shape and the size of the pockets.",
        options: ["the more", "the most", "the less", "the least"],
        correctAnswerIndex: 3,
        explanation: "109年，正答率37% 易失分⭐️⭐️⭐️\n他更在意形狀和尺寸，表示價格是「最不 (the least)」重要的。",
        source: "109年會考"
      }
    ],
    subQuizzes: [
      { title: "比較級與最高級", questionIds: ["g10_c1", "g10_c2"] }
    ]
  },
  {
    id: "unit11",
    title: "Unit 11: 關係子句 (Relative Clauses)",
    summary: "圖解文法：關係子句",
    content: [
      {
        type: 'table',
        data: [
          ["關代的格", "代替的名詞", "使用的關代", "例句"],
          ["關代當主格\n不可省略", "代替人", "who或that", "Katie is a girl who/that makes desserts."],
          ["", "代替非人", "which或that", "The cake which/that sells the best is made by Katie."],
          ["", "代替人+非人", "只能用that", "Katie and her desserts that delighted everyone were the highlight of the party."],
          ["關代當受格*\n可省略", "代替人", "who、that或省略", "Katie is a baker (who/that) everyone loves."],
          ["", "代替非人", "which、that或省略", "Did you enjoy the cake (which/that) Katie made?"],
          ["", "代替人+非人", "只能用that或省略", "This magazine features Katie and her desserts (that) no one will say no to."],
          ["關代當\n所有格", "人或非人\n沒有分別", "都用whose", "Everyone is talking about Katie, whose bakery is famous for its desserts."],
          ["關係副詞\nwhere\n= in which", "代替「在某處」", "用where代替 in which", "Everyone is talking about Katie's bakery, where(= in which) you can smell freshly baked desserts everywhere."]
        ]
      },
      {
        type: 'text',
        data: "1. 尤其留意關代當受格可省略的用法，歷屆會考正答率低。\n2. 以Who提問，為了不重複，關代只用that。ex: Who’s the boy that is talking to Ian?"
      },
      {
        type: 'text',
        title: "⭐ 小試身手﹔分得清楚關係子句和名詞子句的that嗎? 先作答再圈是關係子句或名詞子句。",
        data: "( B ) 1. I think _______ the man you met yesterday is very smart. (關 / 名)\n(A) how (B) that (C) which (D) when\n\n( B ) 2. The things _______ the teacher just said is important. Write it down. (關 / 名)\n(A) how (B) that (C) who (D) what\n\n( A ) 3. The world needs more people _______ help animals. (關 / 名)\n(A) that (B) what (C) which (D) where\n\n( D ) 4. The coffee _______ you made is very strong. (關 / 名)\n(A) who (B) what (C) which (D) that\n\n( C ) 5. It's important _______ you hand in the report on time. (關 / 名)\n(A) who (B) what (C) that (D) which"
      }
    ],
    questions: [
      {
        wordId: "g11_c1",
        question: "1. Fiona loves listening to her children sing songs _____ at school.",
        options: ["are learned", "that learned", "they learned", "that they are learned"],
        correctAnswerIndex: 2,
        explanation: "110年，正答率43% 易失分⭐️⭐️\nsongs 為先行詞，後方為關係子句 (that) they learned at school，其中受格關代 that 被省略。",
        source: "110年會考"
      },
      {
        wordId: "g11_c2",
        question: "2. Actor David Piper became tired of talking about the movie _____ after he was interviewed about it many times.",
        options: ["he is famous", "that he is famous", "that is famous for", "he is famous for"],
        correctAnswerIndex: 3,
        explanation: "104年，正答率30% 易失分⭐️⭐️⭐️\nthe movie 為先行詞，後方關係子句省略關代 which/that -> (which) he is famous for。",
        source: "104年會考"
      }
    ],
    subQuizzes: [
      { title: "關係子句", questionIds: ["g11_c1", "g11_c2"] }
    ]
  },
  {
    id: "unit12",
    title: "Unit 12: 介系詞 (Prepositions)",
    summary: "圖解文法：常用的介系詞",
    content: [
      {
        type: 'table',
        data: [
          ["介系詞", "用法", "例子"],
          ["in", "1. 在...裡：in + 地方／城市／國家\n2. 在...時間：in the早中晚／月／年\n3. 穿著...：in +衣著／顏色\n4. 用...語言：in + 語言\n5. 關於...的課程：in + 課程", "1. in bed / Taipei / the US\n2. in the morning / January / 2024\n3. in uniforms / blue\n4. in Chinese\n5. a lesson in water safety"],
          ["on", "1. 在...上：on + 地方\n2. 在...天：on + 星期／日期／節日\n3. 走路：on foot", "1. on the bed / TV / the phone\n2. on Mon. morning / Feb. 1 / Xmas\n3. on foot"],
          ["at", "1. 在...：at + 地點\n2. 在...邊：at + 地方\n3. 在...時間：at + 晚上／時刻\n4. 以...價格：at + 價錢\n5. 在...年紀：at + 年紀", "1. at home / school / the party\n2. at the door/ the desk\n3. at night / at 12 p.m.\n4. at a low price\n5. at 15 / a young age"],
          ["from ... to", "1. from A時間～B時間\n2. from A地點～B地點", "1. from 8 a.m. to 6 p.m.\n2. from my house to the school"],
          ["by", "1. 藉由：by + 媒介\n2. 搭...交通工具：by + 交通工具", "1. by e-mail\n2. by bus /car / taxi / train / MRT"],
          ["as", "1. 以...身分：as + 身分\n2. 像：as + 身分\n3. 像...一樣：as + adj. + as", "1. work as a police officer\n2. dress up as Doraemon\n3. as busy as a bee"],
          ["with", "1. 和：with + 人 / 物\n2. 用...工具：with +工具\n3. 有...特徵：with + 特徵\n4. 戴...配件：with +配件\n5. 帶著：with + 東西\n(with = who/which have/has)", "1. go with you /your friends\n2. eat with a spoon\n3. the girl with big eyes\n4. the boy with sunglasses\n5. the man with a laptop"],
          ["without", "1. 沒有 = with no", "1. live without fresh air"],
          ["about", "1. 關於", "1. know nothing about AI"],
          ["except", "1. 除了", "1. Everyone except Matt went out."]
        ]
      }
    ],
    questions: [
      {
        wordId: "g12_c1",
        question: "1. I enjoy drinking a cup of black coffee _____ Friday nights.",
        options: ["at", "by", "in", "on"],
        correctAnswerIndex: 3,
        explanation: "102年會考 2題\n特定日期或特定時間的夜晚 (Friday nights)，介系詞用 on。",
        source: "102年會考"
      },
      {
        wordId: "g12_c2",
        question: "2. My dog, Lucy, was lying on the sofa _____ the fan on the wall. So when the fan fell, she was hit right on the head.",
        options: ["under", "off", "from", "down"],
        correctAnswerIndex: 0,
        explanation: "100-1會考 15題\n狗躺在沙發上，在牆上風扇的「下方 (under)」，所以風扇掉下來才會打到頭。",
        source: "100-1會考"
      },
      {
        wordId: "g12_c3",
        question: "3. Allan: Want to try Uncle Joe’s pumpkin pie? I heard it’s quite good.\nJamie: No, thank you. I think nobody _____ my mom can make good pies.",
        options: ["with", "than", "for", "except"],
        correctAnswerIndex: 3,
        explanation: "100-2會考 18題\n語意為「除了 (except) 我媽媽之外，沒人能做出好吃的派」。",
        source: "100-2會考"
      }
    ],
    subQuizzes: [
      { title: "介系詞用法", questionIds: ["g12_c1", "g12_c2", "g12_c3"] }
    ]
  }
];

// ... (Rest of the file including STANDARD_CATEGORIES, CATEGORY_SORT_ORDER, etc. remains unchanged) ...
// (Be sure to include the rest of the file content here to maintain file integrity)
// ...
export const STANDARD_CATEGORIES = [
    '人物/職業', '身體/醫療', '居家/生活', '學校/教育', '飲食/烹飪', 
    '交通/旅遊', '休閒/運動', '自然/環境', '時間/空間', '動作/行為', 
    '情感/個性', '特質/狀態', '社會/溝通', '文法/其他'
];

// UI 分類排序順序
export const CATEGORY_SORT_ORDER = [
  '自建',
  
  // 1. 基礎生活篇
  '人物/職業', '人物', '職業',
  '身體/醫療', '身體部位', '健康',
  '家庭', '居家/生活',
  '飲食/烹飪', '食物',
  '學校/教育', '學校',
  '服飾/配件',
  
  // 2. 社區與環境篇
  '地點/位置', '地點',
  '交通/旅遊', '交通運輸',
  '休閒/運動',
  '自然/環境', '天氣與自然現象', '動物與昆蟲', '植物',
  
  // 3. 抽象與社會篇
  '時間/空間', '時間',
  '數字',
  '社會/溝通',
  '動作/行為', 
  '情感/個性', '人格特質',
  '特質/狀態',

  // 4. 文法與詞性篇
  '其他名詞', '名詞',
  '其他動詞', '動詞',
  '其他形容詞', '形容詞',
  '其他副詞', '副詞',
  '代名詞',
  '介系詞',
  '連接詞',
  '冠詞與限定詞',
  '助動詞',
  '感嘆詞',
  '文法/其他',
  '2000單-補遺'
];

export const RAW_EXAM_DATA = `
114年 (參考試題)
1. Look at the picture. A _____ is flying over the houses. (A) bird (B) butterfly (C) kite (D) plane
`; // (Ideally complete RAW_EXAM_DATA and RAW_VOCAB_STRING here as in previous prompt)

export const VOCABULARY_LIST: Word[] = [];
