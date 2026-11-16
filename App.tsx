
import React, { useState, useMemo, useEffect } from 'react';
import { POSES } from './constants';
import { Pose, AppState, PoseCategory, Message, GalleryItem } from './types';
import { transformImage, getInstructorResponse } from './geminiService';
import Header from './components/Header';
import PoseCard from './components/PoseCard';
import Uploader from './components/Uploader';
import ResultDisplay from './components/ResultDisplay';
import InstructorChat from './components/InstructorChat';
import LiveCoach from './components/LiveCoach';
import Gallery from './components/Gallery';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    selectedPose: null,
    userImage: null,
    resultImage: null,
    isLoading: false,
    error: null,
    view: 'catalog',
    chatHistory: [],
    gallery: [],
    fromLiveView: false,
  });

  const [filter, setFilter] = useState<PoseCategory | 'All'>('All');
  const [visibleCount, setVisibleCount] = useState(60);

  const filteredPoses = useMemo(() => {
    return filter === 'All' ? POSES : POSES.filter(p => p.category === filter);
  }, [filter]);

  useEffect(() => {
    setVisibleCount(60);
  }, [filter]);

  const addToGallery = (item: GalleryItem) => {
    setState(prev => ({ ...prev, gallery: [item, ...prev.gallery] }));
  };

  const handleSelectPose = (pose: Pose) => {
    setState(prev => {
      const isFromLive = prev.fromLiveView;
      return { 
        ...prev, 
        selectedPose: pose, 
        error: null,
        view: isFromLive ? 'live' : prev.view, // Volta para live se veio de lá
        fromLiveView: false // Reseta o flag
      };
    });
    
    if (state.view === 'catalog' && !state.fromLiveView) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpload = (base64Image: string) => {
    setState(prev => ({ ...prev, userImage: base64Image, error: null }));
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { role: 'user', text };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg], isLoading: true }));
    try {
      const response = await getInstructorResponse(text, state.chatHistory, state.userImage);
      const modelMsg: Message = { role: 'model', text: response.text, suggestedPose: response.suggestedPose };
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, modelMsg], isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: "Erro no instrutor", isLoading: false }));
    }
  };

  const handleProcess = async () => {
    if (!state.selectedPose || !state.userImage) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await transformImage(state.userImage, state.selectedPose);
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        original: state.userImage,
        result: result,
        poseName: state.selectedPose.name,
        timestamp: Date.now()
      };
      addToGallery(newItem);
      setState(prev => ({ ...prev, resultImage: result, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || "Erro IA", isLoading: false }));
    }
  };

  const reset = () => {
    setState(prev => ({ ...prev, selectedPose: null, userImage: null, resultImage: null, isLoading: false, error: null, view: 'catalog', fromLiveView: false }));
  };

  const categories: {id: PoseCategory | 'All', label: string}[] = [
    { id: 'All', label: 'Tudo' }, { id: 'Gym', label: 'Academia' }, { id: 'Yoga', label: 'Yoga' },
    { id: 'Pilates', label: 'Pilates' }, { id: 'Stretching', label: 'Alongar' }, { id: 'MartialArts', label: 'Lutas' },
    { id: 'Sports', label: 'Esportes' }, { id: 'Modeling', label: 'Editorial' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onLogoClick={reset} />
      
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar md:gap-8 justify-start">
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'catalog', selectedPose: null, fromLiveView: false }))}
            className={`py-4 px-4 font-bold text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${state.view === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            <i className="fas fa-th-large mr-2"></i> Biblioteca
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'instructor', selectedPose: null, fromLiveView: false }))}
            className={`py-4 px-4 font-bold text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${state.view === 'instructor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            <i className="fas fa-user-tie mr-2"></i> Instrutor
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'live', fromLiveView: false }))}
            className={`py-4 px-4 font-bold text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${state.view === 'live' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            <i className="fas fa-video mr-2"></i> Coach Live
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'gallery', selectedPose: null, fromLiveView: false }))}
            className={`py-4 px-4 font-bold text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${state.view === 'gallery' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            <i className="fas fa-images mr-2"></i> Galeria
          </button>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {state.view === 'catalog' && !state.selectedPose && (
          <section className="animate-fadeIn">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Treine com <span className="text-indigo-600">Perfeição</span></h2>
              <p className="text-slate-500">Navegue por 5.000 variações técnicas para todos os níveis.</p>
            </div>
            <div className="flex overflow-x-auto pb-6 mb-10 gap-2 no-scrollbar">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 whitespace-nowrap ${filter === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-600 border-white hover:border-indigo-100 shadow-sm'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredPoses.slice(0, visibleCount).map(pose => (
                <PoseCard key={pose.id} pose={pose} onSelect={handleSelectPose} isActive={state.selectedPose?.id === pose.id} />
              ))}
            </div>
            {visibleCount < filteredPoses.length && (
              <div className="mt-12 text-center"><button onClick={() => setVisibleCount(p => p + 60)} className="bg-white border-2 border-indigo-100 text-indigo-600 px-10 py-4 rounded-2xl font-black shadow-sm">Ver Mais</button></div>
            )}
          </section>
        )}

        {state.view === 'instructor' && (
          <InstructorChat history={state.chatHistory} onSend={handleSendMessage} onSelectPose={p => { handleSelectPose(p); setState(prev => ({ ...prev, view: 'catalog' })); }} isLoading={state.isLoading} userImage={state.userImage} onUpload={handleUpload} />
        )}

        {state.view === 'live' && (
            <LiveCoach 
              selectedPose={state.selectedPose} 
              onSelectPoseRequest={() => setState(prev => ({ ...prev, view: 'catalog', fromLiveView: true }))} 
              lastUserImage={state.userImage} 
              onNewGalleryItem={addToGallery} 
            />
        )}

        {state.view === 'gallery' && (
            <Gallery items={state.gallery} onSelectPose={(p) => handleSelectPose(p)} />
        )}

        {state.view === 'catalog' && state.selectedPose && !state.resultImage && !state.isLoading && (
          <section className="max-w-2xl mx-auto animate-fadeIn">
            <button onClick={() => setState(prev => ({ ...prev, selectedPose: null }))} className="mb-6 flex items-center text-indigo-600 font-bold"><i className="fas fa-arrow-left mr-2"></i> Voltar</button>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-slate-100">
              <div className="p-8 bg-indigo-600 text-white flex items-center justify-between">
                <div><h2 className="text-3xl font-black">{state.selectedPose.name}</h2><p className="text-indigo-200 text-sm mt-1">{state.selectedPose.description}</p></div>
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm"><img src={state.selectedPose.imageUrl} alt="" className="w-full h-full object-contain invert brightness-0" /></div>
              </div>
              <div className="p-8">
                <Uploader onUpload={handleUpload} currentImage={state.userImage} />
                {state.userImage && (
                  <button onClick={handleProcess} className="w-full mt-8 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 text-lg">
                    <i className="fas fa-wand-magic-sparkles"></i> Gerar Visual da Pose
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {state.isLoading && state.view === 'catalog' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-slate-600 tracking-tight uppercase">Processando seu movimento...</p>
          </div>
        )}

        {state.resultImage && state.view === 'catalog' && !state.isLoading && (
          <ResultDisplay original={state.userImage!} result={state.resultImage} poseName={state.selectedPose!.name} onReset={reset} onTryAgain={() => setState(prev => ({ ...prev, resultImage: null }))} />
        )}

        {state.error && (
          <div className="max-w-md mx-auto mt-8 bg-red-50 text-red-600 p-5 rounded-2xl border-2 border-red-100 shadow-sm flex items-center gap-4">
            <i className="fas fa-triangle-exclamation text-xl"></i><p className="text-sm font-medium">{state.error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
