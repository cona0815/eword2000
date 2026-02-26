
import React from 'react';
import { FamilyStats, GrammarMapData } from '../types';

interface FamilyLeaderboardProps {
  stats: FamilyStats;
  grammarMap?: GrammarMapData;
  currentUser?: string | null;
}

const FamilyLeaderboard: React.FC<FamilyLeaderboardProps> = ({ stats, currentUser }) => {
  const { leaderboard = [] } = stats;
  
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Family Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderboard.map((user) => {
          const isCurrentUser = user.id === currentUser;
          
          return (
            <div 
              key={user.username} 
              className={`bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-xl relative overflow-hidden
                  ${isCurrentUser ? 'border-amber-400 shadow-amber-200 ring-4 ring-amber-100 transform scale-105 z-10' : 'border-slate-100'}
              `}
            >
              {isCurrentUser && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-3 rounded-full shadow-lg z-20">
                      <span className="text-xl">👑</span>
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
          );
        })}
      </div>
    </div>
  );
};

export default FamilyLeaderboard;
