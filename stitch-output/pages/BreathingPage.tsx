'use client';

import React, { useEffect, useState } from 'react';

interface BreathingPageProps {
  verseQuran?: string;
  duration?: number;
  currentTime?: number;
  onClose?: () => void;
  showContextCard?: boolean;
  contextVerse?: string;
}

export const BreathingPage: React.FC<BreathingPageProps> = ({
  verseQuran = 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ',
  duration = 300,
  currentTime: initialTime = 165,
  onClose,
  showContextCard = true,
  contextVerse = 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ',
}) => {
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [breathingText, setBreathingText] = useState('شهيق');
  const [progress, setProgress] = useState((initialTime / duration) * 100);

  // Breathing cycle animation
  useEffect(() => {
    const breathingCycle = 8000; // 8 seconds total cycle
    const phases = [
      { text: 'شهيق', duration: 2000 },
      { text: 'احبس', duration: 2000 },
      { text: 'زفير', duration: 2000 },
      { text: 'سكون', duration: 2000 },
    ];

    let phaseIndex = 0;
    let phaseStart = Date.now();

    const breathingInterval = setInterval(() => {
      const elapsed = Date.now() - phaseStart;
      const currentPhase = phases[phaseIndex];

      if (elapsed >= currentPhase.duration) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        phaseStart = Date.now();
        setBreathingText(phases[phaseIndex].text);
      }
    }, 100);

    return () => clearInterval(breathingInterval);
  }, []);

  // Timer update
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) return duration;
        return prev + 1;
      });
      setProgress(((currentTime + 1) / duration) * 100);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="dark bg-background text-on-surface font-body overflow-hidden w-full h-screen"
    >
      {/* Top Navigation (Minimal Header) */}
      <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-50">
        <div className="flex items-center">
          <button
            onClick={handleClose}
            className="text-on-surface/60 hover:text-primary transition-colors duration-300 flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high"
            aria-label="إغلاق"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="font-serif text-2xl text-primary/80 tracking-widest">
          الْقُرْآن
        </div>
        <div className="w-10"></div>
      </nav>

      {/* Main Meditation Canvas */}
      <main className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Background Depth Gradients */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>

        {/* Abstract Wave/Circle Pattern */}
        <div className="relative flex items-center justify-center z-10">
          {/* Outermost Glow */}
          <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border border-primary/10 breathing-circle"></div>

          {/* Middle Wave */}
          <div
            className="absolute w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full border border-primary/20 breathing-circle"
            style={{ animationDelay: '1s' }}
          ></div>

          {/* Inner Solid Circle */}
          <div className="w-[120px] h-[120px] md:w-[200px] md:h-[200px] rounded-full bg-gradient-to-br from-primary/20 to-transparent backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-[0_0_60px_rgba(230,212,164,0.1)]">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_#e6d4a4]"></div>
          </div>
        </div>

        {/* Breathing Guidance Text */}
        <div className="mt-24 z-20 text-center">
          <div className="h-16 flex items-center justify-center">
            <p className="font-serif text-4xl md:text-6xl text-primary tracking-wide text-fade">
              <span className="block">{breathingText}</span>
            </p>
          </div>
          <p className="text-on-surface/40 font-body text-xs uppercase tracking-[0.2em] mt-8">
            لحظة سكون
          </p>
        </div>

        {/* Progress Area */}
        <div className="absolute bottom-12 left-0 right-0 px-12 md:px-24 flex flex-col items-center gap-4">
          <div className="flex justify-between w-full max-w-md text-[10px] text-on-surface/30 font-body uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full max-w-md h-[1px] bg-outline-variant/20 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 bottom-0 bg-primary shadow-[0_0_10px_#e6d4a4] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </main>

      {/* Contextual Information Card (Desktop only) */}
      {showContextCard && (
        <div className="fixed bottom-32 left-8 hidden lg:block max-w-xs z-30">
          <div className="p-6 rounded-xl bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <h3 className="font-serif text-lg text-primary">آية السكينة</h3>
            </div>
            <p className="text-on-surface/70 leading-relaxed font-serif text-sm">
              "{contextVerse}"
            </p>
          </div>
        </div>
      )}

      {/* Right Side Decorative Fragment */}
      <div className="fixed top-1/2 -translate-y-1/2 right-4 hidden lg:flex flex-col gap-6 z-30">
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
        <div className="rotate-90 origin-center whitespace-nowrap text-[10px] tracking-[0.4em] text-primary/40 uppercase font-body">
          Desert Sanctuary
        </div>
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
      </div>

      {/* Styles for animations */}
      <style jsx>{`
        .breathing-circle {
          animation: pulse 8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.1;
          }
        }
        .text-fade {
          animation: textFlow 8s ease-in-out infinite;
        }
        @keyframes textFlow {
          0%,
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
          20%,
          45% {
            opacity: 1;
            transform: translateY(0);
          }
          50% {
            opacity: 0;
            transform: translateY(-10px);
          }
          70%,
          95% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
