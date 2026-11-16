
import React from 'react';

interface ResultDisplayProps {
  original: string;
  result: string;
  poseName: string;
  onReset: () => void;
  onTryAgain: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ original, result, poseName, onReset, onTryAgain }) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = result;
    link.download = `posemaster-${poseName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-900 mb-2">Transformation Complete!</h2>
        <p className="text-slate-600">You're now a master of the <span className="font-bold text-indigo-600">{poseName}</span>.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Original Photo</p>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
            <img src={original} alt="Original" className="w-full h-[500px] object-cover" />
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-indigo-400 uppercase tracking-widest">AI Pose Result</p>
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500 bg-white relative">
            <img src={result} alt="Result" className="w-full h-[500px] object-cover" />
            <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
              AI Generated
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
        <button 
          onClick={downloadImage}
          className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-download"></i>
          Download Photo
        </button>
        <button 
          onClick={onTryAgain}
          className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-redo"></i>
          Try Another Pose
        </button>
        <button 
          onClick={onReset}
          className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 px-8 rounded-xl transition-all"
        >
          New Project
        </button>
      </div>

      <div className="mt-16 bg-indigo-50 rounded-2xl p-8 text-center border border-indigo-100">
        <h3 className="text-xl font-bold text-indigo-900 mb-2">Loving the results?</h3>
        <p className="text-indigo-700 mb-6">Share your transformation on social media and tag #PoseMasterAI</p>
        <div className="flex justify-center gap-4">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow hover:scale-110 transition-transform">
            <i className="fab fa-instagram text-xl"></i>
          </button>
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow hover:scale-110 transition-transform">
            <i className="fab fa-tiktok text-xl"></i>
          </button>
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow hover:scale-110 transition-transform">
            <i className="fab fa-twitter text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
