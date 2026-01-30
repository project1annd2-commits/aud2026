import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield, Zap, Info, Clock, X } from 'lucide-react';
import { ChatMessage, ChatSession } from '../types';
import { chatService } from '../utils/chatService';

interface ChatWindowProps {
    session: ChatSession;
    currentUser: { id: string; name: string; isAdmin: boolean };
    onClose?: () => void;
}

export default function ChatWindow({ session, currentUser, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = chatService.subscribeToMessages(session.id, currentUser.isAdmin, (msgs: ChatMessage[]) => {
            setMessages(msgs);
            setTimeout(scrollToBottom, 100);
        });
        return () => unsubscribe();
    }, [session.id, currentUser.isAdmin]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await chatService.sendMessage(session.id, newMessage, currentUser);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600/10 backdrop-blur-xl p-8 flex justify-between items-center border-b border-[var(--border-primary)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
                            {session.schoolName}
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-lg border border-indigo-500/10 tracking-widest">{session.schoolCode}</span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                <User size={12} className="text-indigo-400" /> {session.teacherName}
                            </div>
                            <div className="w-1 h-1 bg-[var(--border-primary)] rounded-full"></div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent-emerald)] uppercase tracking-widest animate-pulse">
                                <div className="w-1.5 h-1.5 bg-[var(--accent-emerald)] rounded-full"></div> Channel Connected
                            </div>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-3 rounded-xl bg-[var(--bg-glass)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-[var(--accent-red)] border border-[var(--border-primary)] transition-all">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[var(--bg-primary)] opacity-80">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <Info size={40} className="text-[var(--text-muted)] opacity-20 mb-4" />
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest max-w-[200px]">Encrypted session initialized. No transmission logs yet.</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeInUp`} style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className={`max-w-[75%] space-y-1`}>
                                {showName && (
                                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isMe ? 'text-indigo-400' : 'text-[var(--text-muted)]'}`}>
                                            {isMe ? 'COMMAND CENTER' : msg.senderName}
                                        </span>
                                        {msg.isAdmin && <Shield size={10} className="text-indigo-400 opacity-70" />}
                                    </div>
                                )}
                                <div className={`relative px-5 py-3.5 rounded-2xl text-sm font-medium tracking-tight shadow-xl ${isMe
                                    ? 'bg-indigo-600 text-white rounded-tr-none border border-white/10'
                                    : 'bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-tl-none backdrop-blur-md'
                                    }`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                    <div className={`flex items-center gap-1.5 justify-end mt-2 opacity-40 text-[8px] font-mono uppercase font-black ${isMe ? 'text-indigo-100' : 'text-[var(--text-muted)]'}`}>
                                        <Clock size={8} /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {isMe && <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 blur-sm rounded-full -mr-1 -mt-1 opacity-50"></div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Overlay */}
            <div className="p-8 bg-[var(--bg-glass)] border-t border-[var(--border-primary)] backdrop-blur-2xl">
                <form onSubmit={handleSend} className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all"></div>
                    <div className="relative flex gap-4">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="TRANSMIT SECURE MESSAGE..."
                            className="flex-1 px-8 py-5 bg-[var(--bg-glass)] border border-[var(--border-primary)] rounded-2xl focus:border-indigo-500 focus:bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-primary)] transition-all uppercase placeholder:text-[var(--text-muted)] outline-none shadow-2xl"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-indigo-600 text-white px-8 rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center border border-white/10"
                        >
                            <Send size={20} className="transform -rotate-12" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
