import { useState, useEffect } from 'react';
import { MessageSquare, Search, Zap, User, SearchX } from 'lucide-react';
import { chatService } from '../utils/chatService';
import { ChatSession, Employee } from '../types';
import ChatWindow from './ChatWindow';

interface EmployeeChatDashboardProps {
    currentUser: Employee;
}

export default function EmployeeChatDashboard({ currentUser }: EmployeeChatDashboardProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = chatService.subscribeToEmployeeSessions(currentUser.username, (newSessions) => {
            setSessions(newSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser.username]);

    const filteredSessions = sessions.filter(session =>
        session.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.schoolCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 min-h-[500px]">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <p className="text-indigo-400 font-mono uppercase tracking-[0.2em] animate-pulse">Syncing Comms Array...</p>
            </div>
        );
    }

    return (
        <div className="h-[700px] flex gap-8 animate-fadeIn">
            {/* Sidebar */}
            <div className="w-80 flex flex-col glass-card border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)]">
                <div className="p-8 border-b border-[var(--border-primary)] space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                            <Zap size={10} /> Active Channels
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Support <span className="text-indigo-500">Center</span></h2>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-glass)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500/50 focus:bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-primary)] transition-all uppercase placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {filteredSessions.length === 0 ? (
                        <div className="py-12 text-center">
                            <SearchX size={32} className="mx-auto mb-3 text-gray-800" />
                            <p className="text-[10px] font-mono text-gray-600 uppercase">No active uplinks found</p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`w-full p-5 rounded-2xl text-left transition-all relative overflow-hidden group border ${selectedSession?.id === session.id
                                    ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20'
                                    : 'bg-[var(--bg-glass)] text-[var(--text-muted)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)] hover:border-indigo-500/30'}`}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold uppercase tracking-tight text-xs truncate ${selectedSession?.id === session.id ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                            {session.schoolName}
                                        </h3>
                                        {session.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-red-500/40 animate-pulse">
                                                {session.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`p-1 rounded bg-${selectedSession?.id === session.id ? 'white/20' : 'indigo-500/10'} text-${selectedSession?.id === session.id ? 'white' : 'indigo-400'}`}>
                                            <User size={10} />
                                        </div>
                                        <span className={`text-[9px] font-mono uppercase tracking-widest ${selectedSession?.id === session.id ? 'text-indigo-100' : 'text-[var(--text-muted)]'}`}>{session.teacherName}</span>
                                    </div>
                                    {session.lastMessage && (
                                        <p className={`text-[10px] font-medium truncate ${selectedSession?.id === session.id ? 'text-indigo-100' : 'text-[var(--text-muted)] opacity-60'}`}>
                                            {session.lastMessage.senderId === currentUser.username ? '>> ' : ''}
                                            {session.lastMessage.text}
                                        </p>
                                    )}
                                </div>
                                {selectedSession?.id === session.id && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 glass-card border-[var(--border-primary)] rounded-[3rem] overflow-hidden flex flex-col relative shadow-2xl bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)]">
                {selectedSession ? (
                    <ChatWindow
                        session={selectedSession}
                        currentUser={{
                            id: currentUser.username,
                            name: currentUser.displayName,
                            isAdmin: true
                        }}
                        onClose={() => setSelectedSession(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <div className="w-24 h-24 rounded-full bg-[var(--bg-glass)] border border-[var(--border-primary)] flex items-center justify-center mb-8 relative">
                            <MessageSquare size={48} className="text-[var(--text-muted)] opacity-20" />
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tighter mb-3">Select a Channel</h3>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest max-w-xs leading-relaxed">Select a communication channel from the list to begin messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
