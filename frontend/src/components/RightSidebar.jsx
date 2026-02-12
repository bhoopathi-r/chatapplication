import React from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Mail, Clock, Calendar, User, MapPin } from 'lucide-react';

const RightSidebar = () => {
    const { user } = useAuth();
    const { activeConversation } = useChat();
    const { onlineUsers } = useSocket();

    if (!activeConversation) {
        return (
            <div className="w-80 h-full bg-white border-l border-slate-200 hidden lg:flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <User size={32} />
                </div>
                <p className="text-sm text-slate-400">Select a conversation to view profile details</p>
            </div>
        );
    }

    const otherUser = activeConversation.user1_id === user.id ? activeConversation.user2 : activeConversation.user1;
    const isOnline = onlineUsers.has(otherUser.id);

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 hidden xl:flex flex-col overflow-y-auto">
            <div className="p-8 flex flex-col items-center border-b border-slate-100">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center text-3xl font-bold text-primary-600">
                        {otherUser.name?.[0]?.toUpperCase()}
                    </div>
                    <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{otherUser.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{isOnline ? 'Stable Connection' : 'Offline'}</p>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Information</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail size={18} className="text-slate-400" />
                            <span className="text-sm">{otherUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <MapPin size={18} className="text-slate-400" />
                            <span className="text-sm">San Francisco, CA</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Activity</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Clock size={18} className="text-slate-400" />
                            <span className="text-sm">Last seen: {otherUser.last_seen ? new Date(otherUser.last_seen).toLocaleString() : 'Never'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Calendar size={18} className="text-slate-400" />
                            <span className="text-sm">Joined: {new Date(otherUser.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
                        View Shared Files
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
