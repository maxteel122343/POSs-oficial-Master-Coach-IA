
import React from 'react';
import { GalleryItem } from '../types';

interface GalleryProps {
  items: GalleryItem[];
  onSelectPose: (poseName: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ items }) => {
  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 mb-2">Sua <span className="text-indigo-600">Jornada</span></h2>
        <p className="text-slate-500 font-medium tracking-tight">Histórico completo de evoluções e transformações.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-image-portrait text-slate-300 text-3xl"></i>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Galeria Vazia</p>
          <p className="text-slate-400 text-xs mt-2">Comece a transformar poses ou treine com o Coach Live para ver suas fotos aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="relative aspect-video overflow-hidden">
                <img src={item.result} alt={item.poseName} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                  {item.poseName}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-800 font-bold text-sm">{item.poseName}</p>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">
                    {new Date(item.timestamp).toLocaleDateString()} às {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = item.result;
                    link.download = `pose-${item.poseName.toLowerCase()}.png`;
                    link.click();
                  }}
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
