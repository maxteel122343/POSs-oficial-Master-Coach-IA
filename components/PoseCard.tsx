
import React from 'react';
import { Pose } from '../types';

interface PoseCardProps {
  pose: Pose;
  onSelect: (pose: Pose) => void;
  isActive: boolean;
}

const PoseCard: React.FC<PoseCardProps> = ({ pose, onSelect, isActive }) => {
  return (
    <div 
      onClick={() => onSelect(pose)}
      className={`
        cursor-pointer group relative bg-white rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:-translate-y-1
        ${isActive ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200'}
      `}
    >
      <div className="aspect-square bg-slate-50 flex items-center justify-center p-6 relative">
        {/* Silhouette Preview Image */}
        <img 
          src={pose.imageUrl} 
          alt={pose.name} 
          loading="lazy"
          className={`
            w-full h-full object-contain transition-all duration-300
            ${isActive ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0'}
          `}
        />
        
        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-[10px] p-1.5 rounded-lg shadow-sm">
          <i className={`fas ${getCategoryIcon(pose.category)} text-indigo-600`}></i>
        </div>
      </div>
      
      <div className={`p-3 text-center border-t border-slate-50 ${isActive ? 'bg-indigo-50' : 'bg-white'}`}>
        <h3 className={`text-[11px] font-bold truncate leading-tight mb-1 ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
          {pose.name}
        </h3>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-tighter ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          {pose.category}
        </span>
      </div>
    </div>
  );
};

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Modeling': return 'fa-camera-retro';
    case 'Senior': return 'fa-person-cane';
    case 'Kids': return 'fa-child';
    case 'Rehab': return 'fa-briefcase-medical';
    case 'Office': return 'fa-laptop-code';
    case 'Gym': return 'fa-dumbbell';
    case 'Pilates': return 'fa-yin-yang';
    case 'Yoga': return 'fa-spa';
    case 'Sports': return 'fa-trophy';
    case 'Dance': return 'fa-music';
    case 'MartialArts': return 'fa-hand-fist';
    case 'Functional': return 'fa-bolt';
    case 'Stretching': return 'fa-child-reaching';
    case 'Lying': return 'fa-couch';
    case 'Sitting': return 'fa-chair';
    case 'Standing': return 'fa-walking';
    case 'Inverted': return 'fa-arrows-up-down';
    case 'Dynamic': return 'fa-fire';
    case 'Couple': return 'fa-user-group';
    default: return 'fa-user';
  }
}

export default PoseCard;
