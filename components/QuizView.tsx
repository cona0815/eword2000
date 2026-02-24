
import React, { useState, useMemo } from 'react';
import { Word, QuizQuestion } from '../types';

interface QuizViewProps {
  allWords: Word[];
  questionsMap: Record<string, QuizQuestion[]>; // Map wordId -> Questions[]
  markedUnfamiliar: string[];
  mistakeCounts: Record<string, number>;
  mistakeQuestions: QuizQuestion[];
  categories: string[];
  itemsPerPage: number;
  onUpdateMistakeCount: (id: string) => void;
  onAddMistakeQuestion: (q: QuizQuestion) => void;
  onToggleUnfamiliar: (id: string) => void; // New Prop
  customWordList?: Word[]; // New: For Daily Missions
  autoStart?: boolean; // New: Skip setup
  onQuizComplete?: (results: {wordId: string, isCorrect: boolean}[]) => void; // New: For submitting results
}

type QuizMode = 'RANDOM' | 'WEAKNESS' | 'PROGRESS' | 'CUSTOM';

const QuizView: React.FC<QuizViewProps> = ({
  allWords,
  questionsMap,
  markedUnfamiliar,
  mistakeCounts,
  mistakeQuestions,
  categories,
  itemsPerPage,
  onUpdateMistakeCount,
  onAddMistakeQuestion,
  onToggleUnfamiliar,
  customWordList,
  autoStart,
  onQuizComplete
}) => {
  // UI State
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING' | 'RESULT'>('SETUP');
  const [activeTab, setActiveTab] = useState<QuizMode>(customWordList ? 'CUSTOM' : 'RANDOM');
  
  // Setup State
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'All');
  const [selectedPage, setSelectedPage] = useState(1);
  
  // Weakness Config
  const [includeUnfamiliar, setIncludeUnfamiliar] = useState(true);
  const [includeHighMistake, setIncludeHighMistake] = useState(true);
  const [includeHistoryMistake, setIncludeHistoryMistake] = useState(false);

  // Gameplay State
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // index -> optionIdx
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  // --- Helper: Get Pages for Category ---
  const totalPagesForCategory = useMemo(() => {
      const count = selectedCategory === 'All' 
        ? allWords.length 
        : allWords.filter(w => w.category === selectedCategory).length;
      return Math.ceil(count / itemsPerPage);
  }, [selectedCategory, allWords, itemsPerPage]);

  // --- Logic: Generate Quiz ---
  const handleStartQuiz = () => {
      let candidateWords: Word[] = [];
      let extraQuestions: QuizQuestion[] = []; // For history mistakes which are specific questions

      if (activeTab === 'CUSTOM' && customWordList) {
          candidateWords = [...customWordList];
      }
      else if (activeTab === 'RANDOM') {
          candidateWords = [...allWords];
      } 
      else if (activeTab === 'PROGRESS') {
          const filtered = selectedCategory === 'All' 
            ? allWords 
            : allWords.filter(w => w.category === selectedCategory);
          
          const start = (selectedPage - 1) * itemsPerPage;
          candidateWords = filtered.slice(start, start + itemsPerPage);
      } 
      else if (activeTab === 'WEAKNESS') {
          const uniqueIds = new Set<string>();
          
          if (includeUnfamiliar) {
              markedUnfamiliar.forEach(id => uniqueIds.add(id));
          }
          if (includeHighMistake) {
              Object.keys(mistakeCounts).forEach(id => {
                  if (mistakeCounts[id] > 0) uniqueIds.add(id);
              });
          }
          
          candidateWords = allWords.filter(w => uniqueIds.has(w.id));

          if (includeHistoryMistake) {
              // History mistakes are specific questions, add them directly
              // Filter out grammar mistakes (they belong to GrammarView)
              extraQuestions = mistakeQuestions.filter(q => !(q.grammarTag || q.wordId.startsWith('u') || q.wordId.startsWith('key20')));
          }
      }

      // --- Build Question Pool ---
      let pool: QuizQuestion[] = [];

      // 1. Convert candidate words to questions from DB
      candidateWords.forEach(w => {
          const dbQuestions = questionsMap[w.id];
          if (dbQuestions && dbQuestions.length > 0) {
              // Randomly pick one question for this word to avoid repetition in a single quiz
              const q = dbQuestions[Math.floor(Math.random() * dbQuestions.length)];
              pool.push({
                  ...q,
                  wordId: w.id, // Ensure wordId is present
                  wordTerm: w.term // Ensure term is present
              });
          }
      });

      // 2. Add extra specific questions (history mistakes)
      pool = [...pool, ...extraQuestions];

      // 3. Filter duplicates (by question text)
      const uniquePool = pool.filter((q, index, self) => 
          index === self.findIndex((t) => t.question === q.question)
      );

      if (uniquePool.length === 0) {
          alert("所選範圍內沒有題目 (或是題庫尚未下載)！請先去設定頁執行「AI 自動補全題庫」。");
          return;
      }

      // 4. Shuffle
      const shuffled = uniquePool.sort(() => 0.5 - Math.random());

      // 5. Slice
      // If Custom mode (Mission), use all words provided (don't slice unless count is set, but usually mission has fixed count)
      // If autoStart is true, we assume the passed list is the exact list we want.
      let finalQuestions = shuffled;
      if (!autoStart && activeTab !== 'CUSTOM') {
          finalQuestions = shuffled.slice(0, questionCount);
      }

      setActiveQuestions(finalQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setScore(0);
      setShowExplanation(false);
      setPhase('PLAYING');
  };

  // Auto-start effect
  React.useEffect(() => {
      if (autoStart && customWordList && phase === 'SETUP') {
          handleStartQuiz();
      }
  }, [autoStart, customWordList]);

  const handleAnswer = (optionIdx: number) => {
      if (showExplanation) return;

      const currentQ = activeQuestions[currentIndex];
      const isCorrect = optionIdx === currentQ.correctAnswerIndex;
      
      setAnswers(prev => ({...prev, [currentIndex]: optionIdx}));
      if (isCorrect) setScore(prev => prev + 1);
      
      // Auto-save mistake if wrong
      if (!isCorrect) {
          onAddMistakeQuestion(currentQ); // Save precise question to history
          onUpdateMistakeCount(currentQ.wordId); // Increment simple counter
      }

      setShowExplanation(true);
  };

  const handleNext = () => {
      if (currentIndex < activeQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowExplanation(false);
      } else {
          setPhase('RESULT');
          // Submit results if callback provided
          if (onQuizComplete) {
              const results = activeQuestions.map((q, idx) => ({
                  wordId: q.wordId,
                  isCorrect: answers[idx] === q.correctAnswerIndex
              }));
              onQuizComplete(results);
          }
      }
  };

  // --- Render Components ---

  if (phase === 'SETUP') {
      return (
          <div className="max-w-4xl mx-auto p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white">
                      <h2 className="text-3xl font-black mb-2">測驗設定</h2>
                      <p className="opacity-90">請選擇出題範圍與模式，題庫來源為試算表資料。</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-200">
                      <button 
                        onClick={() => setActiveTab('RANDOM')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'RANDOM' ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          🎲 隨機挑戰
                      </button>
                      <button 
                        onClick={() => setActiveTab('WEAKNESS')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'WEAKNESS' ? 'text-red-600 border-b-4 border-red-600 bg-red-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          🎯 弱點擊破
                      </button>
                      <button 
                        onClick={() => setActiveTab('PROGRESS')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'PROGRESS' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          📚 進度複習
                      </button>
                  </div>

                  <div className="p-8 space-y-8 min-h-[300px]">
                      {/* Count Selector */}
                      <div>
                          <label className="block text-slate-700 font-bold mb-2">題目數量: <span className="text-blue-600 text-xl">{questionCount}</span></label>
                          <input 
                            type="range" 
                            min="5" max="100" step="5" 
                            value={questionCount} 
                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                              <span>5</span>
                              <span>50</span>
                              <span>100</span>
                          </div>
                      </div>

                      {/* Dynamic Content based on Tab */}
                      {activeTab === 'WEAKNESS' && (
                          <div className="space-y-4 bg-red-50 p-6 rounded-xl border border-red-100">
                              <h3 className="font-bold text-red-800 mb-2">選擇弱點來源</h3>
                              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:shadow-sm transition-all">
                                  <input type="checkbox" checked={includeUnfamiliar} onChange={e => setIncludeUnfamiliar(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                                  <div>
                                      <div className="font-bold text-slate-800">不熟單字 (星星)</div>
                                      <div className="text-xs text-slate-500">目前共 {markedUnfamiliar.length} 字</div>
                                  </div>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:shadow-sm transition-all">
                                  <input type="checkbox" checked={includeHighMistake} onChange={e => setIncludeHighMistake(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                                  <div>
                                      <div className="font-bold text-slate-800">易錯單字 (手動標記)</div>
                                      <div className="text-xs text-slate-500">次數大於 0 的單字</div>
                                  </div>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:shadow-sm transition-all">
                                  <input type="checkbox" checked={includeHistoryMistake} onChange={e => setIncludeHistoryMistake(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                                  <div>
                                      <div className="font-bold text-slate-800">曾經錯過的題目 (錯題本)</div>
                                      <div className="text-xs text-slate-500">包含文法與單字錯題 ({mistakeQuestions.length} 題)</div>
                                  </div>
                              </label>
                          </div>
                      )}

                      {activeTab === 'PROGRESS' && (
                          <div className="space-y-4 bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                              <h3 className="font-bold text-emerald-800 mb-2">選擇進度範圍</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-emerald-700 mb-1">分類 (Category)</label>
                                      <select 
                                        value={selectedCategory}
                                        onChange={(e) => { setSelectedCategory(e.target.value); setSelectedPage(1); }}
                                        className="w-full p-3 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 font-bold"
                                      >
                                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-emerald-700 mb-1">頁數 (Page)</label>
                                      <select 
                                        value={selectedPage}
                                        onChange={(e) => setSelectedPage(parseInt(e.target.value))}
                                        className="w-full p-3 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 font-bold"
                                      >
                                          {Array.from({length: totalPagesForCategory}).map((_, i) => (
                                              <option key={i+1} value={i+1}>第 {i+1} 頁</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                              <p className="text-xs text-emerald-600 mt-2">* 該頁面約有 {itemsPerPage} 個單字，系統會嘗試找出對應題目。</p>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-center">
                      <button 
                        onClick={handleStartQuiz}
                        className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                          開始測驗
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'PLAYING') {
      const question = activeQuestions[currentIndex];
      const isCurrentUnfamiliar = markedUnfamiliar.includes(question.wordId);
      const isAnswered = answers[currentIndex] !== undefined;
      const isCorrect = isAnswered && answers[currentIndex] === question.correctAnswerIndex;

      return (
          <div className="max-w-2xl mx-auto p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                  {/* Header */}
                  <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-bold">單字測驗</h2>
                          <div className="text-sm opacity-70">來源: {question.source || '資料庫'}</div>
                      </div>
                      <div className="flex gap-4 items-center">
                          <div className="text-sm font-bold bg-slate-700 px-3 py-1 rounded-full">Score: {score}</div>
                          {/* Unfamiliar Toggle in Header */}
                          <button
                            onClick={() => onToggleUnfamiliar(question.wordId)}
                            className={`p-2 rounded-full transition-all ${isCurrentUnfamiliar ? 'text-yellow-400 bg-white/10' : 'text-slate-500 hover:text-yellow-400'}`}
                            title={isCurrentUnfamiliar ? "已標記不熟" : "標記為不熟"}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isCurrentUnfamiliar ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isCurrentUnfamiliar ? "0" : "2"} className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                             </svg>
                          </button>
                          <div className="text-2xl font-black text-blue-400">{currentIndex + 1}<span className="text-sm text-slate-400 font-normal"> / {activeQuestions.length}</span></div>
                      </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                          {question.question}
                      </h3>

                      <div className="space-y-4 flex-1">
                          {question.options.map((opt, idx) => {
                              let btnClass = "border-slate-200 hover:bg-slate-50 text-slate-700"; // Default
                              
                              if (showExplanation) {
                                  if (idx === question.correctAnswerIndex) {
                                      btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
                                  } else if (idx === answers[currentIndex]) {
                                      btnClass = "bg-red-100 border-red-500 text-red-800";
                                  } else {
                                      btnClass = "border-slate-100 text-slate-300 opacity-50";
                                  }
                              }

                              return (
                                  <button
                                      key={idx}
                                      onClick={() => handleAnswer(idx)}
                                      disabled={showExplanation}
                                      className={`w-full text-left p-5 rounded-xl border-2 transition-all text-lg ${btnClass}`}
                                  >
                                      <span className="inline-block w-8 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                      {opt}
                                  </button>
                              );
                          })}
                      </div>

                      {/* Explanation & Sync Feedback */}
                      {showExplanation && (
                          <div className="mt-8 animate-fadeIn">
                              <div className={`p-5 rounded-xl border mb-6 ${isCorrect ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
                                  {!isCorrect && (
                                      <div className="flex items-center gap-2 mb-3 text-red-600 font-bold bg-white/50 p-2 rounded w-fit">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                          已記錄至易錯區 (同步雲端中)
                                      </div>
                                  )}
                                  <div className="font-bold mb-2 flex items-center gap-2">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      解析
                                  </div>
                                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {question.explanation || "暫無解析"}
                                  </div>
                              </div>
                              <button 
                                onClick={handleNext}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg"
                              >
                                  {currentIndex < activeQuestions.length - 1 ? '下一題' : '查看結果'}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'RESULT') {
      const percentage = Math.round((score / activeQuestions.length) * 100);
      return (
          <div className="max-w-2xl mx-auto p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-10">
                  <div className="mb-6">
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto text-4xl font-black border-8 ${percentage >= 60 ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>
                          {score} / {activeQuestions.length}
                      </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                      {percentage === 100 ? "太完美了！🎉" : percentage >= 60 ? "做得好！👍" : "再接再厲！💪"}
                  </h2>
                  <p className="text-slate-500 mb-8">
                      本次測驗得分率: {percentage}%
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <button 
                        onClick={() => setPhase('SETUP')}
                        className="py-3 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-xl font-bold transition-all"
                      >
                          調整設定
                      </button>
                      <button 
                        onClick={() => handleStartQuiz()} 
                        className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all"
                      >
                          再測一次
                      </button>
                  </div>

                  {/* Wrong Answers Review List */}
                  {score < activeQuestions.length && (
                      <div className="text-left border-t border-slate-100 pt-6">
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              錯題回顧
                          </h3>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                              {activeQuestions.map((q, idx) => {
                                  const userAns = answers[idx];
                                  if (userAns === q.correctAnswerIndex) return null;
                                  const isUnfamiliar = markedUnfamiliar.includes(q.wordId);

                                  return (
                                      <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm">
                                          <div className="flex justify-between items-start mb-2">
                                              <p className="font-bold text-slate-800 pr-2">{q.question}</p>
                                              
                                              {/* Star Button in Result List */}
                                              <div className="flex items-center gap-2 shrink-0">
                                                  {q.wordTerm && <span className="text-xs font-bold text-slate-500">{q.wordTerm}</span>}
                                                  <button
                                                    onClick={() => onToggleUnfamiliar(q.wordId)}
                                                    className={`p-1.5 rounded-full transition-all ${isUnfamiliar ? 'text-yellow-500 bg-white border border-yellow-200' : 'text-slate-400 bg-white border border-slate-200 hover:text-yellow-400'}`}
                                                    title={isUnfamiliar ? "已標記不熟" : "加入不熟清單"}
                                                  >
                                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isUnfamiliar ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isUnfamiliar ? "0" : "2"} className="w-4 h-4">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                      </svg>
                                                  </button>
                                              </div>
                                          </div>
                                          <div className="flex flex-col gap-1 text-slate-600">
                                              <p className="text-green-700 font-bold">✓ {q.options[q.correctAnswerIndex]}</p>
                                              <p className="text-red-500 line-through">✗ {q.options[userAns]}</p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return null;
};

export default QuizView;
