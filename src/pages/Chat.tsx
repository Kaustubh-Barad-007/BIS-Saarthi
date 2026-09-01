import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, User, Plus, Trash2, PanelLeftClose, PanelLeftOpen, Globe, Sun, Moon, LogOut, MessageSquare, ChevronDown, Mic, Paperclip, Copy, Download, Check, CheckCircle2, Volume2, ThumbsUp, ThumbsDown, AlertCircle, X, ShieldCheck, RefreshCcw, Search, Building2, FileText, MapPin, Activity, Library, Calculator, ExternalLink, Upload, Info, HelpCircle, Layers , Image, MoreVertical, Edit3, Pin, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { t as tLib } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  attachment?: {
    name: string;
    type: string;
    url?: string;
    size?: number;
  };
}

interface ConversationMeta {
  id: string;
  title: string;
  createdAt: string;
}

interface Props {
  userRole?: string;
  hideSidebar?: boolean;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },
];

const getSuggestions = (role: string, lang: string): string[] => {
  if (role === 'manufacturer') {
    return [
      tLib(lang, 'suggestCrs'),
      tLib(lang, 'suggestFees'),
      tLib(lang, 'suggestElectronics'),
      tLib(lang, 'suggestLabs'),
    ];
  }
  if (role === 'admin') {
    return [
      tLib(lang, 'suggestRegulations'),
      tLib(lang, 'suggestMandatory'),
      tLib(lang, 'suggestCrs'),
      tLib(lang, 'suggestLabs'),
    ];
  }
  return [
    tLib(lang, 'suggestLabs'),
    tLib(lang, 'suggestFees'),
    tLib(lang, 'suggestStandard'),
    tLib(lang, 'suggestTrack'),
  ];
};

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderContent(rawText: string) {
  if (!rawText) return '';
  let text = rawText;

  // 1. Code blocks (```lang ... ```)
  text = text.replace(/```([\w]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<div class="code-block-container"><pre><code>${escapeHtml(code.trim())}</code></pre></div>`;
  });

  // 2. Inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 3. Tables (| col | col |)
  text = text.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return match;
    const headerLine = lines[0];
    const isHeaderSeparator = lines[1] && lines[1].includes('---');
    const dataLines = isHeaderSeparator ? lines.slice(2) : lines.slice(1);

    const parseRow = (row: string, tag: 'th' | 'td') => {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
    };

    const thead = `<thead>${parseRow(headerLine, 'th')}</thead>`;
    const tbody = `<tbody>${dataLines.map(r => parseRow(r, 'td')).join('')}</tbody>`;
    return `<div class="table-responsive"><table class="markdown-table">${thead}${tbody}</table></div>`;
  });

  // 4. Headings
  text = text.replace(/^#### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
  text = text.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // 5. Bold & Italic
  text = text.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
  text = text.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');

  // 6. Blockquotes (> quote)
  text = text.replace(/^>\s?(.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

  // 7. Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

  // 8. Lists (ordered and unordered)
  text = text.replace(/^[\*\-•]\s(.*$)/gim, '<li class="md-li-bullet">$1</li>');
  text = text.replace(/^(\d+)\.\s(.*$)/gim, '<li class="md-li-num" data-num="$1">$2</li>');

  // Wrap consecutive <li> into <ul> or <ol>
  text = text.replace(/(<li class="md-li-bullet">[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="md-ul">${match}</ul>`);
  text = text.replace(/(<li class="md-li-num"[\s\S]*?<\/li>\n?)+/g, (match) => `<ol class="md-ol">${match}</ol>`);

  // 9. Paragraphs
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map(b => {
      const trimmed = b.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<blockquote')
      ) {
        return trimmed;
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

export default function Chat({ userRole = 'consumer', hideSidebar = false }: Props) {
  const { user, token, logout, setAvatar } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(!hideSidebar);
  const { language, setLanguage, t } = useLanguage();
  
  const getWelcomeMsg = (role: string, lang: string) => {
    if (role === 'manufacturer') return tLib(lang, 'welcomeManufacturer');
    if (role === 'admin') return tLib(lang, 'welcomeAdmin');
    return tLib(lang, 'welcomeConsumer');
  };

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: getWelcomeMsg(userRole, 'en') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: 'success' | 'error'} | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bis_pinned_chats') || '[]'); } catch { return []; }
  });
  const [dropdownOpenChatId, setDropdownOpenChatId] = useState<string | null>(null);
  const [renameChat, setRenameChat] = useState<{ id: string; title: string } | null>(null);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  
  const togglePinChat = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPinnedChatIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      localStorage.setItem('bis_pinned_chats', JSON.stringify(next));
      return next;
    });
    setDropdownOpenChatId(null);
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, title: newTitle.trim() }),
      });
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c));
        showToast('Conversation renamed', 'success');
      }
    } catch {
      showToast('Failed to rename', 'error');
    }
    setRenameChat(null);
    setDropdownOpenChatId(null);
  };

  const handleExportChat = async (id: string, title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDropdownOpenChatId(null);
    try {
      const res = await fetch(`/api/conversations?id=${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const exportContent = (data.messages || []).map((m: any) => {
          let text = m.content;
          try { const p = JSON.parse(m.content); text = p.reply || m.content; } catch {}
          return `[${m.role.toUpperCase()}]:\n${text}\n`;
        }).join('\n----------------------------------------\n\n');
        
        const blob = new Blob([`BIS Intelligent Assistant - Conversation\nTopic: ${title}\nExport Date: ${new Date().toLocaleString()}\n\n${exportContent}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BIS_Chat_${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Chat exported successfully', 'success');
      }
    } catch {
      showToast('Export failed', 'error');
    }
  };
  
  const currentSources = messages.map(m => m.sources).filter(Boolean).pop() || [];
  
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('File too large (max 2MB)', 'error');
    
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (!token) return;
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar: base64 })
        });
        if (res.ok) {
          const { avatar } = await res.json();
          setAvatar(avatar);
          showToast('Profile photo updated!', 'success');
        } else {
          showToast('Failed to update photo', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast('Error uploading photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [activeView, setActiveView] = useState<'chat' | 'standards' | 'calculator' | 'verify' | 'complaint' | 'track' | 'lab' | 'guide' | 'clubs' | 'faq' | 'about' | 'vault' | 'licenses' | 'apply_license' | 'complaints_hub' | 'community_labs'>('chat');

  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintTab, setComplaintTab] = useState<'file' | 'track'>('file');
  const [communityTab, setCommunityTab] = useState<'clubs' | 'labs'>('clubs');
  const [complaintSuccess, setComplaintSuccess] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [labSearch, setLabSearch] = useState(false);
  const [labResults, setLabResults] = useState<any[] | null>(null);
  
  const [standardsSearch, setStandardsSearch] = useState('');
  const [feeTurnover, setFeeTurnover] = useState('');
  const [feeCategory, setFeeCategory] = useState('large');
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [standardsResults, setStandardsResults] = useState<any[]>([{ code: 'IS 14543:2016', name: 'Packaged Drinking Water (Other than Packaged Natural Mineral Water)', status: 'Active' }, { code: 'IS 10500:2012', name: 'Drinking Water - Specification', status: 'Active' }, { code: 'IS 15410:2003', name: 'Containers for Packaging of Natural Mineral Water', status: 'Active' }]);
  
  
  
  
  
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [clubsSearch, setClubsSearch] = useState('');
  const [clubsResults, setClubsResults] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [labState, setLabState] = useState('');
  const [labProduct, setLabProduct] = useState('');


  const [calcResult, setCalcResult] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLang(false);
    if (messages.length === 1 && messages[0].id === '0') {
      setMessages([{ id: '0', role: 'assistant', content: getWelcomeMsg(userRole, lang) }]);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  
    const fetchLicenses = async () => {
      if (!token) return;
      setLoadingLicenses(true);
      try {
        const res = await fetch('/api/licenses', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setUserLicenses(Array.isArray(data) ? data : []); }
      } catch {} finally { setLoadingLicenses(false); }
    };

    const fetchComplaints = async () => {
    if (!token) return;
    setLoadingComplaints(true);
    try {
      const res = await fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setUserComplaints(data); }
    } catch {} finally { setLoadingComplaints(false); }
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setConversations(data); }
    } catch {}
  };

  

  useEffect(() => {
    const fetchClubs = async () => {
      setLoadingClubs(true);
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/clubs?q=${encodeURIComponent(clubsSearch)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const reqs = data.userRequests || [];
          const reqMap = reqs.reduce((acc: any, req: any) => { acc[req.clubId] = req.status; return acc; }, {});
          setClubsResults(data.clubs.map((c: any) => ({ ...c, __status: reqMap[c.id] })));
        }
      } catch {} finally { setLoadingClubs(false); }
    };
    const t = setTimeout(fetchClubs, 300);
    return () => clearTimeout(t);
  }, [clubsSearch]);

  useEffect(() => {
    if (activeView === 'complaints_hub') fetchComplaints();
    if (activeView === 'licenses') fetchLicenses();
    if (activeView === 'standards') {
      fetch('/api/standards')
        .then(res => res.json())
        .then(data => {
          if (data.standards) {
            setStandardsResults(data.standards.map((s: any) => ({
              code: s.code,
              name: s.title,
              status: s.mandatory ? 'Mandatory' : 'Voluntary',
              category: s.category
            })));
          }
        })
        .catch(() => {});
    }
    if (activeView === 'lab' || activeView === 'community_labs') {
      fetch('/api/labs')
        .then(res => res.json())
        .then(data => {
          if (data.labs) {
            setLabResults(data.labs);
          }
        })
        .catch(() => {});
    }
  }, [activeView, token]);

  // Speech Recognition
  
  const handleApplyLicense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return showToast('Please login first', 'error');
    const fd = new FormData(e.currentTarget);
    const product = fd.get('product') as string;
    const isCode = fd.get('isCode') as string;
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product, isCode }),
      });
      if (res.ok) {
        showToast('License application submitted!', 'success');
        setActiveView('licenses');
      } else {
        showToast('Failed to apply', 'error');
      }
    } catch { showToast('Error submitting', 'error'); }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-IN' : `${language}-IN`;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const readAloud = (text: string) => {
    if (!window.speechSynthesis) return showToast('Text-to-speech not supported.', 'error');
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    
    // Map language to BCP-47 for TTS
    const bcp47Map: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
      gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN'
    };
    utterance.lang = bcp47Map[language] || 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(language));
    if (voice) utterance.voice = voice;

    const voices_dummy = [];
    const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(language));
    if (matchingVoice) utterance.voice = matchingVoice;

    window.speechSynthesis.speak(utterance);
  };

  const exportChat = () => {
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'BIS Assistant'}:\n${m.content}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bis-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  const regenerateLastResponse = async () => {
    if (loading || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    
    setMessages(prev => prev.slice(0, prev.length - 1));
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: lastUserMsg.content,
          role: userRole,
          language,
          conversationId: activeConvId,
        }),
      });

      let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error("API returned non-JSON:", text);
          throw new Error("API Error: " + (res.status === 504 ? "Timeout" : "Server error"));
        }
        if (!res.ok) throw new Error(data.error || 'Failed');
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply, sources: data.sources }]);
      if (data.sources && data.sources.length > 0) setShowRightPanel(true);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED') ? '⚠️ The AI is currently experiencing high traffic (Quota Exceeded). Please try again in a few seconds.' : '⚠️ ' + err.message.substring(0, 150)) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSearch = async (stateVal?: string, productVal?: string) => {
    const product = productVal ?? labProduct;
    const state = stateVal ?? labState;
    if (!product && !state) return;
    setLabSearch(true);
    setLabResults(null);
    try {
      const res = await fetch(`/api/labs?product=${encodeURIComponent(product)}&state=${encodeURIComponent(state)}`);
      if (res.ok) {
        const data = await res.json();
        setLabResults(data.labs);
      }
    } catch {} finally {
      setLabSearch(false);
    }
  };

  const handleStandardsSearch = async (query: string) => {
    setStandardsSearch(query);
    if (query.length < 2) return;
    try {
      const res = await fetch(`/api/standards?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setStandardsResults(data.standards.map((s: any) => ({ code: s.code, name: s.title, status: s.mandatory ? 'Mandatory' : 'Voluntary' })));
      }
    } catch {}
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = (formData.get('code') as string).toUpperCase().replace(/\s/g, '');
    if (!code) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        showToast('Verification failed.', 'error');
      }
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const submitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const details = formData.get('details') as string;
    const productName = formData.get('productName') as string;
    const brand = formData.get('brand') as string;
    if (!subject || !details) return;
    setComplaintSubmitting(true);
    setComplaintSuccess(null);
    
      const category = formData.get('category') as string || 'general';
      const priority = formData.get('priority') as string || 'normal';
      
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subject, details, productName, brand, category, priority }),
        });

      const data = await res.json();
      if (res.ok) {
        setComplaintSuccess({ id: `BIS-${data.id.slice(0,8).toUpperCase()}`, date: new Date().toLocaleDateString() });
        showToast('Complaint filed successfully!', 'success');
          setComplaintTab('track');
        e.currentTarget.reset();
      } else {
        showToast(data.error || 'Failed to submit complaint.', 'error');
      }
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setComplaintSubmitting(false);
    }
  };


  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock conversation fetch removed for hackathon
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([{ id: '0', role: 'assistant', content: getWelcomeMsg(userRole, language) }]);
    setInput('');
    setActiveView('chat');
  };

  const loadConversation = async (id: string) => {
    setActiveConvId(id);
    setActiveView('chat');
    setIsChatLoading(true);
    try {
      const res = await fetch(`/api/conversations?id=${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (!data || !Array.isArray(data.messages)) {
          showToast('Invalid conversation format', 'error');
          return;
        }
        setMessages([
          { id: '0', role: 'assistant', content: `Loaded history for: **${data.title}**` },
          ...data.messages.map((m: any) => {
            let content = m.content;
            let sources = undefined;
            if (m.role === 'assistant') {
              try {
                const parsed = JSON.parse(m.content);
                content = parsed.reply || m.content;
                sources = parsed.sources;
              } catch { }
            }
            return { id: m.id, role: m.role, content, sources };
          })
        ]);
      } else {
        showToast('Failed to load conversation', 'error');
      }
    } catch {
      showToast('Error loading conversation', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const sendMessage = useCallback(async (text?: string) => {
    let userText = text || input;
    if (!userText.trim() && !attachedFile) return;
    if (loading) return;

    let fileData: { data: string; mimeType: string } | undefined = undefined;
    let attachmentMeta: { name: string; type: string; url?: string; size?: number } | undefined = undefined;

    if (attachedFile) {
      try {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = error => reject(error);
          reader.readAsDataURL(attachedFile);
        });
        
        fileData = {
          data: base64String,
          mimeType: attachedFile.type
        };

        const isImage = attachedFile.type.startsWith('image/');
        attachmentMeta = {
          name: attachedFile.name,
          type: attachedFile.type,
          url: isImage ? `data:${attachedFile.type};base64,${base64String}` : undefined,
          size: attachedFile.size
        };
      } catch (err) {
        console.error("Failed to read file", err);
      }
      setAttachedFile(null);
    }

    const promptMessage = userText.trim() 
      ? userText 
      : (attachmentMeta 
          ? (attachmentMeta.type.startsWith('image/') 
              ? 'Please inspect this image for BIS certification, ISI Mark, CM/L number, or Hallmarking authenticity.' 
              : 'Please inspect this document for BIS standards compliance.') 
          : '');

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: promptMessage,
      attachment: attachmentMeta
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: promptMessage,
          role: userRole,
          language,
          conversationId: activeConvId,
          file: fileData
        }),
      });

      let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error("API returned non-JSON:", text);
          throw new Error("API Error: " + (res.status === 504 ? "Timeout" : "Server error"));
        }
        if (!res.ok) throw new Error(data.error || 'Failed');

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, sources: data.sources };
      setMessages(prev => [...prev, aiMsg]);
      if (data.sources && data.sources.length > 0) setShowRightPanel(true);

      // If new conversation was created, update sidebar
      if (data.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId);
        setConversations(prev => [{ id: data.conversationId, title: userText.slice(0, 50), createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED') ? '⚠️ The AI is currently experiencing high traffic (Quota Exceeded). Please try again in a few seconds.' : '⚠️ ' + err.message.substring(0, 150)) }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, token, userRole, language, activeConvId, attachedFile]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const roleLabel = t(userRole) || userRole;

  return (
    <div className="app-layout" style={{ height: '100vh' }}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 40, display: typeof window !== 'undefined' && window.innerWidth > 768 ? 'none' : 'block'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* New Chat & Toggle */}
            <div className="sidebar-header" style={{ padding: '16px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="icon-btn" onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', flexShrink: 0, padding: 0, width: 36, height: 36 }} title="Close sidebar">
                <PanelLeftClose size={18} />
              </button>
              <button className="btn btn-primary" onClick={startNewChat} style={{ flex: 1, justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: 600 }}>{t('newChat')}</span>
                <Plus size={16} />
              </button>
            </div>

            {/* Conversation History */}
            <div className="sidebar-scrollable" onClick={() => setDropdownOpenChatId(null)}>
              {/* Search History */}
              {conversations.length > 2 && (
                <div style={{ padding: '0 10px 10px 10px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      placeholder="Search chats..."
                      style={{
                        width: '100%',
                        background: 'var(--bg-glass-strong)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 10,
                        padding: '6px 10px 6px 30px',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        outline: 'none'
                      }}
                    />
                    {chatSearch && (
                      <button onClick={() => setChatSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>×</button>
                    )}
                  </div>
                </div>
              )}

              {/* Pinned Chats */}
              {conversations.filter(c => pinnedChatIds.includes(c.id) && (!chatSearch || c.title.toLowerCase().includes(chatSearch.toLowerCase()))).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pin size={11} color="#f59e0b" /> Pinned
                  </div>
                  {conversations
                    .filter(c => pinnedChatIds.includes(c.id) && (!chatSearch || c.title.toLowerCase().includes(chatSearch.toLowerCase())))
                    .map(c => {
                      const isDropdownOpen = dropdownOpenChatId === c.id;
                      return (
                        <div key={c.id} style={{ position: 'relative', marginBottom: 2 }}>
                          <button
                            className={`sidebar-item ${activeConvId === c.id ? 'active' : ''}`}
                            onClick={() => { loadConversation(c.id); setDropdownOpenChatId(null); }}
                            style={{ width: '100%', justifyContent: 'space-between', paddingRight: 36 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                              <Pin size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', textAlign: 'left' }}>
                                {c.title}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpenChatId(isDropdownOpen ? null : c.id);
                            }}
                            style={{
                              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                              background: isDropdownOpen ? 'var(--bg-hover)' : 'transparent', border: 'none',
                              color: isDropdownOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                              cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', opacity: isDropdownOpen ? 1 : 0.7, zIndex: 10
                            }}
                            title="Options"
                          >
                            <MoreVertical size={14} />
                          </button>
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.12 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute', right: 8, top: 'calc(100% + 2px)', zIndex: 100,
                                  background: '#18181b', border: '1px solid var(--border-glass)',
                                  borderRadius: 12, padding: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                  minWidth: 150, display: 'flex', flexDirection: 'column', gap: 2
                                }}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDropdownOpenChatId(null); setRenameChat({ id: c.id, title: c.title }); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Edit3 size={13} color="var(--accent)" /> Rename
                                </button>
                                <button
                                  onClick={(e) => togglePinChat(c.id, e)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Pin size={13} color="#f59e0b" /> Unpin Chat
                                </button>
                                <button
                                  onClick={(e) => handleExportChat(c.id, c.title, e)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Download size={13} color="var(--accent-2)" /> Export (.txt)
                                </button>
                                <div style={{ height: 1, background: 'var(--border-glass)', margin: '2px 0' }} />
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDropdownOpenChatId(null); setDeleteChatId(c.id); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Trash2 size={13} /> Delete Chat
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Unpinned Recent Chats */}
              {conversations.filter(c => !pinnedChatIds.includes(c.id) && (!chatSearch || c.title.toLowerCase().includes(chatSearch.toLowerCase()))).length > 0 && (
                <>
                  <div className="sidebar-section-label">{t('recent')}</div>
                  {conversations
                    .filter(c => !pinnedChatIds.includes(c.id) && (!chatSearch || c.title.toLowerCase().includes(chatSearch.toLowerCase())))
                    .map(c => {
                      const isDropdownOpen = dropdownOpenChatId === c.id;
                      return (
                        <div key={c.id} style={{ position: 'relative', marginBottom: 2 }}>
                          <button
                            className={`sidebar-item ${activeConvId === c.id ? 'active' : ''}`}
                            onClick={() => { loadConversation(c.id); setDropdownOpenChatId(null); }}
                            style={{ width: '100%', justifyContent: 'space-between', paddingRight: 36 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                              <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', textAlign: 'left' }}>
                                {c.title}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpenChatId(isDropdownOpen ? null : c.id);
                            }}
                            style={{
                              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                              background: isDropdownOpen ? 'var(--bg-hover)' : 'transparent', border: 'none',
                              color: isDropdownOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                              cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', opacity: isDropdownOpen ? 1 : 0.7, zIndex: 10
                            }}
                            title="Options"
                          >
                            <MoreVertical size={14} />
                          </button>
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.12 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute', right: 8, top: 'calc(100% + 2px)', zIndex: 100,
                                  background: '#18181b', border: '1px solid var(--border-glass)',
                                  borderRadius: 12, padding: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                  minWidth: 150, display: 'flex', flexDirection: 'column', gap: 2
                                }}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDropdownOpenChatId(null); setRenameChat({ id: c.id, title: c.title }); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Edit3 size={13} color="var(--accent)" /> Rename
                                </button>
                                <button
                                  onClick={(e) => togglePinChat(c.id, e)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Pin size={13} color="#f59e0b" /> Pin to Top
                                </button>
                                <button
                                  onClick={(e) => handleExportChat(c.id, c.title, e)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Download size={13} color="var(--accent-2)" /> Export (.txt)
                                </button>
                                <div style={{ height: 1, background: 'var(--border-glass)', margin: '2px 0' }} />
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDropdownOpenChatId(null); setDeleteChatId(c.id); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 8, color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Trash2 size={13} /> Delete Chat
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </>
              )}

              {conversations.length === 0 && (
                <div style={{ padding: '16px 10px', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'pre-line' }}>
                  {t('noConversations')} 
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Manufacturer Tools */}
              {userRole === 'manufacturer' && (
                <>
                  <button className={`sidebar-item ${activeView === 'standards' ? 'active' : ''}`} onClick={() => { setActiveView('standards' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <Library size={15} /> {t('standardsDir')}
                  </button>
                  <button className={`sidebar-item ${activeView === 'guide' ? 'active' : ''}`} onClick={() => { setActiveView('guide' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <FileText size={15} /> {t('certGuide')}
                  </button>
                  <button className={`sidebar-item ${activeView === 'calculator' ? 'active' : ''}`} onClick={() => { setActiveView('calculator' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <Calculator size={15} /> {t('feeEstimator')}
                  </button>
                  
                </>
              )}

              {/* Consumer Tools */}
              {userRole === 'consumer' && (
                <>
                  <button className={`sidebar-item ${activeView === 'verify' ? 'active' : ''}`} onClick={() => { setActiveView('verify' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <ShieldCheck size={15} /> {t('verifyISI')}
                  </button>
                  <button className={`sidebar-item ${activeView === 'complaints_hub' ? 'active' : ''}`} onClick={() => { setActiveView('complaints_hub' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                      <AlertCircle size={15} /> Complaints
                    </button>
                  
                  <button className={`sidebar-item ${activeView === 'community_labs' ? 'active' : ''}`} onClick={() => { setActiveView('community_labs' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                      <Layers size={15} /> Community & Labs
                    </button>
                  
                </>
              )}

              {/* Common */}
              <div className="divider" style={{ margin: '4px 0', borderBottom: '1px solid var(--border-glass)' }} />
              <button className={`sidebar-item ${activeView === 'faq' ? 'active' : ''}`} onClick={() => { setActiveView('faq' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                <HelpCircle size={15} /> {t('helpFaq')}
              </button>
              <button className={`sidebar-item ${activeView === 'about' ? 'active' : ''}`} onClick={() => { setActiveView('about' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                  <Info size={15} /> About BIS
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="main-area">
        {/* Top Bar */}
        <div className="topbar" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)} style={{ background: 'var(--bg-glass-strong)' }} title="Open sidebar">
                <PanelLeftOpen size={18} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="app-logo" style={{ width: 32, height: 32, borderRadius: 12 }}>
                <Logo size={20} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                BIS Assistant <span style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>· {roleLabel}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {currentSources.length > 0 && (
              <button
                className="btn btn-ghost btn-sm hide-mobile"
                onClick={() => setShowRightPanel(!showRightPanel)}
                style={{ gap: 5, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', padding: '8px 12px', background: showRightPanel ? 'var(--bg-glass-strong)' : 'transparent', color: 'var(--accent)' }}
                title="View Document Sources"
              >
                <FileText size={16} /> Sources ({currentSources.length})
              </button>
            )}
            <button
              className="icon-btn hide-mobile"
              onClick={exportChat}
              style={{ background: 'transparent' }}
              title="Export Conversation"
            >
              <Download size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ gap: 5, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}
                onClick={() => setShowLang(!showLang)}
              >
                <Globe size={13} />
                <span className="hide-mobile">{LANGUAGES.find(l => l.code === language)?.label}</span>
                <ChevronDown size={12} />
              </button>
              {showLang && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, background: 'var(--bg-glass-strong)',
                  border: '1px solid var(--border-glass)', borderRadius: 16, padding: 8,
                  width: 140, zIndex: 100, boxShadow: 'var(--shadow-glass)'
                }}>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className="sidebar-item"
                      style={{ fontSize: '0.8125rem', color: l.code === language ? 'var(--accent)' : 'var(--text-primary)', borderRadius: 12 }}
                      onClick={() => changeLanguage(l.code)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="icon-btn hide-mobile" onClick={toggleTheme} style={{ background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-md)', width: 40, height: 40 }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

                        {/* Topbar Profile Widget */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ 
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'white', fontWeight: 700, cursor: 'pointer', overflow: 'hidden',
                  border: '2px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)'
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : userRole.charAt(0).toUpperCase()
                )}
              </div>

              {showProfileDropdown && (
                <div className="lang-dropdown" style={{ width: 200 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-glass)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user?.name || 'BIS User'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{user?.email || `user@${userRole}.bis.gov.in`}</div>
                  </div>
                  <button className="lang-item" onClick={() => { setShowProfileDropdown(false); setShowProfileModal(true); }}>
                    <User size={14} /> View Profile
                  </button>
                  <button className="lang-item" onClick={() => { setShowProfileDropdown(false); setShowSignOutModal(true); }} style={{ color: 'var(--danger)' }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeView === 'chat' && (
          <>
            {/* Messages */}
            <div className="chat-scroll">
              <div className="chat-content">
                {isChatLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
                    <div className="message-row" style={{ justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '40%' }}>
                        <div className="skeleton" style={{ height: 44, borderRadius: 24, background: 'var(--bg-hover)' }} />
                      </div>
                    </div>
                    <div className="message-row" style={{ justifyContent: 'flex-start' }}>
                      <div className="msg-avatar ai" style={{ width: 32, height: 32 }}><Logo size={20} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '60%' }}>
                        <div className="skeleton" style={{ height: 80, borderRadius: 16, background: 'var(--bg-hover)' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Suggestions when only welcome message */}
                    {messages.length === 1 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div className="msg-avatar ai" style={{ width: 32, height: 32 }}><Logo size={20} /></div>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>BIS Assistant</span>
                        </div>
                        <div className="msg-bubble ai prose" dangerouslySetInnerHTML={{ __html: renderContent(messages[0].content) }} />
                        <div className="suggestion-grid" style={{ marginTop: 24 }}>
                          {getSuggestions(userRole, language).map((q, i) => (
                            <button key={i} className="suggestion-card" onClick={() => sendMessage(q)}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All messages */}
                    {messages.slice(messages.length === 1 ? 1 : 0).map((msg, i, arr) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="message-row"
                        style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                      >
                        {msg.role === 'assistant' && (
                          <div className="msg-avatar ai" style={{ width: 32, height: 32 }}>
                            <Logo size={20} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: msg.role === 'user' ? '80%' : 'calc(100% - 60px)', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
                          {msg.role === 'user' && msg.attachment && (
                            <div style={{ marginBottom: 4 }}>
                              {msg.attachment.url ? (
                                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.18)', maxWidth: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                                  <img src={msg.attachment.url} alt={msg.attachment.name} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                                </div>
                              ) : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-glass-strong)', borderRadius: 12, fontSize: '0.85rem', border: '1px solid var(--border-glass)' }}>
                                  <FileText size={16} color="var(--accent)" />
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{msg.attachment.name}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {msg.role === 'user' ? (
                            <div className="msg-bubble user">
                              {msg.content}
                            </div>
                          ) : (
                            <div
                              className="msg-bubble ai prose"
                              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                            />
                          )}
                          {msg.role === 'assistant' && (
                            <>
                              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                <button onClick={() => copyToClipboard(msg.content, msg.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }} title="Copy">
                                  {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                                <button onClick={() => readAloud(msg.content)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Read Aloud">
                                  <Volume2 size={14} />
                                </button>
                                <button onClick={() => setFeedback(prev => ({ ...prev, [msg.id]: 'up' }))} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: feedback[msg.id] === 'up' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }} title="Helpful">
                                  <ThumbsUp size={14} />
                                </button>
                                <button onClick={() => setFeedback(prev => ({ ...prev, [msg.id]: 'down' }))} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: feedback[msg.id] === 'down' ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer' }} title="Not helpful">
                                  <ThumbsDown size={14} />
                                </button>
                                {i === arr.length - 1 && (
                                  <button onClick={regenerateLastResponse} disabled={loading} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: loading ? 'not-allowed' : 'pointer' }} title="Regenerate">
                                    <RefreshCcw size={14} />
                                  </button>
                                )}
                              </div>
                              
                              {/* Rich GraphRAG Citations */}
                              {msg.sources && msg.sources.length > 0 && (
                                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Library size={12} /> Retrieved Sources
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                    {msg.sources.map((s: any, idx: number) => (
                                      <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 12, textDecoration: 'none', transition: '0.2s', cursor: 'pointer' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.type === 'lab' ? 'var(--accent-muted)' : 'rgba(239, 68, 68, 0.1)', color: s.type === 'lab' ? 'var(--accent)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {s.type === 'lab' ? <Building2 size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.title}</div>
                                          {s.clause && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>{s.clause} • {s.page}</div>}
                                          {s.details && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.details}</div>}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-row">
                        <div className="msg-avatar ai" style={{ width: 32, height: 32 }}><Logo size={20} /></div>
                        <div className="msg-bubble ai">
                          <div className="typing-dots">
                            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-wrapper">
                {attachedFile && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.8125rem' }}>
                    <Paperclip size={14} />
                    {attachedFile.name}
                    <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                  </div>
                )}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-glass)' }}>
                  <input type="file" ref={fileInputRef} accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 4 * 1024 * 1024) {
                      showToast('File too large (max 4MB)', 'error');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      return;
                    }
                    setAttachedFile(file || null);
                  }} />
                  <button onClick={() => setShowUploadTypeModal(true)} title="Upload file or document" style={{ width: 44, height: 52, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}>
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 0', color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'none', outline: 'none', maxHeight: 200, minHeight: 52, fontFamily: 'inherit', lineHeight: 1.5 }}
                    value={input}
                    onChange={handleTextarea}
                    onKeyDown={handleKey}
                    placeholder={t('placeholder')}
                    rows={1}
                  />
                  <button onClick={toggleListening} style={{ width: 44, height: 52, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: isListening ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isListening ? <span style={{ width: 10, height: 10, background: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> : <Mic size={18} />}
                  </button>
                  <button
                    style={{ margin: '8px 8px 8px 0', width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-button-primary)', color: 'var(--text-on-primary-btn)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() && !attachedFile) || loading ? 0.5 : 1, transition: '0.2s' }}
                    onClick={() => sendMessage()}
                    disabled={(!input.trim() && !attachedFile) || loading}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                BIS AI may make mistakes. Verify important requirements at{' '}
                <a href="https://bis.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>bis.gov.in</a>
              </p>
            </div>
          </>
        )}

        {/* ===== STANDARDS DIRECTORY ===== */}
        {activeView === 'standards' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Library size={28} color="var(--accent)" /> {t('standardsDir')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('standardsSubtitle')}</p>
            </div>
            
            <div style={{ position: 'relative', maxWidth: 800, marginBottom: 24 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={t('standardsSearchPlaceholder')} className="form-input" style={{ paddingLeft: 48, height: 52 }} value={standardsSearch} onChange={e => setStandardsSearch(e.target.value)} />
            </div>

            {loadingStandards ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 20, background: 'var(--bg-glass-strong)', opacity: 0.6 }} />)}</div>
            ) : standardsResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>{t('noStandards')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
                {standardsResults.map((std: any, i: number) => (
                  <div key={i} style={{ padding: 20, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>{std.code}</h3>
                      {std.mandatory && <span className="pill pill-red" style={{ fontSize: '0.7rem' }}>{t('mandatory')} ({std.scheme})</span>}
                      {!std.mandatory && <span className="pill pill-blue" style={{ fontSize: '0.7rem' }}>{t('voluntary')}</span>}
                    </div>
                    <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{std.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Library size={14} /> {std.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'guide' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><FileText size={28} color="var(--accent)" /> {t('certGuide')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('certGuideSubtitle')}</p>
            </div>
            
            <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { step: 1, title: 'Identify Applicable Standard', desc: 'Determine if your product falls under mandatory certification (QCO) and find the exact IS code using the Standards Directory.' },
                { step: 2, title: 'Prepare Manufacturing Infrastructure', desc: 'Ensure your factory has the required in-house testing facilities and competent quality control personnel as prescribed in the Scheme of Inspection and Testing (SIT).' },
                { step: 3, title: 'Submit Application via Manakonline', desc: 'Register on manakonline.in, fill out Form-I, upload necessary documents (factory layout, company registration, testing equipment calibration certificates), and pay the application fee.' },
                { step: 4, title: 'Factory Inspection & Testing', desc: 'A BIS officer will visit your premises, inspect manufacturing and testing capabilities, and draw independent samples for testing at a BIS-recognized lab.' },
                { step: 5, title: 'Grant of License', desc: 'If the inspection is satisfactory and the independent test report confirms conformity, BIS grants the license allowing you to use the Standard Mark (ISI).' }
              ].map(s => (
                <div key={s.step} style={{ padding: '20px 24px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16, display: 'flex', gap: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'calculator' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Calculator size={28} color="var(--accent)" /> {t('feeEstimator')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('calcSubtitle')}</p>
            </div>
            
            <div style={{ maxWidth: 600, padding: 32, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24 }}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">{t('enterpriseType')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[t('microScale'), t('smallScale'), t('largeScale')].map((tLabel, i) => (
                    <button key={i} onClick={() => setFeeCategory(['micro', 'small', 'large'][i])} style={{ padding: '10px', borderRadius: 12, border: `1px solid ${feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent)' : 'var(--border-glass)'}`, background: feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent-muted)' : 'var(--bg-hover)', color: feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      {tLabel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">{t('turnoverLabel')}</label>
                <input type="number" placeholder="e.g. 5000000" value={feeTurnover} onChange={e => setFeeTurnover(e.target.value)} className="form-input" />
              </div>
              
              <div style={{ marginTop: 32, padding: 20, background: 'var(--bg-hover)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('feeBreakdown')}</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  <span>{t('appFee')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹1,000</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  <span>{t('inspectionFee')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹7,000</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: 'var(--text-secondary)' }}>
                  <span>{t('markingFee')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {feeCategory === 'micro' ? '₹20,000 (with 80% concession)' : feeCategory === 'small' ? '₹40,000 (with 50% concession)' : '₹80,000+'}
                  </span>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  <span>{t('totalBaseline')}</span>
                  <span>{feeCategory === 'micro' ? '₹28,000' : feeCategory === 'small' ? '₹48,000' : '₹88,000'}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>* Does not include independent lab testing charges or actual marking fee calculated on per-unit basis.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'verify' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ShieldCheck size={28} color="var(--accent)" /> {t('verifyISI')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('verifySubtitle')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[{ label: t('huidLabel'), example: 'A1B2C3', desc: '6-character code on jewellery', icon: '💍' }, { label: t('isiLabel'), example: 'CM/L-1234567', desc: '7+ digit CM/L number on product', icon: '🏭' }].map((tip, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: '1.5rem' }}>{tip.icon}</span>
                  <div><div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: 4 }}>{tip.label}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 6 }}>{tip.desc}</div><code style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 6, fontSize: '0.82rem', color: 'var(--accent)' }}>{tip.example}</code></div>
                </div>
              ))}
            </div>
            <div className="card" style={{ maxWidth: 640 }}>
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('verifyInputLabel')}</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input name="code" required className="form-input" style={{ flex: 1, fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: 2, height: 52 }} placeholder="e.g. A1B2C3 or CM/L-7654321" />
                    <button type="submit" disabled={verifying} className="btn btn-primary" style={{ height: 52, padding: '0 24px', fontWeight: 600, gap: 8, flexShrink: 0 }}>
                      {verifying ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <Search size={18} />}
                      {t('verifyBtn')}
                    </button>
                  </div>
                </div>
              </form>
              {verifyResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, padding: 24, borderRadius: 20, background: verifyResult.valid ? 'rgba(16,163,127,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid` + (verifyResult.valid ? ' rgba(16,163,127,0.25)' : ' rgba(239,68,68,0.25)') }}>
                  {verifyResult.valid ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}><CheckCircle2 size={22} /> Valid {verifyResult.type} — Authenticated by BIS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                        {Object.entries(verifyResult.details || {}).map(([k, v]: any) => (
                          <div key={k} style={{ background: 'var(--bg-hover)', borderRadius: 14, padding: '10px 14px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'capitalize', marginBottom: 3 }}>{k.replace(/([A-Z])/g, ' `$1').trim()}</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)' }} onClick={() => { const txt = Object.entries(verifyResult.details || {}).map(([k,v]) => k + ': ' + v).join('\n'); navigator.clipboard?.writeText(txt).then(() => showToast('Copied!', 'success')); }}><Copy size={14} /> Copy Details</button>
                        <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit' }}><ExternalLink size={14} /> BIS Portal</a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ padding: 10, borderRadius: 12, background: 'rgba(239,68,68,0.1)', flexShrink: 0 }}><X size={20} color="var(--danger)" /></div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>Not Verified</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{verifyResult.message}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Suspect counterfeiting? <button onClick={() => { setActiveView('chat'); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>File a complaint →</button></p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== COMPLAINTS HUB ===== */}
        {activeView === 'complaints_hub' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><AlertCircle size={28} color="var(--accent)" /> {t('fileComplaint')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('complaintsSubtitle')}</p>
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'var(--bg-glass-strong)', padding: 6, borderRadius: 14, width: 'fit-content' }}>
              <button className={`btn ${complaintTab === 'file' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setComplaintTab('file')} style={{ borderRadius: 10 }}>{t('fileTab')}</button>
              <button className={`btn ${complaintTab === 'track' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setComplaintTab('track')} style={{ borderRadius: 10 }}>{t('trackTab')}</button>
            </div>

            {complaintTab === 'file' && (
            <div className="card" style={{ maxWidth: 680 }}>
              {complaintSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,163,127,0.1)', color: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><CheckCircle2 size={36} /></div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('complaintFiled')}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>BIS officials will review within 7-10 working days.</p>
                  <div style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '20px 32px', display: 'inline-block', textAlign: 'left', marginBottom: 28 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('trackingId')}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: 2, marginBottom: 8 }}>{complaintSuccess.id}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filed on {complaintSuccess.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => { setActiveView('chat'); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>{t('trackTab')}</button>
                    <button className="btn btn-ghost" onClick={() => setComplaintSuccess(null)}>{t('fileAnother')}</button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Category *</label>
                      <select name="category" required className="form-input">
                        <option value="">Select category</option>
                        <option value="counterfeit">Counterfeit ISI Mark</option>
                        <option value="quality">Poor Quality / Defective</option>
                        <option value="hallmark">Hallmarking Issue</option>
                        <option value="manufacturer">Manufacturer Misconduct</option>
                        <option value="retailer">Retailer Fraud</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Priority</label>
                      <select name="priority" className="form-input">
                        <option value="normal">Normal</option>
                        <option value="high">High — Safety Risk</option>
                        <option value="urgent">Urgent — Immediate Danger</option>
                        <option value="low">Low — Minor Issue</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Subject *</label>
                    <input name="subject" required className="form-input" placeholder="e.g. Counterfeit ISI mark on safety helmet" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">Product Name</label><input name="productName" className="form-input" placeholder="e.g. Safety Helmet" /></div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">Brand</label><input name="brand" className="form-input" placeholder="e.g. ABC Industries" /></div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Details *</label>
                    <textarea name="details" required className="form-input" rows={5} placeholder="Describe the issue — where bought, what was wrong, ISI/HUID codes, batch numbers..." style={{ resize: 'vertical', borderRadius: 16 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border-glass)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>* Required. Your details are kept confidential.</p>
                    <button type="submit" disabled={complaintSubmitting} className="btn btn-primary" style={{ height: 48, padding: '0 32px', fontWeight: 600 }}>{complaintSubmitting ? 'Submitting...' : 'Submit to BIS →'}</button>
                  </div>
                </form>
              )}
            </div>
            )}
            
            {/* ===== TRACK COMPLAINTS ===== */}
            {complaintTab === 'track' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loadingComplaints ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} style={{ height: 100, borderRadius: 20, background: 'var(--bg-glass-strong)', opacity: 0.6 }} />)}</div>
                ) : userComplaints.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 680 }}>
                    <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{t('noComplaintsYet')}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Notice a counterfeit or non-compliant product? Let BIS know.</p>
                    <button className="btn btn-primary" onClick={() => setComplaintTab('file')}>File a Complaint →</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {userComplaints.map((c: any) => {
                      const statusMap: Record<string, { color: string; bg: string; label: string; step: number }> = {
                        pending:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending Review', step: 1 },
                        under_review: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Under Review', step: 2 },
                        resolved:     { color: '#10a37f', bg: 'rgba(16,163,127,0.1)', label: 'Resolved', step: 3 },
                        rejected:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected', step: 0 },
                      };
                      const sc = statusMap[c.status] || statusMap.pending;
                      return (
                        <div key={c.id} style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: 24, maxWidth: 680 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{c.subject}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>ID: {c.id.slice(0,8).toUpperCase()} · {new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                            </div>
                            <span style={{ background: sc.bg, color: sc.color, borderRadius: 'var(--radius-md)', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>{sc.label}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, lineHeight: 1.5 }}>{c.details}</p>
                          {c.status !== 'rejected' && (
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: c.adminNote ? 14 : 0 }}>
                              {['Submitted', 'Under Review', 'Resolved'].map((step, idx) => (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                                    {idx > 0 && <div style={{ flex: 1, height: 2, background: sc.step > idx ? 'var(--accent)' : 'var(--border-glass)' }} />}
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: sc.step > idx ? 'var(--accent)' : 'var(--bg-hover)', border: '2px solid ' + (sc.step > idx ? 'var(--accent)' : 'var(--border-glass)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sc.step > idx && <Check size={13} color="white" />}</div>
                                    {idx < 2 && <div style={{ flex: 1, height: 2, background: sc.step > idx + 1 ? 'var(--accent)' : 'var(--border-glass)' }} />}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: sc.step > idx ? 'var(--accent)' : 'var(--text-muted)', marginTop: 5, fontWeight: sc.step > idx ? 600 : 400, textAlign: 'center' }}>{step}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {c.adminNote && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 12, fontSize: '0.875rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>BIS Note: </span><span style={{ color: 'var(--text-secondary)' }}>{c.adminNote}</span></div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}


        {/* ===== FIND TESTING LAB ===== */}
        {activeView === 'community_labs' && communityTab === 'labs' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Building2 size={28} color="var(--accent)" /> {t('findLab')}</h2>
              
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: 'var(--bg-glass-strong)', padding: 6, borderRadius: 14, width: 'fit-content' }}>
                <button className={`btn ${(communityTab as string) === 'clubs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCommunityTab('clubs')} style={{ borderRadius: 10 }}>{t('standardsClubs')}</button>
                <button className={`btn ${(communityTab as string) === 'labs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCommunityTab('labs')} style={{ borderRadius: 10 }}>{t('findLab')}</button>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{t('labsSubtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder={t('filterState')} className="form-input" style={{ paddingLeft: 40, height: 44 }} value={labState} onChange={e => { setLabState(e.target.value); handleLabSearch(e.target.value, labProduct); }} />
              </div>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder={t('filterProduct')} className="form-input" style={{ paddingLeft: 40, height: 44 }} value={labProduct} onChange={e => { setLabProduct(e.target.value); handleLabSearch(labState, e.target.value); }} />
              </div>
            </div>
            {labSearch ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Searching labs...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {(labResults || []).map((lab: any) => (
                  <div key={lab.id || lab.name} style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ padding: 10, background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 14, flexShrink: 0 }}><Building2 size={20} /></div>
                      <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.3, marginBottom: 5 }}>{lab.name}</div><div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.78rem' }}><MapPin size={11} /> {lab.location || lab.address}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {lab.nabl && <span style={{ background: 'rgba(16,163,127,0.1)', color: '#10a37f', borderRadius: 'var(--radius-md)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>NABL Accredited</span>}
                      {lab.bis && <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>BIS Recognized</span>}
                    </div>
                    {lab.products && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{lab.products.slice(0,4).map((p: string) => <span key={p} style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: 8, padding: '2px 8px', fontSize: '0.72rem' }}>{p}</span>)}</div>}
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {lab.phone && <a href={'tel:' + lab.phone} className="btn btn-ghost btn-sm" style={{ gap: 4, borderRadius: 'var(--radius-md)', fontSize: '0.78rem', textDecoration: 'none' }}>📞 {lab.phone}</a>}
                      {lab.website && <a href={lab.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 4, borderRadius: 'var(--radius-md)', fontSize: '0.78rem', textDecoration: 'none' }}><ExternalLink size={11} /> Website</a>}
                      <a href={'https://maps.google.com/?q=' + encodeURIComponent(lab.address || lab.location)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 4, borderRadius: 'var(--radius-md)', fontSize: '0.78rem', textDecoration: 'none' }}><MapPin size={11} /> Directions</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== STANDARDS CLUBS ===== */}
        {activeView === 'community_labs' && communityTab === 'clubs' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Library size={28} color="var(--accent)" /> {t('standardsClubs')}</h2>
              
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: 'var(--bg-glass-strong)', padding: 6, borderRadius: 14, width: 'fit-content' }}>
                <button className={`btn ${(communityTab as string) === 'clubs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCommunityTab('clubs')} style={{ borderRadius: 10 }}>{t('standardsClubs')}</button>
                <button className={`btn ${(communityTab as string) === 'labs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCommunityTab('labs')} style={{ borderRadius: 10 }}>{t('findLab')}</button>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{t('clubsSubtitle')}</p>
            </div>
            <div style={{ position: 'relative', maxWidth: 800, marginBottom: 24 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={t('searchClubsPlaceholder')} className="form-input" style={{ paddingLeft: 48, height: 52 }} value={clubsSearch} onChange={e => setClubsSearch(e.target.value)} />
            </div>
            {loadingClubs ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} style={{ height: 130, borderRadius: 20, background: 'var(--bg-glass-strong)', opacity: 0.6 }} />)}</div>
            ) : clubsResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No clubs found. Try another search.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {clubsResults.map((club: any) => {
                  let status = 'none';
                  if (club.__status) { status = club.__status; }
                  
                  return (
                  <div key={club.id} style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 5 }}>{club.name}</div><div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.78rem' }}><MapPin size={11} /> {club.city}, {club.state}</div></div>
                      <span className="pill pill-blue" style={{ flexShrink: 0, fontSize: '0.72rem' }}>{club.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Members</div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{club.members}</div></div>
                      <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Since</div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{club.established}</div></div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
                      {status === 'approved' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10a37f', fontWeight: 600, fontSize: '0.875rem' }}><CheckCircle2 size={16} /> {t('memberApproved')}</div>
                      ) : status === 'pending' ? (
                        <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem' }}>⏳ {t('reqPending')}</div>
                      ) : status === 'rejected' ? (
                        <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>❌ Request Rejected</div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ borderRadius: 'var(--radius-md)', width: '100%', justifyContent: 'center', fontWeight: 600 }} onClick={async () => {
                          try {
                            const res = await fetch('/api/clubs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ clubId: club.id, clubName: club.name }) });
                            if (res.ok || res.status === 400) { showToast('Join request sent! Pending admin approval.', 'success'); setClubsResults((prev: any[]) => prev.map((c: any) => c.id === club.id ? { ...c, __status: 'pending' } : c)); }
                            else { showToast('Failed to send request', 'error'); }
                          } catch { showToast('Network error', 'error'); }
                        }}>{t('requestToJoin')}</button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== HELP & FAQ ===== */}
        {activeView === 'faq' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><AlertCircle size={28} color="var(--accent)" /> {t('helpFaq')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('faqSubtitle')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, marginBottom: 32 }}>
                {(userRole === 'manufacturer' ? [
                  { q: 'How do I apply for a BIS ISI license?', a: 'Apply through the Manak Online portal at services.bis.gov.in. Submit product test reports from a BIS-recognized lab, factory details, and pay the fee. Process takes 60-90 days.' },
                  { q: 'Which products require mandatory ISI certification?', a: 'Over 370+ products including steel, cement, packaged drinking water, LPG cylinders, electrical wires, helmets, and children toys. Ask the AI chat for your specific product.' },
                  { q: 'What is the fee structure for BIS certification?', a: 'Fees vary by scheme and company turnover. MSMEs get concessions. Annual license fees range from Rs.1,000 to Rs.5 lakhs. Use the Fee Estimator in the sidebar.' },
                  { q: 'What is CRS (Compulsory Registration Scheme)?', a: 'CRS covers electronics like mobiles, laptops, power banks, and LED lights. Unlike ISI it requires self-declaration and registration - no factory inspection for most products.' },
                  { q: 'How often do BIS officials inspect manufacturing units?', a: 'Under regular surveillance, BIS officials inspect units at least once a year. High-risk products may have more frequent surprise inspections.' },
                  { q: 'How do I renew my expired ISI License?', a: 'Renewal applications must be submitted via the Manak Online portal at least one month before expiration, along with the production details and renewal fee.' }
                ] : [
                  { q: 'How do I verify an ISI mark or gold hallmark?', a: 'Use the Verify ISI/HUID tool in the sidebar. For HUID enter the 6-character code, for ISI enter the CM/L number. You can also verify at bis.gov.in.' },
                  { q: 'What is gold hallmarking and why is it mandatory?', a: 'BIS Hallmarking certifies gold purity. Since January 2021 it is mandatory. Each piece has a unique 6-character HUID traceable to the jeweller and assay centre.' },
                  { q: 'How do I file a complaint about poor quality products?', a: 'Navigate to the Complaints section in the sidebar. You can file a detailed report, which is assigned a Tracking ID for BIS officials to review.' },
                  { q: 'How long does a complaint take to resolve?', a: 'Normal priority: 7-10 working days. High/urgent (safety risk): escalated within 24-48 hours. Track progress using your complaint Tracking ID.' },
                  { q: 'How do I join a BIS Standards Club?', a: 'Use the Community & Labs section in the sidebar to find and request membership. Membership is free for students and requires admin approval within 3-5 working days.' },
                  { q: 'What should I do if a retailer refuses to give a bill for hallmarked gold?', a: 'A proper GST bill with the HUID details is mandatory. You should immediately report the jeweller through the Complaints Hub.' }
                ]).map((item, i) => (
                  <details key={i} className="faq-details" style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <summary style={{ fontWeight: 600, color: 'var(--text-primary)', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.q}
                      <span className="faq-icon" style={{ color: 'var(--accent)', fontSize: '1.2rem', transition: 'transform 0.2s' }}>+</span>
                    </summary>
                    <p style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, paddingBottom: 4 }}>{item.a}</p>
                  </details>
                ))}
              </div>
            <div className="card" style={{ maxWidth: 800 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: '1.05rem' }}>{t('stillQuestions')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 18 }}>Use the AI chat for instant answers, or contact BIS directly.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-md)' }} onClick={() => { setActiveView('chat'); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>{t('askAi')}</button>
                <a href="https://www.bis.gov.in/contact-us/" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-md)', textDecoration: 'none', gap: 6 }}><ExternalLink size={14} /> BIS Contact</a>
                <a href="tel:1800-11-4566" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>📞 1800-11-4566</a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ABOUT BIS ===== */}
        {activeView === 'about' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Info size={28} color="var(--accent)" /> {t('aboutBis')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('aboutSubtitle')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
              {[
                { icon: <ShieldCheck size={22} color="var(--accent)" />, title: 'Who We Are', body: 'The Bureau of Indian Standards (BIS) is the National Standard Body of India established under the BIS Act 2016. It operates under the Ministry of Consumer Affairs, Food & Public Distribution, Government of India.' },
                { icon: <Activity size={22} color="var(--accent)" />, title: 'Our Mission', body: 'To provide safe, reliable and quality goods and services through standardization, conformity assessment, and related services, thereby enhancing the quality of life of the people of India.' },
                { icon: <Globe size={22} color="var(--accent)" />, title: 'Core Activities', body: null, list: ['Standards Formulation', 'Product Certification (ISI Mark)', 'Hallmarking of Precious Metals', 'Laboratory Recognition & Testing', 'System Certification (ISO 9001)', 'Consumer Affairs & Awareness', 'Training & Skill Development'] },
                { icon: <Building2 size={22} color="var(--accent)" />, title: 'Key Statistics', body: null, stats: [{ label: 'IS Standards', value: '22,000+' }, { label: 'Certified Products', value: '370+' }, { label: 'Testing Labs', value: '800+' }, { label: 'Hallmarking Centres', value: '1,300+' }] },
              ].map((section, i) => (
                <div key={i} style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ padding: 10, background: 'var(--accent-muted)', borderRadius: 12 }}>{section.icon}</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</h3>
                  </div>
                  {section.body && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{section.body}</p>}
                  {(section as any).list && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>{(section as any).list.map((item: string, j: number) => <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />{item}</div>)}</div>}
                  {(section as any).stats && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>{(section as any).stats.map((s: any, j: number) => <div key={j} style={{ background: 'var(--bg-hover)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div></div>)}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== DOCUMENT VAULT ===== */}
        {activeView === 'vault' && (
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><FileText size={28} color="var(--accent)" /> Document Vault</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Securely manage your BIS application documents, test reports, and licenses.</p>
            </div>
            <div className="card" style={{ maxWidth: 800 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Stored Files</h3>
                <button className="btn btn-primary btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)' }}><Upload size={14} /> Upload Document</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[{ name: 'Factory_License_2024.pdf', size: '2.4 MB', date: 'Oct 12, 2024', category: 'License' }, { name: 'Water_Quality_NABL_Report.pdf', size: '4.1 MB', date: 'Nov 05, 2024', category: 'Test Report' }, { name: 'Machinery_Layout.png', size: '1.2 MB', date: 'Nov 18, 2024', category: 'Drawing' }].map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-hover)', border: '1px solid var(--border-glass)', borderRadius: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: 8, background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 10 }}><FileText size={18} /></div>
                      <div><div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{file.name}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 3 }}>{file.size} · {file.date} · <span style={{ background: 'var(--bg-glass-strong)', padding: '1px 6px', borderRadius: 5 }}>{file.category}</span></div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}><button className="btn btn-ghost btn-sm" style={{ borderRadius: 8 }}><Download size={14} /></button><button className="btn btn-ghost btn-sm" style={{ borderRadius: 8, color: 'var(--danger)' }}><Trash2 size={14} /></button></div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px', border: '2px dashed var(--border-glass)', borderRadius: 18, textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Upload size={24} style={{ marginBottom: 8 }} /><div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop files here</div><div style={{ fontSize: '0.78rem' }}>PDF, PNG, JPG up to 10MB</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

{/* Upload Type Modal */}
      <AnimatePresence>
        {showUploadTypeModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="modal" style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}><Upload size={22} color="var(--accent)" /> Upload Document</h2>
                <button onClick={() => setShowUploadTypeModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 24 }}>What type of file are you uploading?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button className="upload-type-btn" style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)' }} onClick={() => {
                  setShowUploadTypeModal(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                  }
                }}>
                  <Image size={28} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Image</span>
                </button>
                <button className="upload-type-btn" style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)' }} onClick={() => {
                  setShowUploadTypeModal(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf';
                    fileInputRef.current.click();
                  }
                }}>
                  <FileText size={28} color="var(--accent-2)" />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="modal" style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={22} color="var(--danger)" /> {t('deleteAccount')}</h2>
                <button onClick={() => setShowDeleteAccountModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 28 }}>{t('deleteAccountConfirm')}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44 }} onClick={() => setShowDeleteAccountModal(false)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44, background: 'var(--danger)', color: 'white', fontWeight: 600 }} onClick={async () => { 
                  try {
                    await fetch('/api/auth?action=delete', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    logout(); navigate('/sign-in');
                  } catch (e) {
                    showToast('Failed to delete account', 'error');
                  }
                }}>Yes, {t('deleteAccount')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Sign Out Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="modal" style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}><LogOut size={22} color="var(--danger)" /> {t('signOut')}</h2>
                <button onClick={() => setShowSignOutModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 28 }}>{t('signOutConfirm')}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44 }} onClick={() => setShowSignOutModal(false)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44, background: 'var(--danger)', color: 'white', fontWeight: 600 }} onClick={() => { logout(); navigate('/sign-in'); }}>{t('signOut')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Delete Chat Modal */}
      <AnimatePresence>
        {deleteChatId && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="modal" style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={22} color="var(--danger)" /> {t('deleteChat')}</h2>
                <button onClick={() => setDeleteChatId(null)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 28 }}>Are you sure you want to delete this conversation? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44 }} onClick={() => setDeleteChatId(null)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44, background: 'var(--danger)', color: 'white', fontWeight: 600 }} onClick={async () => { 
                  try {
                    await fetch(`/api/conversations/${deleteChatId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    setConversations(prev => prev.filter(c => c.id !== deleteChatId));
                    if (activeConvId === deleteChatId) startNewChat();
                  } catch {}
                  setDeleteChatId(null); 
                }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Rename Chat Modal */}
      <AnimatePresence>
        {renameChat && (
          <div className="modal-backdrop" onClick={() => setRenameChat(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="modal"
              style={{ maxWidth: 420 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Edit3 size={22} color="var(--accent)" /> {t('renameChat')}
                </h2>
                <button onClick={() => setRenameChat(null)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleRenameChat(renameChat.id, renameChat.title); }}>
                <input
                  type="text"
                  className="form-input"
                  value={renameChat.title}
                  onChange={e => setRenameChat({ ...renameChat, title: e.target.value })}
                  placeholder="Enter new conversation title"
                  autoFocus
                  style={{ marginBottom: 20 }}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setRenameChat(null)} style={{ padding: '0 20px', height: 44 }}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: 44 }}>{t('save')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="modal" style={{ maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}><User size={22} color="var(--accent)" /> My Profile</h2>
                <button onClick={() => setShowProfileModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, background: 'var(--bg-hover)', padding: '16px', borderRadius: 20, border: '1px solid var(--border-glass)' }}>
                <input type="file" accept="image/*,application/pdf" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  title="Click to upload profile photo/file"
                >
                  {uploadingAvatar ? <span style={{ fontSize: '0.8rem' }}>...</span> : user?.avatar ? (
                    <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : userRole.charAt(0).toUpperCase()
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '2px', display: 'flex' }}><Upload size={12} color="white" /></div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'BIS User'}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email || `user@${userRole}.bis.gov.in`}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`pill ${userRole === 'consumer' ? 'pill-green' : 'pill-blue'}`}>{roleLabel}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Account Status</div>
                  <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} /> Verified</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Total Queries</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={14} /> {conversations.length}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: '0.9375rem' }}><Globe size={16} color="var(--text-secondary)" /> Language</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{LANGUAGES.find(l => l.code === language)?.label}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{theme === 'dark' ? <Moon size={16} color="var(--text-secondary)" /> : <Sun size={16} color="var(--text-secondary)" />} Theme</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                </div>
              </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44, color: 'var(--danger)' }} onClick={() => { setShowProfileModal(false); setShowDeleteAccountModal(true); }}>Delete Account</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44 }} onClick={() => setShowProfileModal(false)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.35 }}
            style={{
              position: 'fixed', bottom: 28, left: '50%',
              background: 'var(--bg-glass-strong)',
              backdropFilter: 'none', WebkitBackdropFilter: 'none',
              border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.3)' : 'rgba(0,208,132,0.3)'}`,
              color: 'var(--text-primary)', padding: '12px 20px', borderRadius: 14,
              fontWeight: 500, fontSize: '0.9rem',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 'calc(100vw - 32px)'
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span style={{ color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', fontWeight: 600, flexShrink: 0, fontSize: 14 }}>
              {toast.type === 'success' ? 'Success' : 'Error'}
            </span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Right Panel */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            style={{
              height: '100vh',
              borderLeft: '1px solid var(--border-glass)',
              background: 'var(--bg-glass)',
              backdropFilter: 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent)" /> References
              </div>
              <button onClick={() => setShowRightPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {currentSources.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: 40 }}>
                  No references available for this response.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentSources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 16, background: 'var(--bg-glass-strong)', borderRadius: 12, border: '1px solid var(--border-glass)', textDecoration: 'none', transition: '0.2s', color: 'var(--text-primary)' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}><ExternalLink size={14} /> Official Standard</div>
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>{src.title}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}





























