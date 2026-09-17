import React, { useState, useRef, useEffect } from 'react';
import { askAiAdvisor } from '../services/api';
import { Bot, Send, User, Sparkles, Zap } from 'lucide-react';

/* ─── Suggested prompts ─── */
const SUGGESTIONS = [
  'Why is my energy usage high?',
  'Which appliance costs me the most?',
  'How can I save ₹500/month?',
  'What caused today\'s increase?',
  'Is my appliance usage normal?',
];

/* ─── AI Advisor Page ─── */
const AIAdvisor = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I'm Enerza AI — your household energy intelligence advisor.\n\nI've analyzed your consumption patterns from the REFIT dataset. Ask me anything about your energy usage, anomalies, or how to reduce costs."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await askAiAdvisor(msg);
      setMessages(prev => [...prev, { role: 'ai', text: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Unable to reach the AI backend right now. Please ensure the server is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter pb-12 flex flex-col" style={{ height: 'calc(100vh - 64px)', maxHeight: 800 }}>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>AI Advisor</p>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles size={22} style={{ color: '#22d3ee' }} />
            Enerza AI Advisor
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Ask anything about your energy usage.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
          AI Active
        </div>
      </div>

      {/* Suggested prompts — only show when conversation is short */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => handleSend(s)}
              className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.color = '#93c5fd'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = '#94a3b8'; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat window */}
      <div className="flex-1 overflow-hidden rounded-2xl flex flex-col"
        style={{ background: 'rgba(13,21,32,0.75)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 0 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>

              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Bot size={15} style={{ color: '#22d3ee' }} />
                </div>
              )}

              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-none'
                  : 'text-slate-300 rounded-tl-none'
              }`} style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg,#1e40af,#1d4ed8)',
                border: '1px solid rgba(59,130,246,0.25)'
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-600">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex justify-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Bot size={15} style={{ color: '#22d3ee' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-1.5">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#22d3ee', opacity: 0.7, animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,12,20,0.5)' }}>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your energy usage…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder-slate-600"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
              onMouseEnter={e => !loading && (e.target.style.opacity = 0.85)}
              onMouseLeave={e => (e.target.style.opacity = 1)}>
              <Send size={14} className="text-white" />
            </button>
          </form>
          <p className="text-[10px] text-center mt-2" style={{ color: '#1e293b' }}>
            Answers are based solely on your REFIT analytics data. Demo mode if no API key configured.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
