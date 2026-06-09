import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatWithAssistant, ChatUserContext } from '../services/geminiService';
import { User } from '../types';

interface AIAssistantProps {
  user?: User | null;
}

const COOLDOWN_MS = 2000;

const QUICK_ACTIONS = [
  { id: 'recommend', label: '📚 Recommend Books',  message: 'Can you recommend some great books for me?' },
  { id: 'premium',   label: '✦ Premium Books',     message: 'What premium exclusive books do you have?' },
  { id: 'track',     label: '📦 Track Order',       message: 'Can you help me track my recent order?' },
  { id: 'faq',       label: '💬 Help & FAQ',        message: 'What is your return policy and shipping details?' },
];

// Offline fallback responses — shown when Gemini quota is exhausted
const FALLBACK_RESPONSES: Record<string, string> = {
  recommend:
    "I'd love to recommend some great reads! Here are three you might enjoy:\n\n📖 The Midnight Library by Matt Haig — a life-changing story about second chances\n📖 The Alchemist by Paulo Coelho — a timeless journey of self-discovery\n📖 Thinking, Fast and Slow by Daniel Kahneman — brilliant insights into how we think\n\nBrowse our full collection on the home page!",
  premium:
    "Our Premium Exclusive titles are waiting for you:\n\n⭐ Dune by Frank Herbert — the iconic sci-fi epic\n⭐ Steve Jobs by Walter Isaacson — the definitive biography\n⭐ Sapiens by Yuval Noah Harari — a stunning history of humankind\n\nUpgrade to Premium to unlock these titles with 10–20% off!",
  track:
    "Your order tracking info:\n\n📦 Last order: ORD-" + Math.floor(Math.random() * 90000 + 10000) + "\n🚚 Status: Processing\n📅 Est. delivery: 2–3 business days\n\nFor detailed tracking, check your order confirmation email. Need help? Reply here!",
  faq:
    "Happy to help! Here are our key policies:\n\n✅ Returns: 30-day hassle-free returns\n🚚 Shipping: Free on orders over ₹500\n⏱ Delivery: 2–5 business days\n👑 Premium support: 24h priority response\n\nHave another question? Just ask!",
  default:
    "I'm here to help you find your next great read! You can ask me for book recommendations, track your order, or learn about our policies. What can I help you with?",
};

const getFallback = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('book')) return FALLBACK_RESPONSES.recommend;
  if (lower.includes('premium') || lower.includes('exclusive') || lower.includes('unlock')) return FALLBACK_RESPONSES.premium;
  if (lower.includes('track') || lower.includes('order') || lower.includes('delivery')) return FALLBACK_RESPONSES.track;
  if (lower.includes('return') || lower.includes('shipping') || lower.includes('policy') || lower.includes('faq') || lower.includes('help')) return FALLBACK_RESPONSES.faq;
  return FALLBACK_RESPONSES.default;
};

const BotMessage: React.FC<{ text: string; isPremium: boolean }> = ({ text, isPremium }) => {
  const hasUpgradeHint = !isPremium && (
    text.toLowerCase().includes('premium') || text.toLowerCase().includes('upgrade')
  );
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
      {hasUpgradeHint && (
        <Link
          to="/premium"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-900 px-3 py-1.5 rounded-full mt-1 hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d, #d97706)' }}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Upgrade to Premium
        </Link>
      )}
    </div>
  );
};

const AIAssistant: React.FC<AIAssistantProps> = ({ user }) => {
  const isPremium = !!(user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false);

  const greeting = isPremium
    ? `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! ✦ As a premium member, I can give you personalised picks and exclusive recommendations. What are you looking for today?`
    : `Hello! I'm Lumina, your personal book guide. Looking for something specific to read? I can recommend books, help with your orders, or answer any questions!`;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: greeting, isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newGreeting = !!(user?.isPremium && user?.subscriptionEndDate
      ? new Date(user.subscriptionEndDate) > new Date()
      : false)
      ? `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! ✦ As a premium member, I can give you personalised picks. What are you looking for?`
      : `Hello! I'm Lumina, your personal book guide. How can I help you today?`;
    setMessages([{ text: newGreeting, isBot: true }]);
    historyRef.current = [];
  }, [user?.id, user?.isPremium]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const startCooldown = () => {
    setCooldown(COOLDOWN_MS / 1000);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendMessage = async (messageText: string, quickActionId?: string) => {
    if (!messageText.trim() || isLoading || cooldown > 0) return;

    setMessages(prev => [...prev, { text: messageText, isBot: false }]);
    setIsLoading(true);
    setInput('');

    const userContext: ChatUserContext = {
      isPremium,
      userName: user?.name,
      subscriptionType: user?.subscriptionType,
    };

    try {
      const response = await chatWithAssistant(messageText, historyRef.current, userContext);
      const botText = response || 'Something went wrong...';

      let displayText: string;
      if (botText === '⚠️ quota_exceeded') {
        // Use smart offline fallback instead of generic error
        displayText = quickActionId
          ? FALLBACK_RESPONSES[quickActionId] || FALLBACK_RESPONSES.default
          : getFallback(messageText);
      } else {
        displayText = botText;
      }

      const updatedHistory = [
        ...historyRef.current,
        { role: 'user' as const, parts: [{ text: messageText }] },
        { role: 'model' as const, parts: [{ text: displayText }] },
      ];
      historyRef.current = updatedHistory.slice(-12);
      setMessages(prev => [...prev, { text: displayText, isBot: true }]);
    } catch {
      const fallback = quickActionId
        ? FALLBACK_RESPONSES[quickActionId] || FALLBACK_RESPONSES.default
        : getFallback(messageText);
      setMessages(prev => [...prev, { text: fallback, isBot: true }]);
    }

    setIsLoading(false);
    startCooldown();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  const canSend = input.trim() && !isLoading && cooldown === 0;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60]">
      {isOpen ? (
        <div
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/10 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px]"
          style={{ height: '520px' }}
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <div
            className="p-3.5 text-white flex justify-between items-center flex-shrink-0"
            style={isPremium
              ? { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #78350f 100%)' }
              : { background: '#1e1b4b' }
            }
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={isPremium
                  ? { background: 'linear-gradient(135deg,#f59e0b,#fcd34d)', boxShadow: '0 0 10px rgba(251,191,36,0.5)' }
                  : { background: '#4338ca' }
                }
              >
                <svg className={`w-4 h-4 ${isPremium ? 'text-amber-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm">Lumina AI</p>
                  {isPremium && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-amber-900"
                      style={{ background: 'linear-gradient(90deg,#f59e0b,#fcd34d)' }}>
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-indigo-300">
                  {isPremium ? '✦ Personal literary concierge' : 'Online & Ready to Help'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white p-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Messages ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-indigo-50/40 dark:to-indigo-950/20 min-h-0 relative">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both`} style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                {m.isBot && (
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center self-end"
                    style={isPremium
                      ? { background: 'linear-gradient(135deg,#f59e0b,#fcd34d)', boxShadow: '0 0 6px rgba(251,191,36,0.4)' }
                      : { background: 'linear-gradient(135deg,#4f46e5,#4338ca)', boxShadow: '0 0 6px rgba(67,56,202,0.3)' }
                    }
                  >
                    <svg className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.isBot
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700/50 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none'
                  : 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-br-none shadow-md shadow-indigo-200 dark:shadow-none'
                }`}>
                  {m.isBot
                    ? <BotMessage text={m.text} isPremium={isPremium} />
                    : m.text
                  }
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-indigo-500 to-indigo-600 flex-shrink-0 flex items-center justify-center self-end shadow-sm">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 text-gray-400 dark:text-gray-550 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Actions ─────────────────────────────────────── */}
          <div className="px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-indigo-50/50 dark:border-gray-850/50 flex-shrink-0">
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.message, action.id)}
                  disabled={isLoading || cooldown > 0}
                  className={`flex-shrink-0 text-[11px] font-bold px-4 py-2.5 rounded-full border transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider ${
                    action.id === 'premium'
                      ? 'border-amber-200 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 text-amber-800 dark:text-amber-300 hover:shadow-md dark:hover:shadow-none'
                      : 'border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md dark:hover:shadow-none'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Input ────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex-shrink-0 rounded-b-3xl">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isPremium ? 'Ask for personalised picks…' : 'Ask about a book…'}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm rounded-full px-5 py-3.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="absolute right-1.5 p-2 rounded-full disabled:opacity-40 transition-all flex items-center justify-center w-10 h-10 hover:scale-105 active:scale-95 shadow-md text-white"
                style={{ background: isPremium ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#4338ca)' }}
              >
                {cooldown > 0
                  ? <span className="text-[9px] font-black">{cooldown}s</span>
                  : <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                }
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── FAB ─────────────────────────────────────────────── */
        <button
          onClick={() => setIsOpen(true)}
          className="text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 relative group bg-indigo-950 dark:bg-indigo-900"
          style={{ boxShadow: isPremium ? '0 0 20px rgba(99,102,241,0.5)' : undefined }}
        >
          {isPremium && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-indigo-600" />
          )}
          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="absolute -top-10 right-0 bg-white dark:bg-gray-800 text-indigo-900 dark:text-indigo-200 text-xs font-bold py-1 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100 dark:border-gray-700/50">
            {isPremium ? '✦ Lumina Premium AI' : 'Chat with Lumina AI'}
          </span>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
