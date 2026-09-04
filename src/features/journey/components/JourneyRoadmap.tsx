import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, Circle, AlertCircle, PlayCircle, 
  Search, ShieldCheck, MapPin, Building2, ChevronRight, FileText, Info
} from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function JourneyRoadmap({ setActiveView }: { setActiveView: (view: string) => void }) {
  const { t } = useLanguage();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  
  // Dummy journey data simulating a generated pathway for "Industrial Pump"
  const journeySteps = [
    {
      id: 1,
      title: "Product & Context Identified",
      status: "completed",
      icon: <Search size={20} />,
      content: "Industrial Submersible Pump identified for MSME manufacturer.",
      evidence: "User Input: 'I manufacture an industrial pump.'",
      rule: "Context extraction pipeline"
    },
    {
      id: 2,
      title: "Standard Identified",
      status: "completed",
      icon: <FileText size={20} />,
      content: "Applicable Standard: IS 8034 : 2018 (Submersible Pumpsets)",
      evidence: "Matched via Product-to-Standard rules engine.",
      rule: "BIS Standards Catalog Index"
    },
    {
      id: 3,
      title: "Regulatory Status (QCO)",
      status: "completed",
      icon: <ShieldCheck size={20} />,
      content: "Compulsory Certification required under Quality Control Order (QCO).",
      evidence: "Gazette Notification: S.O. 1234(E) dated 12-05-2023.",
      rule: "Mandatory under Scheme-I"
    },
    {
      id: 4,
      title: "Testing & Requirements",
      status: "current",
      icon: <AlertCircle size={20} />,
      content: "Product must be tested for electrical safety, flow rate, and IP68 water resistance.",
      evidence: "Refer to IS 8034 : 2018, Section 4 (Safety Requirements).",
      rule: "Testing Protocol Scheme-I"
    },
    {
      id: 5,
      title: "Find a Recognized Lab",
      status: "pending",
      icon: <MapPin size={20} />,
      content: "Test samples must be sent to a BIS Recognized OSL (Outside Approved Lab).",
      evidence: "Search required in Community Labs directory.",
      actionLabel: "Search Labs",
      actionDest: "community_labs"
    },
    {
      id: 6,
      title: "Apply for License on e-BIS",
      status: "pending",
      icon: <Building2 size={20} />,
      content: "Submit application via Scheme-I with test reports.",
      evidence: "Official BIS Portal (manakonline.in).",
      actionLabel: "Go to Portal",
      actionDest: "licenses"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <PlayCircle size={32} color="var(--accent)" /> Personalized BIS Journey
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
            Your step-by-step verified compliance path for <strong style={{color: 'var(--text-primary)'}}>Industrial Pump</strong>
          </p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="panel" style={{ padding: '32px 24px', background: 'var(--bg-glass-strong)' }}>
        <div style={{ position: 'relative' }}>
          {/* Timeline connecting line */}
          <div style={{ position: 'absolute', top: 20, bottom: 20, left: 24, width: 2, background: 'var(--border-glass)', zIndex: 0 }} />

          {journeySteps.map((step, index) => (
            <div key={step.id} style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1, marginBottom: index === journeySteps.length - 1 ? 0 : 32 }}>
              {/* Timeline Icon */}
              <div 
                style={{ 
                  width: 50, height: 50, borderRadius: 25, 
                  background: step.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : step.status === 'current' ? 'var(--accent-muted)' : 'var(--bg-hover)',
                  border: `2px solid ${step.status === 'completed' ? '#10b981' : step.status === 'current' ? 'var(--accent)' : 'var(--border-glass)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step.status === 'completed' ? '#10b981' : step.status === 'current' ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0
                }}
              >
                {step.icon}
              </div>

              {/* Card */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="view-card"
                style={{ 
                  flex: 1, padding: '20px', borderRadius: 16, 
                  background: 'var(--bg-modal)', border: step.status === 'current' ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
              >
                {step.status === 'current' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, bottom: 0, background: 'var(--accent)' }} />
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {step.status === 'completed' ? <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Completed</span> :
                       step.status === 'current' ? <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Next Step</span> :
                       <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</span>}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{step.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{step.content}</p>
                  </div>
                  
                  <div style={{ color: 'var(--text-muted)', padding: 4 }}>
                    <ChevronRight size={20} style={{ transform: selectedStep === step.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </div>
                </div>

                <AnimatePresence>
                  {selectedStep === step.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-glass)', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 12, marginBottom: 12 }}>
                        <Info size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Why? / Official Evidence</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{step.evidence}</div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600 }}>Decision Rule:</span> {step.rule}
                      </div>

                      {step.actionLabel && (
                        <div style={{ marginTop: 16 }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveView(step.actionDest || 'chat'); }} 
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 8 }}
                          >
                            {step.actionLabel}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
