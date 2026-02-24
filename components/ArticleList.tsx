import React, { useEffect, useState } from 'react';
import { Article } from '../types';
import { fetchArticles } from '../services/gasService';
import { playGeminiTts } from '../services/geminiService';

interface ArticleListProps {
  onBack: () => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      const data = await fetchArticles();
      // Sort by createdAt desc
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setArticles(sorted);
      setLoading(false);
    };
    loadArticles();
  }, []);

  const handlePlayAudio = async (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(id);
    try {
      await playGeminiTts(text);
    } catch (error) {
      console.error('Audio playback failed:', error);
      alert('播放失敗，請稍後再試');
    } finally {
      setIsPlaying(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <span className="text-3xl">📚</span> 我的文章庫
        </h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition-colors"
        >
          返回
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">還沒有儲存的文章</h3>
          <p className="text-slate-500">使用「AI 題庫分析」功能來新增文章吧！</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <div 
              key={article.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedId === article.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}
            >
              <div 
                onClick={() => toggleExpand(article.id)}
                className="p-6 cursor-pointer flex justify-between items-start gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{article.title}</h3>
                  <div className="text-sm text-slate-400 mb-4">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </div>
                  <p className={`text-slate-600 leading-relaxed ${expandedId === article.id ? '' : 'line-clamp-2'}`}>
                    {article.english}
                  </p>
                </div>
                <button
                  onClick={(e) => handlePlayAudio(article.id, article.english, e)}
                  disabled={isPlaying !== null}
                  className={`flex-shrink-0 p-3 rounded-full transition-all ${isPlaying === article.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600'}`}
                >
                  {isPlaying === article.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  )}
                </button>
              </div>

              {expandedId === article.id && (
                <div className="px-6 pb-6 animate-fadeIn">
                  <div className="h-px bg-slate-100 my-4"></div>
                  <h4 className="text-sm font-bold text-emerald-600 mb-2">中文翻譯</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {article.chinese}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleList;
