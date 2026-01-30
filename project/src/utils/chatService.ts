import { ChatSession, ChatMessage } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
}

export const chatService = {
    async initChatSession(schoolCode: string, teacherName: string = 'Teacher'): Promise<{ session: ChatSession, isNew: boolean }> {
        // First get school info to get assignedTo and schoolName
        const schools = await fetchJson<any[]>(`${API_BASE_URL}/schools`);
        const school = schools.find(s => s.code === schoolCode);

        if (!school) {
            throw new Error('Invalid school code');
        }

        const sessionId = `chat_${schoolCode}_${Date.now()}`;
        const newSession: ChatSession = {
            id: sessionId,
            schoolId: school.id,
            schoolName: school.name,
            schoolCode: school.code,
            teacherName: teacherName,
            assignedTo: school.createdBy,
            status: 'active',
            unreadCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const session = await fetchJson<ChatSession>(`${API_BASE_URL}/chat-sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSession)
        });

        return { session, isNew: session.id === sessionId };
    },

    async sendMessage(sessionId: string, text: string, sender: { id: string, name: string, isAdmin: boolean }) {
        const message: ChatMessage = {
            id: `msg_${Date.now()}`,
            senderId: sender.id,
            senderName: sender.name,
            text: text,
            timestamp: new Date().toISOString(),
            read: false,
            isAdmin: sender.isAdmin
        };

        return fetchJson<ChatMessage>(`${API_BASE_URL}/chat-sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
    },

    subscribeToMessages(sessionId: string, isAdmin: boolean, callback: (messages: ChatMessage[]) => void) {
        let isStopped = false;
        const poll = async () => {
            if (isStopped) return;
            try {
                const messages = await fetchJson<ChatMessage[]>(`${API_BASE_URL}/chat-sessions/${sessionId}/messages`);
                callback(messages);

                // Mark as read if we are viewing them
                await fetchJson(`${API_BASE_URL}/chat-sessions/${sessionId}/messages/read?isAdmin=${isAdmin}`, { method: 'PUT' });
            } catch (e) {
                console.error('Polling error:', e);
            }
            if (!isStopped) setTimeout(poll, 3000);
        };
        poll();
        return () => { isStopped = true; };
    },

    subscribeToEmployeeSessions(username: string, callback: (sessions: ChatSession[]) => void) {
        let isStopped = false;
        const poll = async () => {
            if (isStopped) return;
            try {
                const sessions = await fetchJson<ChatSession[]>(`${API_BASE_URL}/chat-sessions?assignedTo=${username}`);
                callback(sessions);
            } catch (e) {
                console.error('Polling error:', e);
            }
            if (!isStopped) setTimeout(poll, 5000);
        };
        poll();
        return () => { isStopped = true; };
    },

    async closeSession(sessionId: string) {
        await fetchJson(`${API_BASE_URL}/chat-sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' })
        });
    }
};
