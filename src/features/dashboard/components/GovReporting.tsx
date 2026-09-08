import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ShieldAlert, FileSearch, Download, PieChart, Users, Activity, ExternalLink, Globe } from 'lucide-react';

export function GovReporting() {
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for prototype
  const systemMetrics = [
    { label: "Total Compliance Queries", value: "14,205", change: "+12%", trend: "up" },
    { label: "Active Tracking (MSMEs)", value: "3,492", change: "+8%", trend: "up" },
    { label: "Auto-Resolved Policies", value: "8,934", change: "+15%", trend: "up" },
    { label: "High-Risk Anomalies", value: "12", change: "-2%", trend: "down" },
  ];

  const recentAudits = [
    { id: "AUD-8921", type: "Standard Match", entity: "IS 8034 : 2018", status: "Verified", time: "2 mins ago" },
    { id: "AUD-8922", type: "Scheme Validation", entity: "Scheme-I", status: "Verified", time: "15 mins ago" },
    { id: "AUD-8923", type: "QCO Enforcement", entity: "Footwear QCO", status: "Flagged", time: "1 hour ago" },
    { id: "AUD-8924", type: "Evidence Check", entity: "S.O. 4532(E)", status: "Verified", time: "2 hours ago" },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,AuditID,Type,Entity,Status,Time\n" + 
        recentAudits.map(e => `${e.id},${e.type},${e.entity},${e.status},${e.time}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "BIS_Policy_Audit_Report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1500);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 8px 0' }}>
            <Globe color="var(--accent)" size={26} /> Gov Reporting & Policy Audit
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Real-time administrative overview of MSME compliance intelligence and regulatory matching.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, height: 42, padding: '0 16px' }}
        >
          {isExporting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Download size={16} />}
          {isExporting ? 'Exporting...' : 'Export Audit CSV'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {systemMetrics.map((metric, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="panel" 
            style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {metric.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{metric.value}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: metric.trend === 'up' ? 'var(--success)' : 'var(--danger)' }}>
                {metric.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSearch size={18} color="var(--text-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Policy Audits</h3>
          </div>
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit ID</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Event Type</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Entity</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((audit, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', fontFamily: 'monospace' }}>{audit.id}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', fontWeight: 500 }}>{audit.type}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem' }}>{audit.entity}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span className={`pill ${audit.status === 'Verified' ? 'pill-green' : 'pill-amber'}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{audit.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Activity size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Live System Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Decision Graph Engine</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online (12ms ping)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Evidence RAG Retrieval</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online (45ms ping)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Gazette Sync Worker</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syncing... (98%)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
