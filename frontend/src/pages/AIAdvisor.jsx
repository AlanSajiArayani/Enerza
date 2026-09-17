import React, { useState } from 'react';
import { askAiAdvisor } from '../services/api';
import { Bot, Send, User } from 'lucide-react';

const AIAdvisor = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm Enerza AI. I've analyzed your household's energy patterns. Ask me anything about your consumption, anomalies, or how to save money!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const res = await askAiAdvisor(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the brain right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[85vh] animate-in fade-in duration-500">
      <header className="shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2">AI Energy Advisor</h1>
        <p className="text-slate-400">Ask questions and get personalized insights about your energy data.</p>
      </header>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 whitespace-pre-wrap'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Bot size={18} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 rounded-tl-none border border-slate-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center space-x-2 bg-slate-800 rounded-xl border border-slate-700 p-1 pl-4 focus-within:border-blue-500 transition-colors"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Why was my consumption high yesterday?"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 py-3"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
