
import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { addCustomWord, getGasApiUrl, updateWordDetailsInSheet } from '../services/gasService';
import { generateWordDetails, getEffectiveApiKey, generateMindMapData, MindMapData } from '../services/geminiService';

interface AddWordModalProps {
  categories: string[];
  onClose: () => void;
  onAdd: (newWord: Word, markAsUnfamiliar: boolean) => void;
  onUpdate?: (updatedWord: Word) => void;
  allWords?: Word[];
  onToggleUnfamiliar?: (id: string) => void;
  markedWords?: string[];
  mistakeCounts?: Record<string, number>;
  onIncrementMistake?: (id: string) => void;
  onSetMistakeCount?: (id: string, count: number) => void;
  initialData?: Word;
}

type ViewMode = 'SEARCH' | 'FORM';

const GeneratingOverlay = () => (
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const AddWordModal: React.FC<AddWordModalProps> = ({ 
    categories, onClose, onAdd, onUpdate, allWords = [], onToggleUnfamiliar, markedWords = [],
    mistakeCounts = {}, onIncrementMistake, onSetMistakeCount, initialData
}) => {
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>(initialData ? 'FORM' : 'SEARCH');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchResult = React.useMemo(() => {
      if (viewMode === 'SEARCH' && searchTerm.trim()) {
          return allWords.find(w => w.term.toLowerCase() === searchTerm.trim().toLowerCase()) || null;
      }
      return null;
  }, [viewMode, searchTerm, allWords]);
  
  // Mind Map State
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [loadingMindMap, setLoadingMindMap] = useState(false);

  // Form State
  const [newWord, setNewWord] = useState<Partial<Word>>({
    category: '自建',
    level: '1200',
    partOfSpeech: '',
    term: '',
    meaning: '',
    phonetic: '',
    example: '',
    exampleTranslation: ''
  });
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [markUnfamiliar, setMarkUnfamiliar] = useState(true);
  const [localMistakeCount, setLocalMistakeCount] = useState(0);
  
  // Duplicate Handling (in Form Mode)
  const isEditMode = initialData && initialData.id !== '';

  const duplicateWord = React.useMemo(() => {
     if (viewMode === 'FORM' && newWord.term && newWord.term.trim().length > 1) {
         const found = allWords.find(w => w.term.toLowerCase() === newWord.term!.trim().toLowerCase());
         if (found && (!isEditMode || found.id !== initialData?.id)) {
             return found;
         }
     }
     return null;
  }, [viewMode, newWord.term, allWords, isEditMode, initialData]);

  // Initialize Form Data
  useEffect(() => {
      if (initialData) {
          setNewWord({ ...initialData });
          if (initialData.id) {
             setMarkUnfamiliar(markedWords.includes(initialData.id));
             setLocalMistakeCount(mistakeCounts[initialData.id] || 0);
          }
      } else {
          setLocalMistakeCount(0);
      }
  }, [initialData, markedWords, mistakeCounts]);

  // Sync mistake count when duplicate found
  useEffect(() => {
     if (duplicateWord) {
         setLocalMistakeCount(mistakeCounts[duplicateWord.id] || 0);
     } else if (!isEditMode) {
         setLocalMistakeCount(0);
     }
  }, [duplicateWord, mistakeCounts, isEditMode]);

  const handleAiAutoFill = async () => {
      if (!newWord.term) {
          alert("請先輸入英文單字！");
          return;
      }
      if (!getEffectiveApiKey()) {
          alert("請先在設定中輸入 API Key 才能使用 AI 自動填寫功能。");
          return;
      }

      setIsGenerating(true);
      try {
          const details = await generateWordDetails(newWord.term);
          if (details) {
              setNewWord(prev => ({
                  ...prev,
                  ...details,
                  category: prev.category === '自建' ? '自建' : details.category
              }));
          } else {
              alert("AI 生成失敗，請確認單字拼寫正確或檢查 API Key。");
          }
      } catch (e) {
          console.error(e);
          alert("發生錯誤，請稍後再試。");
      }
      setIsGenerating(false);
  };

  const loadExistingWordData = () => {
      if (!duplicateWord) return;
      setNewWord({ ...duplicateWord });
  };

  const handleMarkAsMistakeAndClose = () => {
      if (duplicateWord && onIncrementMistake) {
          onIncrementMistake(duplicateWord.id);
          const currentCount = mistakeCounts[duplicateWord.id] || 0;
          alert(`已將「${duplicateWord.term}」標記為易錯！\n(易錯次數: ${currentCount} ➔ ${currentCount + 1})`);
          onClose();
      }
  };

  const handleAddOrUpdateWord = async () => {
    if (!getGasApiUrl()) {
      alert("請先設定 Google Apps Script 網址才能儲存單字！");
      return;
    }
    if (!newWord.term || !newWord.meaning) {
      alert("請至少輸入「英文單字」與「中文意思」");
      return;
    }

    setIsAddingWord(true);

    const targetId = isEditMode ? initialData?.id : duplicateWord?.id;
    const isRealUpdate = !!targetId;

    if (isRealUpdate) {
        const updatedWordData: Word = {
            id: targetId!,
            term: newWord.term!,
            meaning: newWord.meaning!,
            partOfSpeech: newWord.partOfSpeech || '',
            phonetic: newWord.phonetic || '',
            example: newWord.example || '',
            exampleTranslation: newWord.exampleTranslation || '',
            category: newWord.category || (initialData?.category || '自建'),
            level: (newWord.level as '1200' | '800') || '1200',
            syllables: newWord.syllables || '',
            pastExamCount: (initialData?.pastExamCount || duplicateWord?.pastExamCount || 0),
            mistakeCount: localMistakeCount
        };

        const success = await updateWordDetailsInSheet(targetId!, updatedWordData);
        if (success) {
            if (onUpdate) onUpdate(updatedWordData);
            
            const isCurrentlyUnfamiliar = markedWords.includes(targetId!);
            if (markUnfamiliar !== isCurrentlyUnfamiliar && onToggleUnfamiliar) {
                onToggleUnfamiliar(targetId!);
            }

            if (onSetMistakeCount) {
                onSetMistakeCount(targetId!, localMistakeCount);
            }
            
            alert(`單字「${updatedWordData.term}」更新成功！`);
            onClose();
        } else {
            alert("更新失敗，請檢查網路連線。");
        }
    } else {
        const payload = {
            ...newWord,
            mistakeCount: localMistakeCount
        } as Omit<Word, 'id' | 'pastExamCount'>;

        const result = await addCustomWord(payload);
        
        if (result.success) {
          const newWordWithId: Word = {
              id: result.id || `temp-${Date.now()}`,
              term: newWord.term!,
              meaning: newWord.meaning!,
              partOfSpeech: newWord.partOfSpeech || '',
              phonetic: newWord.phonetic || '',
              example: newWord.example || '',
              exampleTranslation: newWord.exampleTranslation || '',
              category: newWord.category || '自建',
              level: (newWord.level as '1200' | '800') || '1200',
              pastExamCount: 0,
              syllables: newWord.syllables || '',
              mistakeCount: localMistakeCount
          };

          onAdd(newWordWithId, markUnfamiliar);
          if (onSetMistakeCount) {
              onSetMistakeCount(newWordWithId.id, localMistakeCount);
          }
          onClose();
        } else {
          alert(`新增失敗：${result.message || '請檢查網路或 Apps Script 設定'}`);
        }
    }
    setIsAddingWord(false);
  };



  // --- RENDER: SEARCH MODE ---
  if (viewMode === 'SEARCH') {
      const isUnfamiliar = searchResult ? markedWords.includes(searchResult.id) : false;
      
      const handleSpeak = (text: string) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
      };

      return (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn p-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        單字查詢 / 新增
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-8">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-4 pl-5 text-lg border-2 border-blue-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-400 font-bold text-slate-700"
                            placeholder="輸入單字查詢..."
                            autoFocus
                        />
                    </div>
                </div>

                {searchTerm && (
                    <div className="animate-fadeIn">
                        {searchResult ? (
                            <div className="bg-white rounded-xl">
                                {/* Top Actions Row */}
                                <div className="flex justify-between items-center mb-4">
                                    <button 
                                        onClick={() => handleMarkAsMistakeAndClose()} // Note: This might need adjustment as duplicateWord isn't set here yet, but we can fix logic or just use searchResult
                                        className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                    >
                                        標記易錯
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setNewWord({...searchResult});
                                                setViewMode('FORM');
                                            }}
                                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => onToggleUnfamiliar && onToggleUnfamiliar(searchResult.id)}
                                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors
                                                ${isUnfamiliar 
                                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-500' 
                                                    : 'border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-200 hover:bg-yellow-50'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill={isUnfamiliar ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Word Title Section */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-5xl font-bold text-slate-800 tracking-tight">{searchResult.term}</h1>
                                        <button 
                                            onClick={() => handleSpeak(searchResult.term)}
                                            className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                                        >
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        </button>
                                    </div>
                                    {/* Underline Decoration */}
                                    <div className="flex h-1.5 mb-4 rounded-full overflow-hidden w-24">
                                        <div className="w-1/2 bg-emerald-500"></div>
                                        <div className="w-1/2 bg-orange-400"></div>
                                    </div>

                                    {/* Phonetic & Tags */}
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <span className="font-mono text-2xl text-slate-600">
                                            <span className="text-emerald-600">[ </span>
                                            {searchResult.phonetic?.replace(/^\/|\/$/g, '') || ' ... '}
                                            <span className="text-orange-500"> ]</span>
                                        </span>
                                        
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-bold rounded-full">
                                            其他名詞
                                        </span>
                                        {searchResult.pastExamCount > 0 && (
                                            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-sm font-bold rounded-full border border-orange-100">
                                                歷年考點
                                            </span>
                                        )}
                                    </div>

                                    {/* Meaning */}
                                    <div className="text-2xl font-bold text-slate-800 mb-6 flex items-baseline gap-2">
                                        <span className="text-lg font-serif italic text-slate-500">{searchResult.partOfSpeech || '(n.)'}</span>
                                        {searchResult.meaning}
                                    </div>

                                    {/* Example Box */}
                                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl relative group">
                                        <p className="font-serif italic text-xl text-slate-800 mb-2 leading-relaxed">
                                            {searchResult.example || 'No example sentence available.'}
                                        </p>
                                        <p className="text-slate-500 font-medium">
                                            {searchResult.exampleTranslation || '尚無例句翻譯'}
                                        </p>
                                        <button 
                                            onClick={() => handleSpeak(searchResult.example)}
                                            className="absolute bottom-4 right-4 text-emerald-600 opacity-50 group-hover:opacity-100 transition-opacity hover:scale-110 transform"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        </button>
                                    </div>

                                    {/* AI Mind Map Section */}
                                    <div className="mt-8">
                                        {!mindMapData && !loadingMindMap && (
                                            <button 
                                                onClick={async () => {
                                                    if (!searchResult) return;
                                                    setLoadingMindMap(true);
                                                    const data = await generateMindMapData(searchResult.term);
                                                    if (data) setMindMapData(data);
                                                    setLoadingMindMap(false);
                                                }}
                                                className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors group"
                                            >
                                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                AI 字根延伸心智圖
                                            </button>
                                        )}

                                        {loadingMindMap && (
                                            <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                正在生成心智圖...
                                            </div>
                                        )}

                                        {mindMapData && (
                                            <div className="relative bg-slate-50 rounded-2xl p-8 mt-4 border border-slate-100 overflow-hidden">
                                                {/* Background Dashed Lines */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-[80%] h-0 border-t-2 border-dashed border-slate-300"></div>
                                                    <div className="absolute h-[80%] w-0 border-l-2 border-dashed border-slate-300"></div>
                                                </div>

                                                {/* Mind Map Grid */}
                                                <div className="relative z-10 grid grid-cols-3 gap-8 place-items-center">
                                                    {/* Top Node (Related 0) */}
                                                    <div className="col-start-2">
                                                        {mindMapData.related[0] && (
                                                            <div className="relative group">
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center w-32 hover:scale-105 transition-transform cursor-pointer" onClick={() => handleSpeak(mindMapData.related[0].word)}>
                                                                    <div className="font-bold text-slate-800 mb-1">{mindMapData.related[0].word}</div>
                                                                    <div className="text-xs text-slate-500">{mindMapData.related[0].meaning}</div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const exists = allWords.some(w => w.term.toLowerCase() === mindMapData.related[0].word.toLowerCase());
                                                                        if (exists) {
                                                                            setSearchTerm(mindMapData.related[0].word);
                                                                        } else {
                                                                            setNewWord({
                                                                                term: mindMapData.related[0].word,
                                                                                meaning: mindMapData.related[0].meaning,
                                                                                partOfSpeech: mindMapData.related[0].partOfSpeech || '',
                                                                                category: searchResult?.category || '自建',
                                                                                level: '1200'
                                                                            });
                                                                            setViewMode('FORM');
                                                                        }
                                                                    }}
                                                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors z-20
                                                                        ${allWords.some(w => w.term.toLowerCase() === mindMapData.related[0].word.toLowerCase())
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                        }`}
                                                                    title={allWords.some(w => w.term.toLowerCase() === mindMapData.related[0].word.toLowerCase()) ? "查看單字" : "新增單字"}
                                                                >
                                                                    {allWords.some(w => w.term.toLowerCase() === mindMapData.related[0].word.toLowerCase()) ? (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Left Node (Related 1) */}
                                                    <div className="col-start-1 row-start-2">
                                                        {mindMapData.related[1] && (
                                                            <div className="relative group">
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center w-32 hover:scale-105 transition-transform cursor-pointer" onClick={() => handleSpeak(mindMapData.related[1].word)}>
                                                                    <div className="font-bold text-slate-800 mb-1">{mindMapData.related[1].word}</div>
                                                                    <div className="text-xs text-slate-500">{mindMapData.related[1].meaning}</div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const exists = allWords.some(w => w.term.toLowerCase() === mindMapData.related[1].word.toLowerCase());
                                                                        if (exists) {
                                                                            setSearchTerm(mindMapData.related[1].word);
                                                                        } else {
                                                                            setNewWord({
                                                                                term: mindMapData.related[1].word,
                                                                                meaning: mindMapData.related[1].meaning,
                                                                                partOfSpeech: mindMapData.related[1].partOfSpeech || '',
                                                                                category: searchResult?.category || '自建',
                                                                                level: '1200'
                                                                            });
                                                                            setViewMode('FORM');
                                                                        }
                                                                    }}
                                                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors z-20
                                                                        ${allWords.some(w => w.term.toLowerCase() === mindMapData.related[1].word.toLowerCase())
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                        }`}
                                                                    title={allWords.some(w => w.term.toLowerCase() === mindMapData.related[1].word.toLowerCase()) ? "查看單字" : "新增單字"}
                                                                >
                                                                    {allWords.some(w => w.term.toLowerCase() === mindMapData.related[1].word.toLowerCase()) ? (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Center Node */}
                                                    <div className="col-start-2 row-start-2">
                                                        <div className="w-24 h-24 bg-blue-600 rounded-full flex flex-col items-center justify-center text-white shadow-lg shadow-blue-200 z-20 relative animate-bounce-slow">
                                                            <div className="font-black text-lg">{mindMapData.center.word}</div>
                                                            <div className="text-xs opacity-80">{mindMapData.center.partOfSpeech}</div>
                                                        </div>
                                                    </div>

                                                    {/* Right Node (Related 2) */}
                                                    <div className="col-start-3 row-start-2">
                                                        {mindMapData.related[2] && (
                                                            <div className="relative group">
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center w-32 hover:scale-105 transition-transform cursor-pointer" onClick={() => handleSpeak(mindMapData.related[2].word)}>
                                                                    <div className="font-bold text-slate-800 mb-1">{mindMapData.related[2].word}</div>
                                                                    <div className="text-xs text-slate-500">{mindMapData.related[2].meaning}</div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const exists = allWords.some(w => w.term.toLowerCase() === mindMapData.related[2].word.toLowerCase());
                                                                        if (exists) {
                                                                            setSearchTerm(mindMapData.related[2].word);
                                                                        } else {
                                                                            setNewWord({
                                                                                term: mindMapData.related[2].word,
                                                                                meaning: mindMapData.related[2].meaning,
                                                                                partOfSpeech: mindMapData.related[2].partOfSpeech || '',
                                                                                category: searchResult?.category || '自建',
                                                                                level: '1200'
                                                                            });
                                                                            setViewMode('FORM');
                                                                        }
                                                                    }}
                                                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors z-20
                                                                        ${allWords.some(w => w.term.toLowerCase() === mindMapData.related[2].word.toLowerCase())
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                        }`}
                                                                    title={allWords.some(w => w.term.toLowerCase() === mindMapData.related[2].word.toLowerCase()) ? "查看單字" : "新增單字"}
                                                                >
                                                                    {allWords.some(w => w.term.toLowerCase() === mindMapData.related[2].word.toLowerCase()) ? (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Node (Related 3) */}
                                                    <div className="col-start-2 row-start-3">
                                                        {mindMapData.related[3] && (
                                                            <div className="relative group">
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center w-32 hover:scale-105 transition-transform cursor-pointer" onClick={() => handleSpeak(mindMapData.related[3].word)}>
                                                                    <div className="font-bold text-slate-800 mb-1">{mindMapData.related[3].word}</div>
                                                                    <div className="text-xs text-slate-500">{mindMapData.related[3].meaning}</div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const exists = allWords.some(w => w.term.toLowerCase() === mindMapData.related[3].word.toLowerCase());
                                                                        if (exists) {
                                                                            setSearchTerm(mindMapData.related[3].word);
                                                                        } else {
                                                                            setNewWord({
                                                                                term: mindMapData.related[3].word,
                                                                                meaning: mindMapData.related[3].meaning,
                                                                                partOfSpeech: mindMapData.related[3].partOfSpeech || '',
                                                                                category: searchResult?.category || '自建',
                                                                                level: '1200'
                                                                            });
                                                                            setViewMode('FORM');
                                                                        }
                                                                    }}
                                                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors z-20
                                                                        ${allWords.some(w => w.term.toLowerCase() === mindMapData.related[3].word.toLowerCase())
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                        }`}
                                                                    title={allWords.some(w => w.term.toLowerCase() === mindMapData.related[3].word.toLowerCase()) ? "查看單字" : "新增單字"}
                                                                >
                                                                    {allWords.some(w => w.term.toLowerCase() === mindMapData.related[3].word.toLowerCase()) ? (
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <p className="text-slate-500 font-bold mb-6 text-lg">資料庫中找不到「{searchTerm}」</p>
                                <button 
                                    onClick={() => {
                                        setNewWord({
                                            ...newWord,
                                            term: searchTerm,
                                            category: '自建'
                                        });
                                        setViewMode('FORM');
                                    }}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    新增「{searchTerm}」到單字庫
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- RENDER: FORM MODE ---
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn p-4">
        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {isEditMode ? '編輯單字' : (duplicateWord ? '更新/喚醒單字' : '新增單字 (AI 輔助)')}
            </h3>
            
            <div className="space-y-3">
               
               {/* English Word Input + AI Button */}
               <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">英文單字 *</label>
                   <div className="flex gap-2">
                       <input 
                            type="text" 
                            value={newWord.term} 
                            onChange={e => setNewWord({...newWord, term: e.target.value})} 
                            className={`flex-1 p-2 border rounded focus:ring-2 outline-none font-bold text-lg 
                                ${duplicateWord 
                                    ? 'border-red-300 ring-2 ring-red-200 bg-red-50 text-red-900' 
                                    : 'border-slate-300 focus:ring-purple-500 bg-white text-slate-900'
                                }`} 
                            placeholder="例如: serendipity" 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAiAutoFill();
                            }}
                       />
                       <button 
                            onClick={handleAiAutoFill}
                            disabled={isGenerating || !newWord.term}
                            className={`px-3 py-2 rounded font-bold text-sm flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap
                                ${isGenerating 
                                    ? 'bg-slate-100 text-slate-400 cursor-wait' 
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90'
                                }
                            `}
                       >
                            {isGenerating ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    AI 自動填寫
                                </>
                            )}
                       </button>
                   </div>

                   {/* DUPLICATE WARNING */}
                   {duplicateWord && (
                       <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 animate-fadeIn">
                           <div className="flex flex-col gap-2">
                               <div className="flex items-start gap-2 text-red-800">
                                   <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                   <div>
                                       <p className="font-bold text-sm">這個字已經在裡面囉！</p>
                                       <p className="text-xs mt-1">
                                           <span className="font-bold">{duplicateWord.term}</span> {duplicateWord.partOfSpeech} {duplicateWord.meaning}
                                       </p>
                                   </div>
                               </div>
                               
                               <div className="flex gap-2 mt-1">
                                   <button 
                                       onClick={handleMarkAsMistakeAndClose}
                                       className="flex-1 bg-white border border-red-300 text-red-700 px-3 py-2 rounded-lg font-bold hover:bg-red-50 shadow-sm flex items-center justify-center gap-1"
                                   >
                                       ⚠️ 標記易錯 (次數 {(mistakeCounts[duplicateWord.id] || 0)} ➔ {(mistakeCounts[duplicateWord.id] || 0) + 1})
                                   </button>
                                   <button 
                                       onClick={loadExistingWordData}
                                       className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-700 shadow-sm flex items-center gap-1 text-sm"
                                       title="載入舊資料並編輯"
                                   >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                       編輯
                                   </button>
                               </div>
                           </div>
                       </div>
                   )}
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="relative">
                   <label className="block text-xs font-bold text-slate-500 mb-1">中文意思 *</label>
                   <div className="relative">
                       <input 
                           type="text" 
                           value={newWord.meaning} 
                           onChange={e => setNewWord({...newWord, meaning: e.target.value})} 
                           className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 ${isGenerating ? 'bg-purple-50' : 'bg-white border-slate-300'}`}
                           placeholder="AI 自動生成..." 
                       />
                       {isGenerating && <GeneratingOverlay />}
                   </div>
                 </div>
                 <div className="relative">
                   <label className="block text-xs font-bold text-slate-500 mb-1">詞性</label>
                   <div className="relative">
                       <input 
                           type="text" 
                           value={newWord.partOfSpeech} 
                           onChange={e => setNewWord({...newWord, partOfSpeech: e.target.value})} 
                           className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 ${isGenerating ? 'bg-purple-50' : 'bg-white border-slate-300'}`} 
                           placeholder="(n.)" 
                       />
                       {isGenerating && <GeneratingOverlay />}
                   </div>
                 </div>
               </div>

               <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 mb-1">音標</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={newWord.phonetic} 
                            onChange={e => setNewWord({...newWord, phonetic: e.target.value})} 
                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none font-mono text-slate-900 ${isGenerating ? 'bg-purple-50' : 'bg-white border-slate-300'}`} 
                            placeholder="/.../" 
                        />
                        {isGenerating && <GeneratingOverlay />}
                    </div>
               </div>

               <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">分類 (Category)</label>
                   <div className="flex gap-2">
                        <select 
                            value={newWord.category} 
                            onChange={e => setNewWord({...newWord, category: e.target.value})} 
                            className="w-1/3 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-900"
                        >
                            <option value="自建">自建</option>
                            {categories.filter(c => c !== 'All' && c !== '自建').map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="綜合">綜合</option>
                        </select>
                        <input 
                            type="text" 
                            value={newWord.category} 
                            onChange={e => setNewWord({...newWord, category: e.target.value})} 
                            className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white text-slate-900" 
                            placeholder="或手動輸入新分類..." 
                        />
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                       <label className="block text-xs font-bold text-slate-500 mb-1">例句 (英文)</label>
                       <div className="relative">
                           <textarea 
                               value={newWord.example} 
                               onChange={e => setNewWord({...newWord, example: e.target.value})} 
                               className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm h-16 text-slate-900 ${isGenerating ? 'bg-purple-50' : 'bg-white border-slate-300'}`} 
                               placeholder="AI 自動生成..." 
                           />
                           {isGenerating && <GeneratingOverlay />}
                       </div>
                   </div>
                   
                   <div className="bg-red-50 rounded border border-red-100 p-2 flex flex-col justify-center">
                       <label className="block text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           易錯次數 (手動調整)
                       </label>
                       <div className="flex items-center justify-center gap-4 bg-white rounded-lg p-1 border border-red-100 shadow-sm">
                           <button 
                               onClick={() => setLocalMistakeCount(c => Math.max(0, c - 1))}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                           >
                               -
                           </button>
                           <span className={`font-bold text-xl w-8 text-center ${localMistakeCount > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                               {localMistakeCount}
                           </span>
                           <button 
                               onClick={() => setLocalMistakeCount(c => c + 1)}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 font-bold transition-colors"
                           >
                               +
                           </button>
                       </div>
                   </div>
               </div>

               <div className="relative">
                   <label className="block text-xs font-bold text-slate-500 mb-1">例句 (中文)</label>
                   <div className="relative">
                       <input 
                           type="text" 
                           value={newWord.exampleTranslation} 
                           onChange={e => setNewWord({...newWord, exampleTranslation: e.target.value})} 
                           className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-900 ${isGenerating ? 'bg-purple-50' : 'bg-white border-slate-300'}`} 
                           placeholder="AI 自動生成..." 
                       />
                       {isGenerating && <GeneratingOverlay />}
                   </div>
               </div>

               <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                     <input 
                       type="checkbox" 
                       checked={markUnfamiliar}
                       onChange={e => setMarkUnfamiliar(e.target.checked)}
                       className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300 bg-white" 
                     />
                     <span className="text-sm font-bold text-slate-700">加入後立即標記為「不熟」(加入複習)</span>
                  </label>
               </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
               {!initialData && (
                   <button 
                       onClick={() => setViewMode('SEARCH')} 
                       className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1"
                   >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                       重查
                   </button>
               )}
               <button 
                   onClick={() => {
                       if (initialData) {
                           onClose();
                       } else if (searchTerm) {
                           setViewMode('SEARCH');
                       } else {
                           onClose();
                       }
                   }} 
                   className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
               >
                   取消
               </button>
               <button 
                  onClick={handleAddOrUpdateWord} 
                  disabled={isAddingWord || isGenerating} 
                  className={`px-6 py-2 text-white rounded-lg font-bold shadow-lg flex items-center gap-2
                    ${isAddingWord || isGenerating 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : duplicateWord && !isEditMode 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-slate-800 hover:bg-slate-700' 
                    }
                  `}
                >
                 {isAddingWord 
                    ? "處理中..." 
                    : (isEditMode)
                        ? "確認更新" 
                        : (duplicateWord ? "確認更新/喚醒" : "確認新增")
                 }
               </button>
            </div>
        </div>
    </div>
  );
};

export default AddWordModal;
