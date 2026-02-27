
import { UserProgress, QuizQuestion, Word, DailyMission, QuizResultSubmission, UserVocabProgress, FamilyStats, Article } from '../types';

// ...

export const fetchArticles = async (): Promise<Article[]> => {
  const url = getGasApiUrl();
  if (!url) return [];
  try {
    const response = await fetchWithTimeout(`${url}?action=getArticles&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      return await response.json();
    }
  } catch (error: unknown) {
    console.error("Error fetching articles", error);
  }
  return [];
};

export const saveArticle = async (article: Partial<Article>): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'saveArticle', 
          article: article 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error saving article", error);
    return false; 
  }
};

// 硬編碼的 Google Apps Script 網址 (公開常數，供前端檢查)
export const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzodVB7iTQogtuDyufKE8bRj2t4io9czGneEZJMqRD31CBqIzdqYgEjyEPt95iQ-lOb/exec";

export const getGasApiUrl = (): string => {
  // 優先使用 localStorage 設定，如果沒有則使用預設的硬編碼網址
  return localStorage.getItem('user_gas_app_url') || DEFAULT_GAS_URL;
};

export const getUserId = (): string => {
  let userId = localStorage.getItem('junior_vocab_userid');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('junior_vocab_userid', userId);
  }
  return userId;
};

const isJsonResponse = (response: Response): boolean => {
  const contentType = response.headers.get("content-type");
  return contentType ? contentType.indexOf("application/json") !== -1 : false;
};

// Increased timeout to 30s to handle GAS cold starts
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error: unknown) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
             throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    }
}

// Improved Test Connection
export const testGasConnection = async (url: string): Promise<{ success: boolean; message: string; count?: number }> => {
  if (!url) return { success: false, message: "網址為空" };
  // Accept /exec, but warn if missing
  if (!url.endsWith('/exec')) return { success: false, message: "網址結尾必須是 /exec" };

  try {
    // Attempt to fetch vocabulary count
    // Added timestamp to prevent caching
    const response = await fetchWithTimeout(`${url}?action=getVocabulary&_t=${Date.now()}`, {}, 15000); // 15s for test
    
    if (response.ok) {
      if (isJsonResponse(response)) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return { success: true, message: "連線成功！", count: data.length };
        } else {
            return { success: false, message: "連線成功，但回傳格式非陣列 (可能是空的)" };
        }
      } else {
        // Returned 200 OK but HTML or Text -> Permission issue redirecting to Login Page
        return { 
            success: false, 
            message: "權限錯誤：伺服器回傳了網頁而非資料。\n\n請確認 Apps Script 部署設定：\n「誰可以存取」必須是「任何人 (Anyone)」。" 
        };
      }
    } else {
        return { success: false, message: `伺服器回應錯誤 (Status: ${response.status})` };
    }
  } catch (error: unknown) {
    console.error("Connection test failed", error);
    
    let msg = "連線失敗 (Network Error)";
    if (error instanceof Error) {
        msg = `連線失敗 (${error.message})`;
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            msg = "❌ 連線被拒絕 (Failed to fetch)\n\n這通常是權限問題。請依序檢查：\n1. Apps Script 部署的「誰可以存取」是否已設為「任何人」？\n2. 您是否建立了「新版本」？\n3. 網址是否正確 (結尾為 /exec)？";
        }
    }
    
    return { success: false, message: msg };
  }
};

export const fetchRemoteVocabulary = async (): Promise<Word[]> => {
  const url = getGasApiUrl();
  if (!url) return [];
  
  try {
    // Retry once if failed
    try {
        // Added timestamp to prevent caching
        const response = await fetchWithTimeout(`${url}?action=getVocabulary&_t=${Date.now()}`);
        if (response.ok && isJsonResponse(response)) {
            const data = await response.json();
            if (Array.isArray(data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.map((w: any) => ({
                    ...w, 
                    level: String(w.level) as '1200' | '800',
                    syllables: w.syllables || '',
                    tags: w.tags || '',
                    mistakeCount: w.mistakeCount || 0,
                    coreTag: w.coreTag || ''
                }));
            }
        }
    } catch (err) {
        console.warn("First attempt failed, retrying...", err);
        const response = await fetchWithTimeout(`${url}?action=getVocabulary&_t=${Date.now()}`);
        if (response.ok && isJsonResponse(response)) {
            const data = await response.json();
            if (Array.isArray(data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.map((w: any) => ({
                    ...w, 
                    level: String(w.level) as '1200' | '800',
                    syllables: w.syllables || '',
                    tags: w.tags || '',
                    mistakeCount: w.mistakeCount || 0,
                    coreTag: w.coreTag || ''
                }));
            }
        }
    }
  } catch (error: unknown) {
    console.error("Error fetching remote vocabulary", error);
  }
  return [];
};

export const fetchRemoteQuestions = async (): Promise<Record<string, Omit<QuizQuestion, 'wordId' | 'wordTerm'>[]> | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  
  try {
    // Added timestamp to prevent caching
    const response = await fetchWithTimeout(`${url}?action=getQuestions&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      const data = await response.json();
      console.log("GAS getQuestions response:", data);
      return data;
    }
  } catch (error: unknown) {
    console.error("Error fetching remote questions", error);
  }
  return null;
};

export const saveRemoteQuestions = async (questions: QuizQuestion[], customUrl?: string): Promise<{success: boolean, message: string}> => {
  const url = customUrl || getGasApiUrl();
  if (!url) return { success: false, message: "未設定 Google Apps Script URL" };
  
  console.log("Saving questions to:", url);

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveQuestions', questions: questions })
    }, 60000); // 60 seconds timeout for large payloads
    
    if (isJsonResponse(response)) {
      const res = await response.json();
      if (res.status === 'success') {
          return { success: true, message: res.message || '上傳成功' };
      } else {
          // Pass through the error message from GAS (e.g. "Unknown action")
          return { success: false, message: `伺服器錯誤: ${res.message}` };
      }
    }
    
    const text = await response.text();
    if (text.includes("Google Accounts") || text.includes("signin")) {
        return { success: false, message: "權限不足：請確認 Apps Script 部署設定為「任何人 (Anyone)」" };
    }

    return { success: false, message: `伺服器回傳格式錯誤 (非 JSON)，可能是網址錯誤。回傳開頭: ${text.substring(0, 50)}...` };
  } catch (error: unknown) {
    const e = error as any;
    console.error("Error saving questions", e);
    return { success: false, message: `網路連線失敗: ${e.message}` };
  }
};

export const fetchUserProgress = async (username?: string): Promise<UserProgress | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  const userId = username || getUserId();
  try {
    // Added timestamp to prevent caching
    const response = await fetchWithTimeout(`${url}?action=getUserProgress&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      return await response.json();
    }
  } catch (error: unknown) {
    console.error("Error fetching user progress", error);
  }
  return null;
};

export const saveUserProgress = async (progress: UserProgress, username?: string): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  const userId = username || getUserId();
  try {
    const response = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveUserProgress', userId: userId, data: progress })
    });
    return response.ok;
  } catch (error: unknown) {
    console.error("Error saving progress", error);
    return false;
  }
};

export const addCustomWord = async (word: Omit<Word, 'id' | 'pastExamCount'>): Promise<{success: boolean, id?: string, message?: string}> => {
  const url = getGasApiUrl();
  if (!url) return { success: false, message: "請先在設定中輸入 Google Apps Script 網址" };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addWord', word: word })
    });

    if (!response.ok) {
       return { success: false, message: `伺服器回應錯誤: ${response.status}` };
    }

    const text = await response.text(); // Get raw text first to handle HTML errors gracefully
    
    try {
        const res = JSON.parse(text);
        if (res.status === 'success') {
            return { success: true, id: res.id };
        } else {
            return { success: false, message: res.message || '伺服器回傳未知的錯誤' };
        }
    } catch {
        // parsing failed, probably HTML error
        if (text.includes("Google Accounts") || text.includes("signin")) {
             return { success: false, message: "權限錯誤：請確認您的 Apps Script 部署設定為「任何人 (Anyone)」可存取，而不是「僅限我自己」。" };
        }
        return { success: false, message: "回傳格式錯誤 (非 JSON)，可能是網址錯誤或權限不足。" };
    }
  } catch (error: unknown) {
    const e = error as Error;
    console.error("Error adding custom word", e);
    return { success: false, message: e.message || "網路連線失敗" };
  }
};

export const updateWordExampleInSheet = async (wordId: string, example: string, translation: string): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateWordExample', wordId: wordId, example: example, translation: translation })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch { return false; }
};

export const updateWordExampleBatch = async (updates: {id: string, example: string, translation: string}[]): Promise<{success: boolean, updated: number}> => {
  const url = getGasApiUrl();
  if (!url) return { success: false, updated: 0 };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateWordExampleBatch', updates: updates })
    });
    
    if (response.ok && isJsonResponse(response)) {
      const res = await response.json();
      return res.status === 'success' ? { success: true, updated: res.updated } : { success: false, updated: 0 };
    }
    return { success: false, updated: 0 };
  } catch (error: unknown) { 
    console.error(error);
    return { success: false, updated: 0 }; 
  }
};

export const updateWordDetailsInSheet = async (wordId: string, details: Partial<Word>): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'updateWordDetails', 
          wordId: wordId, 
          word: details 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch { return false; }
};

export const toggleWordStatusInSheet = async (wordId: string, isUnfamiliar: boolean): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'updateWordStatus', 
          wordId: wordId, 
          isUnfamiliar: isUnfamiliar 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch { return false; }
};

export const updateWordMistakeCountInSheet = async (wordId: string, count: number): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'updateWordMistakeCount', 
          wordId: wordId, 
          count: count 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch { return false; }
};

export const updateWordCategoriesInSheet = async (updates: {id: string, category: string}[]): Promise<{success: boolean, updated: number}> => {
  const url = getGasApiUrl();
  if (!url) return { success: false, updated: 0 };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateWordCategoryBatch', updates: updates })
    });
    
    if (response.ok && isJsonResponse(response)) {
      const res = await response.json();
      return res.status === 'success' ? { success: true, updated: res.updated } : { success: false, updated: 0 };
    }
    return { success: false, updated: 0 };
  } catch (error: unknown) { 
    console.error(error);
    return { success: false, updated: 0 }; 
  }
};

export const clearRemoteVocabulary = async (): Promise<{success: boolean, message?: string}> => {
  const url = getGasApiUrl();
  if (!url) return { success: false, message: 'URL not set' };
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'clearVocabulary' })
    }, 15000);
    
    if (isJsonResponse(response)) {
        const res = await response.json();
        return res.status === 'success' ? { success: true } : { success: false, message: res.message };
    }
    return { success: false, message: 'Server returned non-JSON response' };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, message: e.message || 'Network error' };
  }
};

export const uploadVocabulary = async (words: Word[]): Promise<number> => {
  const url = getGasApiUrl();
  if (!url) return 0;
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'uploadVocabulary', words: words })
    }, 45000); // 45s for upload
    
    if (response.ok && isJsonResponse(response)) {
      const result = await response.json();
      return result.status === 'success' ? result.added : 0;
    }
  } catch (error: unknown) {
    console.error("Error uploading vocabulary", error);
  }
  return 0;
}

export const fetchUserVocabProgress = async (username: string): Promise<Record<string, UserVocabProgress> | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  try {
    const response = await fetchWithTimeout(`${url}?action=getUserVocabProgress&username=${encodeURIComponent(username)}&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      return await response.json();
    }
  } catch (error: unknown) {
    console.error("Error fetching user vocab progress", error);
  }
  return null;
};

export const fetchDailyMission = async (username: string): Promise<DailyMission | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  try {
    const response = await fetchWithTimeout(`${url}?action=getDailyMission&username=${encodeURIComponent(username)}&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      return await response.json();
    }
  } catch (error: unknown) {
    console.error("Error fetching daily mission", error);
  }
  return null;
};

export const submitQuizResult = async (username: string, results: QuizResultSubmission[]): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'submitQuizResult', 
          username: username, 
          results: results 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error submitting quiz result", error);
    return false; 
  }
};

export const submitSrsResult = async (username: string, wordId: string, rating: 'again' | 'hard' | 'good' | 'easy'): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'submitSrsResult', 
          username: username, 
          wordId: wordId, 
          rating: rating 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error submitting SRS result", error);
    return false; 
  }
};

export const markWordViewed = async (username: string, wordIds: string[]): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'markWordViewed', 
          username: username, 
          wordIds: wordIds 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error marking words viewed", error);
    return false; 
  }
};

export const markArticleRead = async (username: string, articleId: string): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'markArticleRead', 
          username: username, 
          articleId: articleId 
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch { return false; }
};

export const fetchGrammarMap = async (username: string): Promise<Record<string, { highestScore: number, stars: number }> | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  try {
    const response = await fetchWithTimeout(`${url}?action=getGrammarMap&username=${encodeURIComponent(username)}&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      return await response.json();
    }
  } catch (error: unknown) {
    console.error("Error fetching grammar map", error);
  }
  return null;
};

export const fetchFamilyStats = async (): Promise<FamilyStats | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  try {
    const response = await fetchWithTimeout(`${url}?action=getFamilyStats&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      const data = await response.json();
      // Validate structure
      if (data && Array.isArray(data.leaderboard)) {
          return data;
      }
      console.warn("Invalid family stats format:", data);
    }
  } catch (error: unknown) {
    console.error("Error fetching family stats", error);
  }
  return null;
};

export const fetchGrammarQuestions = async (unit: string): Promise<QuizQuestion[] | null> => {
  const url = getGasApiUrl();
  if (!url) return null;
  try {
    const response = await fetchWithTimeout(`${url}?action=getGrammarQuestions&unit=${encodeURIComponent(unit)}&_t=${Date.now()}`);
    if (response.ok && isJsonResponse(response)) {
      const data = await response.json();
      console.log(`GAS getGrammarQuestions for ${unit}:`, data);
      return data;
    }
  } catch (error: unknown) {
    console.error("Error fetching grammar questions", error);
  }
  return null;
};

export const saveGrammarResult = async (username: string, unit: string, score: number, stars: number): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'saveGrammarResult', 
          username: username, 
          unit: unit,
          score: score,
          stars: stars
      })
    });
    if (isJsonResponse(response)) {
      return (await response.json()).status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error saving grammar result", error);
    return false; 
  }
};

export const removeDuplicateWordsFromSheet = async (): Promise<{success: boolean, removed: number, message?: string}> => {
  const url = getGasApiUrl();
  if (!url) return { success: false, removed: 0, message: 'URL not set' };
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'removeDuplicateWords' })
    }, 30000);
    
    if (response.ok && isJsonResponse(response)) {
      const result = await response.json();
      if (result.status === 'success') {
          return { success: true, removed: result.removed };
      }
      return { success: false, removed: 0, message: result.message };
    }
    return { success: false, removed: 0, message: 'Server returned error' };
  } catch (error: unknown) {
    const e = error as Error;
    console.error("Error removing duplicates", e);
    return { success: false, removed: 0, message: e.message };
  }
};

export const syncQuestionsToSheet = async (username: string, questions: QuizQuestion[]): Promise<boolean> => {
  const url = getGasApiUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ 
          action: 'syncQuestions', 
          username: username, 
          questions: questions 
      })
    });
    if (isJsonResponse(response)) {
      const res = await response.json();
      return res.status === 'success';
    }
    return false;
  } catch (error: unknown) { 
    console.error("Error syncing questions", error);
    return false; 
  }
};
