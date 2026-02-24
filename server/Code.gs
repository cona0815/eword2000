
// ----------------------------------------------------------------
// Google Apps Script (GAS) 後端程式碼 - v4.3 Robust Column Detection
// ----------------------------------------------------------------

// 定義試算表欄位對應 (Vocabulary)
const COL_INDEX = {
  ID: 0,
  TERM: 1,
  PHONETIC: 2,
  MEANING_FULL: 3, 
  EXAMPLE: 4,
  TRANS: 5,
  CATEGORY: 6,
  EXAM_COUNT: 7,
  SYLLABLES: 8,
  TAGS: 9,
  MISTAKE_COUNT: 10,
  CORE_TAG: 11
};

// 定義試算表欄位對應 (Questions) - 標準格式
const Q_COL_INDEX = {
  WORD_ID: 0,
  WORD_TERM: 1,
  QUESTION: 2,
  OPTIONS: 3, // JSON String
  CORRECT_IDX: 4,
  EXPLANATION: 5,
  SOURCE: 6,
  GRAMMAR_TAG: 7 
};

// 新增：使用者進度表欄位 (User_Vocab_Progress)
const USER_VOCAB_HEADERS = ['Username', 'Word_ID', 'Map_Viewed', 'Tested_Count', 'Correct_Count', 'Next_Review_Date', 'Is_Marked'];
const COL_USER_VOCAB = {
  USERNAME: 0,
  WORD_ID: 1,
  MAP_VIEWED: 2,
  TESTED_COUNT: 3,
  CORRECT_COUNT: 4,
  NEXT_REVIEW_DATE: 5,
  IS_MARKED: 6
};

// 新增：文章表欄位 (Articles)
const ARTICLE_HEADERS = ['ID', 'Title', 'English', 'Chinese', 'Created_At'];
const COL_ARTICLE = {
  ID: 0,
  TITLE: 1,
  ENGLISH: 2,
  CHINESE: 3,
  CREATED_AT: 4
};

// 新增：文法闖關紀錄表欄位 (User_Grammar_Progress)
const USER_GRAMMAR_HEADERS = ['Username', 'Unit', 'Highest_Score', 'Stars'];
const COL_USER_GRAMMAR = {
  USERNAME: 0,
  UNIT: 1,
  HIGHEST_SCORE: 2,
  STARS: 3
};

// 指定的表頭名稱
const VOCAB_HEADERS = ['id', '英文', '音標', '中譯', '例句', '翻譯', '分類', 'pastExamCount', 'syllables', 'tags', 'mistakeCount', 'coreTag'];
const QUEST_HEADERS = ['wordId', 'wordTerm', 'question', 'options (json)', 'correctAnswerIndex', 'explanation', 'source', 'grammarTag'];

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 自動檢查並修復資料表結構
function setup() {
  const ss = getSpreadsheet();
  
  // 1. 確保必要的工作表存在
  const sheets = ['Vocabulary', 'Questions', 'UserProgress', 'User_Vocab_Progress', 'Grammar_Questions', 'User_Grammar_Progress', 'Articles', 'DebugLog'];
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  
  // 2. 檢查 Vocabulary 表頭
  const vSheet = ss.getSheetByName('Vocabulary');
  if (vSheet.getLastRow() === 0) {
      vSheet.appendRow(VOCAB_HEADERS);
  }
  
  // 3. 檢查 Questions 表頭
  const qSheet = ss.getSheetByName('Questions');
  if (qSheet.getLastRow() === 0) {
      qSheet.appendRow(QUEST_HEADERS);
  } else {
      // Check if tag column exists
      const lastCol = qSheet.getLastColumn();
      if (lastCol < 8) {
         qSheet.getRange(1, 8).setValue('grammarTag');
      }
  }

  // 4. 檢查 User_Vocab_Progress 表頭
  const uvSheet = ss.getSheetByName('User_Vocab_Progress');
  if (uvSheet.getLastRow() === 0) {
      uvSheet.appendRow(USER_VOCAB_HEADERS);
  }

  // 5. 檢查 User_Grammar_Progress 表頭
  const ugSheet = ss.getSheetByName('User_Grammar_Progress');
  if (ugSheet.getLastRow() === 0) {
      ugSheet.appendRow(USER_GRAMMAR_HEADERS);
  }

  // 6. 檢查 Articles 表頭
  const aSheet = ss.getSheetByName('Articles');
  if (aSheet.getLastRow() === 0) {
      aSheet.appendRow(ARTICLE_HEADERS);
  }
}

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'unknown';
    setup();
    
    if (action === 'getVocabulary') {
      return getVocabulary();
    }
    if (action === 'getQuestions') {
      return getQuestions();
    }
    if (action === 'getUserProgress') {
      return getUserProgress(e.parameter.userId);
    }
    // 新增：每日任務
    if (action === 'getDailyMission') {
      return getDailyMission(e.parameter.username);
    }
    // 新增：文法地圖
    if (action === 'getGrammarMap') {
      return getGrammarMap(e.parameter.username);
    }
    // 新增：文法題目
    if (action === 'getGrammarQuestions') {
      return getGrammarQuestions(e.parameter.unit);
    }
    // 新增：取得使用者所有單字進度 (用於列表與統計)
    if (action === 'getUserVocabProgress') {
      return getUserVocabProgress(e.parameter.username);
    }
    // 新增：取得文章
    if (action === 'getArticles') {
      return getArticles();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'API works', action: action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const jsonResponse = (data) => ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);

  try {
    if (!e || !e.postData) return jsonResponse({ status: 'error', message: 'No data' });
    
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    setup(); 
    
    const ss = getSpreadsheet();

    // 新增：提交測驗結果
    if (action === 'submitQuizResult') {
        return submitQuizResult(postData.username, postData.results);
    }

    // 新增：標記單字已讀 (Map Viewed)
    if (action === 'markWordViewed') {
        return markWordViewed(postData.username, postData.wordIds);
    }

    // 新增：儲存文法測驗結果
    if (action === 'saveGrammarResult') {
        return saveGrammarResult(postData.username, postData.unit, postData.score, postData.stars);
    }

    // 新增：儲存文章
    if (action === 'saveArticle') {
        return saveArticle(postData.article);
    }

    if (action === 'uploadVocabulary') {
      let sheet = ss.getSheetByName('Vocabulary');
      const words = postData.words;
      if (!words || !Array.isArray(words)) return jsonResponse({ status: 'error', message: 'Invalid words data' });
      const rows = words.map(w => {
        let fullMeaning = w.meaning || '';
        if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
        const row = new Array(12);
        row[0] = w.id || ''; row[1] = w.term || ''; row[2] = w.phonetic || ''; row[3] = fullMeaning;
        row[4] = w.example || ''; row[5] = w.exampleTranslation || ''; row[6] = w.category || '綜合';
        row[7] = w.pastExamCount || 0; row[8] = w.syllables || ''; row[9] = w.tags || '';
        row[10] = w.mistakeCount || 0; row[11] = w.coreTag || '';
        return row;
      });
      const lastRow = sheet.getLastRow();
      if (rows.length > 0) sheet.getRange(lastRow + 1, 1, rows.length, 12).setValues(rows);
      return jsonResponse({ status: 'success', added: rows.length });
    }

    if (action === 'saveQuestions' || action === 'syncQuestions') {
        let sheet = ss.getSheetByName('Questions');
        const questions = postData.questions; 
        if (!questions || !Array.isArray(questions)) return jsonResponse({ status: 'error', message: 'Invalid questions data' });

        const lastRow = sheet.getLastRow();
        const existingQuestions = new Set();
        if (lastRow > 1) {
            // Check Col C (Index 2) for standard format questions
            const existingData = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
            for (let i = 0; i < existingData.length; i++) {
                const qText = String(existingData[i][0]).trim();
                if (qText) existingQuestions.add(qText);
            }
        }

        const rows = [];
        let addedCount = 0;
        let skippedCount = 0;

        questions.forEach(q => {
            const qText = String(q.question || '').trim();
            if (!qText) return;
            if (existingQuestions.has(qText)) { skippedCount++; return; }

            const row = new Array(8);
            row[0] = q.wordId || ('auto_' + new Date().getTime());
            row[1] = q.wordTerm || '';
            row[2] = q.question || '';
            row[3] = JSON.stringify(q.options || []);
            row[4] = q.correctAnswerIndex;
            row[5] = q.explanation || '';
            row[6] = q.source || 'AI';
            row[7] = q.grammarTag || '';
            
            rows.push(row);
            existingQuestions.add(qText); 
            addedCount++;
        });

        if (rows.length > 0) sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows);
        return jsonResponse({ status: 'success', added: addedCount, message: `成功新增 ${addedCount} 題，忽略 ${skippedCount} 題重複。` });
    }

    if (action === 'clearVocabulary') {
      let sheet = ss.getSheetByName('Vocabulary');
      if (sheet && sheet.getMaxRows() > 1) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      }
      return jsonResponse({ status: 'success' });
    }

    if (action === 'saveUserProgress') {
      let sheet = ss.getSheetByName('UserProgress');
      const userId = postData.userId;
      const progressStr = JSON.stringify(postData.data);
      const now = new Date();
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === userId) { rowIndex = i + 1; break; }
      }
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 2).setValue(progressStr);
        sheet.getRange(rowIndex, 3).setValue(now);
      } else {
        sheet.appendRow([userId, progressStr, now]);
      }
      return jsonResponse({ status: 'success' });
    }

    if (action === 'addWord') {
      let sheet = ss.getSheetByName('Vocabulary');
      const w = postData.word;
      const newId = String(new Date().getTime());
      let fullMeaning = w.meaning || '';
      if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
      const row = new Array(12);
      row[0] = newId; row[1] = w.term || ''; row[2] = w.phonetic || ''; row[3] = fullMeaning;
      row[4] = w.example || ''; row[5] = w.exampleTranslation || ''; row[6] = w.category || '綜合';
      row[7] = 0; row[8] = w.syllables || ''; row[9] = ''; row[10] = w.mistakeCount || 0; row[11] = w.coreTag || '';
      sheet.appendRow(row);
      return jsonResponse({ status: 'success', id: newId });
    }
    
    if (action === 'updateWordStatus') {
       let sheet = ss.getSheetByName('Vocabulary');
       const wordId = postData.wordId;
       const isUnfamiliar = postData.isUnfamiliar;
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === String(wordId)) {
           const currentTags = String(data[i][9] || '');
           let newTags = currentTags;
           if (isUnfamiliar) {
               if (!currentTags.includes('unfamiliar')) newTags = currentTags ? currentTags + ',unfamiliar' : 'unfamiliar';
           } else {
               newTags = currentTags.replace(/unfamiliar/g, '').replace(/,,/g, ',').replace(/^,|,$/g, '');
           }
           sheet.getRange(i+1, 10).setValue(newTags);
           return jsonResponse({ status: 'success', newTags: newTags });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordMistakeCount') {
       let sheet = ss.getSheetByName('Vocabulary');
       const wordId = postData.wordId;
       const count = parseInt(postData.count);
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === String(wordId)) {
           sheet.getRange(i+1, 11).setValue(isNaN(count) ? 0 : count);
           return jsonResponse({ status: 'success', count: count });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordExample') {
       let sheet = ss.getSheetByName('Vocabulary');
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === postData.wordId) {
           sheet.getRange(i+1, 5).setValue(postData.example);
           sheet.getRange(i+1, 6).setValue(postData.translation);
           return jsonResponse({ status: 'success' });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordDetails') {
       let sheet = ss.getSheetByName('Vocabulary');
       const w = postData.word;
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === postData.wordId) {
           let fullMeaning = w.meaning || '';
           if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
           const rowIdx = i + 1;
           if (w.phonetic) sheet.getRange(rowIdx, 3).setValue(w.phonetic);
           if (fullMeaning) sheet.getRange(rowIdx, 4).setValue(fullMeaning);
           if (w.example) sheet.getRange(rowIdx, 5).setValue(w.example);
           if (w.exampleTranslation) sheet.getRange(rowIdx, 6).setValue(w.exampleTranslation);
           if (w.syllables) sheet.getRange(rowIdx, 9).setValue(w.syllables);
           if (w.category) sheet.getRange(rowIdx, 7).setValue(w.category);
           if (w.mistakeCount !== undefined) sheet.getRange(rowIdx, 11).setValue(w.mistakeCount);
           if (w.coreTag !== undefined) sheet.getRange(rowIdx, 12).setValue(w.coreTag);
           return jsonResponse({ status: 'success' });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'removeDuplicateWords') {
      let sheet = ss.getSheetByName('Vocabulary');
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return jsonResponse({ status: 'success', removed: 0 });
      const range = sheet.getRange(2, 1, lastRow - 1, 12);
      const values = range.getValues();
      const uniqueRows = [];
      const seen = new Set();
      let removedCount = 0;
      values.forEach(row => {
          const term = String(row[1]).trim().toLowerCase();
          const meaning = String(row[3]).trim();
          const key = term + '_' + meaning;
          if (!seen.has(key)) { seen.add(key); uniqueRows.push(row); } 
          else { removedCount++; }
      });
      if (removedCount > 0) {
          range.clearContent();
          if (uniqueRows.length > 0) sheet.getRange(2, 1, uniqueRows.length, 12).setValues(uniqueRows);
      }
      return jsonResponse({ status: 'success', removed: removedCount });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });

  } catch (e) {
    return jsonResponse({ status: 'error', message: e.toString() });
  }
}

function getArticles() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Articles');
  if (!sheet) return jsonOutput([]);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOutput([]);
  const range = sheet.getRange(2, 1, lastRow - 1, 5);
  const rows = range.getDisplayValues();
  const result = rows.map(row => ({
    id: String(row[0]),
    title: String(row[1]),
    english: String(row[2]),
    chinese: String(row[3]),
    createdAt: String(row[4])
  }));
  return jsonOutput(result);
}

function saveArticle(article) {
  if (!article) return jsonOutput({ status: 'error', message: 'No article data' });
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Articles');
  const newRow = [
    article.id || ('art_' + new Date().getTime()),
    article.title || 'Untitled',
    article.english || '',
    article.chinese || '',
    new Date()
  ];
  sheet.appendRow(newRow);
  return jsonOutput({ status: 'success' });
}

    // ... (vocabulary actions omitted for brevity, they remain same) ...
    if (action === 'uploadVocabulary') {
      let sheet = ss.getSheetByName('Vocabulary');
      const words = postData.words;
      if (!words || !Array.isArray(words)) return jsonResponse({ status: 'error', message: 'Invalid words data' });
      const rows = words.map(w => {
        let fullMeaning = w.meaning || '';
        if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
        const row = new Array(12);
        row[0] = w.id || ''; row[1] = w.term || ''; row[2] = w.phonetic || ''; row[3] = fullMeaning;
        row[4] = w.example || ''; row[5] = w.exampleTranslation || ''; row[6] = w.category || '綜合';
        row[7] = w.pastExamCount || 0; row[8] = w.syllables || ''; row[9] = w.tags || '';
        row[10] = w.mistakeCount || 0; row[11] = w.coreTag || '';
        return row;
      });
      const lastRow = sheet.getLastRow();
      if (rows.length > 0) sheet.getRange(lastRow + 1, 1, rows.length, 12).setValues(rows);
      return jsonResponse({ status: 'success', added: rows.length });
    }

    if (action === 'saveQuestions' || action === 'syncQuestions') {
        let sheet = ss.getSheetByName('Questions');
        const questions = postData.questions; 
        if (!questions || !Array.isArray(questions)) return jsonResponse({ status: 'error', message: 'Invalid questions data' });

        const lastRow = sheet.getLastRow();
        const existingQuestions = new Set();
        if (lastRow > 1) {
            // Check Col C (Index 2) for standard format questions
            const existingData = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
            for (let i = 0; i < existingData.length; i++) {
                const qText = String(existingData[i][0]).trim();
                if (qText) existingQuestions.add(qText);
            }
        }

        const rows = [];
        let addedCount = 0;
        let skippedCount = 0;

        questions.forEach(q => {
            const qText = String(q.question || '').trim();
            if (!qText) return;
            if (existingQuestions.has(qText)) { skippedCount++; return; }

            const row = new Array(8);
            row[0] = q.wordId || ('auto_' + new Date().getTime());
            row[1] = q.wordTerm || '';
            row[2] = q.question || '';
            row[3] = JSON.stringify(q.options || []);
            row[4] = q.correctAnswerIndex;
            row[5] = q.explanation || '';
            row[6] = q.source || 'AI';
            row[7] = q.grammarTag || '';
            
            rows.push(row);
            existingQuestions.add(qText); 
            addedCount++;
        });

        if (rows.length > 0) sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows);
        return jsonResponse({ status: 'success', added: addedCount, message: `成功新增 ${addedCount} 題，忽略 ${skippedCount} 題重複。` });
    }

    if (action === 'clearVocabulary') {
      let sheet = ss.getSheetByName('Vocabulary');
      if (sheet && sheet.getMaxRows() > 1) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      }
      return jsonResponse({ status: 'success' });
    }

    if (action === 'saveUserProgress') {
      let sheet = ss.getSheetByName('UserProgress');
      const userId = postData.userId;
      const progressStr = JSON.stringify(postData.data);
      const now = new Date();
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === userId) { rowIndex = i + 1; break; }
      }
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 2).setValue(progressStr);
        sheet.getRange(rowIndex, 3).setValue(now);
      } else {
        sheet.appendRow([userId, progressStr, now]);
      }
      return jsonResponse({ status: 'success' });
    }

    // ... (Keep other actions: addWord, updateWordStatus, etc. from previous version) ...
    // To save tokens, assuming standard update functions exist as before.
    // Ensure all update/add functions from previous context are preserved here.
    if (action === 'addWord') {
      let sheet = ss.getSheetByName('Vocabulary');
      const w = postData.word;
      const newId = String(new Date().getTime());
      let fullMeaning = w.meaning || '';
      if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
      const row = new Array(12);
      row[0] = newId; row[1] = w.term || ''; row[2] = w.phonetic || ''; row[3] = fullMeaning;
      row[4] = w.example || ''; row[5] = w.exampleTranslation || ''; row[6] = w.category || '綜合';
      row[7] = 0; row[8] = w.syllables || ''; row[9] = ''; row[10] = w.mistakeCount || 0; row[11] = w.coreTag || '';
      sheet.appendRow(row);
      return jsonResponse({ status: 'success', id: newId });
    }
    
    if (action === 'updateWordStatus') {
       let sheet = ss.getSheetByName('Vocabulary');
       const wordId = postData.wordId;
       const isUnfamiliar = postData.isUnfamiliar;
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === String(wordId)) {
           const currentTags = String(data[i][9] || '');
           let newTags = currentTags;
           if (isUnfamiliar) {
               if (!currentTags.includes('unfamiliar')) newTags = currentTags ? currentTags + ',unfamiliar' : 'unfamiliar';
           } else {
               newTags = currentTags.replace(/unfamiliar/g, '').replace(/,,/g, ',').replace(/^,|,$/g, '');
           }
           sheet.getRange(i+1, 10).setValue(newTags);
           return jsonResponse({ status: 'success', newTags: newTags });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordMistakeCount') {
       let sheet = ss.getSheetByName('Vocabulary');
       const wordId = postData.wordId;
       const count = parseInt(postData.count);
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === String(wordId)) {
           sheet.getRange(i+1, 11).setValue(isNaN(count) ? 0 : count);
           return jsonResponse({ status: 'success', count: count });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordExample') {
       let sheet = ss.getSheetByName('Vocabulary');
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === postData.wordId) {
           sheet.getRange(i+1, 5).setValue(postData.example);
           sheet.getRange(i+1, 6).setValue(postData.translation);
           return jsonResponse({ status: 'success' });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'updateWordDetails') {
       let sheet = ss.getSheetByName('Vocabulary');
       const w = postData.word;
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
         if(String(data[i][0]) === postData.wordId) {
           let fullMeaning = w.meaning || '';
           if (w.partOfSpeech && !fullMeaning.startsWith(w.partOfSpeech)) fullMeaning = `${w.partOfSpeech} ${fullMeaning}`;
           const rowIdx = i + 1;
           if (w.phonetic) sheet.getRange(rowIdx, 3).setValue(w.phonetic);
           if (fullMeaning) sheet.getRange(rowIdx, 4).setValue(fullMeaning);
           if (w.example) sheet.getRange(rowIdx, 5).setValue(w.example);
           if (w.exampleTranslation) sheet.getRange(rowIdx, 6).setValue(w.exampleTranslation);
           if (w.syllables) sheet.getRange(rowIdx, 9).setValue(w.syllables);
           if (w.category) sheet.getRange(rowIdx, 7).setValue(w.category);
           if (w.mistakeCount !== undefined) sheet.getRange(rowIdx, 11).setValue(w.mistakeCount);
           if (w.coreTag !== undefined) sheet.getRange(rowIdx, 12).setValue(w.coreTag);
           return jsonResponse({ status: 'success' });
         }
       }
       return jsonResponse({ status: 'not_found' });
    }

    if (action === 'removeDuplicateWords') {
      let sheet = ss.getSheetByName('Vocabulary');
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return jsonResponse({ status: 'success', removed: 0 });
      const range = sheet.getRange(2, 1, lastRow - 1, 12);
      const values = range.getValues();
      const uniqueRows = [];
      const seen = new Set();
      let removedCount = 0;
      values.forEach(row => {
          const term = String(row[1]).trim().toLowerCase();
          const meaning = String(row[3]).trim();
          const key = term + '_' + meaning;
          if (!seen.has(key)) { seen.add(key); uniqueRows.push(row); } 
          else { removedCount++; }
      });
      if (removedCount > 0) {
          range.clearContent();
          if (uniqueRows.length > 0) sheet.getRange(2, 1, uniqueRows.length, 12).setValues(uniqueRows);
      }
      return jsonResponse({ status: 'success', removed: removedCount });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });

  } catch (e) {
    return jsonResponse({ status: 'error', message: e.toString() });
  }
}

// ---------------- 讀取邏輯 (Questions with Shift Detection) ----------------

function getVocabulary() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Vocabulary');
  if (!sheet) return jsonOutput([]);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOutput([]); 
  const range = sheet.getRange(2, 1, lastRow - 1, 12);
  const rows = range.getDisplayValues(); 
  const result = rows.map(row => {
      const fullMeaning = String(row[3]).trim();
      let partOfSpeech = '';
      let meaning = fullMeaning;
      const posMatch = fullMeaning.match(/^(\([a-z]+\.\)|（[a-z]+\.）)\s*(.*)/i);
      if (posMatch) { partOfSpeech = posMatch[1]; meaning = posMatch[2]; }
      return {
        id: String(row[0]).trim(),
        term: String(row[1]).trim(),
        phonetic: row[2] ? String(row[2]).trim() : '',
        partOfSpeech: partOfSpeech,
        meaning: meaning,
        example: row[4],
        exampleTranslation: row[5],
        category: row[6] || '綜合',
        level: '1200',
        pastExamCount: parseInt(row[7] || '0'),
        syllables: row[8] ? String(row[8]).trim() : '',
        tags: row[9] ? String(row[9]).trim() : '',
        mistakeCount: parseInt(row[10] || '0'),
        coreTag: row[11] || ''
      };
  });
  return jsonOutput(result);
}

function getQuestions() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Questions');
  if (!sheet) return jsonOutput({});
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOutput({});

  // Read up to column 8 (H)
  const range = sheet.getRange(2, 1, lastRow - 1, 8);
  const rows = range.getDisplayValues();

  const resultMap = {};

  rows.forEach(row => {
      const wordId = String(row[0]);
      if (!wordId) return;

      // --- Column Shift Detection ---
      // Standard: [0]ID, [1]Term, [2]Q, [3]Opts, [4]Ans, [5]Exp, [6]Src, [7]Tag
      // Shifted:  [0]ID, [1]Q, [2]Opts, [3]Ans, [4]Exp, [5]?, [6]Src, [7]Tag
      
      let questionText = "";
      let optionsJson = "[]";
      let ansIdx = 0;
      let explanation = "";
      let source = "";
      let tag = "";
      let term = "";

      const col2 = String(row[2]).trim();
      const col3 = String(row[3]).trim();

      // Check if Col 2 (Index 2, C) looks like JSON Array -> Shifted format
      if (col2.startsWith('[') && col2.endsWith(']')) {
          // Shifted Format (User pasted directly?)
          questionText = String(row[1]); // Col B
          optionsJson = col2;            // Col C
          ansIdx = parseInt(row[3]);     // Col D
          explanation = String(row[4]);  // Col E
          source = String(row[6]);       // Col G
          tag = String(row[7]);          // Col H
      } else {
          // Standard Format
          term = String(row[1]);         // Col B
          questionText = String(row[2]); // Col C
          optionsJson = col3;            // Col D
          ansIdx = parseInt(row[4]);     // Col E
          explanation = String(row[5]);  // Col F
          source = String(row[6]);       // Col G
          tag = String(row[7]);          // Col H
      }

      let options = [];
      try {
          options = JSON.parse(optionsJson);
      } catch (e) {
          options = [];
      }

      const q = {
          wordId: wordId,
          wordTerm: term,
          question: questionText,
          options: options,
          correctAnswerIndex: isNaN(ansIdx) ? 0 : ansIdx,
          explanation: explanation,
          source: source,
          grammarTag: tag
      };

      if (!resultMap[wordId]) {
          resultMap[wordId] = [];
      }
      resultMap[wordId].push(q);
  });

  return jsonOutput(resultMap);
}

function getUserProgress(userId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('UserProgress');
  if (!sheet) return jsonOutput(null);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === userId) {
      try { return jsonOutput(JSON.parse(data[i][1])); } catch (e) { return jsonOutput(null); }
    }
  }
  return jsonOutput(null);
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- 新增功能實作 ----------------

function getDailyMission(username) {
  if (!username) return jsonOutput({ error: 'Username required' });

  const ss = getSpreadsheet();
  
  // 1. 讀取所有單字 (Vocabulary)
  const vSheet = ss.getSheetByName('Vocabulary');
  const vData = vSheet.getDataRange().getValues();
  const vocabMap = {};
  // Skip header
  for (let i = 1; i < vData.length; i++) {
    const row = vData[i];
    const id = String(row[0]);
    vocabMap[id] = {
      id: id,
      term: String(row[1]),
      meaning: String(row[3]),
      category: String(row[6]),
      coreTag: String(row[11])
    };
  }
  const allWordIds = Object.keys(vocabMap);

  // 2. 讀取使用者進度 (User_Vocab_Progress)
  const uvSheet = ss.getSheetByName('User_Vocab_Progress');
  const uvData = uvSheet.getDataRange().getValues();
  
  const userProgressMap = {}; // wordId -> { ... }
  
  // Skip header
  for (let i = 1; i < uvData.length; i++) {
    const row = uvData[i];
    if (String(row[COL_USER_VOCAB.USERNAME]) === username) {
      const wordId = String(row[COL_USER_VOCAB.WORD_ID]);
      userProgressMap[wordId] = {
        mapViewed: row[COL_USER_VOCAB.MAP_VIEWED] === true || String(row[COL_USER_VOCAB.MAP_VIEWED]).toLowerCase() === 'true',
        testedCount: parseInt(row[COL_USER_VOCAB.TESTED_COUNT] || 0),
        correctCount: parseInt(row[COL_USER_VOCAB.CORRECT_COUNT] || 0),
        nextReviewDate: row[COL_USER_VOCAB.NEXT_REVIEW_DATE] ? new Date(row[COL_USER_VOCAB.NEXT_REVIEW_DATE]) : null,
        isMarked: row[COL_USER_VOCAB.IS_MARKED] === true || String(row[COL_USER_VOCAB.IS_MARKED]).toLowerCase() === 'true'
      };
    }
  }

  // 3. 篩選邏輯
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const poolNew = [];
  const poolReview = [];
  const poolMastery = [];

  allWordIds.forEach(wid => {
    const p = userProgressMap[wid];
    const v = vocabMap[wid];
    if (!v) return;

    if (!p) {
      // 完全沒碰過 -> 視為 New (但需求說要 Map_Viewed == true，這裡放寬一點：如果沒記錄，先不排入任務，除非使用者去點閃卡)
      // 修正需求： "GAS 撈取 Map_Viewed == true 且 Tested_Count == 0"
      // 所以沒記錄的 (undefined) 不算。
    } else {
      // 有記錄
      if (p.mapViewed && p.testedCount === 0) {
        poolNew.push(v);
      } else if (p.testedCount > 0) {
        // Review Logic: Marked OR Due OR Low Accuracy
        const isDue = p.nextReviewDate && p.nextReviewDate <= now;
        const lowAcc = p.testedCount > p.correctCount; // 只要有錯過就算? 需求說 "Tested_Count > Correct_Count" 代表至少錯一次且沒補回來? 
        // 其實 Tested > Correct 意思是 答對率 < 100%。
        
        if (p.isMarked || isDue || lowAcc) {
          poolReview.push(v);
        } else if (p.correctCount >= 2) {
          // Mastery Logic
          poolMastery.push(v);
        }
      }
    }
  });

  // 4. 隨機抽取 (Shuffle & Slice)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const mission = {
    newWords: shuffle(poolNew).slice(0, 15),
    reviewWords: shuffle(poolReview).slice(0, 10),
    masteryWords: shuffle(poolMastery).slice(0, 5)
  };

  return jsonOutput(mission);
}

function getUserVocabProgress(username) {
  if (!username) return jsonOutput({ error: 'Username required' });

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('User_Vocab_Progress');
  const data = sheet.getDataRange().getValues();
  
  const progressMap = {};
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL_USER_VOCAB.USERNAME]) === username) {
      const wordId = String(row[COL_USER_VOCAB.WORD_ID]);
      progressMap[wordId] = {
        mapViewed: row[COL_USER_VOCAB.MAP_VIEWED] === true || String(row[COL_USER_VOCAB.MAP_VIEWED]).toLowerCase() === 'true',
        testedCount: parseInt(row[COL_USER_VOCAB.TESTED_COUNT] || 0),
        correctCount: parseInt(row[COL_USER_VOCAB.CORRECT_COUNT] || 0),
        nextReviewDate: row[COL_USER_VOCAB.NEXT_REVIEW_DATE] ? new Date(row[COL_USER_VOCAB.NEXT_REVIEW_DATE]) : null,
        isMarked: row[COL_USER_VOCAB.IS_MARKED] === true || String(row[COL_USER_VOCAB.IS_MARKED]).toLowerCase() === 'true'
      };
    }
  }
  
  return jsonOutput(progressMap);
}

function submitQuizResult(username, results) {
  if (!username || !results || !Array.isArray(results)) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid data' })).setMimeType(ContentService.MimeType.JSON);
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonOutput({ status: 'error', message: 'Server busy' });

  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('User_Vocab_Progress');
    const data = sheet.getDataRange().getValues();
    
    // 建立索引: username_wordId -> rowIndex
    const indexMap = {};
    for (let i = 1; i < data.length; i++) {
      const u = String(data[i][COL_USER_VOCAB.USERNAME]);
      const w = String(data[i][COL_USER_VOCAB.WORD_ID]);
      indexMap[u + '_' + w] = i + 1; // 1-based row index
    }

    const newRows = [];
    const now = new Date();

    results.forEach(res => {
      const key = username + '_' + res.wordId;
      const rowIndex = indexMap[key];
      
      if (rowIndex) {
        // Update existing
        const dataRowIdx = rowIndex - 1;
        const currentTested = parseInt(data[dataRowIdx][COL_USER_VOCAB.TESTED_COUNT] || 0);
        const currentCorrect = parseInt(data[dataRowIdx][COL_USER_VOCAB.CORRECT_COUNT] || 0);
        
        const newTested = currentTested + 1;
        const newCorrect = res.isCorrect ? currentCorrect + 1 : currentCorrect;
        
        // SRS Logic
        let nextDate = new Date(now);
        if (res.isCorrect) {
          const streak = newCorrect;
          let days = 1;
          if (streak === 1) days = 1;
          else if (streak === 2) days = 3;
          else if (streak === 3) days = 7;
          else if (streak >= 4) days = 14;
          
          nextDate.setDate(nextDate.getDate() + days);
        } else {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        let isMarked = data[dataRowIdx][COL_USER_VOCAB.IS_MARKED];
        if (!res.isCorrect) isMarked = true;
        else if (newCorrect >= 2) isMarked = false;

        data[dataRowIdx][COL_USER_VOCAB.TESTED_COUNT] = newTested;
        data[dataRowIdx][COL_USER_VOCAB.CORRECT_COUNT] = newCorrect;
        data[dataRowIdx][COL_USER_VOCAB.NEXT_REVIEW_DATE] = nextDate;
        data[dataRowIdx][COL_USER_VOCAB.IS_MARKED] = isMarked;

      } else {
        // Insert new
        let nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const newRow = [
          username,
          res.wordId,
          false, 
          1, 
          res.isCorrect ? 1 : 0, 
          nextDate,
          !res.isCorrect 
        ];
        newRows.push(newRow);
        indexMap[key] = -1; 
      }
    });

    if (data.length > 1) {
        sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
    
    if (newRows.length > 0) {
      sheet.getRange(data.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return jsonOutput({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}

function markWordViewed(username, wordIds) {
  if (!username || !wordIds || !Array.isArray(wordIds)) return jsonOutput({ error: 'Invalid data' });
  
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonOutput({ status: 'error', message: 'Server busy' });

  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('User_Vocab_Progress');
    const data = sheet.getDataRange().getValues();
    
    const indexMap = {};
    for (let i = 1; i < data.length; i++) {
      const u = String(data[i][COL_USER_VOCAB.USERNAME]);
      const w = String(data[i][COL_USER_VOCAB.WORD_ID]);
      indexMap[u + '_' + w] = i; // 0-based index in `data`
    }

    const newRows = [];
    let updatedCount = 0;

    wordIds.forEach(wid => {
      const key = username + '_' + wid;
      const idx = indexMap[key];
      
      if (idx !== undefined) {
        // Update
        if (data[idx][COL_USER_VOCAB.MAP_VIEWED] !== true) {
            data[idx][COL_USER_VOCAB.MAP_VIEWED] = true;
            updatedCount++;
        }
      } else {
        // Create
        const newRow = [
          username,
          wid,
          true, // Map_Viewed
          0, // Tested
          0, // Correct
          '', // Next Date
          false // Is Marked
        ];
        newRows.push(newRow);
        indexMap[key] = -1; // prevent dupes
      }
    });

    // Write back
    if (updatedCount > 0) {
        sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
    if (newRows.length > 0) {
        sheet.getRange(data.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    return jsonOutput({ status: 'success', updated: updatedCount, created: newRows.length });
  } catch (e) {
    return jsonOutput({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getGrammarMap(username) {
  if (!username) return jsonOutput({ error: 'Username required' });
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('User_Grammar_Progress');
  const data = sheet.getDataRange().getValues();
  
  const progress = {};
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL_USER_GRAMMAR.USERNAME]) === username) {
      const unit = String(row[COL_USER_GRAMMAR.UNIT]);
      progress[unit] = {
        highestScore: parseInt(row[COL_USER_GRAMMAR.HIGHEST_SCORE] || 0),
        stars: parseInt(row[COL_USER_GRAMMAR.STARS] || 0)
      };
    }
  }
  
  return jsonOutput(progress);
}

function getGrammarQuestions(unit) {
  if (!unit) return jsonOutput({ error: 'Unit required' });
  
  const ss = getSpreadsheet();
  let questions = [];
  
  // 1. Try Grammar_Questions sheet (Specific Grammar Sheet)
  const gSheet = ss.getSheetByName('Grammar_Questions');
  if (gSheet && gSheet.getLastRow() > 1) {
    const data = gSheet.getDataRange().getValues();
    // Expected Header: Question_ID, Unit, Question, Option_A, Option_B, Option_C, Option_D, Answer, Explanation
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUnit = String(row[1]);
      if (unit === 'All' || rowUnit === unit) {
        questions.push({
          id: String(row[0]),
          unit: rowUnit,
          question: String(row[2]),
          options: [String(row[3]), String(row[4]), String(row[5]), String(row[6])],
          answer: String(row[7]), 
          correctAnswerIndex: convertAnswerToIndex(String(row[7])), 
          explanation: String(row[8])
        });
      }
    }
  }
  
  // 2. If still empty or as additional source, try Questions sheet (Unified Sheet)
  const qSheet = ss.getSheetByName('Questions');
  if (qSheet && qSheet.getLastRow() > 1) {
    const qData = qSheet.getDataRange().getValues();
    for (let i = 1; i < qData.length; i++) {
      const row = qData[i];
      const rowTag = String(row[Q_COL_INDEX.GRAMMAR_TAG]);
      if (unit === 'All' || rowTag === unit) {
        // Check if options is JSON or separate columns
        let options = [];
        try {
          options = JSON.parse(row[Q_COL_INDEX.OPTIONS]);
        } catch (e) {
          // Fallback if it's not JSON (though Q_COL_INDEX says it is)
          options = [String(row[3])]; 
        }
        
        // Avoid duplicates if already added from Grammar_Questions
        const qText = String(row[Q_COL_INDEX.QUESTION]);
        if (!questions.some(q => q.question === qText)) {
          questions.push({
            id: String(row[Q_COL_INDEX.WORD_ID]),
            unit: rowTag,
            question: qText,
            options: options,
            correctAnswerIndex: parseInt(row[Q_COL_INDEX.CORRECT_IDX] || 0),
            explanation: String(row[Q_COL_INDEX.EXPLANATION]),
            source: String(row[Q_COL_INDEX.SOURCE])
          });
        }
      }
    }
  }
  
  // If 'All' (Grand Challenge), shuffle and pick 20
  if (unit === 'All' && questions.length > 0) {
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    questions = shuffle(questions).slice(0, 20);
  }
  
  return jsonOutput(questions);
}

function convertAnswerToIndex(ans) {
  ans = ans.trim().toUpperCase();
  if (ans === 'A' || ans === '1') return 0;
  if (ans === 'B' || ans === '2') return 1;
  if (ans === 'C' || ans === '3') return 2;
  if (ans === 'D' || ans === '4') return 3;
  return 0; // Default
}

function saveGrammarResult(username, unit, score, stars) {
  if (!username || !unit) return jsonOutput({ error: 'Invalid data' });
  
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonOutput({ status: 'error', message: 'Server busy' });

  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('User_Grammar_Progress');
    const data = sheet.getDataRange().getValues();
    
    let rowIndex = -1;
    
    // Find existing row
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL_USER_GRAMMAR.USERNAME]) === username && String(data[i][COL_USER_GRAMMAR.UNIT]) === unit) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > 0) {
      // Update if score is higher
      const currentScore = parseInt(data[rowIndex - 1][COL_USER_GRAMMAR.HIGHEST_SCORE] || 0);
      if (score > currentScore) {
        sheet.getRange(rowIndex, 3).setValue(score);
        sheet.getRange(rowIndex, 4).setValue(stars);
      }
    } else {
      // Insert new
      sheet.appendRow([username, unit, score, stars]);
    }
    
    return jsonOutput({ status: 'success' });
  } catch (e) {
    return jsonOutput({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}
