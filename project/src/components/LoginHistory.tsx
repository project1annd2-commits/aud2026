import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogIn, LogOut, User, Activity, Filter as FilterIcon, Shield, Search } from 'lucide-react';
import { LoginSession } from '../types';
import { storage } from '../utils/storage';

const LoginHistory: React.FC = () => {
    const [sessions, setSessions] = useState<LoginSession[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<LoginSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'logged_out'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [sessions, filterStatus, searchQuery]);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            const allSessions = await storage.getLoginSessions();
            setSessions(allSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) {
            console.error('Failed to load login sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...sessions];
        if (filterStatus !== 'all') {
            filtered = filtered.filter(s => s.status === filterStatus);
        }
        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.ipAddress.includes(searchQuery)
            );
        }
        setFilteredSessions(filtered);
    };

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'Mobile': return <Smartphone size={18} />;
            case 'Tablet': return <Tablet size={18} />;
            default: return <Monitor size={18} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getSessionDuration = (session: LoginSession) => {
        const start = new Date(session.timestamp);
        const end = session.logoutTimestamp ? new Date(session.logoutTimestamp) : new Date();
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <p className="text-blue-400 font-mono uppercase tracking-[0.2em] animate-pulse">Scanning Security Logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                        <Shield size={12} /> Authentication History
                    </div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Security <span className="text-[var(--accent-primary)]">Logs</span></h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Audit Trail & Authentication Metrics</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="text-right">
                        <div className="text-2xl font-black text-white font-mono">{sessions.length}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-mono tracking-widest">Logged Events</div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-emerald-400 font-mono">{sessions.filter(s => s.status === 'active').length}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-mono tracking-widest">Active Links</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-[2rem] p-8 border-white/10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH OPERATOR OR IP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 focus:bg-white/10 text-xs font-mono text-white transition-all uppercase placeholder:text-gray-700"
                        />
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {[
                            { id: 'all', label: 'All Cycles' },
                            { id: 'active', label: 'Active Link' },
                            { id: 'logged_out', label: 'Terminated' }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setFilterStatus(s.id as any)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table/List */}
            <div className="glass-card rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 border-b border-white/5 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-6">Operator</th>
                                <th className="px-8 py-6">Interface</th>
                                <th className="px-8 py-6">Telemetry (IP)</th>
                                <th className="px-8 py-6">Phase Timeline</th>
                                <th className="px-8 py-6 text-right">Channel Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSessions.map((session) => (
                                <tr key={session.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[var(--text-primary)] truncate uppercase">{session.displayName}</div>
                                                <div className="text-[9px] font-mono text-gray-500 uppercase">@{session.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-400">{getDeviceIcon(session.deviceInfo.device)}</div>
                                            <div>
                                                <div className="text-[10px] font-black text-white uppercase">{session.deviceInfo.device}</div>
                                                <div className="text-[8px] font-mono text-gray-500 uppercase">{session.deviceInfo.browser} / {session.deviceInfo.os}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-mono text-[10px] text-gray-400">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-blue-400/70"><MapPin size={10} /> {session.ipAddress}</div>
                                            {session.location?.city && <div className="uppercase opacity-50">{session.location.city}, {session.location.country}</div>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/70 uppercase">
                                                <LogIn size={10} /> {formatDate(session.timestamp)}
                                            </div>
                                            {session.logoutTimestamp ? (
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-red-400/70 uppercase">
                                                    <LogOut size={10} /> {formatDate(session.logoutTimestamp)}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--accent-primary)] uppercase">
                                                    <Clock size={10} /> Ongoing Cycle ({getSessionDuration(session)})
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {session.status === 'active' ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                                                <Activity size={10} className="animate-pulse" /> Linked
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-600 text-[9px] font-black font-mono uppercase tracking-widest">
                                                Terminated
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredSessions.length === 0 && (
                    <div className="py-20 text-center">
                        <FilterIcon size={48} className="mx-auto mb-4 text-gray-800 animate-pulse" />
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">No matching logs found in database</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginHistory;
