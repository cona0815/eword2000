import React, { useState, useRef, useEffect } from 'react';
import { generateAiAnalysis, playGeminiTts } from '../services/geminiService';
import { syncQuestionsToSheet, saveArticle } from '../services/gasService';
import { QuizQuestion, Article } from '../types';

interface AiAnalysisModalProps {
  onClose: () => void;
  onLookupWord: (term: string) => void;
  currentUser: string | null;
}

type AnalysisType = 'article' | 'quiz';

interface AnalysisResult {
  type: AnalysisType;
  content?: {
    english: string;
    chinese: string;
  };
  questions?: QuizQuestion[];
}

// Internal component to handle Article display state (translation visibility)
const ArticleRenderer: React.FC<{
  content: { english: string; chinese: string };
  onLookupWord: (term: string) => void;
  onSave: () => void;
  onPlay: (text: string) => void;
  isSaving: boolean;
  isPlaying: boolean;
}> = ({ content, onLookupWord, onSave, onPlay, isSaving, isPlaying }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const words = content.english.split(/(\s+)/);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-slate-700">英文原文 (點擊查單字)</h3>
          <div className="flex gap-2">
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span> 儲存中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  儲存文章
                </>
              )}
            </button>
            <button 
              onClick={() => onPlay(content.english)}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-all ${isPlaying ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300'}`}
            >
              {isPlaying ? (
                <>
                  <span className="animate-spin">⏳</span> 播放中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  AI 朗讀
                </>
              )}
            </button>
          </div>
        </div>
        <div className="text-lg leading-relaxed text-slate-800">
          {words.map((part, index) => {
            if (part.trim() === '') return <span key={index}>{part}</span>;
            const isWord = /[a-zA-Z]/.test(part);
            if (!isWord) return <span key={index}>{part}</span>;
            
            return (
              <span 
                key={index} 
                onClick={() => onLookupWord(part.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))}
                className="cursor-pointer hover:bg-yellow-200 hover:text-blue-600 rounded px-0.5 transition-colors"
              >
                {part}
              </span>
            );
          })}
        </div>
      </div>
      
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 transition-all">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-emerald-700">中文翻譯</h3>
          <button 
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            {showTranslation ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                隱藏翻譯
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                顯示翻譯
              </>
            )}
          </button>
        </div>
        
        {showTranslation ? (
          <div className="text-lg leading-relaxed text-slate-700 animate-fadeIn">
            {content.chinese}
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-emerald-400/50 italic border-2 border-dashed border-emerald-200/50 rounded-lg">
            翻譯已隱藏，點擊上方按鈕顯示
          </div>
        )}
      </div>
    </div>
  );
};

const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({ onClose, onLookupWord, currentUser }) => {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setFile(blob);
            // Optional: You could show a toast here "Image pasted!"
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText && !file) {
      alert('請輸入文字或上傳圖片/PDF');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const analysis = await generateAiAnalysis(inputText, file);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!result?.questions || !currentUser) return;
    setSyncing(true);
    try {
      await syncQuestionsToSheet(currentUser, result.questions);
      alert('題庫已同步到試算表！');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!result?.content) return;
    setSavingArticle(true);
    try {
      const article: Partial<Article> = {
        title: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : '') || 'Uploaded Article',
        english: result.content.english,
        chinese: result.content.chinese,
      };
      await saveArticle(article);
      alert('文章已儲存到試算表！');
    } catch (error) {
      console.error('Save article failed:', error);
      alert('儲存失敗');
    } finally {
      setSavingArticle(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await playGeminiTts(text);
    } catch (error) {
      console.error('Audio playback failed:', error);
      alert('播放失敗，請稍後再試');
    } finally {
      setIsPlaying(false);
    }
  };

  const renderQuiz = (questions: QuizQuestion[]) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">AI 生成題庫 ({questions.length} 題)</h3>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                同步中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                同步到試算表
              </>
            )}
          </button>
        </div>

        <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${q.grammarTag ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {q.grammarTag ? '文法題' : '單字題'}
                </span>
                {q.grammarTag && <span className="text-xs text-slate-500">{q.grammarTag}</span>}
              </div>
              <p className="font-bold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-2 rounded border text-sm ${i === q.correctAnswerIndex ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
                <span className="font-bold">解析：</span> {q.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">AI 題庫分析</h2>
              <p className="text-slate-500 text-sm font-bold">自動翻譯文章、生成題庫</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {!result ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  輸入文字或文章 (支援貼上圖片 Ctrl+V)
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="請貼上英文文章或題目..."
                  className="w-full h-40 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  或上傳圖片/PDF
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors group flex flex-col items-center justify-center"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden" 
                    />
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</div>
                    <p className="text-slate-500 font-bold">
                      選擇檔案
                    </p>
                    <p className="text-xs text-slate-400 mt-1">.jpg, .png, .pdf</p>
                  </div>

                  <div 
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors group flex flex-col items-center justify-center"
                  >
                     <input 
                      type="file" 
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden" 
                    />
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                    <p className="text-slate-500 font-bold">
                      相機拍照
                    </p>
                    <p className="text-xs text-slate-400 mt-1">手機/平板適用</p>
                  </div>
                </div>
                
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-bold text-sm truncate">{file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-auto text-blue-400 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || (!inputText && !file)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span> 開始分析
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                   <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.type === 'article' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {result.type === 'article' ? '文章模式' : '題庫模式'}
                   </span>
                </div>
                <button 
                  onClick={() => setResult(null)}
                  className="text-slate-500 hover:text-slate-700 font-bold text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                  重新分析
                </button>
              </div>

              {result.type === 'article' && result.content && (
                <ArticleRenderer 
                  content={result.content}
                  onLookupWord={onLookupWord}
                  onSave={handleSaveArticle}
                  onPlay={handlePlayAudio}
                  isSaving={savingArticle}
                  isPlaying={isPlaying}
                />
              )}
              {result.type === 'quiz' && result.questions && renderQuiz(result.questions)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisModal;
