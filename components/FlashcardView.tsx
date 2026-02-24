
import React, { useState, useEffect, useMemo } from 'react';
import { Word } from '../types';
import { playGeminiTts, getEffectiveApiKey } from '../services/geminiService';
import { RotateCcw, Brain, Check, Zap, ChevronLeft, Settings, Star, Volume2 } from 'lucide-react';

interface FlashcardViewProps {
  allWords: Word[];
  categories: string[];
  itemsPerPage: number;
  completedPages: string[];
  markedUnfamiliar: string[];
  mistakeCounts: Record<string, number>;
  onToggleUnfamiliar: (id: string) => void;
  onCompletePage?: (category: string, page: number, wordIds: string[], forceState?: boolean) => void;
  onSrsAssessment?: (wordId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const SYLLABLE_COLORS = ['border-emerald-500', 'border-orange-400', 'border-blue-500', 'border-purple-500', 'border-pink-500'];

const guessSyllables = (word: string) => {
    if (!word) return [];
    const parts = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
    if (!parts) return [word];
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (/^[^aeiouy]+e$/i.test(lastPart)) { parts[parts.length - 2] += lastPart; parts.pop(); }
    }
    return parts;
};

const guessPhoneticParts = (phonetic: string) => {
    if (!phonetic) return [];
    const content = phonetic.replace(/^[/[]/, '').replace(/[/]]$/, '').trim();
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

type Mode = 'MAP' | 'CUSTOM' | 'WEAKNESS';

const FlashcardView: React.FC<FlashcardViewProps> = ({ 
    allWords, 
    categories, 
    itemsPerPage, 
    completedPages, 
    markedUnfamiliar, 
    mistakeCounts, 
    onToggleUnfamiliar,
    onCompletePage,
    onSrsAssessment
}) => {
  // Phase State
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING'>('SETUP');
  const [activeTab, setActiveTab] = useState<Mode>('MAP');

  // Setup State
  const [selectedCategory, setSelectedCategory] = useState<string>(categories.find(c => c !== 'All') || 'All');
  const [selectedPage, setSelectedPage] = useState(1);
  const [customCount, setCustomCount] = useState(20);
  const [isShuffle, setIsShuffle] = useState(false);
  const [includeMistakes, setIncludeMistakes] = useState(true);
  const [includeUnfamiliar, setIncludeUnfamiliar] = useState(true);

  // Playing State
  const [activeWords, setActiveWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExamplePlaying, setIsExamplePlaying] = useState(false);

  // --- Calculations for Setup ---
  const filteredWordsByCategory = useMemo(() => {
      return selectedCategory === 'All' 
        ? allWords 
        : allWords.filter(w => (w.category || '未分類') === selectedCategory);
  }, [allWords, selectedCategory]);

  const totalPages = Math.ceil(filteredWordsByCategory.length / itemsPerPage);

  useEffect(() => {
      setSelectedPage(1);
  }, [selectedCategory]);

  // --- Handlers ---

  const handleStart = () => {
      let pool: Word[] = [];

      if (activeTab === 'MAP') {
          const start = (selectedPage - 1) * itemsPerPage;
          pool = filteredWordsByCategory.slice(start, start + itemsPerPage);
      } 
      else if (activeTab === 'CUSTOM') {
          pool = [...filteredWordsByCategory];
          if (isShuffle) {
              pool.sort(() => 0.5 - Math.random());
          }
          pool = pool.slice(0, customCount);
      }
      else if (activeTab === 'WEAKNESS') {
          const uniqueIds = new Set<string>();
          if (includeUnfamiliar) markedUnfamiliar.forEach(id => uniqueIds.add(id));
          if (includeMistakes) {
              Object.keys(mistakeCounts).forEach(id => {
                  if (mistakeCounts[id] > 0) uniqueIds.add(id);
              });
          }
          pool = allWords.filter(w => uniqueIds.has(w.id));
          pool.sort(() => 0.5 - Math.random());
          pool = pool.slice(0, customCount);
      }

      if (pool.length === 0) {
          alert("選定範圍內沒有單字！");
          return;
      }

      setActiveWords(pool);
      setCurrentIndex(0);
      setIsFlipped(false);
      setPhase('PLAYING');
  };

  const handleNext = (e?: React.MouseEvent, rating?: 'again' | 'hard' | 'good' | 'easy') => {
    e?.stopPropagation(); 
    
    if (rating && onSrsAssessment && activeWords[currentIndex]) {
        onSrsAssessment(activeWords[currentIndex].id, rating);
    }

    setIsFlipped(false);
    setTimeout(() => {
        if (currentIndex < activeWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // If in MAP mode, notify completion
            if (activeTab === 'MAP' && onCompletePage) {
                onCompletePage(selectedCategory, selectedPage, activeWords.map(w => w.id), true);
            }

            // Loop or Finish? Let's Loop for flashcards usually, or ask to restart
            if (window.confirm("已完成本輪複習！要重新開始嗎？")) {
                setCurrentIndex(0);
            } else {
                setPhase('SETUP');
            }
        }
    }, 200);
  };

  const handlePrev = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentIndex > 0) {
          setIsFlipped(false);
          setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
      }
  };

  const handleMark = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeWords[currentIndex]) {
          onToggleUnfamiliar(activeWords[currentIndex].id);
      }
  };

  // TTS Logic
  const playAudio = async (e: React.MouseEvent, text: string, type: 'term' | 'example') => {
    e.stopPropagation();
    const setPlaying = type === 'term' ? setIsPlaying : setIsExamplePlaying;
    if (isPlaying || isExamplePlaying) return;
    
    setPlaying(true);
    let aiSuccess = false;

    if (getEffectiveApiKey()) {
        try {
            aiSuccess = await playGeminiTts(text);
        } catch { console.warn("TTS fallback"); }
    }

    if (!aiSuccess) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = type === 'term' ? 0.8 : 0.9;
            utterance.onend = () => setPlaying(false);
            utterance.onerror = () => setPlaying(false);
            window.speechSynthesis.speak(utterance);
            setTimeout(() => setPlaying(false), 5000);
        } else {
            alert("瀏覽器不支援發音");
            setPlaying(false);
        }
    } else {
        setPlaying(false);
    }
  };

  // --- Render Setup Phase ---
  if (phase === 'SETUP') {
      return (
          <div className="max-w-3xl mx-auto p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
                      <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          單字卡設定
                      </h2>
                      <p className="opacity-90">請選擇您想複習的範圍與模式</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-200">
                      <button 
                        onClick={() => setActiveTab('MAP')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'MAP' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          🗺️ 地圖進度 (Map)
                      </button>
                      <button 
                        onClick={() => setActiveTab('CUSTOM')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'CUSTOM' ? 'text-purple-600 border-b-4 border-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          ⚙️ 自訂範圍
                      </button>
                      <button 
                        onClick={() => setActiveTab('WEAKNESS')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'WEAKNESS' ? 'text-red-600 border-b-4 border-red-600 bg-red-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          🎯 弱點特訓
                      </button>
                  </div>

                  <div className="p-8 min-h-[300px] bg-slate-50">
                      {/* MAP MODE */}
                      {activeTab === 'MAP' && (
                          <div className="space-y-6">
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="block text-sm font-bold text-slate-700 mb-2">1. 選擇分類 (Category)</label>
                                  <select 
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500"
                                  >
                                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="block text-sm font-bold text-slate-700 mb-4">2. 選擇頁數 (Page)</label>
                                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                      {Array.from({length: totalPages}).map((_, i) => {
                                          const pageNum = i + 1;
                                          const isCompleted = completedPages.includes(`${selectedCategory}-${pageNum}`);
                                          return (
                                              <button
                                                  key={pageNum}
                                                  onClick={() => setSelectedPage(pageNum)}
                                                  className={`
                                                      relative p-2 rounded-lg font-bold text-sm border-2 transition-all
                                                      ${selectedPage === pageNum 
                                                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' 
                                                          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'
                                                      }
                                                  `}
                                              >
                                                  {pageNum}
                                                  {isCompleted && (
                                                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm">
                                                          ✓
                                                      </div>
                                                  )}
                                              </button>
                                          )
                                      })}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-3 text-right">每頁約 {itemsPerPage} 個單字</p>
                              </div>
                          </div>
                      )}

                      {/* CUSTOM MODE */}
                      {activeTab === 'CUSTOM' && (
                          <div className="space-y-6">
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="block text-sm font-bold text-slate-700 mb-2">選擇分類</label>
                                  <select 
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500"
                                  >
                                      {categories.map(c => <option key={c} value={c}>{c === 'All' ? '全部單字' : c}</option>)}
                                  </select>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex justify-between items-center mb-2">
                                      <label className="block text-sm font-bold text-slate-700">單字數量</label>
                                      <span className="text-2xl font-black text-purple-600">{customCount}</span>
                                  </div>
                                  <input 
                                    type="range" min="5" max="100" step="5" 
                                    value={customCount}
                                    onChange={(e) => setCustomCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                  />
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={isShuffle}
                                        onChange={(e) => setIsShuffle(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                      />
                                      <span className="font-bold text-slate-700">隨機打亂順序 (Shuffle)</span>
                                  </label>
                              </div>
                          </div>
                      )}

                      {/* WEAKNESS MODE */}
                      {activeTab === 'WEAKNESS' && (
                          <div className="space-y-6">
                              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                  <h3 className="font-bold text-red-800 mb-4">來源設定</h3>
                                  <div className="space-y-3">
                                      <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-red-200">
                                          <input type="checkbox" checked={includeUnfamiliar} onChange={e => setIncludeUnfamiliar(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                                          <span className="font-bold text-slate-700">⭐ 不熟單字 ({markedUnfamiliar.length})</span>
                                      </label>
                                      <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-red-200">
                                          <input type="checkbox" checked={includeMistakes} onChange={e => setIncludeMistakes(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                                          <span className="font-bold text-slate-700">⚠️ 易錯單字 ({(Object.values(mistakeCounts) as number[]).filter(c=>c>0).length})</span>
                                      </label>
                                  </div>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex justify-between items-center mb-2">
                                      <label className="block text-sm font-bold text-slate-700">最大數量</label>
                                      <span className="text-2xl font-black text-red-600">{customCount}</span>
                                  </div>
                                  <input 
                                    type="range" min="5" max="100" step="5" 
                                    value={customCount}
                                    onChange={(e) => setCustomCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                  />
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-white flex justify-center">
                      <button 
                        onClick={handleStart}
                        className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                          開始複習
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- Render Playing Phase ---
  const currentWord = activeWords[currentIndex];
  const isUnfamiliar = markedUnfamiliar.includes(currentWord.id);
  const displayParts = guessSyllables(currentWord.term);
  const phoneticParts = guessPhoneticParts(currentWord.phonetic);

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-4 animate-fadeIn">
      {/* Header */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center text-slate-500 font-bold text-xs">
         <button onClick={() => setPhase('SETUP')} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
             <Settings className="w-3.5 h-3.5" />
             設定
         </button>
         <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">{currentIndex + 1} / {activeWords.length}</span>
         <button onClick={(e) => handleMark(e)} className={`${isUnfamiliar ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'} transition-colors`}>
             <Star className="w-5 h-5" fill={isUnfamiliar ? "currentColor" : "none"} />
         </button>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md h-[500px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)} style={{ perspective: '1000px' }}>
        <div className="relative w-full h-full duration-500 transition-transform" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
           
           {/* Front */}
           <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 z-20" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              {currentWord.coreTag && <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm bg-gray-100">{currentWord.coreTag}</div>}
              <div className="flex flex-wrap items-end justify-center mb-6 mt-8">
                {displayParts.map((part, idx) => (
                    <span key={idx} className={`text-5xl font-black tracking-wide mr-[2px] border-b-[6px] ${SYLLABLE_COLORS[idx % SYLLABLE_COLORS.length]} ${isPlaying ? 'text-emerald-600' : 'text-slate-800'}`}>{part}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1 mb-8 font-mono text-xl text-slate-500 bg-slate-50 px-4 py-2 rounded-full">
                 <span>/</span>{phoneticParts.map((part, idx) => <span key={idx} className={`${isPlaying ? 'text-emerald-600' : ''}`}>{part}</span>)}<span>/</span>
              </div>
              <button onClick={(e) => playAudio(e, currentWord.term, 'term')} className={`p-4 rounded-full shadow-md transition-all ${isPlaying ? 'bg-emerald-100 text-emerald-600 scale-95' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {isPlaying ? <Volume2 className="w-8 h-8 animate-pulse" /> : <Volume2 className="w-8 h-8" />}
              </button>
              <p className="mt-8 text-slate-400 text-sm animate-pulse">點擊卡片翻面看例句</p>
           </div>

           {/* Back */}
           <div className="absolute w-full h-full bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-700 flex flex-col items-center p-6 text-white z-10" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="text-3xl font-black text-white tracking-wider mb-2">{currentWord.term}</div>
              <div className="text-2xl font-bold mb-4 text-emerald-400 text-center">{currentWord.partOfSpeech} {currentWord.meaning}</div>
              <div className="w-full h-px bg-slate-600 mb-6"></div>
              
              <div className="text-center w-full flex-1 flex flex-col justify-center overflow-y-auto mb-4">
                 {currentWord.example ? (
                     <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 flex flex-col items-center">
                         <p className="text-xl md:text-2xl mb-3 text-slate-200 font-serif leading-relaxed">"{currentWord.example}"</p>
                         <p className="text-base text-slate-400 mb-4">{currentWord.exampleTranslation}</p>
                         <button onClick={(e) => playAudio(e, currentWord.example, 'example')} className="p-3 bg-slate-600 rounded-full hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center gap-2 px-4 shadow-sm transition-colors">
                             {isExamplePlaying ? '播放中...' : <span className="text-sm font-bold">播放例句</span>}
                         </button>
                     </div>
                 ) : <p className="text-slate-500 italic">暫無例句</p>}
              </div>

              {/* SRS Buttons */}
              <div className="w-full grid grid-cols-4 gap-2 mt-auto">
                 <button 
                   onClick={(e) => handleNext(e, 'again')}
                   className="flex flex-col items-center justify-center py-2 px-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all group/btn"
                 >
                   <RotateCcw className="w-4 h-4 mb-1 text-red-400 group-hover/btn:rotate-[-45deg] transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-red-200">Again</span>
                   <span className="text-[8px] text-red-400/80 font-bold">忘記了</span>
                 </button>
                 <button 
                   onClick={(e) => handleNext(e, 'hard')}
                   className="flex flex-col items-center justify-center py-2 px-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all group/btn"
                 >
                   <Brain className="w-4 h-4 mb-1 text-orange-400 group-hover/btn:scale-110 transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-orange-200">Hard</span>
                   <span className="text-[8px] text-orange-400/80 font-bold">有點卡</span>
                 </button>
                 <button 
                   onClick={(e) => handleNext(e, 'good')}
                   className="flex flex-col items-center justify-center py-2 px-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all group/btn"
                 >
                   <Check className="w-4 h-4 mb-1 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-blue-200">Good</span>
                   <span className="text-[8px] text-blue-400/80 font-bold">很順利</span>
                 </button>
                 <button 
                   onClick={(e) => handleNext(e, 'easy')}
                   className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all group/btn"
                 >
                   <Zap className="w-4 h-4 mb-1 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-200">Easy</span>
                   <span className="text-[8px] text-emerald-400/80 font-bold">太簡單</span>
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-6 mt-8 w-full max-w-md items-center justify-between">
         <button onClick={handlePrev} disabled={currentIndex === 0} className="p-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
             <ChevronLeft className="w-6 h-6 text-slate-600" />
         </button>
         
         <button onClick={(e) => handleNext(e)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-700 transition-all transform hover:scale-[1.02] active:scale-95">
             {currentIndex < activeWords.length - 1 ? '下一個 (Next)' : '完成 (Finish)'}
         </button>
      </div>
    </div>
  );
};

export default FlashcardView;
