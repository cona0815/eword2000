
import React, { useMemo } from 'react';
import { Word, UserVocabProgressMap } from '../types';
import { CATEGORY_SORT_ORDER } from '../constants';

interface ProgressViewProps {
  allWords: Word[];
  userVocabProgress: UserVocabProgressMap;
  completedPages: string[];
  categories: string[];
  itemsPerPage: number;
  onNavigate: (category: string, page: number) => void;
  onTogglePage: (category: string, page: number) => void;
}

const ProgressView: React.FC<ProgressViewProps> = ({ 
  allWords, 
  userVocabProgress,
  completedPages,
  itemsPerPage, 
  onNavigate,
  onTogglePage
}) => {

  // Calculate stats per category and its chunks
  const categoryGroups = useMemo(() => {
    const groups: {
        category: string;
        total: number;
        viewed: number;
        mastered: number;
        sortIndex: number;
        chunks: {
            id: string;
            page: number;
            label: string;
            total: number;
            viewed: number;
            mastered: number;
        }[];
    }[] = [];
    
    // Group words by category first
    const wordsByCat: Record<string, Word[]> = {};
    allWords.forEach(w => {
        const cat = w.category || '其他';
        if (!wordsByCat[cat]) wordsByCat[cat] = [];
        wordsByCat[cat].push(w);
    });

    // For each category, create chunks
    Object.keys(wordsByCat).forEach(cat => {
        const catWords = wordsByCat[cat];
        const count = catWords.length;
        const chunksCount = Math.ceil(count / itemsPerPage);
        
        const sortIndex = CATEGORY_SORT_ORDER.indexOf(cat);
        const finalSortIndex = sortIndex !== -1 ? sortIndex : 999;

        const group = {
            category: cat,
            total: count,
            viewed: 0,
            mastered: 0,
            sortIndex: finalSortIndex,
            chunks: [] as {
                id: string;
                page: number;
                label: string;
                total: number;
                viewed: number;
                mastered: number;
            }[]
        };

        for (let i = 0; i < chunksCount; i++) {
            const start = i * itemsPerPage;
            const end = Math.min((i + 1) * itemsPerPage, count);
            const chunkWords = catWords.slice(start, end);
            
            const chunk = {
                id: `${cat}__${i}`,
                page: i + 1,
                label: chunksCount > 1 ? `${cat}-${i + 1}` : cat,
                total: chunkWords.length,
                viewed: 0,
                mastered: 0
            };

            chunkWords.forEach(w => {
                const progress = userVocabProgress[w.id];
                if (progress) {
                    if (progress.mapViewed) {
                        chunk.viewed++;
                        group.viewed++;
                    }
                    if (progress.correctCount >= 2) {
                        chunk.mastered++;
                        group.mastered++;
                    }
                }
            });

            group.chunks.push(chunk);
        }
        groups.push(group);
    });

    // Sort by category order
    return groups.sort((a, b) => {
        if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex;
        return a.category.localeCompare(b.category);
    });
  }, [allWords, userVocabProgress, itemsPerPage]);

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fadeIn">
      <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-slate-800 mb-2">學習地圖 🗺️</h2>
          <p className="text-slate-500">雙軌追蹤：閱讀進度 (藍) 與 精熟程度 (金)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categoryGroups.map(group => {
            const viewedPct = Math.round((group.viewed / group.total) * 100) || 0;
            const masteredPct = Math.round((group.mastered / group.total) * 100) || 0;

            return (
                <div key={group.category} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    {/* Category Header */}
                    <div className="bg-white p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-800">{group.category}</h3>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                                {group.total} 單字
                            </span>
                        </div>

                        {/* Reading Progress */}
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                                <span className="text-blue-600">總閱讀進度</span>
                                <span className="text-blue-600">{viewedPct}%</span>
                            </div>
                            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${viewedPct}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Page Boxes (Horizontal Row) */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {group.chunks.map(chunk => {
                                const isCompleted = completedPages.includes(`${group.category}-${chunk.page}`);

                                return (
                                    <div key={chunk.id} className="relative group/box">
                                        <button 
                                            onClick={() => onNavigate(group.category, chunk.page)}
                                            title={chunk.label}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all transform hover:scale-105 shadow-sm
                                                ${isCompleted 
                                                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-100 shadow-emerald-100' 
                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                                            `}
                                        >
                                            {chunk.page}
                                        </button>
                                        
                                        {/* Toggle Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglePage(group.category, chunk.page);
                                            }}
                                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all transform hover:scale-125 z-10
                                                ${isCompleted 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : 'bg-slate-300 text-white opacity-0 group-hover/box:opacity-100'}
                                            `}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mastery Progress */}
                        <div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                                <span className="text-amber-500">總制霸進度</span>
                                <span className="text-amber-500">{masteredPct}%</span>
                            </div>
                            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${masteredPct}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ProgressView;
