'use client';

import React, { useState } from 'react';

interface JournalPageProps {
  children?: React.ReactNode;
  stepNumber?: number;
  stepTitle?: string;
  prompt?: string;
  placeholder?: string;
  onSave?: (content: string) => void;
  onBack?: () => void;
  initialContent?: string;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  children,
  stepNumber = 3,
  stepTitle = 'الخطوة الثالثة: اكتب',
  prompt = 'كيف تنطبق هذه الآية على حياتك اليوم؟',
  placeholder = 'ابدأ الكتابة هنا بكل صدق وهدوء...',
  onSave,
  onBack,
  initialContent = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    // Count Arabic/English words
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content);
      }
      // Simulate save delay
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Error saving:', error);
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="dark bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col"
    >
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#15130f] border-b border-[#c9b88a]/15 flex flex-row-reverse justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="text-on-surface-variant hover:text-primary transition-colors duration-500 flex items-center justify-center p-2"
            aria-label="حفظ"
            disabled={isSaving}
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
            </svg>
          </button>
          <div className="h-6 w-[1px] bg-outline-variant/30"></div>
          <span className="text-xs font-body uppercase tracking-widest text-on-surface-variant">
            الخطوة {stepNumber}
          </span>
        </div>

        <h1 className="font-serif text-2xl tracking-wide font-medium text-primary">
          {stepTitle}
        </h1>

        <button
          onClick={handleBack}
          className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center p-2"
          aria-label="العودة"
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </header>

      {/* Main Content Sanctuary */}
      <main className="flex-grow pt-24 pb-32 px-6 md:px-12 lg:px-24 max-w-4xl mx-auto w-full flex flex-col">
        {/* Contextual Prompt Section */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-3 text-primary-fixed-dim/60">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.2em] font-body">
              تأمل وجداني
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl leading-relaxed text-on-surface max-w-2xl">
            {prompt}
          </h2>
          <div className="h-px w-16 bg-gradient-to-l from-primary/40 to-transparent"></div>
        </div>

        {/* The Writing Canvas */}
        <div className="relative flex-grow flex flex-col bg-surface-container-lowest/30 rounded-xl p-8 border border-outline-variant/10 shadow-inner">
          {/* Subtle Line Guide Decor */}
          <div className="absolute inset-y-0 right-12 w-px bg-primary/5 pointer-events-none"></div>

          <textarea
            className="writing-area flex-grow bg-transparent border-none p-0 text-xl md:text-2xl font-serif leading-[2.2] text-on-surface-variant placeholder:text-on-surface-variant/20 resize-none custom-scrollbar focus:outline-none"
            placeholder={placeholder}
            spellCheck={false}
            value={content}
            onChange={handleTextChange}
            dir="rtl"
          />

          {/* Metadata / Word Count */}
          <div className="mt-6 flex justify-between items-center border-t border-outline-variant/10 pt-4">
            <div className="flex items-center gap-2 text-on-surface-variant/40 text-[10px] font-body uppercase tracking-wider">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm12 16H3V4c0-.55.45-1 1-1h14v17z" />
              </svg>
              <span>مساحة للتعبير الحر</span>
            </div>
            <div className="text-on-surface-variant/40 text-xs font-body">
              <span>{wordCount} كلمات</span>
            </div>
          </div>
        </div>

        {children}
      </main>

      {/* Bottom Action Area */}
      <footer className="fixed bottom-0 w-full z-40 p-8 flex justify-center bg-gradient-to-t from-background via-background/80 to-transparent">
        <button
          onClick={handleSave}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          disabled={isSaving}
          className="group relative flex items-center justify-center gap-4 bg-primary px-10 py-4 rounded-lg text-on-primary font-bold transition-all duration-500 overflow-hidden disabled:opacity-50"
          style={{
            transform: isHovering && !isSaving ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isHovering
              ? '0 0 40px rgba(230,212,164,0.15)'
              : '0 0 0px rgba(0,0,0,0)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="font-body text-sm uppercase tracking-widest relative z-10">
            {isSaving ? 'جاري الحفظ...' : 'احفظ التمعّن'}
          </span>
          <svg
            className="w-5 h-5 relative z-10"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
          </svg>
        </button>
      </footer>

      {/* Atmosphere/Texture Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] bg-repeat paper-texture"></div>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Styles for custom classes */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #37342f;
          border-radius: 10px;
        }
        .writing-area:focus {
          outline: none;
        }
        .paper-texture {
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /></filter><rect width="100" height="100" fill="%23000" filter="url(%23noise)" opacity="0.02"/></svg>');
        }
      `}</style>
    </div>
  );
};
