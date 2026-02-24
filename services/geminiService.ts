
import { GoogleGenAI, Modality } from "@google/genai";
import { Word, QuizQuestion } from '../types';

// ============================================================================
// 🔑 開發者專用：在此填入 API Key 即可免輸入 (請勿提交到公開庫)
// ============================================================================
const TEMP_API_KEY: string = ""; 
// ============================================================================

// ⚡ 指定使用高效能 Flash 模型
const GEN_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Helper to get the API key dynamically with robust trimming
export const getEffectiveApiKey = (): string | undefined => {
  if (TEMP_API_KEY && TEMP_API_KEY.trim()) return TEMP_API_KEY.trim();
  
  const localKey = localStorage.getItem('user_gemini_api_key');
  if (localKey && localKey.trim()) return localKey.trim();

  try {
    // Check for Vite-style env variable first
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === 'string' && viteKey.trim()) return viteKey.trim();

    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      const envKey = process.env.API_KEY;
      if (envKey && !envKey.startsWith('YOUR_API_KEY') && envKey.trim()) {
          return envKey.trim();
      }
    }
  } catch {
    // Ignore env access errors
  }
  return undefined;
};

// ----------------------------------------------------------------------------
// 🛡️ Retry Logic Helper
// ----------------------------------------------------------------------------
const runGenAiWithRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 5000
): Promise<T | null> => {
    let retries = 0;
    while (true) {
        try {
            return await operation();
        } catch (error: unknown) {
            const e = error as any;
            let errorCode = e.status || e.code;
            let errorMessage = e.message || JSON.stringify(e);
            
            if (e.error) {
                errorCode = e.error.code || errorCode;
                errorMessage = e.error.message || errorMessage;
                if (e.error.status) errorCode = e.error.status; 
            }

            const errorStr = String(errorMessage).toLowerCase();
            
            // 1. Check for Invalid API Key (400)
            if (errorCode === 400 && (errorStr.includes('api key') || errorStr.includes('api_key'))) {
                 console.error("🔒 Invalid API Key detected.");
                 throw new Error("INVALID_API_KEY");
            }

            // 2. Check for Quota Exceeded
            const isQuotaExceeded = 
                errorStr.includes('quota') || 
                errorStr.includes('resource_exhausted') || 
                errorStr.includes('resource exhausted') ||
                (errorCode === 429 && !errorStr.includes('rate limit'));

            if (isQuotaExceeded) {
                console.warn("🚫 Quota Exceeded detected");
                throw new Error("QUOTA_EXCEEDED");
            }

            // 3. Check for Rate Limit (Transient)
            const isRateLimit = 
                errorCode === 429 || 
                errorCode === 503 || 
                errorStr.includes('429') || 
                errorStr.includes('overloaded');

            if (isRateLimit && retries < maxRetries) {
                retries++;
                const delay = baseDelay * Math.pow(2, retries - 1) + (Math.random() * 2000);
                console.warn(`⚠️ API Rate Limit (${errorCode}). Retrying in ${(delay/1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("❌ API Request Failed:", e);
                // Propagate specific errors
                if (errorCode === 429) throw new Error("QUOTA_EXCEEDED"); 
                throw e; 
            }
        }
    }
};

// Robust JSON Extractor: Can handle Markdown blocks, conversational text, and messy JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractAndParseJSON = (text: string): any => {
    if (!text) return null;
    let cleanText = text.trim();
    
    // 1. Try to find JSON block bounded by ```json ... ``` or just ``` ... ```
    const codeBlockMatch = cleanText.match(/```(?:json)?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        cleanText = codeBlockMatch[1].trim();
    }

    // 2. Try to find the outermost {} or []
    const startObj = cleanText.indexOf('{');
    const startArr = cleanText.indexOf('[');
    const start = (startObj !== -1 && (startArr === -1 || startObj < startArr)) ? startObj : startArr;
    
    const endObj = cleanText.lastIndexOf('}');
    const endArr = cleanText.lastIndexOf(']');
    const end = Math.max(endObj, endArr);

    if (start !== -1 && end !== -1 && end > start) {
        cleanText = cleanText.substring(start, end + 1);
    }

    try {
        return JSON.parse(cleanText);
    } catch {
        console.error("JSON Parse Error on text:", cleanText);
        // Fallback: simple cleanup of common JSON errors (like trailing commas) could go here
        throw new Error("FAILED_TO_PARSE_JSON");
    }
};

export interface MindMapNode {
    word: string;
    meaning: string;
    partOfSpeech?: string;
    relation?: string;
}

export interface MindMapData {
    center: MindMapNode;
    related: MindMapNode[];
}

export const generateRootMindMap = async (word: string): Promise<MindMapData | null> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
        throw new Error("INVALID_API_KEY"); 
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Pure text prompt, explicitly asking for raw JSON string
    // Removed strict JSON schema config to allow model more flexibility, then we parse manually.
    const prompt = `
      You are an English teacher for Junior High students in Taiwan.
      Create a "Word Family & Roots Mind Map" for the English word: "${word}".
      
      Goal: Help students memorize the word by understanding its root, prefix, suffix, or related family words.
      
      Output strictly in valid JSON format. Do not use Markdown if possible, but I can parse it.
      Structure:
      {
        "root": "${word}",
        "rootMeaning": "Traditional Chinese Meaning (繁體中文)",
        "relatedWords": [
           { "word": "related/derived word 1", "meaning": "Chinese Meaning" },
           { "word": "related/derived word 2", "meaning": "Chinese Meaning" },
           { "word": "related/derived word 3", "meaning": "Chinese Meaning" },
           { "word": "related/derived word 4", "meaning": "Chinese Meaning" }
        ]
      }
    `;

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
                // Removed config: { responseMimeType: 'application/json' } to prevent API from blocking conversational output
            });
        });

        if (response && response.text) {
            return extractAndParseJSON(response.text) as MindMapData;
        }
    } catch (error: unknown) { 
        const e = error as any;
        console.error("Mind Map Gen Error:", e); 
        if (e.message === 'INVALID_API_KEY') throw e;
        if (e.message === 'QUOTA_EXCEEDED') throw e;
    }
    return null;
};

export const generateMissingExample = async (word: Word): Promise<{sentence: string, translation: string} | null> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) throw new Error("INVALID_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
        Create a simple example sentence for the word "${word.term}" (${word.partOfSpeech}, ${word.meaning}).
        Output valid JSON only: { "sentence": "English sentence", "translation": "Traditional Chinese translation" }
    `;

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
            });
        });
            
        if (response && response.text) {
            return extractAndParseJSON(response.text);
        }
    } catch (error: unknown) { 
        const e = error as any;
        console.error(e);
        if (e.message === 'INVALID_API_KEY') throw e;
        if (e.message === 'QUOTA_EXCEEDED') throw e;
    }
    return null;
};

export const generateWordDetails = async (term: string): Promise<Partial<Word> | null> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) throw new Error("INVALID_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Provide details for English word "${term}". 
      Return valid JSON only:
      {
        "partOfSpeech": "(n.) or (v.) etc.",
        "meaning": "Traditional Chinese definition",
        "phonetic": "KK or IPA",
        "example": "Simple sentence",
        "exampleTranslation": "Chinese translation",
        "category": "One category (e.g. 人物, 食物, 動作...)",
        "level": "1200",
        "syllables": "word split by hyphen e.g. ap-ple"
      }
    `;

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
            });
        });

        if (response && response.text) {
            const data = extractAndParseJSON(response.text);
            return {
                term: term,
                partOfSpeech: data.partOfSpeech,
                meaning: data.meaning,
                phonetic: data.phonetic,
                example: data.example,
                exampleTranslation: data.exampleTranslation,
                category: data.category,
                level: '1200',
                syllables: data.syllables
            };
        }
    } catch (error: unknown) { 
        const e = error as any;
        console.error(e); 
        if (e.message === 'INVALID_API_KEY') throw e;
        if (e.message === 'QUOTA_EXCEEDED') throw e;
    }
    return null;
};

export const generateGrammarLesson = async (topic: string): Promise<string> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) return "請先設定 API Key。";
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: `Explain grammar "${topic}" for Junior High students in Taiwan. Use Traditional Chinese (繁體中文). Output in Markdown.` }] }],
            });
        });
        return response?.text || "生成失敗。";
    } catch { return "API Error"; }
};

export const generateGrammarQuiz = async (topic: string): Promise<QuizQuestion[]> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
        Create 3 grammar multiple choice questions for topic "${topic}".
        Output valid JSON array:
        {
            "questions": [
                {
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswerIndex": 0,
                    "explanation": "Chinese explanation"
                }
            ]
        }
    `;

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
            });
        });

        if (response && response.text) {
             const data = extractAndParseJSON(response.text);
             return data.questions || [];
        }
    } catch (error: unknown) { console.error(error); }
    return [];
};

let audioContext: AudioContext | null = null;

function decodePCM(data: Uint8Array, ctx: AudioContext, sampleRate = 24000) {
  const pcm16 = new Int16Array(data.buffer);
  const frameCount = pcm16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = pcm16[i] / 32768.0;
  }
  return buffer;
}

export const playGeminiTts = async (text: string): Promise<boolean> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) return false;

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: TTS_MODEL,
                contents: [{ parts: [{ text: text }] }], 
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
                }
            });
        }, 2, 2000); 

        if (response && response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            const part = response.candidates[0].content.parts[0];
            if (part.inlineData && part.inlineData.data) {
                const binaryString = atob(part.inlineData.data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const audioBuffer = decodePCM(bytes, audioContext, 24000);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                return true;
            }
        }
    } catch (error: unknown) {
        console.error("TTS error", error);
    }
    return false;
};

export const generateMindMapData = async (word: string): Promise<MindMapData | null> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) throw new Error("INVALID_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Create a "Word Family & Related Words Mind Map" for the English word: "${word}".
      Target audience: Junior High School students in Taiwan (CEFR A1-A2).
      
      Output strictly in valid JSON format:
      {
        "center": { 
            "word": "${word}", 
            "meaning": "Traditional Chinese Meaning", 
            "partOfSpeech": "(n./v./adj.)" 
        },
        "related": [
            { "word": "Word 1", "meaning": "Meaning", "relation": "noun form / antonym / synonym / past tense", "partOfSpeech": "(n.)" },
            { "word": "Word 2", "meaning": "Meaning", "relation": "...", "partOfSpeech": "..." },
            { "word": "Word 3", "meaning": "Meaning", "relation": "...", "partOfSpeech": "..." },
            { "word": "Word 4", "meaning": "Meaning", "relation": "...", "partOfSpeech": "..." }
        ]
      }
      
      Rules:
      1. Provide exactly 4 related words.
      2. Prioritize word family (e.g., act -> action, active, actor).
      3. If no word family, use common synonyms or antonyms.
      4. Keep meanings concise in Traditional Chinese.
    `;

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
            });
        });

        if (response && response.text) {
            return extractAndParseJSON(response.text) as MindMapData;
        }
    } catch (error: unknown) {
        const e = error as any;
        console.error("Mind Map Gen Error:", e);
        if (e.message === 'INVALID_API_KEY') throw e;
        if (e.message === 'QUOTA_EXCEEDED') throw e;
    }
    return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateAiAnalysis = async (inputText: string, file: File | null): Promise<any> => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) throw new Error("INVALID_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    
    const parts: any[] = [];
    
    if (inputText) {
        parts.push({ text: inputText });
    }

    if (file) {
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: file.type
            }
        });
    }

    const prompt = `
        Analyze the provided content (text or image/PDF).
        
        Task 1: Determine if the content is primarily an "Article" (reading passage, story, news) or a "Quiz" (list of questions, exercises).
        
        Task 2:
        If it is an ARTICLE:
        - Translate the English text to Traditional Chinese.
        - Output JSON:
        {
            "type": "article",
            "content": {
                "english": "Full English text extracted/corrected",
                "chinese": "Full Traditional Chinese translation"
            }
        }

        If it is a QUIZ:
        - Extract all questions.
        - For each question, identify if it is a "Vocabulary" question or "Grammar" question.
        - Provide the question text, options, correct answer index (0-3), and a detailed explanation in Traditional Chinese.
        - Output JSON:
        {
            "type": "quiz",
            "questions": [
                {
                    "question": "Question text...",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswerIndex": 0,
                    "explanation": "Explanation in Traditional Chinese...",
                    "grammarTag": "Grammar Topic (e.g. Past Tense) OR null if Vocabulary",
                    "wordTerm": "Target word if Vocabulary question OR null"
                }
            ]
        }
        
        IMPORTANT: Output ONLY valid JSON.
    `;

    parts.push({ text: prompt });

    try {
        const response = await runGenAiWithRetry(async () => {
            return await ai.models.generateContent({
                model: GEN_MODEL,
                contents: [{ parts: parts }],
            });
        });

        if (response && response.text) {
            return extractAndParseJSON(response.text);
        }
    } catch (error: unknown) {
        console.error("Analysis Error:", error);
        throw error;
    }
    return null;
};

