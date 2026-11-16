
import React from 'react';

interface HeaderProps {
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onLogoClick}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-person-running text-xl"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pose<span className="text-indigo-600">Master</span> AI
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-slate-600 hover:text-indigo-600 font-medium">Library</a>
          <a href="#" className="text-slate-600 hover:text-indigo-600 font-medium">How it works</a>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
            Get Pro
          </button>
        </nav>

        <button className="md:hidden text-slate-600">
          <i className="fas fa-bars text-2xl"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
