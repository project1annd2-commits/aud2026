import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Globe, XCircle, Shield, Clock, Search, Zap, ShieldAlert } from 'lucide-react';
import { Device, Employee } from '../types';
import { storage } from '../utils/storage';
import { formatDate } from '../utils/helpers';

interface DeviceManagementProps {
    currentEmployee: Employee;
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ currentEmployee }) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        loadDevices();
    }, []);

    useEffect(() => {
        filterDevices();
    }, [devices, searchQuery, statusFilter]);

    const loadDevices = async () => {
        try {
            setIsLoading(true);
            const allDevices = await storage.getDevices();
            setDevices(allDevices);
        } catch (error) {
            console.error('Failed to load devices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterDevices = () => {
        let filtered = [...devices];
        if (statusFilter !== 'all') filtered = filtered.filter(d => d.status === statusFilter);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.username.toLowerCase().includes(query) ||
                d.name.toLowerCase().includes(query) ||
                d.ipAddress.includes(query)
            );
        }
        setFilteredDevices(filtered);
    };

    const handleUpdateStatus = async (device: Device, status: 'approved' | 'rejected') => {
        try {
            const updatedDevice: Device = {
                ...device,
                status,
                approvedBy: status === 'approved' ? currentEmployee.username : undefined,
                approvedAt: status === 'approved' ? new Date().toISOString() : undefined
            };
            await storage.updateDevice(updatedDevice);
            setDevices(prev => prev.map(d => d.id === device.id ? updatedDevice : d));
        } catch (error) {
            console.error('Failed to update device status:', error);
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <Smartphone size={20} />;
            case 'tablet': return <Tablet size={20} />;
            default: return <Monitor size={20} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <p className="text-cyan-400 font-mono uppercase tracking-[0.2em] animate-pulse">Scanning Hardware Nodes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/10 text-cyan-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                        <Shield size={12} /> Device Access Control
                    </div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Access <span className="text-[var(--accent-primary)]">Management</span></h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Authorized Entrypoints & Security Protocols</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="text-right">
                        <div className="text-2xl font-black text-yellow-400 font-mono">{devices.filter(d => d.status === 'pending').length}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-mono tracking-widest">Pending Access</div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-cyan-400 font-mono">{devices.length}</div>
                        <div className="text-[8px] text-gray-500 uppercase font-mono tracking-widest">Total Nodes</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="glass-card rounded-[2rem] p-8 border-white/10">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by device, user or IP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-cyan-500 focus:bg-white/10 text-xs font-mono text-white transition-all uppercase placeholder:text-gray-700"
                        />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full lg:w-auto overflow-x-auto">
                        {[
                            { id: 'all', label: 'All Nodes' },
                            { id: 'pending', label: 'Auth Pending' },
                            { id: 'approved', label: 'Trusted' },
                            { id: 'rejected', label: 'Blocked' }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStatusFilter(s.id as any)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredDevices.map((device) => (
                    <div key={device.id} className="glass-card p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-all ${device.status === 'approved' ? 'bg-cyan-500' : device.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'} group-hover:scale-150`}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-${device.status === 'approved' ? 'cyan' : device.status === 'pending' ? 'yellow' : 'red'}-500/10 text-${device.status === 'approved' ? 'cyan' : device.status === 'pending' ? 'yellow' : 'red'}-400 border border-${device.status === 'approved' ? 'cyan' : device.status === 'pending' ? 'yellow' : 'red'}-500/20`}>
                                    {getDeviceIcon(device.type)}
                                </div>
                                <div className={`text-[9px] font-black font-mono uppercase tracking-widest px-3 py-1 rounded-lg border ${device.status === 'approved' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : device.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {device.status}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] truncate uppercase">{device.username}</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">{device.name}</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 uppercase">
                                    <Globe size={12} className="text-cyan-400/50" /> {device.ipAddress}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 uppercase">
                                    <Zap size={12} className="text-cyan-400/50" /> {device.browser} / {device.os}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 uppercase">
                                    <Clock size={12} className="text-cyan-400/50" /> Last Active: {formatDate(device.lastLoginAt)}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {device.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(device, 'approved')}
                                            className="flex-1 py-3 rounded-xl bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20"
                                        >
                                            Authorize
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(device, 'rejected')}
                                            className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </>
                                ) : device.status === 'approved' ? (
                                    <button
                                        onClick={() => handleUpdateStatus(device, 'rejected')}
                                        className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Block Node Access
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUpdateStatus(device, 'approved')}
                                        className="w-full py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Restore Trust
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredDevices.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <ShieldAlert size={48} className="mx-auto mb-4 text-gray-800 animate-pulse" />
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">No nodes match your current security parameters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeviceManagement;
