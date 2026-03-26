"use client";

import { useState, type CSSProperties } from "react";
import {
  Lock, CheckCircle, Circle, Star, Moon, Sun, Flame, Eye, Heart, Sparkles,
  BookOpen, Clock, Calendar, Award, TrendingUp, Settings,
  type LucideIcon,
} from "lucide-react";

const subscriberData = {
  name: "عبدالله",
  email: "abdullah@example.com",
  plan: "سنوي",
  planPrice: "820 ر.س",
  startDate: "2025-09-15",
  renewDate: "2026-09-15",
  daysActive: 193,
  currentPhase: 2,
  totalPhases: 7,
  completedLessons: 18,
  totalLessons: 49,
  streak: 12,
  lastActive: "اليوم",
};

type PhaseStatus = "completed" | "current" | "locked";

const journeyPhases: {
  id: number; title: string; subtitle: string; icon: string;
  status: PhaseStatus; lessons: number; completedLessons: number; description: string;
}[] = [
  { id: 1, title: "الصحوة", subtitle: "إدراك الذات", icon: "eye", status: "completed", lessons: 7, completedLessons: 7, description: "مرحلة الوعي الأولى — اكتشاف من أنت حقاً وما الذي تحمله بداخلك." },
  { id: 2, title: "التأمل", subtitle: "النظر إلى الداخل", icon: "moon", status: "current", lessons: 7, completedLessons: 4, description: "الغوص في أعماق النفس — مواجهة الظلال واحتضان الحقيقة الكاملة." },
  { id: 3, title: "التطهير", subtitle: "تحرير القديم", icon: "flame", status: "locked", lessons: 7, completedLessons: 0, description: "إسقاط المعتقدات والأنماط التي لم تعد تخدمك." },
  { id: 4, title: "البناء", subtitle: "تأسيس الجديد", icon: "sun", status: "locked", lessons: 7, completedLessons: 0, description: "بناء أساس جديد من الوعي والوضوح." },
  { id: 5, title: "التدفق", subtitle: "الحركة الطبيعية", icon: "heart", status: "locked", lessons: 7, completedLessons: 0, description: "الانسجام مع إيقاعك الطبيعي في العمل والحياة." },
  { id: 6, title: "الإتقان", subtitle: "العمق والتمكّن", icon: "star", status: "locked", lessons: 7, completedLessons: 0, description: "تحوّل المعرفة إلى حكمة مجسّدة في حياتك اليومية." },
  { id: 7, title: "النور", subtitle: "الاكتمال", icon: "sparkles", status: "locked", lessons: 7, completedLessons: 0, description: "الوصول إلى حالة الوضوح الكامل — أنت الآن مُتمعّن." },
];

const currentLessons = [
  { id: 1, title: "مرآة الظل", duration: "18 دقيقة", completed: true, type: "فيديو" },
  { id: 2, title: "تأمل الصمت الداخلي", duration: "25 دقيقة", completed: true, type: "تأمل" },
  { id: 3, title: "رسالة من الماضي", duration: "12 دقيقة", completed: true, type: "تمرين" },
  { id: 4, title: "الحوار مع النفس", duration: "20 دقيقة", completed: true, type: "فيديو" },
  { id: 5, title: "خريطة المشاعر", duration: "30 دقيقة", completed: false, type: "ورشة" },
  { id: 6, title: "نقطة التحول", duration: "15 دقيقة", completed: false, type: "فيديو" },
  { id: 7, title: "اختبار المرحلة", duration: "10 دقائق", completed: false, type: "اختبار" },
];

function PhaseIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const icons: Record<string, LucideIcon> = { eye: Eye, moon: Moon, flame: Flame, sun: Sun, heart: Heart, star: Star, sparkles: Sparkles };
  const Ic = icons[icon] || Circle;
  return <Ic size={size} />;
}

function GlowOrb({ color = "#D4AF37", size = 200, opacity = 0.08, top, left, right, bottom }: {
  color?: string; size?: number; opacity?: number;
  top?: string | number; left?: string | number; right?: string | number; bottom?: string | number;
}) {
  const hex = Math.round(opacity * 255).toString(16).padStart(2, "0");
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}${hex} 0%, transparent 70%)`,
        top, left, right, bottom, pointerEvents: "none", filter: "blur(40px)",
      }}
    />
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

type TabId = "journey" | "lessons" | "subscription";

export default function KahfiTaamun() {
  const [activeTab, setActiveTab] = useState<TabId>("journey");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(2);
  const [showSettings, setShowSettings] = useState(false);

  const sub = subscriberData;
  const overallProgress = Math.round((sub.completedLessons / sub.totalLessons) * 100);
  const currentPhaseData = journeyPhases.find((p) => p.id === sub.currentPhase);
  const phaseProgress = currentPhaseData ? Math.round((currentPhaseData.completedLessons / currentPhaseData.lessons) * 100) : 0;

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "journey", label: "الرحلة", icon: TrendingUp },
    { id: "lessons", label: "الدروس", icon: BookOpen },
    { id: "subscription", label: "الاشتراك", icon: Award },
  ];

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f0f1a 30%, #111118 60%, #0a0a0f 100%)",
        color: "#e8e4dc",
        fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GlowOrb color="#D4AF37" size={400} opacity={0.04} top="-100px" right="-100px" />
      <GlowOrb color="#8B7355" size={300} opacity={0.03} bottom="100px" left="-80px" />
      <GlowOrb color="#D4AF37" size={200} opacity={0.025} top="50%" left="60%" />

      {/* header */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37 0%, #8B7355 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#0a0a0f" }}>
            {sub.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f0ece4" }}>أهلاً {sub.name}</div>
            <div style={{ fontSize: 12, color: "rgba(212,175,55,0.6)", marginTop: 2 }}>مرحلة {currentPhaseData?.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.08)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(212,175,55,0.12)" }}>
            <Flame size={14} color="#D4AF37" />
            <span style={{ fontSize: 13, color: "#D4AF37", fontWeight: 600 }}>{sub.streak}</span>
            <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)" }}>يوم</span>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, color: "rgba(228,224,216,0.4)" }}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* welcome banner */}
      <div style={{ position: "relative", zIndex: 5, margin: "0 32px", padding: 32, borderRadius: 16, background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(15,15,26,0.9) 50%, rgba(139,115,85,0.04) 100%)", border: "1px solid rgba(212,175,55,0.1)", marginTop: 24, overflow: "hidden" }}>
        <GlowOrb color="#D4AF37" size={150} opacity={0.06} top="-30px" right="-20px" />
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#f0ece4", lineHeight: 1.4 }}>كهفي</h1>
          <p style={{ fontSize: 14, color: "rgba(228,224,216,0.5)", margin: "8px 0 0", lineHeight: 1.6 }}>مساحتك الخاصة في تمعّن — هنا تتابع رحلتك وتراقب تقدمك</p>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(228,224,216,0.4)" }}>التقدم الكلي</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#D4AF37" }}>{overallProgress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(212,175,55,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${overallProgress}%`, background: "linear-gradient(90deg, #8B7355, #D4AF37)", transition: "width 1s ease", boxShadow: "0 0 12px rgba(212,175,55,0.3)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(228,224,216,0.3)" }}>{sub.completedLessons} من {sub.totalLessons} درس</span>
              <span style={{ fontSize: 11, color: "rgba(228,224,216,0.3)" }}>المرحلة {sub.currentPhase} من {sub.totalPhases}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
            {([
              { label: "أيام في الرحلة", value: sub.daysActive, Ic: Calendar },
              { label: "دروس مكتملة", value: sub.completedLessons, Ic: CheckCircle },
              { label: "آخر نشاط", value: sub.lastActive, Ic: Clock },
            ] as const).map((stat, i) => (
              <div key={i} style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.06)", borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
                <stat.Ic size={16} color="rgba(212,175,55,0.4)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f0ece4" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(228,224,216,0.35)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 0, margin: "24px 32px 0", borderBottom: "1px solid rgba(212,175,55,0.08)", position: "relative", zIndex: 5 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 0", background: "none", border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #D4AF37" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.3s",
              color: activeTab === tab.id ? "#D4AF37" : "rgba(228,224,216,0.35)",
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, fontFamily: "inherit",
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* content */}
      <div style={{ position: "relative", zIndex: 5, padding: "24px 32px 48px" }}>

        {/* journey tab */}
        {activeTab === "journey" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Sparkles size={16} color="#D4AF37" />
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#f0ece4" }}>رحلة التمعّن</h2>
            </div>

            <div style={{ position: "relative" }}>
              {journeyPhases.map((phase, idx) => {
                const isCompleted = phase.status === "completed";
                const isCurrent = phase.status === "current";
                const isLocked = phase.status === "locked";
                const isExpanded = expandedPhase === phase.id;
                const pProgress = phase.lessons > 0 ? Math.round((phase.completedLessons / phase.lessons) * 100) : 0;

                return (
                  <div key={phase.id} style={{ display: "flex", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 48, flexShrink: 0 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: isCompleted ? "linear-gradient(135deg, #D4AF37, #8B7355)" : isCurrent ? "rgba(212,175,55,0.15)" : "rgba(228,224,216,0.04)",
                        border: isCurrent ? "2px solid #D4AF37" : isCompleted ? "none" : "1px solid rgba(228,224,216,0.08)",
                        color: isCompleted ? "#0a0a0f" : isCurrent ? "#D4AF37" : "rgba(228,224,216,0.2)",
                        boxShadow: isCurrent ? "0 0 20px rgba(212,175,55,0.2)" : "none",
                        transition: "all 0.3s",
                      }}>
                        {isCompleted ? <CheckCircle size={20} /> : isLocked ? <Lock size={16} /> : <PhaseIcon icon={phase.icon} size={20} />}
                      </div>
                      {idx < journeyPhases.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 24, background: isCompleted ? "rgba(212,175,55,0.3)" : "rgba(228,224,216,0.06)" }} />
                      )}
                    </div>

                    <div
                      onClick={() => !isLocked && setExpandedPhase(isExpanded ? null : phase.id)}
                      style={{
                        flex: 1, cursor: isLocked ? "default" : "pointer", marginBottom: 16, padding: "16px 20px", borderRadius: 14,
                        background: isCurrent ? "rgba(212,175,55,0.04)" : "rgba(228,224,216,0.015)",
                        border: isCurrent ? "1px solid rgba(212,175,55,0.12)" : "1px solid rgba(228,224,216,0.04)",
                        opacity: isLocked ? 0.45 : 1, transition: "all 0.3s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: isCurrent ? "#D4AF37" : isCompleted ? "#c4b998" : "rgba(228,224,216,0.4)" }}>{phase.title}</h3>
                            {isCurrent && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontWeight: 600 }}>الحالية</span>}
                          </div>
                          <p style={{ fontSize: 12, color: "rgba(228,224,216,0.35)", margin: "4px 0 0" }}>{phase.subtitle}</p>
                        </div>
                        {!isLocked && <span style={{ fontSize: 12, color: "rgba(228,224,216,0.3)" }}>{phase.completedLessons}/{phase.lessons}</span>}
                      </div>

                      {!isLocked && (
                        <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: "rgba(212,175,55,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 2, width: `${pProgress}%`, background: isCompleted ? "#D4AF37" : "linear-gradient(90deg, #8B7355, #D4AF37)", transition: "width 0.5s" }} />
                        </div>
                      )}

                      {isExpanded && !isLocked && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(212,175,55,0.06)" }}>
                          <p style={{ fontSize: 13, color: "rgba(228,224,216,0.55)", lineHeight: 1.8, margin: 0 }}>{phase.description}</p>
                          {isCurrent && (
                            <button style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4AF37, #8B7355)", color: "#0a0a0f", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(212,175,55,0.2)" }}>
                              أكمل الرحلة
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* lessons tab */}
        {activeTab === "lessons" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={16} color="#D4AF37" />
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#f0ece4" }}>مرحلة {currentPhaseData?.title}</h2>
              </div>
              <span style={{ fontSize: 13, color: "rgba(212,175,55,0.5)", fontWeight: 600 }}>{phaseProgress}% مكتمل</span>
            </div>

            <div style={{ height: 4, borderRadius: 2, background: "rgba(212,175,55,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", width: `${phaseProgress}%`, borderRadius: 2, background: "linear-gradient(90deg, #8B7355, #D4AF37)", transition: "width 0.5s" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentLessons.map((lesson, idx) => {
                const isNext = !lesson.completed && (idx === 0 || currentLessons[idx - 1]?.completed);
                return (
                  <div
                    key={lesson.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 12,
                      background: isNext ? "rgba(212,175,55,0.06)" : "rgba(228,224,216,0.015)",
                      border: isNext ? "1px solid rgba(212,175,55,0.15)" : "1px solid rgba(228,224,216,0.03)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: lesson.completed ? "linear-gradient(135deg, #D4AF37, #8B7355)" : isNext ? "rgba(212,175,55,0.12)" : "rgba(228,224,216,0.04)",
                      color: lesson.completed ? "#0a0a0f" : isNext ? "#D4AF37" : "rgba(228,224,216,0.25)",
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {lesson.completed ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: lesson.completed ? "rgba(228,224,216,0.5)" : isNext ? "#f0ece4" : "rgba(228,224,216,0.6)" }}>{lesson.title}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "rgba(228,224,216,0.25)" }}>{lesson.duration}</span>
                        <span style={{ fontSize: 11, color: "rgba(212,175,55,0.3)" }}>{lesson.type}</span>
                      </div>
                    </div>
                    {isNext && (
                      <button style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #D4AF37, #8B7355)", color: "#0a0a0f", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(212,175,55,0.2)" }}>ابدأ</button>
                    )}
                    {lesson.completed && <span style={{ fontSize: 11, color: "rgba(212,175,55,0.4)" }}>مكتمل</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* subscription tab */}
        {activeTab === "subscription" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Award size={16} color="#D4AF37" />
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#f0ece4" }}>تفاصيل الاشتراك</h2>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(15,15,26,0.95) 60%, rgba(139,115,85,0.06) 100%)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 16, padding: 28, position: "relative", overflow: "hidden" }}>
              <GlowOrb color="#D4AF37" size={120} opacity={0.06} top="-30px" left="-30px" />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(212,175,55,0.5)", marginBottom: 4 }}>نوع الاشتراك</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#D4AF37" }}>تمعّن {sub.plan}</div>
                  </div>
                  <div style={{ textAlign: "left" as const }}>
                    <div style={{ fontSize: 12, color: "rgba(212,175,55,0.5)", marginBottom: 4 }}>القيمة</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#f0ece4" }}>{sub.planPrice}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "تاريخ البدء", value: formatDate(sub.startDate) },
                    { label: "تاريخ التجديد", value: formatDate(sub.renewDate) },
                    { label: "البريد الإلكتروني", value: sub.email },
                    { label: "الحالة", value: "نشط", isActive: true },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: "rgba(212,175,55,0.03)", borderRadius: 10, border: "1px solid rgba(212,175,55,0.05)" }}>
                      <div style={{ fontSize: 11, color: "rgba(228,224,216,0.3)", marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: item.isActive ? "#4ade80" : "#e8e4dc", display: "flex", alignItems: "center", gap: 6 }}>
                        {item.isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.4)" }} />}
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, padding: 20, background: "rgba(212,175,55,0.03)", borderRadius: 12, border: "1px solid rgba(212,175,55,0.06)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(228,224,216,0.6)", marginBottom: 16 }}>ملخص رحلتك</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "المراحل المكتملة", value: journeyPhases.filter((p) => p.status === "completed").length },
                      { label: "الدروس المكتملة", value: sub.completedLessons },
                      { label: "أيام الاستمرارية", value: sub.streak },
                      { label: "التقدم الكلي", value: `${overallProgress}%` },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37" }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "rgba(228,224,216,0.3)", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(212,175,55,0.2)", background: "transparent", color: "#D4AF37", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>إدارة الاشتراك</button>
                  <button style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4AF37, #8B7355)", color: "#0a0a0f", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(212,175,55,0.2)" }}>ترقية الباقة</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "24px 32px 40px", borderTop: "1px solid rgba(212,175,55,0.04)" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(212,175,55,0.2)", letterSpacing: 2 }}>تمعّن</span>
      </div>
    </div>
  );
}
