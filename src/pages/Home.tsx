import { useLanguage } from '@/app/providers/LanguageContext';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/app/providers/ThemeContext";
import { Sun, Moon, ArrowRight, BookOpen, ShieldCheck, Award, FlaskConical, Languages, Zap, Building2, MessageSquare } from "lucide-react";
import Logo from "@/components/Logo";
import { useEffect } from "react";

export default function Home() {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (window.location.search.includes("code=")) {
      navigate("/sign-in" + window.location.search);
    }
  }, [navigate]);

  return (
    <div style={{ background: "var(--bg-body)", minHeight: "100vh", overflowX: "hidden" }}>
      <nav className="landing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="app-logo"><Logo size={20} /></div>
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>BIS SAARTHI</span><span style={{ fontSize: "0.7rem", color: "var(--accent)", marginLeft: 6, fontWeight: 600, padding: "2px 6px", background: "var(--accent-muted)", borderRadius: 8 }}>by IntelliStd</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/sign-in")}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/sign-in")}>Get Started</button>
        </div>
      </nav>

      <section className="landing-hero" style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 840, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: "absolute", top: 0, left: "-50%", right: "-50%", height: "100%", backgroundImage: "linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.2, zIndex: 0, pointerEvents: "none", maskImage: "radial-gradient(ellipse at center, black 0%, transparent 60%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 60%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 'var(--radius-md)', background: "var(--bg-glass-strong)", border: "1px solid var(--border-glass)", marginBottom: 32 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>SIH 2026 · Problem Statement 26107</span>
          </div>

          <h1 className="landing-title" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            BIS Intelligent Assistant
          </h1>

          <p className="landing-subtitle" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 40px' }}>
            Find, understand and explore BIS standards, documents and certification information with a modern intelligent assistant.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <motion.button whileHover={{ y: -2 }} whileTap={{ y: 1 }} onClick={() => navigate("/sign-in")} className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-md)' }}>Get Started <ArrowRight size={16} /></motion.button>
            <motion.button whileHover={{ y: -2 }} whileTap={{ y: 1 }} onClick={() => navigate("/sign-in")} className="btn btn-white btn-lg" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>Sign In</motion.button>
          </div>

          <div style={{ display: "inline-flex", background: "var(--bg-glass-strong)", border: "1px solid var(--border-glass)", borderRadius: 'var(--radius-md)', overflow: "hidden" }}>
            {[["20,000+", "Indian Standards"], ["15+", "BIS Schemes"], ["800+", "Testing Labs"], ["11", "Languages"]].map(([val, label], i) => (
              <div key={label} style={{ textAlign: "center", padding: "16px 32px", borderRight: i < 3 ? "1px solid var(--border-glass)" : "none" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 10 }}>Everything You Need</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: 480, margin: "0 auto" }}>Built for consumers, MSMEs, manufacturers, and administrators</p>
        </motion.div>
        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }} className="feature-item">
              <div className="feature-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 7, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: "0.855rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 24px 80px", maxWidth: 900, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Who is it for?</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          {[
            { title: "Consumers", emoji: "🛍️", color: "#00d084", desc: "Verify ISI marks, check hallmarks, file product complaints, understand your consumer rights." },
            { title: "Manufacturers & MSMEs", emoji: "🏭", color: "#6366f1", desc: "Find applicable standards, get BIS certification guidance, discover testing labs." },
            { title: "Administrators", emoji: "🏛️", color: "#f59e0b", desc: "Monitor platform usage, manage complaints, review BIS scheme coverage." },
          ].map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 'var(--radius-xl)', textAlign: "center", backdropFilter: "blur(12px)", cursor: "default" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 14, lineHeight: 1 }}>{r.emoji}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.01em" }}>{r.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 24px 80px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 500, margin: "0 auto", padding: "48px 40px", background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 'var(--radius-xl)', position: "relative", overflow: "hidden", boxShadow: 'var(--shadow-lg)' }}>
          <div className="app-logo" style={{ margin: "0 auto 20px", width: 52, height: 52, borderRadius: 'var(--radius-md)', position: "relative" }}><Logo size={32} /></div>
          <h2 style={{ fontSize: "1.55rem", fontWeight: 800, marginBottom: 10, color: "var(--text-primary)", letterSpacing: "-0.03em", position: "relative" }}>Ready to simplify BIS compliance?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: "0.9375rem", lineHeight: 1.6, position: "relative" }}>Join consumers, MSMEs, and startups using AI to navigate Indian Standards.</p>
          <motion.button whileHover={{ y: -2 }} whileTap={{ y: 1 }} className="btn btn-primary btn-lg" style={{ width: "100%", borderRadius: 'var(--radius-md)', position: "relative" }} onClick={() => navigate("/sign-in")}>Get Started Free <ArrowRight size={16} /></motion.button>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 16, position: "relative" }}>Admin Demo: admin@bis.gov.in / admin123</p>
        </motion.div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border-glass)", padding: "24px 32px", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <Logo size={16} />
          <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>BIS Intelligent Assistant</strong>
        </div>
        SIH 2026 · Problem Statement 26107 · Ministry of Consumer Affairs, Food &amp; Public Distribution
      </footer>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes float1{0%,100%{transform:translateY(0) translateX(0)}33%{transform:translateY(-20px) translateX(10px)}66%{transform:translateY(10px) translateX(-5px)}}@keyframes float2{0%,100%{transform:translateY(0) translateX(0)}33%{transform:translateY(15px) translateX(-10px)}66%{transform:translateY(-10px) translateX(5px)}}`}</style>
    </div>
  );
}

const features = [
  { icon: <BookOpen size={18} />, title: "Standard Discovery", desc: "Find applicable IS codes for any product with specific clause references and mandatory certification status.", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  { icon: <ShieldCheck size={18} />, title: "BIS Certification Guidance", desc: "Navigate ISI mark licensing, CRS, FMCS, and hallmarking with step-by-step process workflows.", color: "#00d084", bg: "rgba(0,208,132,0.1)" },
  { icon: <Award size={18} />, title: "Hallmarking Services", desc: "Understand gold and silver hallmarking regulations, purity stamps, and HUID verification.", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { icon: <FlaskConical size={18} />, title: "Testing Lab Finder", desc: "Discover NABL-accredited, BIS-recognized labs by product category and state across India.", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { icon: <Languages size={18} />, title: "Multilingual Support", desc: "Interact in Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, Kannada, and more.", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { icon: <Zap size={18} />, title: "AI-Powered Answers", desc: "Context-aware, source-backed responses with IS clause citations using Gemini AI.", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  { icon: <MessageSquare size={18} />, title: "Complaint Filing", desc: "File and track product complaints directly with BIS. Get a tracking ID instantly.", color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
  { icon: <Building2 size={18} />, title: "Standards Clubs", desc: "Find BIS Standards Clubs near you for schools, colleges, and institutions.", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
];


