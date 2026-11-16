
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Pose, GalleryItem } from '../types';
import { POSES } from '../constants';
import { transformImage } from '../geminiService';

interface LiveCoachProps {
  selectedPose: Pose | null;
  onSelectPoseRequest: () => void;
  lastUserImage: string | null;
  onNewGalleryItem: (item: GalleryItem) => void;
}

// --- Funções de áudio PCM para Live API ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const findExerciseTool: FunctionDeclaration = {
  name: 'findExercise',
  parameters: {
    type: Type.OBJECT,
    description: 'Busca um novo exercício no catálogo baseado no pedido do usuário.',
    properties: {
      query: { type: Type.STRING, description: 'O que o usuário quer treinar' },
    },
    required: ['query']
  }
};

const LiveCoach: React.FC<LiveCoachProps> = ({ selectedPose, onSelectPoseRequest, lastUserImage, onNewGalleryItem }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [aiGeneratedPose, setAiGeneratedPose] = useState<string | null>(null);
  const [isGeneratingPose, setIsGeneratingPose] = useState(false);
  const [currentPose, setCurrentPose] = useState<Pose | null>(selectedPose);
  const [curiosityQuestions, setCuriosityQuestions] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const micVisualizerRef = useRef<number>(0);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  const triggerGeneratePoseImage = async (pose: Pose) => {
    if (!lastUserImage) return;
    setIsGeneratingPose(true);
    try {
      const result = await transformImage(lastUserImage, pose);
      setAiGeneratedPose(result);
      onNewGalleryItem({
        id: Date.now().toString(),
        original: lastUserImage,
        result: result,
        poseName: pose.name,
        timestamp: Date.now()
      });
      generateCuriosityQuestions(pose);
    } catch (e) {
      console.error("Erro gerando pose IA:", e);
    } finally {
      setIsGeneratingPose(false);
    }
  };

  const generateCuriosityQuestions = async (pose: Pose) => {
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere 3 perguntas curtas e motivadoras que um aluno faria sobre o exercício "${pose.name}". Retorne apenas as 3 frases separadas por ponto e vírgula.`,
      });
      const questions = resp.text?.split(';').map(q => q.trim().replace(/^['"\d+\.\s]*/, '')) || [];
      setCuriosityQuestions(questions.filter(q => q.length > 5).slice(0, 3));
    } catch (e) {
      setCuriosityQuestions(["Como melhorar meu equilíbrio?", "Quais músculos estou usando?", "Qual o segredo desta pose?"]);
    }
  };

  useEffect(() => {
    if (selectedPose && (!currentPose || selectedPose.id !== currentPose.id)) {
      setCurrentPose(selectedPose);
    }
  }, [selectedPose]);

  useEffect(() => {
    if (currentPose) triggerGeneratePoseImage(currentPose);
  }, [currentPose]);

  const startSession = async () => {
    setIsConnecting(true);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    
    await audioContextRef.current.resume();
    await inputAudioContextRef.current.resume();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      
      if (videoRef.current) videoRef.current.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);

            // Stream Microfone
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Pequena lógica de visualização de volume
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              const rms = Math.sqrt(sum/inputData.length);
              setIsMicActive(rms > 0.01);
              
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);

            // Stream Frames de Vídeo
            frameIntervalRef.current = window.setInterval(() => {
              if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const v = videoRef.current;
                const cw = 640;
                const ch = 480;
                ctx?.drawImage(v, 0, 0, cw, ch);
                canvasRef.current.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1];
                      sessionPromise.then(s => s.sendRealtimeInput({ 
                        media: { data: base64, mimeType: 'image/jpeg' } 
                      }));
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }, 1000);
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data && audioContextRef.current) {
                  setIsAiSpeaking(true);
                  const audioBuffer = await decodeAudioData(decode(part.inlineData.data), audioContextRef.current, 24000, 1);
                  const source = audioContextRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContextRef.current.destination);
                  
                  const now = audioContextRef.current.currentTime;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  
                  source.onended = () => {
                    if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.2) {
                      setIsAiSpeaking(false);
                    }
                  };
                }
              }
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'findExercise') {
                  const { query } = fc.args as any;
                  const found = POSES.find(p => p.name.toLowerCase().includes(query.toLowerCase())) || POSES[Math.floor(Math.random()*POSES.length)];
                  setCurrentPose(found);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: `Ok, mudando para ${found.name}.` } }
                  }));
                }
              }
            }
          },
          onclose: () => stopSession(),
          onerror: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: [findExerciseTool] }],
          systemInstruction: `Você é o Coach PoseMaster AI. Fale sempre por VOZ.
          1. Use a câmera para ver o usuário e corrigir sua postura no exercício "${currentPose?.name || 'solicitado'}".
          2. Seja um treinador de elite: firme, motivador e técnico.
          3. O usuário pode falar com você livremente. Responda-o por voz de forma concisa.
          4. Se o usuário clicar em uma pergunta na tela, ela chegará como texto; responda-a detalhadamente por voz.`,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const askQuestion = (q: string) => {
    if (sessionRef.current && isActive) {
      sessionRef.current.sendRealtimeInput({ text: q });
      // Regenera perguntas após um pequeno delay para manter o usuário interessado
      setTimeout(() => {
        if (currentPose) generateCuriosityQuestions(currentPose);
      }, 3000);
    }
  };

  const stopSession = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (sessionRef.current) sessionRef.current.close();
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    setIsFullscreen(false);
  };

  return (
    <div className={`transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'max-w-7xl mx-auto pb-20'}`}>
      
      {/* Container Principal de Layout */}
      <div className={`grid gap-6 h-full ${isFullscreen ? 'p-0' : 'lg:grid-cols-[1.7fr_1fr]'}`}>
        
        {/* Área da Câmera (Ocupa a maior parte) */}
        <div className="relative group">
          <div className={`bg-slate-900 overflow-hidden shadow-2xl transition-all duration-500 relative ${isFullscreen ? 'w-full h-full' : 'rounded-[3rem] border-8 border-white aspect-video'}`}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            
            {/* Overlay: Não ativo */}
            {!isActive && !isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-700 text-white w-24 h-24 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center">
                  <i className="fas fa-play text-3xl ml-2"></i>
                </button>
                <p className="text-white font-black mt-6 tracking-widest text-sm uppercase">Ativar Câmera & Coach Live</p>
              </div>
            )}

            {/* Overlay: Conectando */}
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Conectando I.A. de Visão...</p>
              </div>
            )}

            {/* Status e Controles da Câmera (Sobrepostos) */}
            {isActive && (
              <>
                <div className="absolute top-8 left-8 flex flex-col gap-3">
                  <div className="bg-red-600/90 backdrop-blur-md text-white px-5 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-red-500/30">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                    <span className="text-[11px] font-black uppercase tracking-wider">Vision Engine On</span>
                  </div>
                  {isAiSpeaking && (
                    <div className="bg-indigo-600/90 backdrop-blur-md text-white px-5 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-indigo-500/30 animate-fadeIn">
                      <i className="fas fa-headset text-xs"></i>
                      <span className="text-[11px] font-black uppercase tracking-wider">Coach Orientando</span>
                    </div>
                  )}
                </div>

                {/* Microfone Activity Meter */}
                <div className="absolute top-8 right-8 flex items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20">
                   <div className="flex gap-1 h-4 items-end">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1 bg-white rounded-full transition-all duration-150 ${isMicActive ? 'h-full opacity-100' : 'h-[20%] opacity-40'}`} style={{ transitionDelay: `${i*30}ms` }}></div>
                      ))}
                   </div>
                   <span className="text-white text-[10px] font-black uppercase tracking-widest">Escutando Você</span>
                </div>

                {/* Botão Fullscreen */}
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)} 
                  className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/30 text-white w-14 h-14 rounded-2xl backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all"
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xl`}></i>
                </button>

                {/* Pose Overlay em Fullscreen */}
                {isFullscreen && aiGeneratedPose && (
                  <div className="absolute bottom-8 left-8 w-64 md:w-80 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-slideUp">
                     <img src={aiGeneratedPose} alt="Ref" className="w-full h-full object-contain aspect-video" />
                     <div className="p-4 bg-black/40 text-center">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{currentPose?.name}</p>
                     </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Barra de Legendagem/Feedback */}
          {isActive && !isFullscreen && (
            <div className="mt-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <i className="fas fa-wave-square"></i>
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audio Feedback</p>
                   <p className="text-sm font-bold text-slate-800">Fale com a IA: "Como está minha postura?"</p>
                 </div>
               </div>
               <div className="flex gap-1">
                 {[1,2,3,4,5,6,7,8].map(i => (
                   <div key={i} className={`w-1.5 bg-indigo-600 rounded-full transition-all duration-300 ${isAiSpeaking ? 'animate-wave' : 'h-2 opacity-20'}`} style={{ animationDelay: `${i*0.1}s`, height: isAiSpeaking ? '100%' : '8px' }}></div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Pose e Perguntas (Ou Overlay se Fullscreen) */}
        <div className={`space-y-6 flex flex-col ${isFullscreen ? 'fixed bottom-8 right-8 z-[110] w-96' : ''}`}>
          
          {/* Card da Pose de Referência (Ajustado para não cortar) */}
          <div className={`${isFullscreen ? 'hidden md:block' : ''} bg-white rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden relative group`}>
             <div className="aspect-video bg-slate-50 flex items-center justify-center relative">
                {isGeneratingPose ? (
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase">Processando Pose...</p>
                   </div>
                ) : aiGeneratedPose ? (
                   <img src={aiGeneratedPose} alt="Ref" className="w-full h-full object-contain" />
                ) : (
                   <div className="text-center p-8 opacity-20">
                      <i className="fas fa-image text-5xl mb-4"></i>
                      <p className="text-xs font-black uppercase">Aguardando Seleção</p>
                   </div>
                )}
                
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none"></div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Alvo Técnico</p>
                   <p className="text-sm font-black text-slate-800 truncate max-w-[150px]">{currentPose?.name || '---'}</p>
                </div>
                <button onClick={onSelectPoseRequest} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                   Biblioteca
                </button>
             </div>
          </div>

          {/* Perguntas Inteligentes (Renovação dinâmica) */}
          <div className={`${isFullscreen ? 'bg-black/40 backdrop-blur-2xl border-white/10' : 'bg-white border-slate-100'} p-8 rounded-[3rem] shadow-2xl border flex-grow space-y-6 overflow-hidden`}>
             <div className="flex items-center justify-between">
                <h4 className={`${isFullscreen ? 'text-white/40' : 'text-slate-400'} text-[11px] font-black uppercase tracking-[0.2em]`}>Curiosidades do Treino</h4>
                {isActive && <i className="fas fa-sparkles text-indigo-500 animate-pulse text-xs"></i>}
             </div>

             <div className="flex flex-col gap-3">
                {curiosityQuestions.length > 0 ? curiosityQuestions.map((q, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => askQuestion(q)}
                     disabled={!isActive}
                     className={`text-left p-5 rounded-[2rem] border transition-all duration-300 group disabled:opacity-30 ${isFullscreen ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-lg'}`}
                   >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold pr-4 leading-relaxed">{q}</span>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                           <i className="fas fa-volume-high text-[10px]"></i>
                        </div>
                      </div>
                   </button>
                )) : (
                  <div className="py-8 text-center opacity-30 italic text-xs">Aguardando IA gerar sugestões...</div>
                )}
             </div>

             <div className={`p-5 rounded-3xl border-2 border-dashed transition-all duration-500 flex items-center gap-4 ${isAiSpeaking ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${isAiSpeaking ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-slate-300'}`}>
                   <i className={`fas ${isAiSpeaking ? 'fa-comment-dots animate-bounce' : 'fa-microphone-slash'}`}></i>
                </div>
                <div>
                   <p className={`${isFullscreen ? 'text-white' : 'text-slate-800'} text-[11px] font-black uppercase tracking-widest`}>{isAiSpeaking ? 'Coach respondendo...' : 'IA ouvindo você'}</p>
                   <p className="text-slate-400 text-[9px] font-medium mt-0.5 leading-tight">O microfone está ativo. Fale ou clique acima para aprender.</p>
                </div>
             </div>
          </div>

          {/* Botão de Encerrar (Aparece no canto ou no final) */}
          {isActive && (
            <div className="text-center">
               <button onClick={stopSession} className={`px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${isFullscreen ? 'bg-red-600 text-white hover:bg-red-700 w-full' : 'bg-white border-2 border-red-100 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                  Sair do Treino
               </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.8); }
        }
        .animate-wave {
          animation: wave 0.8s infinite ease-in-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveCoach;
