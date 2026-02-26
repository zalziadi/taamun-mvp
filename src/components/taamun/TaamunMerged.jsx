"use client";

import Nav from "./Nav";
import Hero from "./Hero";
import States from "./States";
import Journey from "./Journey";
import Daily from "./Daily";
import Progress from "./Progress";
import Book from "./Book";
import Pricing from "./Pricing";
import Footer from "./Footer";

function Breath({ reveal = false }) {
  return (
    <div className={reveal ? "breath reveal" : "breath"}>
      <div className="st" />
      <div className="st m" />
      <div className="st" />
    </div>
  );
}

export default function TaamunMerged() {
  return (
    <main className="theme-parchment min-h-screen bg-[color:var(--parchment)]">
      <div className="silence-layer" />
      <div className="content">
        <Nav />
        <Hero />

        <div className="verse-block reveal">
          <p className="ayah">﴿ أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا ﴾</p>
          <p className="ref">سورة محمد — ٢٤</p>
        </div>

        <Breath />
        <States />
        <Breath reveal />
        <Journey />
        <Breath reveal />
        <Daily />
        <Breath reveal />
        <Progress />
        <Breath reveal />
        <Book />
        <Breath reveal />
        <Pricing />
        <Footer />
      </div>

      <style>{`
        .silence-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse at 25% 40%, rgba(196,162,101,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 70%, rgba(160,148,128,0.03) 0%, transparent 40%),
            var(--parchment);
        }
        .content { position: relative; z-index: 1; }
        .verse-block { text-align: center; padding: 56px 24px; max-width: 640px; margin: 0 auto; }
        .verse-block .ayah { font-family: "Amiri", serif; font-size: clamp(20px, 2.8vw, 27px); color: #3d3226; line-height: 2.1; margin-bottom: 12px; }
        .verse-block .ref { font-size: 12.5px; color: #a09480; letter-spacing: 0.5px; }
        .breath { display: flex; justify-content: center; align-items: center; gap: 18px; padding: 32px 0; }
        .breath .st { width: 4px; height: 4px; border-radius: 50%; background: #d9cdb8; }
        .breath .st.m { width: 5px; height: 5px; background: #a09480; opacity: 0.4; }
        .state-hover-card:hover { background: rgba(255, 255, 255, 0.72); }
        .journey-hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 36px rgba(42, 33, 24, 0.05);
          border-color: rgba(160, 148, 128, 0.25);
        }
        .book-chapter-row:hover { color: rgba(246, 241, 231, 0.65) !important; }
        .progress-day-node:hover { transform: scale(1.08); }
        .nav-link:hover { color: #2a2118 !important; }
        @media (max-width: 768px) {
          .verse-block { padding: 44px 20px; }
        }
      `}</style>
    </main>
  );
}
