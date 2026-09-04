import { FAQ } from '@/features/info/components/FAQ';
import { AboutBIS } from '@/features/info/components/AboutBIS';
import { DocumentVault } from '@/features/vault/components/DocumentVault';
import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, User, Plus, Trash2, PanelLeftClose, PanelLeftOpen, Globe, Sun, Moon, LogOut, MessageSquare, ChevronDown, Mic, Paperclip, Copy, Download, Check, CheckCircle2, Volume2, ThumbsUp, ThumbsDown, AlertCircle, AlertTriangle, X, ShieldCheck, RefreshCcw, Search, Building2, FileText, MapPin, Activity, Library, Calculator, ExternalLink, Upload, Info, HelpCircle, Layers , Image, MoreVertical, Edit3, Pin, Share2, Bell, Radio, Award } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { t as tLib } from '@/shared/lib/i18n';
import { LicensePortal } from '@/features/licenses/components/LicensePortal';
import { FeeEstimator } from '@/features/licenses/components/FeeEstimator';
import { LicenseVerifier } from '@/features/licenses/components/LicenseVerifier';
import { StandardsDirectory } from '@/features/directory/components/StandardsDirectory';
import { CertificationGuide } from '@/features/directory/components/CertificationGuide';
import { ComplaintsHub } from '@/features/complaints/components/ComplaintsHub';
import { CommunityLabs } from '@/features/directory/components/CommunityLabs';
import { ComplianceRadar } from '@/features/compliance/components/ComplianceRadar';
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (hideSidebar) return false;
    // On mobile, start with sidebar closed; on desktop, start open
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return false;
    return true;
  });
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
  const [activeView, setActiveView] = useState<'chat' | 'standards' | 'calculator' | 'verify' | 'complaint' | 'track' | 'lab' | 'guide' | 'clubs' | 'faq' | 'about' | 'vault' | 'licenses' | 'apply_license' | 'complaints_hub' | 'community_labs' | 'radar'>('chat');
  const [viewParams, setViewParams] = useState<any>({});
  
  
  
  
  
  
  
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
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

  useEffect(() => { if (activeView === 'licenses') fetchLicenses(); }, [activeView, token]);

  // Notifications & Regulatory Radar Alerts State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<any | null>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sync?type=notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadNotifCount(data.filter((n: any) => !n.read).length);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [token]);

  const handleNotificationClick = async (notif: any) => {
    try {
    await fetch('/api/sync?type=notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: notif.id })
    });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));

    setShowNotifCenter(false);

    let targetView = 'chat';
    let params: any = {};

    const text = `${notif.title || ''} ${notif.message || ''} ${notif.type || ''}`.toLowerCase();
    
    if (text.includes('complaint') || text.includes('grievance') || text.includes('ticket') || notif.type === 'STATUS_UPDATE') {
      targetView = 'complaints_hub';
      params = { defaultTab: 'track' };
    } else if (text.includes('license') || text.includes('cm/l') || text.includes('application')) {
      targetView = 'licenses';
    } else if (text.includes('radar') || text.includes('qco') || text.includes('standard') || notif.type === 'RADAR_ALERT') {
      targetView = 'radar';
    } else if (text.includes('club') || notif.type === 'CLUB_UPDATE') {
      targetView = 'community_labs';
      params = { defaultTab: 'clubs' };
    } else if (text.includes('lab') || text.includes('testing')) {
      targetView = 'community_labs';
      params = { defaultTab: 'labs' };
    } else if (text.includes('isi') || text.includes('hallmark') || text.includes('verify')) {
      targetView = 'verify';
    } else {
      setSelectedNotifDetail(notif);
      return;
    }

    setActiveView(targetView as any);
    setViewParams(params);
    showToast(`Redirected to ${targetView.replace('_', ' ')}`);
  } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/sync?type=notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
      showToast('All notifications marked as read');
    } catch {}
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setConversations(data); }
    } catch {}
  };
  
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
      showToast('Speech recognition is not supported in this browser.', 'error');
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Mock conversation fetch removed for hackathon
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  const startNewChat = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    setActiveConvId(null);
    setMessages([{ id: '0', role: 'assistant', content: getWelcomeMsg(userRole, language) }]);
    setInput('');
    setActiveView('chat');
  };
  const loadConversation = async (id: string) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
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
    <div className="app-layout">
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
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 40
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
                  <button className={`sidebar-item ${activeView === 'licenses' ? 'active' : ''}`} onClick={() => { setActiveView('licenses' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <Award size={15} /> License Portal
                  </button>
                  <button className={`sidebar-item ${activeView === 'radar' ? 'active' : ''}`} onClick={() => { setActiveView('radar' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <Radio size={15} /> Compliance Radar
                  </button>
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
                  <button className={`sidebar-item ${activeView === 'radar' ? 'active' : ''}`} onClick={() => { setActiveView('radar' as any); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }}>
                    <Radio size={15} /> Compliance Radar
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
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                BIS Assistant <span className="hide-mobile" style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>· {roleLabel}</span>
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
                                    {/* Notification Bell Widget */}
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                onClick={() => setShowNotifCenter(!showNotifCenter)}
                style={{
                  background: showNotifCenter ? 'var(--bg-hover)' : 'var(--bg-glass-strong)',
                  borderRadius: 'var(--radius-md)',
                  width: 40, height: 40, position: 'relative',
                  border: showNotifCenter ? '1px solid var(--accent)' : '1px solid transparent'
                }}
                title="Notifications & Regulatory Radar Alerts"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="notif-badge" style={{
                    position: 'absolute', top: 7, right: 7, width: 8, height: 8,
                    borderRadius: '50%', background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444'
                  }} />
                )}
              </button>

              <AnimatePresence>
                {showNotifCenter && (
                  <>
                    {/* Mobile: full-screen backdrop + bottom sheet */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifCenter(false)}
                      style={{
                        display: 'none',
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        zIndex: 999,
                      }}
                      className="notif-backdrop"
                    />
                    {/* Panel: absolute on desktop, fixed bottom-sheet on mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="notif-panel"
                      style={{
                        position: 'absolute', right: 0, top: 48,
                        width: 'min(340px, calc(100vw - 16px))',
                        maxHeight: 460,
                        background: 'var(--bg-modal)', border: '1px solid var(--border-glass)',
                        borderRadius: 16, boxShadow: 'var(--shadow-glass)', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Bell size={16} color="var(--accent)" />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Notifications</span>
                          {unreadNotifCount > 0 && (
                            <span className="pill pill-red" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{unreadNotifCount} new</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {notifications.length > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifCenter(false)}
                            className="icon-btn"
                            style={{ width: 28, height: 28, background: 'var(--bg-hover)', borderRadius: 8 }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 360, display: 'flex', flexDirection: 'column' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                            No notifications or alerts yet
                          </div>
                        ) : (
                          notifications.map((notif: any) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              style={{
                                padding: '12px 16px', borderBottom: '1px solid var(--border-glass)',
                                background: notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.05)',
                                cursor: 'pointer', transition: 'background 0.15s',
                                display: 'flex', gap: 12, alignItems: 'flex-start'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.05)')}
                            >
                              <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: notif.type === 'RADAR_ALERT' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                                color: notif.type === 'RADAR_ALERT' ? '#f59e0b' : 'var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {notif.type === 'RADAR_ALERT' ? <AlertTriangle size={16} /> : <FileText size={16} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: notif.read ? 600 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {notif.title}
                                  </div>
                                  {!notif.read && (
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {notif.message}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

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
                            <motion.button 
                              initial={{ opacity: 0, y: 15, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.25, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                              key={i} 
                              className="suggestion-card" 
                              onClick={() => sendMessage(q)}
                            >
                              {q}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* All messages */}
                    {messages.slice(messages.length === 1 ? 1 : 0).map((msg, i, arr) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
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
          <StandardsDirectory setActiveView={setActiveView as any} />
        )}
        {activeView === 'guide' && (
          <CertificationGuide setActiveView={setActiveView as any} />
        )}
        {activeView === 'licenses' && (
          <LicensePortal
            userLicenses={userLicenses}
            loadingLicenses={loadingLicenses}
            fetchLicenses={fetchLicenses}
            setActiveView={setActiveView as any}
          />
        )}
        {activeView === 'calculator' && (
          <FeeEstimator setActiveView={setActiveView as any} />
        )}
        {activeView === 'complaints_hub' && (
          <ComplaintsHub setActiveView={setActiveView as any} viewParams={viewParams} />
        )}
        {activeView === 'verify' && (
          <LicenseVerifier setActiveView={setActiveView as any} setSidebarOpen={setSidebarOpen} />
        )}
        {activeView === 'community_labs' && <CommunityLabs setActiveView={setActiveView as any} viewParams={viewParams} />}
        {activeView === 'faq' && <FAQ setActiveView={setActiveView as any} />}
        {activeView === 'about' && <AboutBIS setActiveView={setActiveView as any} />}
        {/* ===== DOCUMENT VAULT ===== */}
        {activeView === 'vault' && <DocumentVault setActiveView={setActiveView as any} />}
        {activeView === 'radar' && <ComplianceRadar setActiveView={setActiveView as any} />}
      </div>

            {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotifDetail && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="modal"
              style={{ maxWidth: 480 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={20} color="var(--accent)" /> Official Notification
                </h3>
                <button onClick={() => setSelectedNotifDetail(null)} className="icon-btn" style={{ background: 'transparent' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {selectedNotifDetail.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {new Date(selectedNotifDetail.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedNotifDetail.message}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedNotifDetail(null)} className="btn btn-primary" style={{ borderRadius: 10 }}>
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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


