import React, { useState } from 'react';
import { MessageSquare, ArrowRight, School, AlertCircle } from 'lucide-react';
import { chatService } from '../utils/chatService';
import { ChatSession } from '../types';
import ChatWindow from './ChatWindow';

export default function TeacherSupportPage() {
    const [schoolCode, setSchoolCode] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

    // For teachers, we generate a temporary ID or use a stored one if we had auth
    // Since no login is required, we'll use a random ID for this session or localStorage
    const [teacherId] = useState(() => {
        const stored = localStorage.getItem('support_teacher_id');
        if (stored) return stored;
        const newId = 'teacher_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('support_teacher_id', newId);
        return newId;
    });

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolCode.trim() || !teacherName.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { session } = await chatService.initChatSession(schoolCode.trim(), teacherName.trim());
            setActiveSession(session);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to connect. Please check your School Code.');
        } finally {
            setLoading(false);
        }
    };

    if (activeSession) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Live Support</h1>
                        <button
                            onClick={() => setActiveSession(null)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Exit Chat
                        </button>
                    </div>
                    <ChatWindow
                        session={activeSession}
                        currentUser={{
                            id: teacherId,
                            name: teacherName,
                            isAdmin: false
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Teacher Support</h1>
                    <p className="text-gray-500 mt-2">Enter your details to connect with your support agent</p>
                </div>

                <form onSubmit={handleConnect} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            School Code
                        </label>
                        <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={schoolCode}
                                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase"
                                placeholder="Ex: SCH001"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <span className="text-lg">👤</span>
                            </div>
                            <input
                                type="text"
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            'Connecting...'
                        ) : (
                            <>
                                Start Chat <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
