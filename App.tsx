
import React, { useState, useEffect, useMemo } from 'react';
import { Word, QuizQuestion, AppView, DailyMission, UserVocabProgressMap, UserProfile, GrammarMapData } from './types';
import { VOCABULARY_LIST, CATEGORY_SORT_ORDER, CORE_VOCAB_MAP } from './constants';
import WordCard from './components/WordCard';
import FlashcardView from './components/FlashcardView';
import StatsChart from './components/StatsChart';
import GrammarView from './components/GrammarView';
import AddWordModal from './components/AddWordModal';
import AiAnalysisModal from './components/AiAnalysisModal';
import EditProfileModal from './components/EditProfileModal';
import ProgressView from './components/ProgressView';
import QuizView from './components/QuizView'; // Import the new component
import ArticleList from './components/ArticleList'; // Import the new component
import FamilyLeaderboard from './components/FamilyLeaderboard';
import { 
  fetchRemoteVocabulary, 
  fetchRemoteQuestions, 
  fetchUserProgress, 
  saveUserProgress, 
  updateWordMistakeCountInSheet,
  toggleWordStatusInSheet,
  getGasApiUrl,
  fetchDailyMission,
  submitQuizResult,
  fetchUserVocabProgress,
  markWordViewed,
  fetchFamilyStats,
  submitSrsResult,
  fetchGrammarMap
} from './services/gasService';
import { 
  getEffectiveApiKey
} from './services/geminiService';
import { FamilyStats } from './types';

const ITEMS_PER_PAGE = 12;
const LIST_SUB_CHUNK_SIZE = 12; // Adjusted to match ITEMS_PER_PAGE for perfect alignment

const App: React.FC = () => {
  // Data State
  const [words, setWords] = useState<Word[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);

  // User Progress State
  const [markedUnfamiliar, setMarkedUnfamiliar] = useState<string[]>([]);
  const [mistakeCounts, setMistakeCounts] = useState<Record<string, number>>({});
  const [quizCounts, setQuizCounts] = useState<Record<string, number>>({});
  const [lastQuestions, setLastQuestions] = useState<Record<string, QuizQuestion>>({});
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [mistakeQuestions, setMistakeQuestions] = useState<QuizQuestion[]>([]);

  // Multi-User & Mission State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [dailyMission, setDailyMission] = useState<DailyMission | null>(null);
  const [userVocabProgress, setUserVocabProgress] = useState<UserVocabProgressMap>({});
  const [loadingMission, setLoadingMission] = useState(false);
  const [missionQuizWords, setMissionQuizWords] = useState<Word[] | undefined>(undefined);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [grammarMap, setGrammarMap] = useState<GrammarMapData>({});

  // User Profiles State
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() => {
      const saved = localStorage.getItem('user_profiles');
      return saved ? JSON.parse(saved) : [
          { id: 'Dad', name: '爸爸', avatar: '👨', color: 'bg-blue-500' },
          { id: 'Mom', name: '媽媽', avatar: '👩', color: 'bg-pink-500' },
          { id: 'Daughter', name: '女兒', avatar: '👧', color: 'bg-emerald-500' }
      ];
  });
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  // UI State
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentCategory, setCurrentCategory] = useState<string>('All');
  
  // NEW: Unified Filter Mode State
  // Values: 'ALL', 'MISTAKE', 'UNFAMILIAR', 'CORE_SUPER', 'CORE_READING', 'CORE_PAST'
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);

  // Settings Input State
  const [apiKeyInput, setApiKeyInput] = useState(getEffectiveApiKey() || '');
  const [gasUrlInput, setGasUrlInput] = useState(getGasApiUrl() || '');
  
  // Reactive API Key State (Pass to children to update UI without reload)
  const [hasApiKey, setHasApiKey] = useState(!!getEffectiveApiKey());

  const handleLogin = async (username: string) => {
      setCurrentUser(username);
      localStorage.setItem('juniorVocabUser', username);
      setView(AppView.DASHBOARD);
      
      setLoadingMission(true);
      
      // Parallel fetch for Mission, Progress and Family Stats
      const [mission, progressMap, fStats, gMap] = await Promise.all([
          fetchDailyMission(username),
          fetchUserVocabProgress(username),
          fetchFamilyStats(),
          fetchGrammarMap(username)
      ]);

      setDailyMission(mission);
      if (progressMap) setUserVocabProgress(progressMap);
      setFamilyStats(fStats);
      setGrammarMap(gMap || {});
      
      setLoadingMission(false);
      
      // Also fetch legacy progress if needed (optional, maybe for migration)
      const legacyProgress = await fetchUserProgress(username);
      if (legacyProgress) {
        setMarkedUnfamiliar(legacyProgress.markedUnfamiliar || []);
        setQuizCounts(legacyProgress.quizCounts || {});
        setLastQuestions(legacyProgress.lastQuestions || {});
        setMistakeQuestions(legacyProgress.mistakeQuestions || []);
        setMistakeCounts(legacyProgress.mistakeCounts || {});
        setCompletedPages(legacyProgress.completedPages || []);
      }
      setLoading(false);
  };

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      let loadedWords: Word[] = [];

      // 1. Vocabulary
      const remoteWords = await fetchRemoteVocabulary();
      if (remoteWords.length > 0) {
        loadedWords = remoteWords;
      } else {
        loadedWords = VOCABULARY_LIST;
      }

      // Create a static map for recovery of metadata (Example Sentences, Sources)
      const staticMap = new Map(VOCABULARY_LIST.map(w => [w.term.toLowerCase(), w]));

      // 🛠️ CRITICAL FIX: Force Apply Core Tags & Exam Sources
      loadedWords = loadedWords.map(w => {
          const lowerTerm = w.term.toLowerCase().trim();
          const staticData = staticMap.get(lowerTerm);
          const finalWord = { ...w };

          const staticTag = CORE_VOCAB_MAP[w.term] || CORE_VOCAB_MAP[lowerTerm];
          if (staticTag) {
              finalWord.coreTag = staticTag;
          }

          if (staticData?.examSource) {
              finalWord.examSource = staticData.examSource;
              if (staticData.example) {
                  finalWord.example = staticData.example;
                  if (staticData.exampleTranslation) {
                      finalWord.exampleTranslation = staticData.exampleTranslation;
                  }
              }
          }
          return finalWord;
      });

      setWords(loadedWords);

      // 2. Questions Database
      const remoteQuestions = await fetchRemoteQuestions();
      if (remoteQuestions) {
        setQuestionsMap(remoteQuestions as unknown as Record<string, QuizQuestion[]>);
      }

      // 3. User Progress (Legacy Single User) - We keep this for backward compatibility or global stats
      // But for multi-user, we rely on GAS backend mostly.
      // However, the app still uses local state for immediate feedback.
      // We will load user-specific progress when user logs in.
      const savedUser = localStorage.getItem('juniorVocabUser');
      if (savedUser) {
          handleLogin(savedUser);
      } else {
          setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSrsAssessment = async (wordId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!currentUser) return;
      
      // Optimistic update for local state if needed (e.g. marking unfamiliar if 'again')
      if (rating === 'again') {
          setMarkedUnfamiliar(prev => prev.includes(wordId) ? prev : [...prev, wordId]);
      } else if (rating === 'easy') {
          setMarkedUnfamiliar(prev => prev.filter(id => id !== wordId));
      }

      await submitSrsResult(currentUser, wordId, rating);
      
      // Refresh progress map to reflect new review dates
      const progressMap = await fetchUserVocabProgress(currentUser);
      if (progressMap) setUserVocabProgress(progressMap);
      
      // Refresh family stats to update mastery progress
      refreshFamilyStats();
  };

  const refreshFamilyStats = async () => {
    try {
       const stats = await fetchFamilyStats();
       setFamilyStats(stats);
    } catch (e) {
       console.error("Failed to refresh family stats", e);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('juniorVocabUser');
      setCurrentUser(null);
      setView(AppView.LOGIN);
      setDailyMission(null);
  };

  const startMission = (type: 'new' | 'review' | 'mastery') => {
      if (!dailyMission) return;
      let missionWords: Word[] = [];
      if (type === 'new') missionWords = dailyMission.newWords;
      else if (type === 'review') missionWords = dailyMission.reviewWords;
      else if (type === 'mastery') missionWords = dailyMission.masteryWords;

      if (missionWords.length === 0) {
          alert('太棒了！這個任務目前沒有題目，你已經完全制霸了！🎉');
          return;
      }

      setMissionQuizWords(missionWords);
      setView(AppView.QUIZ);
  };

  // Save Progress on Change
  useEffect(() => {
    if (loading || !currentUser) return; // Only save if logged in
    const timer = setTimeout(() => {
      saveUserProgress({
        markedUnfamiliar,
        quizCounts,
        lastQuestions,
        mistakeQuestions,
        mistakeCounts,
        completedPages
      }, currentUser);
    }, 2000);
    return () => clearTimeout(timer);
  }, [markedUnfamiliar, quizCounts, lastQuestions, mistakeQuestions, mistakeCounts, completedPages, loading, currentUser]);

  // Derived Data: Grouped Categories
  const categories = useMemo(() => {
    const cats = new Set(words.map(w => w.category).filter(Boolean));
    return ['All', ...(Array.from(cats) as string[]).sort((a: string, b: string) => {
       const idxA = CATEGORY_SORT_ORDER.indexOf(a);
       const idxB = CATEGORY_SORT_ORDER.indexOf(b);
       if (idxA !== -1 && idxB !== -1) return idxA - idxB;
       if (idxA !== -1) return -1;
       if (idxB !== -1) return 1;
       return a.localeCompare(b);
    })];
  }, [words]);

  // Advanced Grouping with Sub-chunks
  const groupedCategories = useMemo(() => {
    const wordsByCat: Record<string, number> = {};
    words.forEach(w => {
        const cat = w.category || '未分類';
        wordsByCat[cat] = (wordsByCat[cat] || 0) + 1;
    });

    const uniqueCats = Object.keys(wordsByCat).sort((a: string, b: string) => {
         const idxA = CATEGORY_SORT_ORDER.indexOf(a);
         const idxB = CATEGORY_SORT_ORDER.indexOf(b);
         if (idxA !== -1 && idxB !== -1) return idxA - idxB;
         if (idxA !== -1) return -1;
         if (idxB !== -1) return 1;
         return a.localeCompare(b, 'zh-TW');
    });

    const primaryGroups = [
        { id: 'custom', label: '⭐ 自建與其他', match: (c: string) => c === '自建' || c === '綜合' || c.includes('補遺') || c === '未分類' },
        { id: 'life', label: '🏠 基礎生活篇', match: (c: string) => ['人物', '職業', '身體', '健康', '家庭', '居家', '飲食', '食物', '服飾', '配件'].some(k => c.includes(k)) },
        { id: 'env', label: '🌍 社區與環境篇', match: (c: string) => ['學校', '教育', '地點', '交通', '運輸', '旅遊', '休閒', '運動', '自然', '天氣', '動物', '昆蟲', '植物'].some(k => c.includes(k)) },
        { id: 'abstract', label: '🧠 抽象與社會篇', match: (c: string) => ['時間', '空間', '數字', '社會', '溝通', '動作', '行為', '情感', '個性', '特質', '狀態', '人格'].some(k => c.includes(k)) },
    ];

    const grammarGroup = { 
        id: 'grammar', 
        label: '🔤 文法與詞性篇', 
        match: (c: string) => ['名詞', '動詞', '形容詞', '副詞', '代名詞', '介系詞', '連接詞', '冠詞', '限定詞', '助動詞', '感嘆詞', '文法'].some(k => c.includes(k)) 
    };

    const primaryResultGroups: { label: string, options: {label: string, value: string}[] }[] = primaryGroups.map(g => ({ label: g.label, options: [] }));
    const grammarResultGroup: { label: string, options: {label: string, value: string}[] } = { label: grammarGroup.label, options: [] };
    const separateCategories: { label: string, options: {label: string, value: string}[] }[] = [];

    uniqueCats.forEach(cat => {
        const count = wordsByCat[cat];
        const chunks = Math.ceil(count / LIST_SUB_CHUNK_SIZE);
        const optionsForCat: {label: string, value: string}[] = [];

        for (let i = 0; i < chunks; i++) {
            const start = i * LIST_SUB_CHUNK_SIZE + 1;
            const end = Math.min((i + 1) * LIST_SUB_CHUNK_SIZE, count);
            const label = chunks > 1 
                ? `${cat}-${i + 1} (${start}~${end})` 
                : `${cat} (${count})`;
            const value = `${cat}__${i}`;
            optionsForCat.push({ label, value });
        }

        let matched = false;
        for (let i = 0; i < primaryGroups.length; i++) {
            if (primaryGroups[i].match(cat)) {
                primaryResultGroups[i].options.push(...optionsForCat);
                matched = true;
                break;
            }
        }

        if (!matched && grammarGroup.match(cat)) {
            grammarResultGroup.options.push(...optionsForCat);
            matched = true;
        }
        
        if (!matched) {
            separateCategories.push({
                label: `📂 ${cat}`,
                options: optionsForCat
            });
        }
    });

    return [
        ...primaryResultGroups.filter(g => g.options.length > 0),
        ...separateCategories,
        ...(grammarResultGroup.options.length > 0 ? [grammarResultGroup] : [])
    ];
  }, [words]);

  const filteredWords = useMemo(() => {
    let filtered = words;

    if (currentCategory !== 'All') {
        const separatorIndex = currentCategory.lastIndexOf('__');
        if (separatorIndex !== -1) {
            const catName = currentCategory.substring(0, separatorIndex);
            const chunkIndexStr = currentCategory.substring(separatorIndex + 2);
            const chunkIndex = parseInt(chunkIndexStr, 10);

            const categoryWords = filtered.filter(w => (w.category || '未分類') === catName);
            
            if (!isNaN(chunkIndex)) {
                const start = chunkIndex * LIST_SUB_CHUNK_SIZE;
                const end = start + LIST_SUB_CHUNK_SIZE;
                filtered = categoryWords.slice(start, end);
            } else {
                filtered = categoryWords;
            }
        } else {
            filtered = filtered.filter(w => (w.category || '未分類') === currentCategory);
        }
    }

    switch (filterMode) {
        case 'MISTAKE':
            filtered = filtered.filter(w => (mistakeCounts[w.id] || 0) > 0);
            break;
        case 'UNFAMILIAR':
            filtered = filtered.filter(w => markedUnfamiliar.includes(w.id));
            break;
        case 'CORE_SUPER':
            filtered = filtered.filter(w => w.coreTag === '超級高頻');
            break;
        case 'CORE_READING':
            filtered = filtered.filter(w => w.coreTag === '閱測高頻');
            break;
        case 'CORE_PAST':
            filtered = filtered.filter(w => w.coreTag === '歷年考點');
            break;
        default:
            break;
    }

    return filtered;
  }, [words, currentCategory, filterMode, markedUnfamiliar, mistakeCounts]);

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);

  // Handlers
  const handleToggleUnfamiliar = async (id: string) => {
    const isNowUnfamiliar = !markedUnfamiliar.includes(id);
    setMarkedUnfamiliar(prev => 
      isNowUnfamiliar ? [...prev, id] : prev.filter(x => x !== id)
    );
    await toggleWordStatusInSheet(id, isNowUnfamiliar);
    refreshFamilyStats();
  };

  const handleIncrementMistake = async (id: string) => {
    const newCount = (mistakeCounts[id] || 0) + 1;
    setMistakeCounts(prev => ({ ...prev, [id]: newCount }));
    await updateWordMistakeCountInSheet(id, newCount);
    refreshFamilyStats();
  };

  const handleAddMistakeQuestion = (q: QuizQuestion) => {
      setMistakeQuestions(prev => {
          if (prev.some(existing => existing.question === q.question)) return prev;
          return [q, ...prev];
      });
  };

  const getCurrentContext = () => {
    let catName = currentCategory;
    let pageNum = currentPage;

    if (currentCategory !== 'All' && currentCategory.includes('__')) {
        const parts = currentCategory.split('__');
        catName = parts[0];
        const chunkIndex = parseInt(parts[1], 10);
        pageNum = chunkIndex + 1 + (currentPage - 1);
    }
    
    return { catName, pageNum };
  };

  const markPageComplete = async (cat?: string, page?: number, ids?: string[], forceState?: boolean) => {
    let catName = cat;
    let pageNum = page;
    let wordIds = ids;

    if (!catName || !pageNum || !wordIds) {
        const ctx = getCurrentContext();
        catName = ctx.catName;
        pageNum = ctx.pageNum;
        wordIds = paginatedWords.map(w => w.id);
    }

    if (catName === 'All') return; 
    const pageKey = `${catName}-${pageNum}`;
    const isCurrentlyCompleted = completedPages.includes(pageKey);
    
    // Determine the new state: if forceState is provided, use it. Otherwise, toggle.
    const newState = forceState !== undefined ? forceState : !isCurrentlyCompleted;
    
    // If the state is already what we want, do nothing
    if (isCurrentlyCompleted === newState) return;

    if (newState) {
        setCompletedPages(prev => [...prev, pageKey]);
    } else {
        setCompletedPages(prev => prev.filter(p => p !== pageKey));
    }

    if (currentUser) {
        // Optimistic update for local progress
        setUserVocabProgress(prev => {
            const newProgress = { ...prev };
            wordIds!.forEach(id => {
                if (!newProgress[id]) {
                    newProgress[id] = { 
                        mapViewed: newState, 
                        testedCount: 0, 
                        correctCount: 0, 
                        nextReviewDate: new Date().toISOString(), 
                        isMarked: false 
                    };
                } else {
                    newProgress[id] = { ...newProgress[id], mapViewed: newState };
                }
            });
            return newProgress;
        });

        // Server update (currently only supports marking as viewed, but we can call it anyway for marking "on")
        if (newState) {
            await markWordViewed(currentUser, wordIds!);
            refreshFamilyStats();
        }
    }
  };

  const { catName: currentCatName, pageNum: currentPageNum } = getCurrentContext();
  const currentPageKey = `${currentCatName}-${currentPageNum}`;
  const isCurrentPageCompleted = completedPages.includes(currentPageKey);

  const renderView = () => {
    switch (view) {
      case AppView.LOGIN:
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 text-white overflow-hidden relative">
                {/* Netflix-style background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black pointer-events-none"></div>
                
                <div className="relative z-10 text-center mb-16 animate-fadeIn">
                    <h1 className="text-6xl font-black tracking-tighter mb-4">
                        Junior Vocab <span className="text-blue-500">AI</span>
                    </h1>
                    <p className="text-2xl text-slate-400 font-bold">全家人的英文單字教練</p>
                </div>
                
                <div className="relative z-10 max-w-4xl w-full text-center animate-slideUp">
                    <h2 className="text-3xl font-bold mb-12 text-slate-200">誰在學習？</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 px-8">
                        {userProfiles.map(profile => (
                            <div key={profile.id} className="relative group">
                                <button onClick={() => handleLogin(profile.id)} className="flex flex-col items-center gap-6 transition-all w-full">
                                    <div className={`w-40 h-40 ${profile.color} rounded-2xl flex items-center justify-center text-8xl shadow-2xl ring-offset-4 ring-offset-slate-900 group-hover:ring-4 ring-white transition-all transform group-hover:scale-110`}>
                                        {profile.avatar}
                                    </div>
                                    <div className="font-black text-2xl text-slate-400 group-hover:text-white transition-colors">
                                        {profile.name}
                                    </div>
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProfile(profile);
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="編輯個人檔案"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-24 relative z-10">
                    <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-slate-300 font-bold flex items-center gap-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        管理設定
                    </button>
                </div>
            </div>
        );

      case AppView.DASHBOARD:
        return (
            <div className="max-w-4xl mx-auto p-4 animate-fadeIn">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">
                            歡迎回來，{userProfiles.find(p => p.id === currentUser)?.name || currentUser}！👋
                        </h2>
                        <p className="text-slate-500 font-bold mt-1">今天想挑戰什麼任務？</p>
                    </div>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                        切換帳號
                    </button>
                </div>

                {/* Family Stats Section */}
                {familyStats && (
                    <div className="mb-12">
                        <FamilyLeaderboard 
                            stats={{
                                ...familyStats,
                                leaderboard: (familyStats.leaderboard || []).map(user => {
                                    const profile = userProfiles.find(p => p.id === user.username);
                                    if (profile) {
                                        return {
                                            ...user,
                                            username: profile.name,
                                            avatar: profile.avatar,
                                            color: profile.color
                                        };
                                    }
                                    return user;
                                })
                            }} 
                            grammarMap={grammarMap}
                            currentUser={currentUser}
                        />
                    </div>
                )}

                {loadingMission ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50 mx-auto mb-4"></div>
                        <p className="text-slate-500 font-bold">正在從雲端分析您的學習數據...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Mission 1: New Words */}
                        <button 
                            onClick={() => startMission('new')}
                            className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group text-left"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl font-black group-hover:scale-110 transition-transform">🌱</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-2">探索新領域</h3>
                                <p className="opacity-90 mb-6 font-bold">學習新單字 (15題)</p>
                                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-sm">
                                    {dailyMission?.newWords.length || 0} 個待學習
                                </div>
                            </div>
                        </button>

                        {/* Mission 2: Review */}
                        <button 
                            onClick={() => startMission('review')}
                            className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group text-left"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl font-black group-hover:scale-110 transition-transform">🚑</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-2">搶救記憶</h3>
                                <p className="opacity-90 mb-6 font-bold">複習易錯字 (10題)</p>
                                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-sm">
                                    {dailyMission?.reviewWords.length || 0} 個需複習
                                </div>
                            </div>
                        </button>

                        {/* Mission 3: Mastery */}
                        <button 
                            onClick={() => startMission('mastery')}
                            className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group text-left"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl font-black group-hover:scale-110 transition-transform">💪</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-2">鞏固神經</h3>
                                <p className="opacity-90 mb-6 font-bold">維持手感 (5題)</p>
                                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-sm">
                                    {dailyMission?.masteryWords.length || 0} 個精熟字
                                </div>
                            </div>
                        </button>
                    </div>
                )}
                
                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <button onClick={() => setView(AppView.LIST)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all group text-left">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">📚</div>
                    <div className="font-bold text-slate-800">單字列表</div>
                    <div className="text-xs text-slate-400 mt-1">{words.length} 個單字</div>
                  </button>
                  
                  <button onClick={() => setView(AppView.FLASHCARD)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all group text-left">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">🎴</div>
                    <div className="font-bold text-slate-800">單字卡</div>
                    <div className="text-xs text-slate-400 mt-1">記憶練習</div>
                  </button>

                  <button onClick={() => setView(AppView.GRAMMAR)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all group text-left">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">✍️</div>
                    <div className="font-bold text-slate-800">文法特訓</div>
                    <div className="text-xs text-slate-400 mt-1">錯題複習</div>
                  </button>

                  <button onClick={() => setView(AppView.ARTICLES)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all group text-left">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                    <div className="font-bold text-slate-800">我的文章</div>
                    <div className="text-xs text-slate-400 mt-1">閱讀複習</div>
                  </button>
                </div>
            </div>
        );

      case AppView.LIST:
        return (
          // ... (ListView content - kept same but omitted for brevity as it's large) ...
          <div className="max-w-7xl mx-auto p-4">
             {/* Review Dashboard Banner */}
             {markedUnfamiliar.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-800 text-lg">待複習單字: {markedUnfamiliar.length} 個</h3>
                            <p className="text-yellow-600 text-sm">這些單字被標記為「不熟」，建議優先複習！</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView(AppView.FLASHCARD)} className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 font-bold rounded-lg hover:bg-yellow-100 transition-colors shadow-sm">
                            單字卡複習
                        </button>
                        <button onClick={() => setView(AppView.QUIZ)} className="px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-md">
                            測驗弱點
                        </button>
                    </div>
                </div>
             )}

             {/* Controls */}
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 items-center">
                   <select 
                      value={currentCategory} 
                      onChange={(e) => {
                          setCurrentCategory(e.target.value);
                          setCurrentPage(1);
                      }}
                      className="p-2 border border-slate-300 rounded-lg shadow-sm bg-white font-bold text-slate-800 min-w-[180px]"
                   >
                      <option value="All">顯示全部 (All)</option>
                      {groupedCategories.map(group => (
                          <optgroup key={group.label} label={group.label}>
                              {group.options.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                          </optgroup>
                      ))}
                   </select>

                   <div className="relative">
                       <select
                          value={filterMode}
                          onChange={(e) => {
                              setFilterMode(e.target.value);
                              setCurrentPage(1);
                          }}
                          className={`p-2 border border-slate-300 rounded-lg shadow-sm font-bold appearance-none pr-8 cursor-pointer min-w-[150px]
                              ${filterMode === 'MISTAKE' ? 'bg-red-50 text-red-700 border-red-300' : 
                                filterMode === 'UNFAMILIAR' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                filterMode.startsWith('CORE') ? 'bg-indigo-50 text-indigo-700 border-indigo-300' :
                                'bg-white text-slate-800'
                              }
                          `}
                       >
                          <option value="ALL">顯示全部 (All)</option>
                          <optgroup label="狀態篩選">
                              <option value="MISTAKE">⚠️ 易錯單字 ({(Object.values(mistakeCounts) as number[]).filter(c=>c>0).length})</option>
                              <option value="UNFAMILIAR">⭐ 不熟單字 ({markedUnfamiliar.length})</option>
                          </optgroup>
                          <optgroup label="核心單字">
                              <option value="CORE_SUPER">🔥 超級高頻 ({words.filter(w => w.coreTag === '超級高頻').length})</option>
                              <option value="CORE_READING">📘 閱測高頻 ({words.filter(w => w.coreTag === '閱測高頻').length})</option>
                              <option value="CORE_PAST">📝 歷年考點 ({words.filter(w => w.coreTag === '歷年考點').length})</option>
                          </optgroup>
                       </select>
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </div>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-emerald-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      查詢單字
                   </button>
                   <button onClick={() => setShowImportModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1">
                      <span className="text-lg">✨</span>
                      AI 題庫分析
                   </button>
                </div>
             </div>

             {/* Filter Status Banner */}
             {filterMode !== 'ALL' && (
                 <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-bold animate-fadeIn
                    ${filterMode === 'MISTAKE' ? 'bg-red-50 text-red-700 border border-red-100' :
                      filterMode === 'UNFAMILIAR' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }
                 `}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {filterMode === 'MISTAKE' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                        {filterMode === 'UNFAMILIAR' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
                        {filterMode.startsWith('CORE') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                    </svg>
                    目前顯示：
                    {filterMode === 'MISTAKE' ? '易錯單字' : 
                     filterMode === 'UNFAMILIAR' ? '不熟單字' :
                     filterMode === 'CORE_SUPER' ? '超級高頻單字' :
                     filterMode === 'CORE_READING' ? '閱測高頻單字' :
                     '歷年考點單字'}
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs ml-auto">共 {filteredWords.length} 個</span>
                 </div>
             )}

             {/* Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedWords.length > 0 ? (
                    paginatedWords.map(word => (
                    <WordCard 
                        key={word.id} 
                        word={word} 
                        isUnfamiliar={markedUnfamiliar.includes(word.id)}
                        onToggleUnfamiliar={handleToggleUnfamiliar}
                        quizCount={quizCounts[word.id] || 0}
                        lastQuestion={lastQuestions[word.id]}
                        mistakeCount={mistakeCounts[word.id] || 0}
                        onIncrementMistake={handleIncrementMistake}
                        onEdit={(w) => {
                            setEditingWord(w);
                            setShowAddModal(true);
                        }}
                        onAddRelatedWord={(term, meaning) => {
                            setEditingWord({
                                id: '',
                                term,
                                meaning,
                                partOfSpeech: '',
                                phonetic: '',
                                example: '',
                                exampleTranslation: '',
                                category: '自建',
                                level: '1200'
                            });
                            setShowAddModal(true);
                        }}
                        hasApiKey={hasApiKey}
                        userProgress={userVocabProgress[word.id]}
                    />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-lg font-bold mb-2">沒有符合條件的單字</p>
                        <p className="text-sm">請嘗試切換其他篩選條件或新增單字。</p>
                    </div>
                )}
             </div>

             {/* Pagination & Complete Button */}
             <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">
               {totalPages > 1 && (
                  <div className="flex items-center gap-4">
                     <button 
                       disabled={currentPage === 1}
                       onClick={() => setCurrentPage(p => p - 1)}
                       className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50"
                     >
                       上一頁
                     </button>
                     <span className="font-bold text-slate-600">
                        Page {currentPage} of {totalPages}
                     </span>
                     <button 
                       disabled={currentPage === totalPages}
                       onClick={() => setCurrentPage(p => p + 1)}
                       className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50"
                     >
                       下一頁
                     </button>
                  </div>
               )}

               {currentCatName !== 'All' && (
                   <button 
                      onClick={() => markPageComplete()}
                      className={`ml-4 px-4 py-2 font-bold rounded-full shadow-sm transition-all flex items-center gap-2
                          ${isCurrentPageCompleted 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-400 text-white hover:bg-gray-500 hover:shadow-md'
                          }`}
                   >
                      {isCurrentPageCompleted ? (
                          <>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             已完成 {currentCatName}-{currentPageNum} (點擊取消)
                          </>
                      ) : (
                          <>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             標記 {currentCatName}-{currentPageNum} 完成
                          </>
                      )}
                   </button>
               )}
             </div>
          </div>
        );
      
      case AppView.FLASHCARD:
        return (
           <div className="max-w-4xl mx-auto p-4">
              <FlashcardView 
                 allWords={words}
                 categories={categories}
                 itemsPerPage={ITEMS_PER_PAGE}
                 completedPages={completedPages}
                 markedUnfamiliar={markedUnfamiliar}
                 mistakeCounts={mistakeCounts}
                 onToggleUnfamiliar={handleToggleUnfamiliar}
                 onCompletePage={markPageComplete}
                 onSrsAssessment={handleSrsAssessment}
              />
           </div>
        );

      case AppView.STATS:
        return (
           <div className="max-w-4xl mx-auto p-4">
              <StatsChart 
                 total={words.length} 
                 unfamiliar={markedUnfamiliar.length} 
                 mastered={words.length - markedUnfamiliar.length} 
              />
           </div>
        );
      
      case AppView.GRAMMAR:
        return (
            <div className="max-w-6xl mx-auto p-4">
               <GrammarView 
                  mistakeQuestions={mistakeQuestions}
                  onUpdateMistakes={setMistakeQuestions}
                  questionsMap={questionsMap}
                  username={currentUser}
                  grammarMap={grammarMap}
                  onUpdateGrammarMap={setGrammarMap}
                  onQuizComplete={refreshFamilyStats}
               />
            </div>
        );

      case AppView.PROGRESS:
        return (
           <ProgressView 
              allWords={words}
              userVocabProgress={userVocabProgress}
              completedPages={completedPages}
              categories={categories}
              itemsPerPage={ITEMS_PER_PAGE}
              onNavigate={(cat, page) => {
                  // Construct the specific chunk key corresponding to this page
                  // page is 1-based. chunk index is 0-based.
                  const chunkIndex = page - 1;
                  const chunkKey = `${cat}__${chunkIndex}`;
                  setFilterMode('ALL'); // Reset filters so the user sees the content
                  setCurrentCategory(chunkKey);
                  setCurrentPage(1); // Reset to 1 relative to the chunk
                  setView(AppView.LIST);
              }}
              onTogglePage={(cat, page) => {
                  const catWords = words.filter(w => w.category === cat);
                  const start = (page - 1) * ITEMS_PER_PAGE;
                  const end = Math.min(page * ITEMS_PER_PAGE, catWords.length);
                  const wordIds = catWords.slice(start, end).map(w => w.id);
                  markPageComplete(cat, page, wordIds);
              }}
           />
        );

      case AppView.ARTICLES:
        return <ArticleList onBack={() => setView(AppView.DASHBOARD)} />;

      case AppView.QUIZ:
        return (
            <div className="max-w-5xl mx-auto p-4">
                <QuizView 
                    allWords={words}
                    questionsMap={questionsMap}
                    markedUnfamiliar={markedUnfamiliar}
                    mistakeCounts={mistakeCounts}
                    mistakeQuestions={mistakeQuestions}
                    categories={categories}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onUpdateMistakeCount={handleIncrementMistake}
                    onAddMistakeQuestion={handleAddMistakeQuestion}
                    onToggleUnfamiliar={handleToggleUnfamiliar}
                    customWordList={missionQuizWords} // Pass mission words
                    autoStart={!!missionQuizWords} // Auto start if mission words exist
                    onQuizComplete={async (results) => {
                        if (currentUser) {
                            await submitQuizResult(currentUser, results);
                            // Refresh mission, progress and family stats after quiz
                            const [mission, progressMap, fStats] = await Promise.all([
                                fetchDailyMission(currentUser),
                                fetchUserVocabProgress(currentUser),
                                fetchFamilyStats()
                            ]);
                            setDailyMission(mission);
                            if (progressMap) setUserVocabProgress(progressMap);
                            setFamilyStats(fStats);
                        }
                        // Clear mission state so we don't get stuck in mission mode if user navigates away and back
                        setMissionQuizWords(undefined);
                    }}
                />
            </div>
        );

      default:
        return <div>View not implemented yet</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      {view !== AppView.LOGIN && (
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
               <span className="text-2xl">📚</span> Junior Vocab AI
            </h1>

            <div className="flex items-center gap-4 overflow-x-auto">
               <button onClick={() => setView(AppView.DASHBOARD)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.DASHBOARD ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-100'}`}>首頁</button>
               <button onClick={() => setView(AppView.LIST)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.LIST ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>列表</button>
               <button onClick={() => setView(AppView.FLASHCARD)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.FLASHCARD ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}>單字卡</button>
               <button onClick={() => setView(AppView.QUIZ)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.QUIZ ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>測驗</button>
               <button onClick={() => setView(AppView.GRAMMAR)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.GRAMMAR ? 'bg-pink-100 text-pink-700' : 'text-slate-500 hover:bg-slate-100'}`}>文法/錯題</button>
               <button onClick={() => setView(AppView.STATS)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.STATS ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-100'}`}>統計</button>
               <button onClick={() => setView(AppView.PROGRESS)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.PROGRESS ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-100'}`}>學習地圖</button>
               <button onClick={() => setView(AppView.ARTICLES)} className={`px-3 py-1 rounded-full text-sm font-bold ${view === AppView.ARTICLES ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>文章</button>
               
               <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>
            </div>
         </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="pt-6 pb-20">
         {loading ? (
             <div className="flex items-center justify-center h-96">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50"></div>
             </div>
         ) : renderView()}
      </main>

      {/* Modals */}
      {editingProfile && (
          <EditProfileModal 
              profile={editingProfile}
              onClose={() => setEditingProfile(null)}
              onSave={(updated) => {
                  setUserProfiles(prev => {
                      const newProfiles = prev.map(p => p.id === updated.id ? updated : p);
                      localStorage.setItem('user_profiles', JSON.stringify(newProfiles));
                      return newProfiles;
                  });
              }}
          />
      )}
      {showAddModal && (
         <AddWordModal 
            categories={categories}
            onClose={() => {
                setShowAddModal(false);
                setEditingWord(undefined);
            }}
            allWords={words}
            markedWords={markedUnfamiliar}
            mistakeCounts={mistakeCounts}
            initialData={editingWord}
            onAdd={(newWord, mark) => {
                setWords(prev => [newWord, ...prev]);
                if (mark) handleToggleUnfamiliar(newWord.id);
            }}
            onUpdate={(updated) => {
                setWords(prev => prev.map(w => w.id === updated.id ? updated : w));
            }}
            onToggleUnfamiliar={handleToggleUnfamiliar}
            onIncrementMistake={handleIncrementMistake}
            onSetMistakeCount={(id, count) => setMistakeCounts(prev => ({...prev, [id]: count}))}
         />
      )}

      {showImportModal && (
         <AiAnalysisModal 
            onClose={() => setShowImportModal(false)}
            currentUser={currentUser}
            onLookupWord={(term) => {
                setEditingWord({
                    id: '',
                    term,
                    meaning: '',
                    partOfSpeech: '',
                    phonetic: '',
                    example: '',
                    exampleTranslation: '',
                    category: '自建',
                    level: '1200'
                });
                setShowAddModal(true);
            }}
         />
      )}

      {/* Settings Modal */}
      {showSettings && (
         <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                 <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                    ⚙️ 設定 (Settings)
                 </h2>
                 
                 <div className="space-y-6">
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                         <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                             <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                             Gemini API Key
                         </h3>
                         <div className="relative">
                             <input 
                                type="password" 
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="在此貼上您的 Free Tier API Key"
                             />
                             {apiKeyInput && (
                                 <button 
                                    onClick={() => setApiKeyInput('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                                    title="清除 Key"
                                 >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                             )}
                         </div>
                         <p className="text-xs text-slate-500 mt-2">
                             * 我們已將「發音功能」改為瀏覽器內建 (免費)，以節省您的 API 額度。
                         </p>
                     </div>

                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                         <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                             <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             Google Apps Script 網址
                         </h3>
                         <input 
                            type="text" 
                            value={gasUrlInput}
                            onChange={(e) => setGasUrlInput(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-green-500 text-sm font-mono"
                            placeholder="https://script.google.com/macros/s/..."
                         />
                         <p className="text-xs text-slate-500 mt-2">用於雲端同步單字與進度。</p>
                     </div>
                 </div>

                 <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                     <button onClick={() => setShowSettings(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                     <button 
                        onClick={() => {
                            const trimmedKey = apiKeyInput.trim();
                            const trimmedUrl = gasUrlInput.trim();
                            localStorage.setItem('user_gemini_api_key', trimmedKey);
                            localStorage.setItem('user_gas_app_url', trimmedUrl);
                            setApiKeyInput(trimmedKey); // Update local state to show trimmed version
                            setGasUrlInput(trimmedUrl);
                            setHasApiKey(!!trimmedKey); 
                            alert("設定已儲存！");
                            setShowSettings(false);
                        }}
                        className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 shadow-lg transition-transform hover:scale-[1.02]"
                     >
                        儲存設定
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default App;
