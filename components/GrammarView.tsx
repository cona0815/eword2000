
import React, { useState, useEffect } from 'react';
import { QuizQuestion, GrammarMapData, MollyGrammarUnit } from '../types';
import { fetchGrammarMap, fetchGrammarQuestions, saveGrammarResult, fetchRemoteQuestions } from '../services/gasService';
import { MOLLY_GRAMMAR_UNITS, GRAMMAR_QUIZ_QUESTIONS_PER_ROUND } from '../constants';

interface GrammarViewProps {
  mistakeQuestions: QuizQuestion[];
  onUpdateMistakes: (updater: (prev: QuizQuestion[]) => QuizQuestion[]) => void;
  questionsMap?: Record<string, QuizQuestion[]>;
}

const GrammarView: React.FC<GrammarViewProps> = ({ mistakeQuestions, onUpdateMistakes }) => {
  const [viewState, setViewState] = useState<'MAP' | 'LEARN' | 'QUIZ' | 'RESULT' | 'MISTAKES'>('MAP');
  const [grammarMap, setGrammarMap] = useState<GrammarMapData>({});
  const [remoteCounts, setRemoteCounts] = useState<Record<string, number>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMistakeReview, setIsMistakeReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MollyGrammarUnit | null>(null);
  const [unitQuestions, setUnitQuestions] = useState<QuizQuestion[]>([]);
  
  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // index -> optionIdx
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const username = localStorage.getItem('juniorVocabUser');

  const loadMap = async () => {
    if (!username) return;
    setLoading(true);
    const map = await fetchGrammarMap(username);
    if (map) setGrammarMap(map);
    setLoading(false);
  };

  const loadRemoteCounts = async () => {
    setIsSyncing(true);
    const counts: Record<string, number> = {};
    console.log("Starting robust cloud questions sync...");
    
    try {
      // 1. Fetch ALL questions
      const allQsMap = await fetchRemoteQuestions();
      const allQs = allQsMap ? (Object.values(allQsMap).flat() as any[]) : [];
      
      console.log(`Total cloud questions fetched: ${allQs.length}`);
      if (allQs.length > 0) {
        console.log("Sample cloud IDs:", allQs.slice(0, 5).map(q => q.wordId));
      }

      for (const unit of MOLLY_GRAMMAR_UNITS) {
        const unitIdNum = unit.id.replace("unit", ""); // "unit1" -> "1"
        
        const unitQs = allQs.filter(q => {
          const qId = (q.wordId || "").toString().toLowerCase();
          const qUnit = (
            q.unit || 
            q.category || 
            q.Unit || 
            q.Category || 
            q.QuestionsJSON || 
            ""
          ).toString().trim();
          
          // Match by Title (Exact)
          if (qUnit.toLowerCase() === unit.title.trim().toLowerCase()) return true;
          
          // Match by ID Prefix (e.g., "u1_" matches "Unit 1")
          if (qId.startsWith(`u${unitIdNum}_`) || qId.startsWith(`unit${unitIdNum}_`)) return true;
          
          return false;
        });
        
        counts[unit.id] = unitQs.length;
        if (unitQs.length > 0) {
          console.log(`✅ Matched ${unitQs.length} questions for ${unit.title}`);
        }
      }
      
      // 2. Fallback: Try unit-specific fetch for units still at 0
      for (const unit of MOLLY_GRAMMAR_UNITS) {
        if (!counts[unit.id] || counts[unit.id] === 0) {
          const qs = await fetchGrammarQuestions(unit.title);
          if (qs && qs.length > 0) {
            counts[unit.id] = qs.length;
            console.log(`📡 Unit-specific fetch found ${qs.length} for ${unit.title}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync cloud counts", e);
    }
    
    setRemoteCounts(counts);
    setIsSyncing(false);
  };

  useEffect(() => {
    if (username) {
      loadMap();
      loadRemoteCounts();
    }
  }, [username]);

  const handleUnitClick = async (unit: MollyGrammarUnit) => {
      setSelectedUnit(unit);
      setViewState('LEARN');
      setLoading(true);
      
      let finalQuestions: QuizQuestion[] = [];
      try {
        const qs = await fetchGrammarQuestions(unit.title);
        if (qs && qs.length > 0) {
          finalQuestions = qs;
        } else {
          const allQsMap = await fetchRemoteQuestions();
          if (allQsMap) {
            const allQs = Object.values(allQsMap).flat().filter(Boolean) as any[];
            const unitIdNum = unit.id.replace("unit", "");
            finalQuestions = allQs.filter(q => {
              if (!q) return false;
              const qId = (q.wordId || "").toString().toLowerCase();
              const qUnit = (q.unit || q.category || q.Unit || q.Category || q.QuestionsJSON || "").toString().trim();
              return qUnit.toLowerCase() === unit.title.trim().toLowerCase() || qId.startsWith(`u${unitIdNum}_`) || qId.startsWith(`unit${unitIdNum}_`);
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch unit questions", e);
      }
      
      setUnitQuestions(finalQuestions.length > 0 ? finalQuestions : unit.questions);
      setLoading(false);
  };

  const getSmartCategory = (q: any, unitTitle: string): string[] => {
    const text = (q.question + " " + (q.explanation || "")).toLowerCase();
    const categories: string[] = [];
    
    // Unit 1: 時態 (Tenses)
    if (unitTitle.includes("時態")) {
      if (text.includes("will") || text.includes("going to") || text.includes("tomorrow") || text.includes("next") || text.includes("in the future")) categories.push("未來式");
      if ((text.includes("have") || text.includes("has")) && (text.includes("since") || text.includes("for") || text.includes("already") || text.includes("yet") || text.includes("so far") || text.includes("just ") || text.includes("ever"))) categories.push("現在完成式");
      if (text.includes("yesterday") || text.includes("ago") || text.includes("last ") || text.includes("did ") || (text.includes("was") && !text.includes("ing")) || (text.includes("were") && !text.includes("ing")) || text.includes("in 20") || text.includes("used to")) categories.push("過去簡單式");
      if (text.includes("ing") && (text.includes("am ") || text.includes("is ") || text.includes("are "))) categories.push("現在進行式");
      if (text.includes("ing") && (text.includes("was ") || text.includes("were "))) categories.push("過去進行式");
      if (text.includes("be ") && (text.includes("vpp") || text.includes("by ") || text.includes("brushed") || text.includes("taken to") || text.includes("asked"))) categories.push("被動語態");
      if (text.includes("had ") && text.includes("vpp")) categories.push("過去完成式");
      if (text.includes("every day") || text.includes("usually") || text.includes("often") || text.includes("always")) categories.push("現在簡單式");
    }
    
    // Unit 2: 代名詞 (Pronouns)
    if (unitTitle.includes("代名詞")) {
      if (text.includes("another") || text.includes("other") || text.includes("others")) categories.push("不定代名詞");
      if (text.includes("myself") || text.includes("yourself") || text.includes("himself") || text.includes("herself") || text.includes("themselves")) categories.push("反身代名詞");
      if (text.includes("mine") || text.includes("yours") || text.includes("his") || text.includes("hers") || text.includes("theirs")) categories.push("所有格代名詞");
      if (text.includes("each of") || text.includes("both of") || text.includes("some of") || text.includes("most of") || text.includes("all of") || text.includes("one of")) categories.push("數量代名詞");
      if (text.includes("this") || text.includes("that") || text.includes("these") || text.includes("those")) categories.push("指示代名詞");
    }

    // Unit 3: 常考句型 (Common Patterns)
    if (unitTitle.includes("句型")) {
      if (text.includes("playing ") || text.includes("getting up") || text.includes("eating ") || text.includes("using ")) categories.push("動名詞當主詞");
      if (text.includes("there is") || text.includes("there are") || text.includes("there was") || text.includes("there were")) categories.push("there be");
      if (text.includes("don't you") || text.includes("is it") || text.includes("did he") || text.includes("can't she")) categories.push("附加問句");
      if (text.includes("too") && text.includes(" to ")) categories.push("too...to");
      if (q.question.trim().match(/^[A-Z][a-z]+ /) && !text.includes(" i ") && !text.includes(" he ") && !text.includes(" she ")) categories.push("祈使句");
    }

    // Unit 4: 常考動詞 (Common Verbs)
    if (unitTitle.includes("動詞")) {
      if (text.includes("spend") || text.includes("cost") || text.includes("pay") || text.includes("take")) categories.push("花費動詞");
      if (text.includes("see") || text.includes("saw") || text.includes("watch") || text.includes("hear") || text.includes("heard") || text.includes("smell") || text.includes("feel") || text.includes("notice")) categories.push("感官動詞");
      if (text.includes("not to")) categories.push("不定詞否定");
      if (text.includes("enjoy") || text.includes("finish") || text.includes("keep") || text.includes("mind") || text.includes("practice") || text.includes("quit") || text.includes("feel like")) categories.push("動詞後接動名詞");
    }

    // Unit 5: 名詞子句 (Noun Clauses)
    if (unitTitle.includes("名詞子句")) {
      if (text.includes("what") || text.includes("where") || text.includes("how") || text.includes("why") || text.includes("who")) categories.push("wh-名詞子句");
      if (text.includes("if") || text.includes("whether")) categories.push("if/whether名詞子句");
      if (text.includes("that")) categories.push("that名詞子句");
    }

    // Unit 6 & 7: 連接詞 (Connectors)
    if (unitTitle.includes("連接詞") || unitTitle.includes("副詞子句")) {
      if (text.includes("although") || text.includes("though")) categories.push("從屬連接詞although");
      if (text.includes("because")) categories.push("從屬連接詞because");
      if (text.includes("but")) categories.push("對等連接詞but");
      if (text.includes(" or ")) categories.push("對等連接詞or");
      if (text.includes(" so ")) categories.push("對等連接詞so");
      if (text.includes("until")) categories.push("從屬連接詞until");
      if (text.includes("before") || text.includes("after")) categories.push("時間連接詞");
    }

    // Unit 10: 形容詞副詞的級 (Degrees)
    if (unitTitle.includes("級")) {
      if (text.includes("than") || text.includes("more") || text.includes("er ") || text.includes("as ") && text.includes(" as")) categories.push("形容詞比較級");
      if (text.includes("the most") || text.includes("est ") || text.includes("the best")) categories.push("形容詞最高級");
    }

    // Unit 11: 關係子句 (Relative Clauses)
    if (unitTitle.includes("關係子句")) {
      if (text.includes("who") || text.includes("which") || text.includes("that")) categories.push("關係代名詞");
      if (text.includes("where") || text.includes("when")) categories.push("關係副詞");
    }

    // Unit 12: 介系詞 (Prepositions)
    if (unitTitle.includes("介系詞")) {
      if (text.includes(" on ")) categories.push("時間介系詞on");
      if (text.includes(" in ") || text.includes(" at ")) categories.push("地方介系詞");
      if (text.includes("except")) categories.push("介系詞except");
    }
    
    // Add explicit tags if they exist in the cloud data
    const cloudTag = (q.tags || q.category || q.subCategory || "").toString();
    if (cloudTag) categories.push(cloudTag);
    
    return categories;
  };

  const startQuiz = async (subQuizId?: string) => {
    if (!username || !selectedUnit) return;
    setLoading(true);
    
    let finalQuestions: QuizQuestion[] = [];
    
    try {
      // Strategy: Use the already loaded unitQuestions if available, otherwise fetch
      let sourceQs = unitQuestions.length > 0 ? unitQuestions : [];
      
      if (sourceQs.length === 0) {
        const qs = await fetchGrammarQuestions(selectedUnit.title);
        if (qs && qs.length > 0) {
          sourceQs = qs;
        } else {
          const allQsMap = await fetchRemoteQuestions();
          if (allQsMap) {
            const allQs = Object.values(allQsMap).flat() as any[];
            const unitIdNum = selectedUnit.id.replace("unit", "");
            sourceQs = allQs.filter(q => {
              const qId = (q.wordId || "").toString().toLowerCase();
              const qUnit = (q.unit || q.category || q.Unit || q.Category || q.QuestionsJSON || "").toString().trim();
              return qUnit.toLowerCase() === selectedUnit.title.trim().toLowerCase() || qId.startsWith(`u${unitIdNum}_`) || qId.startsWith(`unit${unitIdNum}_`);
            });
          }
        }
      }

      if (subQuizId) {
        // Use smart matching for sub-quizzes
        finalQuestions = sourceQs.filter(q => {
          // 1. Direct ID match
          const subQuiz = selectedUnit.subQuizzes?.find(sq => sq.title === subQuizId);
          if (subQuiz && subQuiz.questionIds.includes(q.wordId)) return true;
          
          // 2. Text snippet match
          const textMatch = subQuiz?.questionIds.some(sqId => {
            const builtInQ = selectedUnit.questions.find(bq => bq.wordId === sqId);
            return builtInQ && q.question.includes(builtInQ.question.substring(0, 20));
          });
          if (textMatch) return true;
          
          // 3. Smart keyword/tag match
          const smartCats = getSmartCategory(q, selectedUnit.title);
          return smartCats.some(cat => cat.includes(subQuizId) || subQuizId.includes(cat));
        });
        
        if (finalQuestions.length === 0) {
          alert('找不到此子測驗的雲端題目，將使用內建題目。');
          finalQuestions = selectedUnit.questions.filter(q => 
            selectedUnit.subQuizzes?.find(sq => sq.title === subQuizId)?.questionIds.includes(q.wordId)
          );
        }
      } else {
        finalQuestions = sourceQs.length > 0 ? sourceQs : selectedUnit.questions;
        // Shuffle and take a subset
        finalQuestions = [...finalQuestions].sort(() => 0.5 - Math.random()).slice(0, GRAMMAR_QUIZ_QUESTIONS_PER_ROUND);
      }
    } catch (e) {
      console.error("Cloud fetch failed", e);
      finalQuestions = selectedUnit.questions;
    }

    if (finalQuestions && finalQuestions.length > 0) {
      setQuestions(finalQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setScore(0);
      setShowExplanation(false);
      setIsMistakeReview(false); // Reset review mode
      setViewState('QUIZ');
    } else {
      alert('此單元目前沒有題目。');
    }
    setLoading(false);
  };

  const startMistakeReview = () => {
    const grammarMistakes = mistakeQuestions.filter(q => q.grammarTag || q.wordId.startsWith('u') || q.wordId.startsWith('key20'));
    if (grammarMistakes.length === 0) return;

    setQuestions([...grammarMistakes].sort(() => 0.5 - Math.random()));
    setCurrentIndex(0);
    setAnswers({});
    setScore(0);
    setShowExplanation(false);
    setIsMistakeReview(true);
    setViewState('QUIZ');
  };

  const handleAnswer = (optionIdx: number) => {
    if (showExplanation) return;

    const currentQ = questions[currentIndex];
    const correct = optionIdx === currentQ.correctAnswerIndex;
    setIsCorrect(correct);
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIdx }));

    if (correct) {
      setScore(prev => prev + 1);
      
      // If in mistake review mode, remove the question from mistakes if answered correctly
      if (isMistakeReview) {
        onUpdateMistakes(prev => prev.filter(mq => mq.question !== currentQ.question));
      }

      setTimeout(() => {
          handleNext();
      }, 500);
    } else {
      setShowExplanation(true);
      
      // Tag the question with grammar theme before saving
      const taggedQ = { ...currentQ };
      if (!taggedQ.grammarTag && selectedUnit) {
        const smartCats = getSmartCategory(currentQ, selectedUnit.title);
        if (smartCats.length > 0) {
          taggedQ.grammarTag = smartCats[0];
        } else {
          taggedQ.grammarTag = selectedUnit.title;
        }
      }

      onUpdateMistakes(prev => {
          if (!prev.some(q => q.question === taggedQ.question)) {
              return [taggedQ, ...prev];
          }
          return prev;
      });
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!username || !selectedUnit) return;
    
    const percentage = Math.round((score / questions.length) * 100);
    let stars = 0;
    if (percentage === 100) stars = 3;
    else if (percentage >= 80) stars = 2;
    else if (percentage >= 60) stars = 1;

    setGrammarMap(prev => ({
        ...prev,
        [selectedUnit.id]: {
            highestScore: Math.max(prev[selectedUnit.id]?.highestScore || 0, score),
            stars: Math.max(prev[selectedUnit.id]?.stars || 0, stars)
        }
    }));

    setViewState('RESULT');
    await saveGrammarResult(username, selectedUnit.id, score, stars);
  };

  // --- Render Helpers ---

  const renderContent = (unit: MollyGrammarUnit) => {
      return (
          <div className="space-y-6">
              {unit.content.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${item.highlight ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-white border border-slate-100'}`}>
                      {item.title && <h4 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h4>}
                      
                      {item.type === 'text' && (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.data as string}</p>
                      )}

                      {item.type === 'table' && (
                          <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                  <tbody>
                                      {(item.data as string[][]).map((row, rIdx) => (
                                          <tr key={rIdx}>
                                              {row.map((cell, cIdx) => (
                                                  <td key={cIdx} className="border border-slate-200 p-2 text-slate-700 whitespace-pre-wrap">
                                                      {cell}
                                                  </td>
                                              ))}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}

                      {item.type === 'list' && (
                          <ul className="list-disc list-inside space-y-1">
                              {(item.data as string[]).map((li, lIdx) => (
                                  <li key={lIdx} className="text-slate-700">{li}</li>
                              ))}
                          </ul>
                      )}
                  </div>
              ))}
          </div>
      );
  };

  // --- Main Render ---

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-500 border-opacity-50"></div>
          </div>
      );
  }

  if (viewState === 'MAP') {
      const allUnlocked = MOLLY_GRAMMAR_UNITS.every(u => (grammarMap[u.id]?.stars || 0) > 0);
      const totalRemote = Object.values(remoteCounts).reduce((a, b) => (a as number) + (b as number), 0) as number;
      const grammarMistakes = mistakeQuestions.filter(q => q.grammarTag || q.wordId.startsWith('u') || q.wordId.startsWith('key20'));

      return (
          <div className="animate-fadeIn max-w-6xl mx-auto">
              <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-pink-600 mb-2">文法闖關地圖 🗺️</h2>
                  <p className="text-slate-500">挑戰各個單元，收集星星，解鎖最終大魔王！</p>
                  
                  <div className="mt-4 flex flex-wrap justify-center items-center gap-4">
                      <div className="inline-flex items-center gap-4 px-6 py-2 bg-slate-100 rounded-full text-sm border border-slate-200">
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`}></div>
                              <span className="font-bold text-slate-600">
                                  雲端同步狀態: {isSyncing ? '同步中...' : `已連線 (共 ${totalRemote} 題)`}
                              </span>
                          </div>
                          <button 
                            onClick={loadRemoteCounts}
                            disabled={isSyncing}
                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            重新整理
                          </button>
                      </div>

                      {grammarMistakes.length > 0 && (
                        <>
                          <button 
                              onClick={() => setViewState('MISTAKES')}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-200 hover:bg-red-100 transition-all shadow-sm"
                          >
                              <span className="text-lg">📕</span>
                              文法錯題集 ({grammarMistakes.length})
                          </button>
                          <button 
                              onClick={startMistakeReview}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-md transform hover:scale-105"
                          >
                              <span className="text-lg">🚀</span>
                              複習文法錯題
                          </button>
                        </>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {MOLLY_GRAMMAR_UNITS.map((unit, idx) => {
                      const data = grammarMap[unit.id] || { stars: 0, highestScore: 0 };
                      
                      return (
                          <button
                              key={unit.id}
                              onClick={() => handleUnitClick(unit)}
                              className={`relative p-6 rounded-2xl border-2 text-left transition-all transform hover:-translate-y-1 hover:shadow-lg
                                  ${data.stars === 3 ? 'bg-yellow-50 border-yellow-400' : 
                                    data.stars > 0 ? 'bg-pink-50 border-pink-300' : 
                                    'bg-white border-slate-200 hover:border-pink-300'}
                              `}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="font-bold text-lg text-slate-800">{unit.title}</div>
                                  <div className="flex text-yellow-400 text-xl">
                                      {[...Array(3)].map((_, i) => (
                                          <span key={i} className={i < data.stars ? 'opacity-100' : 'opacity-20'}>★</span>
                                      ))}
                                  </div>
                              </div>
                              <div className="text-sm text-slate-500 line-clamp-2 mb-2">
                                  {unit.summary}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                  <div className="text-xs font-bold text-pink-500">
                                      最高分: {data.highestScore}
                                  </div>
                                  <div className="text-[10px] text-slate-400 italic flex flex-col items-end">
                                      <span>內建: {unit.questions.length} 題</span>
                                      <span className={`${(remoteCounts[unit.id] || 0) > 0 ? 'text-pink-400 font-bold' : 'text-slate-300'}`}>
                                        雲端: {remoteCounts[unit.id] !== undefined ? `${remoteCounts[unit.id]} 題` : '讀取中...'}
                                      </span>
                                  </div>
                              </div>
                          </button>
                      );
                  })}
              </div>

              {/* Grand Challenge */}
              <div className="text-center">
                  <button
                      onClick={() => allUnlocked ? startQuiz() : alert('請先在所有單元獲得至少 1 顆星！')}
                      disabled={!allUnlocked}
                      className={`px-12 py-6 rounded-3xl font-black text-2xl shadow-xl transition-all transform
                          ${allUnlocked 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-2xl cursor-pointer' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale'}
                      `}
                  >
                      <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">👑</span>
                          <span>期末大魔王挑戰</span>
                          {!allUnlocked && <span className="text-sm font-normal opacity-70">(需解鎖所有單元)</span>}
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  if (viewState === 'LEARN' && selectedUnit) {
      return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                      <h3 className="text-xl font-bold">{selectedUnit.title} - 學習重點</h3>
                      <button onClick={() => setViewState('MAP')} className="text-slate-400 hover:text-white transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="p-8 max-h-[70vh] overflow-y-auto">
                      {renderContent(selectedUnit)}

                      {selectedUnit.subQuizzes && selectedUnit.subQuizzes.length > 0 && (
                        <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎯</span>
                              <h4 className="text-xl font-black text-slate-800">專項小挑戰</h4>
                            </div>
                            {unitQuestions.length > selectedUnit.questions.length && (
                              <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-bold">
                                雲端模式：已載入 {unitQuestions.length} 題
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(() => {
                              // 1. Get all unique categories from unitQuestions
                              const cloudCategories = new Set<string>();
                              unitQuestions.forEach(q => {
                                const cats = getSmartCategory(q, selectedUnit.title);
                                cats.forEach(c => cloudCategories.add(c));
                              });

                              // 2. Merge with predefined subQuizzes
                              const allCategoryTitles = Array.from(new Set([
                                ...(selectedUnit.subQuizzes?.filter(Boolean).map(sq => sq!.title) || []),
                                ...Array.from(cloudCategories)
                              ])).filter(t => t && t.trim() !== "");

                              // 3. Render buttons for each category
                              const categoryButtons = allCategoryTitles.map((title, idx) => {
                                const count = unitQuestions.filter(q => {
                                  // Direct ID match for predefined subQuizzes
                                  const subQuiz = selectedUnit.subQuizzes?.filter(Boolean).find(sq => sq!.title === title);
                                  if (subQuiz && subQuiz.questionIds.includes(q.wordId)) return true;
                                  
                                  // Text snippet match
                                  const textMatch = subQuiz?.questionIds.some(sqId => {
                                    const builtInQ = selectedUnit.questions.find(bq => bq.wordId === sqId);
                                    return builtInQ && q.question.includes(builtInQ.question.substring(0, 20));
                                  });
                                  if (textMatch) return true;
                                  
                                  // Smart keyword match
                                  const smartCats = getSmartCategory(q, selectedUnit.title);
                                  return smartCats.some(cat => cat.toLowerCase() === title.toLowerCase());
                                }).length;

                                if (count === 0) return null;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => startQuiz(title)}
                                    className="group relative px-6 py-4 bg-white border-2 border-blue-400 text-blue-600 rounded-2xl font-bold hover:bg-blue-500 hover:text-white hover:border-blue-500 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex justify-between items-center"
                                  >
                                    <span>{title}</span>
                                    <span className="bg-blue-100 text-blue-600 group-hover:bg-blue-400 group-hover:text-white px-2 py-1 rounded-lg text-xs transition-colors">
                                      {count} 題
                                    </span>
                                  </button>
                                );
                              });

                              // 4. Add "Other Questions" if there are uncategorized ones
                              const categorizedIds = new Set<string>();
                              unitQuestions.forEach(q => {
                                const cats = getSmartCategory(q, selectedUnit.title);
                                const isPredefined = selectedUnit.subQuizzes?.some(sq => sq.questionIds.includes(q.wordId));
                                if (cats.length > 0 || isPredefined) {
                                  categorizedIds.add(q.wordId);
                                }
                              });

                              const otherQuestions = unitQuestions.filter(q => !categorizedIds.has(q.wordId));
                              if (otherQuestions.length > 0) {
                                categoryButtons.push(
                                  <button
                                    key="others"
                                    onClick={() => {
                                      setQuestions(otherQuestions);
                                      setCurrentIndex(0);
                                      setAnswers({});
                                      setScore(0);
                                      setShowExplanation(false);
                                      setViewState('QUIZ');
                                    }}
                                    className="group relative px-6 py-4 bg-white border-2 border-slate-300 text-slate-500 rounded-2xl font-bold hover:bg-slate-500 hover:text-white hover:border-slate-500 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex justify-between items-center"
                                  >
                                    <span>其他題目</span>
                                    <span className="bg-slate-100 text-slate-500 group-hover:bg-slate-400 group-hover:text-white px-2 py-1 rounded-lg text-xs transition-colors">
                                      {otherQuestions.length} 題
                                    </span>
                                  </button>
                                );
                              }

                              return categoryButtons;
                            })()}
                            
                            {/* Add a "Practice All Cloud" button if there are many cloud questions */}
                            {unitQuestions.length > 10 && (
                              <button
                                onClick={() => {
                                  setQuestions(unitQuestions);
                                  setCurrentIndex(0);
                                  setAnswers({});
                                  setScore(0);
                                  setShowExplanation(false);
                                  setViewState('QUIZ');
                                }}
                                className="sm:col-span-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2"
                              >
                                <span>🚀 雲端全題庫挑戰 ({unitQuestions.length} 題)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center gap-4">
                      <button 
                        onClick={() => setViewState('MAP')}
                        className="px-12 py-3 bg-white border-2 border-slate-300 text-slate-600 rounded-full font-bold hover:bg-slate-100 transition-all shadow-sm"
                      >
                          回地圖
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (viewState === 'QUIZ') {
      const q = questions[currentIndex];
      return (
          <div className="max-w-2xl mx-auto animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
                  <div className="bg-pink-600 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">{selectedUnit?.title}</h3>
                      <div className="font-mono text-xl">{currentIndex + 1} / {questions.length}</div>
                  </div>
                  
                  <div className="p-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">{q.question}</h2>
                      
                      <div className="space-y-4">
                          {q.options.map((opt, idx) => (
                              <button
                                  key={idx}
                                  onClick={() => handleAnswer(idx)}
                                  disabled={showExplanation}
                                  className={`w-full text-left p-4 rounded-xl border-2 text-lg font-medium transition-all
                                      ${showExplanation && idx === q.correctAnswerIndex ? 'bg-green-100 border-green-500 text-green-800' : 
                                        showExplanation && !isCorrect && idx === (answers[currentIndex] ?? -1) ? 'bg-red-100 border-red-500 text-red-800' : 
                                        'border-slate-200 hover:bg-pink-50 hover:border-pink-300 text-slate-700'}
                                  `}
                              >
                                  <span className="inline-block w-8 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                  {opt}
                              </button>
                          ))}
                      </div>

                      {showExplanation && (
                          <div className="mt-8 p-6 bg-red-50 rounded-xl border border-red-200 animate-bounceIn">
                              <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  哎呀！答錯了
                              </div>
                              <p className="text-slate-700 mb-6 leading-relaxed whitespace-pre-wrap">
                                  {q.explanation || "暫無詳解"}
                              </p>
                              <button 
                                  onClick={handleNext}
                                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-colors"
                              >
                                  我懂了，下一題
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  if (viewState === 'RESULT') {
      const percentage = Math.round((score / questions.length) * 100);
      let stars = 0;
      if (percentage === 100) stars = 3;
      else if (percentage >= 80) stars = 2;
      else if (percentage >= 60) stars = 1;

      return (
          <div className="max-w-md mx-auto text-center animate-fadeIn pt-12">
              <div className="text-6xl mb-4">
                  {stars === 3 ? '🏆' : stars === 2 ? '🥈' : stars === 1 ? '🥉' : '💪'}
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">
                  {stars === 3 ? '完美通關！' : stars > 0 ? '挑戰成功！' : '再接再厲！'}
              </h2>
              <div className="flex justify-center gap-2 text-4xl text-yellow-400 mb-6">
                  {[...Array(3)].map((_, i) => (
                      <span key={i} className={i < stars ? 'opacity-100' : 'opacity-20'}>★</span>
                  ))}
              </div>
              <p className="text-slate-500 mb-8 text-lg">
                  得分: <span className="font-bold text-pink-600">{score}</span> / {questions.length}
              </p>
              
              <button 
                  onClick={() => setViewState('MAP')}
                  className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 shadow-lg transition-transform hover:scale-105"
              >
                  回到地圖
              </button>
          </div>
      );
  }

  if (viewState === 'MISTAKES') {
      const grammarMistakes = mistakeQuestions.filter(q => q.grammarTag || q.wordId.startsWith('u') || q.wordId.startsWith('key20'));
      
      // Group mistakes by tag
      const groupedMistakes: Record<string, QuizQuestion[]> = {};
      grammarMistakes.forEach(q => {
          const tag = q.grammarTag || "未分類";
          if (!groupedMistakes[tag]) groupedMistakes[tag] = [];
          groupedMistakes[tag].push(q);
      });

      return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                      <span className="text-4xl">📕</span>
                      文法錯題集
                  </h2>
                  <button 
                      onClick={() => setViewState('MAP')}
                      className="px-6 py-2 bg-white border-2 border-slate-300 text-slate-600 rounded-full font-bold hover:bg-slate-50 transition-all"
                  >
                      回地圖
                  </button>
              </div>

              {grammarMistakes.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2">太棒了！</h3>
                      <p className="text-slate-500 font-bold">目前沒有任何文法錯題，繼續保持！</p>
                  </div>
              ) : (
                  <div className="space-y-8">
                      {Object.entries(groupedMistakes).map(([tag, qs]) => (
                          <div key={tag} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                              <div className="bg-slate-800 p-4 px-6 text-white flex justify-between items-center">
                                  <h3 className="font-black text-lg flex items-center gap-2">
                                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                      {tag}
                                  </h3>
                                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                      {qs.length} 題
                                  </span>
                              </div>
                              <div className="p-6 space-y-6 divide-y divide-slate-100">
                                  {qs.map((q, qIdx) => (
                                      <div key={qIdx} className={qIdx > 0 ? "pt-6" : ""}>
                                          <p className="font-bold text-slate-800 mb-4 leading-relaxed">
                                              {q.question}
                                          </p>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                              {q.options.map((opt, oIdx) => (
                                                  <div 
                                                      key={oIdx}
                                                      className={`p-3 rounded-xl border-2 text-sm font-bold ${
                                                          oIdx === q.correctAnswerIndex 
                                                              ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                                                              : "border-slate-100 bg-slate-50 text-slate-400"
                                                      }`}
                                                  >
                                                      {opt}
                                                  </div>
                                              ))}
                                          </div>
                                          {q.explanation && (
                                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
                                                  <span className="font-black mr-2">💡 詳解：</span>
                                                  {q.explanation}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  return null;
};

export default GrammarView;
