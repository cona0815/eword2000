
import React from 'react';
import { FamilyStats, GrammarMapData } from '../types';
import { MOLLY_GRAMMAR_UNITS } from '../constants';

interface FamilyLeaderboardProps {
  stats: FamilyStats;
  grammarMap?: GrammarMapData;
  currentUser?: string | null;
}

const FamilyLeaderboard: React.FC<FamilyLeaderboardProps> = ({ stats, grammarMap }) => {
  const { leaderboard = [], familyProgress } = stats;
  
  const totalWords = familyProgress?.totalWords || 2000;
  const masteredWords = familyProgress?.masteredWords || 0;
  const viewedWords = familyProgress?.viewedWords || 0;

  const totalPct = Math.round((masteredWords / totalWords) * 100) || 0;
  const viewedPct = Math.round((viewedWords / totalWords) * 100) || 0;

  // Calculate Grammar Progress (Current User Only)
  const totalGrammarStars: number = MOLLY_GRAMMAR_UNITS.length * 3;
  const collectedStars: number = grammarMap 
    ? Object.keys(grammarMap).reduce((acc: number, key: string) => acc + (grammarMap[key]?.stars || 0), 0) 
    : 0;
  const grammarPct: number = Math.round((collectedStars / totalGrammarStars) * 100) || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Co-op Mode: Family Goal */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl font-black">🤝</div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
                <h3 className="text-2xl font-black mb-1">家庭共同目標 🏆</h3>
                <p className="text-slate-400 font-bold">全家共同將 2000 單字推向 100% 精熟！</p>
            </div>
            <div className="text-right">
                <span className="text-4xl font-black text-emerald-400">{totalPct}%</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">總精熟度</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-400">全家閱讀進度</span>
                    <span>{viewedWords} / {totalWords}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${viewedPct}%` }}
                    ></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-amber-400">全家制霸進度</span>
                    <span>{masteredWords} / {totalWords}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${totalPct}%` }}
                    ></div>
                </div>
            </div>
            {grammarMap && (
                <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-purple-400">我的文法地圖進度</span>
                        <span>{collectedStars} / {totalGrammarStars} ⭐</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            style={{ width: `${grammarPct}%` }}
                        ></div>
                    </div>
                </div>
            )}
          </div>
          
          <p className="mt-6 text-center text-sm text-slate-400 italic">
            "三個人的努力，都會讓這個進度條往前進！加油！"
          </p>
        </div>
      </div>

      {/* Family Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderboard.map((user, idx) => (
          <div 
            key={user.username} 
            className={`bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-xl relative overflow-hidden
                ${idx === 0 ? 'border-amber-200 shadow-amber-100/50' : 'border-slate-100'}
            `}
          >
            {idx === 0 && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-4 rounded-full rotate-12 shadow-lg">
                    <span className="text-2xl">👑</span>
                </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-4 shadow-inner ${user.color}`}>
                {user.avatar}
              </div>
              
              <h4 className="text-xl font-black text-slate-800 mb-1">{user.username}</h4>
              <p className={`text-xs font-black uppercase tracking-wider mb-4 px-3 py-1 rounded-full ${user.color.replace('bg-', 'text-').replace('-100', '-600')} bg-opacity-20`}>
                {user.title}
              </p>

              <div className="w-full grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase">本週測驗</p>
                    <p className="text-lg font-black text-slate-700">{user.quizCount}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase">精熟度</p>
                    <p className="text-lg font-black text-slate-700">{user.masteryPct}%</p>
                </div>
              </div>
              
              {user.mistakeCount > 0 && (
                <div className="mt-4 w-full bg-red-50 p-3 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-red-400 uppercase">消滅錯字</span>
                    <span className="text-sm font-black text-red-600">+{user.mistakeCount}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyLeaderboard;
