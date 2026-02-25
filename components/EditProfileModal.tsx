import React, { useState } from 'react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

const EMOJI_OPTIONS = [
  '👨', '👩', '👧', '👦', '👴', '👵', 
  '🐶', '🐱', '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🦄', '🐲', '👽', '🤖', '👻', 
  '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟',
  '🦊', '🐰', '🐹', '🐭', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
  '🕷', '🕸', '🐢', '🐍', '🦎', '🦂', '🦀', '🦑', '🐙', '🦐', '🐠', '🐟', '🐡',
  '🐬', '🦈', '🐳', '🐋', '🐊', '🐆', '🐅', '🐃', '🐂', '🐄', '🐪', '🐫', '🐘',
  '🦏', '🦍', '🐎', '🐖', '🐐', '🐑', '🐏', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊',
  '🐇', '🐁', '🐀', '🐿', '🐾', '🐉', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿',
  '☘', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀',
  '🌻', '🌼', '🌸', '🌺', '🌎', '🌍', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒',
  '🌓', '🌔', '🌚', '🌝', '🌛', '🌜', '🌞', '🌟', '⭐️', '🌠', '☁️', '⛅️', '⛈',
  '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬', '🌈', '☂', '☔️', '⚡️',
  '❄️', '☃', '⛄️', '☄', '🔥', '💧', '🌊'
];
const COLOR_OPTIONS = [
  'bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 
  'bg-purple-500', 'bg-orange-500', 'bg-red-500', 
  'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500',
  'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-black text-white mb-8 text-center">編輯個人檔案</h2>

        <div className="flex flex-col items-center gap-6 mb-8">
          <div className={`w-32 h-32 ${color} rounded-2xl flex items-center justify-center text-6xl shadow-xl ring-4 ring-slate-800 transition-all`}>
            {avatar}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-slate-400 font-bold mb-2 text-sm uppercase tracking-wider">暱稱</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-xl px-4 py-3 font-bold focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="輸入您的名字"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-2 text-sm uppercase tracking-wider">選擇頭像</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-slate-700 transition-colors ${avatar === emoji ? 'bg-slate-700 ring-2 ring-blue-500' : 'bg-slate-800'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-2 text-sm uppercase tracking-wider">選擇主題色</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map(c => (
                <button 
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg ${c} hover:opacity-80 transition-opacity ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">取消</button>
          <button 
            onClick={() => {
              onSave({ ...profile, name, avatar, color });
              onClose();
            }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all transform hover:scale-[1.02]"
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
