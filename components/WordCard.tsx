import React, { useState, useEffect, useMemo } from 'react';
import { Word, QuizQuestion, UserVocabProgress } from '../types';
import { generateMissingExample, generateWordDetails, generateRootMindMap, MindMapData, playGeminiTts } from '../services/geminiService';
import { updateWordExampleInSheet, updateWordDetailsInSheet } from '../services/gasService';

interface WordCardProps {
  word: Word;
  isUnfamiliar: boolean;
  quizCount: number;
  lastQuestion?: QuizQuestion;
  onToggleUnfamiliar: (id: string) => void;
  showAiButton?: boolean;
  mistakeCount?: number;
  onIncrementMistake?: (id: string) => void;
  onEdit?: (word: Word) => void;
  onAddRelatedWord?: (term: string, meaning: string) => void;
  hasApiKey?: boolean;
  userProgress?: UserVocabProgress;
}

const SYLLABLE_COLORS = [
    'border-emerald-500', 
    'border-orange-400',
    'border-blue-500',
    'border-purple-500',
    'border-pink-500'
];

const guessSyllables = (word: string) => {
    if (!word) return [];
    const parts = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
    if (!parts) return [word];
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (/^[^aeiouy]+e$/i.test(lastPart)) {
             parts[parts.length - 2] += lastPart;
             parts.pop(); 
        }
    }
    return parts;
};

const guessPhoneticParts = (phonetic: string) => {
    if (!phonetic) return [];
    const content = phonetic.replace(/^[/[\]]/, '').replace(/[/[\]]$/, '').trim();
    if (!content) return [];
    const VOWELS_REGEX = /[aeiouɪɛeæɑɔʊʌəɝɚ!]+(?:ː|r|:|\u02D0)?/gi;
    const matches = Array.from(content.matchAll(VOWELS_REGEX));
    if (matches.length === 0) return [content];
    const parts: string[] = [];
    let boundaryStart = 0;
    for (let i = 0; i < matches.length - 1; i++) {
        const currentVowel = matches[i];
        const nextVowel = matches[i+1];
        const currentVowelEnd = currentVowel.index! + currentVowel[0].length;
        const nextVowelStart = nextVowel.index!;
        const between = content.slice(currentVowelEnd, nextVowelStart);
        const splitOffset = between.match(/[ˈˌ']/) ? between.match(/[ˈˌ']/)!.index! : (between.length <= 1 ? 0 : 1);
        const splitIndex = currentVowelEnd + splitOffset;
        parts.push(content.slice(boundaryStart, splitIndex));
        boundaryStart = splitIndex;
    }
    parts.push(content.slice(boundaryStart));
    return parts;
};

const WordCard: React.FC<WordCardProps> = ({ 
  word: initialWord, 
  isUnfamiliar, 
  lastQuestion,
  onToggleUnfamiliar, 
  showAiButton = true,
  onEdit,
  onAddRelatedWord,
  hasApiKey = false,
  userProgress
}) => {
  const [word, setWord] = useState<Word>(initialWord);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [syllables] = useState<string | null>(null);
  const [showLastQuestion, setShowLastQuestion] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isTermSpeaking, setIsTermSpeaking] = useState(false);
  const [isExampleSpeaking, setIsExampleSpeaking] = useState(false);
  const [isExampleLoading, setIsExampleLoading] = useState(false);
  
  useEffect(() => {
    setWord(initialWord);
    setMindMapData(null);
  }, [initialWord]);

  const displayParts = useMemo(() => {
      if (syllables) return syllables.split(/[‧·.-]/).filter(s => s.trim());
      if (word.syllables && word.syllables.trim().length > 0) return word.syllables.split(/[-‧·.]/).filter(s => s.trim());
      return guessSyllables(word.term);
  }, [word.term, syllables, word.syllables]);

  const phoneticParts = useMemo(() => guessPhoneticParts(word.phonetic), [word.phonetic]);

  const handleGenerateDetails = async () => {
      if (isDetailsLoading) return;
      
      if (!hasApiKey) {
          alert("請先在右上角「設定」中輸入 API Key。");
          return;
      }

      setIsDetailsLoading(true);
      try {
        const details = await generateWordDetails(word.term);
        if (details) {
            const updatedWord = { ...word, ...details };
            setWord(updatedWord);
            await updateWordDetailsInSheet(word.id, updatedWord);
        } else {
            alert("無法自動生成資料");
        }
      } catch (e: unknown) {
         console.error(e);
         const message = e instanceof Error ? e.message : String(e);
         alert(`生成失敗: ${message}`);
      }
      setIsDetailsLoading(false);
  };

  const handleGenerateExample = async () => {
      if (!hasApiKey) {
          alert("請先在右上角「設定」中輸入 API Key。");
          return;
      }

      setIsExampleLoading(true);
      try {
        const result = await generateMissingExample(word);
        if (result) {
            const updatedWord = { ...word, example: result.sentence, exampleTranslation: result.translation };
            setWord(updatedWord);
            updateWordExampleInSheet(word.id, result.sentence, result.translation);
        } else {
            alert("生成失敗 (可能配額不足)");
        }
      } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error ? e.message : String(e);
          alert(`生成失敗: ${message}`);
      }
      setIsExampleLoading(false);
  };

  const handleAiAsk = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    if (!hasApiKey) {
        alert("請先在右上角「設定」中輸入 API Key 才能使用 AI 功能。");
        return;
    }

    if (mindMapData) { 
        setMindMapData(null); 
        return; 
    }
    
    setIsAiLoading(true);
    try {
        console.log("Generating Mind Map for:", word.term);
        const data = await generateRootMindMap(word.term);
        console.log("Mind Map Data:", data);
        if (data) {
            setMindMapData(data);
        } else {
            alert("AI 未回傳有效資料，請稍後再試。");
        }
    } catch (e: unknown) {
        console.error("AI Error:", e);
        let msg = "生成失敗";
        const message = e instanceof Error ? e.message : String(e);
        if (message === 'INVALID_API_KEY') msg = "API Key 無效";
        if (message === 'QUOTA_EXCEEDED') msg = "額度已用完 (Quota Exceeded)";
        alert(`${msg}。請檢查設定。\n詳細錯誤: ${message}`);
    }
    setIsAiLoading(false);
  };

  const playAudio = async (text: string, setLoading: (l: boolean) => void) => {
      if (!text) return;
      setLoading(true);
      let aiSuccess = false;
      if (hasApiKey) {
          try {
              aiSuccess = await playGeminiTts(text);
          } catch (e) { console.warn("AI TTS Failed"); }
      }
      if (!aiSuccess) {
          if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US'; 
              utterance.rate = 0.8; 
              utterance.onend = () => setLoading(false);
              utterance.onerror = () => setLoading(false);
              window.speechSynthesis.speak(utterance);
              setTimeout(() => setLoading(false), 5000);
          } else {
              alert("您的瀏覽器不支援語音功能。");
              setLoading(false);
          }
      } else {
          setLoading(false);
      }
  };

  const speakTerm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTermSpeaking) return;
    playAudio(word.term, setIsTermSpeaking);
  };

  const speakExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExampleSpeaking) return;
    if (word.example) playAudio(word.example, setIsExampleSpeaking);
  };

  const renderMindMap = () => {
      if (!mindMapData) return null;
      const items = mindMapData.relatedWords || [];
      return (
          <div className="mt-4 relative bg-slate-50 rounded-xl overflow-hidden animate-fadeIn select-none border border-slate-100 z-10" style={{ height: '350px' }}>
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                  {items.map((_, index) => {
                      const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2;
                      const x = 50 + 27 * Math.cos(angle);
                      const y = 50 + 27 * Math.sin(angle);
                      return <line key={`line-${index}`} x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />;
                  })}
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex flex-col items-center justify-center text-white border-4 border-white ring-4 ring-blue-50/50">
                      <span className="font-bold text-lg">{mindMapData.root}</span>
                      <span className="text-[10px] opacity-90">{mindMapData.rootMeaning}</span>
                  </div>
              </div>
              {items.map((item, index) => {
                  const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2;
                  const left = 50 + 27 * Math.cos(angle);
                  const top = 50 + 27 * Math.sin(angle);
                  return (
                      <button key={index} onClick={(e) => { e.stopPropagation(); if (onAddRelatedWord) onAddRelatedWord(item.word, item.meaning); }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-2 rounded-xl shadow-md border-2 border-white text-center z-20 hover:scale-110 transition-all cursor-pointer hover:border-blue-400 group"
                        style={{ left: `${left}%`, top: `${top}%` }}>
                          <div className="font-bold text-slate-800 text-sm truncate max-w-[80px] group-hover:text-blue-600">{item.word}</div>
                          <div className="text-slate-500 text-xs scale-95 truncate max-w-[80px]">{item.meaning}</div>
                      </button>
                  );
              })}
          </div>
      );
  };

  // Determine Mastery Status
  const getMasteryStatus = () => {
      if (!userProgress) return { color: 'slate', icon: '🔒', label: '未學', bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
      
      if (userProgress.isMarked) return { color: 'red', icon: '🚨', label: '易錯', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
      if (userProgress.correctCount >= 2) return { color: 'amber', icon: '👑', label: '精熟', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
      if (userProgress.correctCount === 1) return { color: 'yellow', icon: '🌙', label: '淺層', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' };
      if (userProgress.mapViewed) return { color: 'blue', icon: '👀', label: '已讀', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
      
      return { color: 'slate', icon: '🔒', label: '未學', bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
  };

  const status = getMasteryStatus();

  if (isDetailsLoading) return <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center min-h-[250px] animate-pulse">AI 補全中...</div>;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${status.border} overflow-hidden flex flex-col h-full transition-transform hover:-translate-y-1 duration-200 relative group p-6`}>
      {/* Top Controls */}
      <div className="absolute top-3 left-3 z-30 flex gap-2">
        <div className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${status.bg} ${status.text} ${status.border}`}>
            <span>{status.icon}</span>
            <span>{status.label}</span>
            {userProgress && userProgress.testedCount > 0 && <span className="ml-1 opacity-75">({userProgress.correctCount}/{userProgress.testedCount})</span>}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
         {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(word); }} className="p-2 rounded-full bg-white border border-slate-200 text-slate-300 hover:text-blue-500 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
         
         <button 
            onClick={(e) => { e.stopPropagation(); onToggleUnfamiliar(word.id); }} 
            className={`p-2 rounded-full border shadow-sm transition-all transform active:scale-125
                ${isUnfamiliar 
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-500' 
                    : 'bg-white border-slate-200 text-slate-300 hover:text-yellow-400'
                }`}
            title={isUnfamiliar ? "移除不熟標記" : "加入不熟標記"}
         >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isUnfamiliar ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isUnfamiliar ? "0" : "2"} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
         </button>
      </div>

      {/* Main Content Area - Flex-1 to fill space */}
      <div className="mt-6 flex flex-col gap-1 flex-1">
          {/* Term & Audio */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex flex-wrap items-end cursor-pointer group/word select-none mr-1" onClick={speakTerm} title="點擊發音">
                {displayParts.map((part, idx) => (
                    <span key={idx} className={`text-4xl font-black tracking-wide mr-[1px] border-b-[4px] ${SYLLABLE_COLORS[idx % SYLLABLE_COLORS.length]} ${isTermSpeaking ? 'text-emerald-600' : 'text-slate-800'}`}>{part}</span>
                ))}
            </div>
            <button onClick={speakTerm} className={`p-1.5 rounded-full ${isTermSpeaking ? 'text-emerald-600' : 'text-emerald-500 hover:text-emerald-600'}`}>
              {isTermSpeaking ? <span className="animate-spin text-lg">🔊</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
            </button>
          </div>

          {/* Phonetic */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-lg text-slate-500 mb-2">
            <span>[</span> {phoneticParts.map((part, i) => <span key={i} className={`${SYLLABLE_COLORS[i % SYLLABLE_COLORS.length].replace('border-', 'text-')}`}>{part}</span>)} <span>]</span>
          </div>

          {/* Category Tag */}
          <div className="flex flex-wrap gap-2 mb-4">
            {word.category && <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">{word.category}</span>}
            {word.coreTag && <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-bold">{word.coreTag}</span>}
          </div>

          {/* Meaning */}
          <div className="text-xl font-bold text-slate-800 mb-2 flex items-baseline">
             <span className="text-slate-600 font-bold mr-2 text-lg">{word.partOfSpeech}</span>
             {word.meaning || <span className="text-slate-300 italic text-sm font-normal">待補充...</span>}
          </div>
          {(!word.meaning) && <button onClick={handleGenerateDetails} className={`w-full py-2 border rounded-lg text-sm font-bold mt-2 ${!hasApiKey ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'}`}>{!hasApiKey ? '請先設定 API Key' : 'AI 補全資料'}</button>}

          {/* Example Box */}
          {word.example ? (
            <div className="mt-2 bg-emerald-50/50 border-l-4 border-emerald-400 p-4 rounded-r-lg relative z-10">
                <p className="text-lg text-slate-800 italic font-serif leading-relaxed mb-1 pr-8">{word.example}</p>
                <p className="text-sm text-slate-500 mb-1">{word.exampleTranslation}</p>
                <button onClick={speakExample} disabled={isExampleSpeaking} className={`absolute bottom-2 right-2 p-1 rounded-full ${isExampleSpeaking ? 'text-emerald-700' : 'text-emerald-400 hover:text-emerald-600'}`} title="例句發音">
                    {isExampleSpeaking ? '🔊' : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                </button>
            </div>
          ) : (
             <div className="mt-2 text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300">
                <button 
                  onClick={handleGenerateExample} 
                  disabled={isExampleLoading || !hasApiKey}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mx-auto ${hasApiKey ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {isExampleLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      生成中...
                    </>
                  ) : 'AI 生成例句'}
                </button>
             </div>
          )}

          {/* Footer Actions - Pushed to bottom */}
          <div className="mt-auto pt-4 flex flex-col gap-2 relative z-50">
             {showAiButton && (
                 <>
                    <button 
                        onClick={handleAiAsk} 
                        disabled={isAiLoading} 
                        className={`text-sm font-bold text-left w-full py-2 px-2 rounded-lg transition-colors flex items-center gap-2
                            ${!hasApiKey 
                                ? 'text-slate-400 hover:bg-slate-50 cursor-pointer' 
                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                    >
                        {isAiLoading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                AI 分析中...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI 字根延伸心智圖 {!hasApiKey && <span className="text-xs text-red-400 ml-1">(需設定 Key)</span>}
                            </>
                        )}
                    </button>
                    {renderMindMap()}
                 </>
             )}
             {lastQuestion && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                    <span>上次測驗: {lastQuestion.question.substring(0, 20)}...</span>
                    <button onClick={(e) => { e.stopPropagation(); setShowLastQuestion(!showLastQuestion); }} className="text-blue-500 hover:underline">展開</button>
                </div>
             )}
             {showLastQuestion && lastQuestion && <div className="bg-blue-50 p-2 rounded text-xs text-slate-700 mt-1">{lastQuestion.question}</div>}
          </div>
      </div>
    </div>
  );
};

export default React.memo(WordCard);
