
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (base64: string) => void;
  currentImage: string | null;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {currentImage ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-indigo-200 bg-indigo-50">
          <img 
            src={currentImage} 
            alt="Preview" 
            className="w-full max-h-80 object-contain mx-auto p-4"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={triggerUpload}
              className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
            >
              Change Photo
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={triggerUpload}
          className="border-4 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 transition-colors">
            <i className="fas fa-cloud-arrow-up text-3xl text-slate-400 group-hover:text-indigo-500"></i>
          </div>
          <p className="text-lg font-semibold text-slate-700">Click to upload or drag & drop</p>
          <p className="text-sm text-slate-500 mt-1">High-quality JPG, PNG (Max 10MB)</p>
          <div className="mt-6 inline-flex items-center gap-2 text-indigo-600 font-medium">
            <i className="fas fa-camera"></i>
            Take a selfie
          </div>
        </div>
      )}
    </div>
  );
};

export default Uploader;
