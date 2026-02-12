import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { Search, LogOut, User as UserIcon } from 'lucide-react';
import api from '../services/api';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { conversations, activeConversation, setActiveConversation, startConversation } = useChat();
    const { onlineUsers } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            try {
                const response = await api.get(`/users/search?q=${query}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Search failed', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const selectUser = (otherUser) => {
        startConversation(otherUser.id);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="w-80 h-full bg-white border-r border-slate-200 flex flex-col">
            {/* Profile Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">{user?.name}</h2>
                        <span className="text-xs text-green-500 font-medium">Online</span>
                    </div>
                </div>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all outline-none"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border border-slate-100 rounded-lg shadow-lg overflow-hidden absolute z-10 w-72">
                        {searchResults.map((u) => (
                            <button
                                key={u.id}
                                onClick={() => selectUser(u)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                    <UserIcon size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-400">{u.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Messages</h3>
                {conversations.map((conv) => {
                    const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
                    const isActive = activeConversation?.id === conv.id;
                    const isOnline = onlineUsers.has(otherUser.id);

                    return (
                        <button
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={`w-full p-4 flex items-center gap-3 transition-colors ${isActive ? 'bg-primary-50 border-r-4 border-primary-500' : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {otherUser.name?.[0]?.toUpperCase()}
                                </div>
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold text-slate-800 text-sm">{otherUser.name}</h4>
                                    <span className="text-[10px] text-slate-400">12:30 PM</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">Last message content...</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
