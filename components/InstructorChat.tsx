
import React, { useState, useRef, useEffect } from 'react';
import { Message, Pose } from '../types';
import Uploader from './Uploader';

interface InstructorChatProps {
  history: Message[];
  onSend: (text: string) => void;
  onSelectPose: (pose: Pose) => void;
  isLoading: boolean;
  userImage: string | null;
  onUpload: (base64: string) => void;
}

const InstructorChat: React.FC<InstructorChatProps> = ({ 
  history, onSend, onSelectPose, isLoading, userImage, onUpload 
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[75vh] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      {/* Sidebar de Perfil/Instrução Rápida */}
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Seu Perfil de Treino</h3>
          <div className="mb-6">
            <p className="text-[10px] text-slate-500 mb-2">Foto para análise técnica:</p>
            <Uploader onUpload={onUpload} currentImage={userImage} />
          </div>
          <div className="mt-auto bg-indigo-600 p-4 rounded-2xl text-white">
            <p className="text-xs font-bold mb-1"><i className="fas fa-lightbulb mr-2"></i> Dica do Pro:</p>
            <p className="text-[10px] opacity-80 leading-relaxed">Envie uma foto em pé para que eu possa analisar seu alinhamento postural.</p>
          </div>
        </div>

        {/* Área do Chat */}
        <div className="flex-grow flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <i className="fas fa-user-doctor"></i>
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-sm">Instrutor PoseMaster</h2>
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online agora
                </span>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
            {history.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-slate-300 text-2xl"></i>
                </div>
                <p className="text-slate-500 font-medium">Olá! Eu sou seu instrutor técnico. Como posso ajudar no seu treino hoje?</p>
                <p className="text-slate-400 text-xs mt-2">Pergunte sobre postura, benefícios ou peça uma recomendação.</p>
              </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.suggestedPose && (
                    <div className="mt-4 bg-white rounded-xl border border-indigo-100 p-3 shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg p-1 flex-shrink-0">
                        <img src={msg.suggestedPose.imageUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Sugestão de Treino</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{msg.suggestedPose.name}</p>
                      </div>
                      <button 
                        onClick={() => onSelectPose(msg.suggestedPose!)}
                        className="bg-indigo-600 text-white text-[10px] font-black px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        PRATICAR AGORA
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao instrutor técnico..."
              className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstructorChat;
