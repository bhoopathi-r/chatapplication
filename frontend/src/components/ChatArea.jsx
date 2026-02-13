import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft, Search, Trash2, Ban, Edit2, Reply, Pin, Forward, X } from 'lucide-react';
import UserStatus from './user/UserStatus';
import EmojiPicker from 'emoji-picker-react';

const ChatArea = () => {
    const { user } = useAuth();
    const { activeConversation, setActiveConversation, messages, sendMessage, typingUsers, sendTyping, toggleUserInfo, setShowUserInfo, editMessage, deleteMessage, pinMessage, blockUser, clearChat, searchMessages } = useChat();
    const { onlineUsers } = useSocket();
    const [input, setInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState(null); // For message actions menu
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(null); // Store message id to delete

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const emojiPickerRef = useRef(null);
    const headerMenuRef = useRef(null);
    const messageMenuRef = useRef(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const otherUser = activeConversation
        ? (activeConversation.user1_id === user.id ? activeConversation.user2 : activeConversation.user1)
        : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
                setShowHeaderMenu(false);
            }
            if (messageMenuRef.current && !messageMenuRef.current.contains(event.target)) {
                setActiveMessageId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (!otherUser) return;

        if (editingMessage) {
            editMessage(editingMessage.id, otherUser.id, input);
            setEditingMessage(null);
        } else if (input.trim()) {
            sendMessage(otherUser.id, input, replyingTo?.id);
            setReplyingTo(null);
        }

        setInput('');
        setShowEmojiPicker(false);

        // Stop typing indicator
        if (isTypingRef.current) {
            sendTyping(otherUser.id, false);
            isTypingRef.current = false;
        }
    };

    const onEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji);
    };

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (!otherUser) return;
        const isTyping = e.target.value.length > 0;
        if (isTyping && !isTypingRef.current) {
            sendTyping(otherUser.id, true);
            isTypingRef.current = true;
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                if (isTypingRef.current) {
                    sendTyping(otherUser.id, false);
                    isTypingRef.current = false;
                }
            }, 1000);
        }
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Smile size={40} />
                </div>
                <p className="text-lg font-medium">Select a contact to start chatting</p>
            </div>
        );
    }

    const isOtherTyping = typingUsers[activeConversation.id] === otherUser.id;

    return (
        <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden relative">
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setActiveConversation(null); setShowUserInfo(false); }}
                        className="p-1 -ml-2 text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors" onClick={toggleUserInfo}>
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                            {otherUser.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{otherUser.name}</h3>
                            <UserStatus isOnline={onlineUsers.has(otherUser.id)} isTyping={isOtherTyping} lastSeen={otherUser.last_seen} size="small" />
                        </div>
                    </div>
                </div>
                <div className="relative" ref={headerMenuRef}>
                    <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-2 text-slate-400 hover:text-slate-600">
                        <MoreVertical size={20} />
                    </button>
                    {showHeaderMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                            <button
                                onClick={() => { setIsSearching(true); setShowHeaderMenu(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                            >
                                <Search size={16} /> Search Messages
                            </button>
                            <button
                                onClick={() => { clearChat(activeConversation.id); setShowHeaderMenu(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3 text-red-500"
                            >
                                <Trash2 size={16} /> Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isSearching && (
                <div className="h-12 bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-3">
                    <Search size={16} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search in chat..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="p-1 text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" onClick={() => setActiveMessageId(null)}>
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    const isActionOpen = activeMessageId === msg.id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                            onClick={(e) => { e.stopPropagation(); setActiveMessageId(isActionOpen ? null : msg.id); }}
                        >
                            <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'} ${searchQuery && msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ? 'ring-2 ring-yellow-400' : ''}`}>
                                {msg.reply_to_id && (
                                    <div className={`mb-2 p-2 rounded-lg border-l-4 text-xs ${isMe ? 'bg-primary-700/50 border-primary-300 text-primary-100' : 'bg-slate-50 border-slate-300 text-slate-500'}`}>
                                        <p className="font-bold truncate">
                                            {messages.find(m => m.id === msg.reply_to_id)?.sender_id === user.id ? 'You' : otherUser.name}
                                        </p>
                                        <p className="truncate">{messages.find(m => m.id === msg.reply_to_id)?.content || 'Deleted message'}</p>
                                    </div>
                                )}
                                {msg.is_pinned && <Pin size={12} className="absolute -top-1 -right-1 text-primary-400 bg-white rounded-full p-0.5" />}
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    {msg.is_edited && <span className="text-[9px] opacity-70">edited</span>}
                                    <p className={`text-[10px] ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Message Actions Menu */}
                                {isActionOpen && (
                                    <div ref={messageMenuRef} className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 w-32`}>
                                        <button className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setEditingMessage(msg); setInput(msg.content); setActiveMessageId(null); }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setReplyingTo(msg); setActiveMessageId(null); }}>
                                            <Reply size={14} /> Reply
                                        </button>
                                        <button className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2" onClick={() => { pinMessage(msg.id, otherUser.id, !msg.is_pinned); setActiveMessageId(null); }}>
                                            <Pin size={14} /> {msg.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setShowDeletePopup(msg.id); setActiveMessageId(null); }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isOtherTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                {editingMessage && (
                    <div className="mb-2 px-3 py-1 bg-slate-50 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-2"><Edit2 size={12} /> Editing message</span>
                        <button onClick={() => { setEditingMessage(null); setInput(''); }} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                )}
                {replyingTo && (
                    <div className="mb-2 px-3 py-1 bg-slate-50 rounded-lg flex items-center justify-between border-l-4 border-primary-400">
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-bold text-primary-600">Replying to {replyingTo.sender_id === user.id ? 'yourself' : otherUser.name}</span>
                            <span className="text-xs text-slate-500 truncate">{replyingTo.content}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <div className="relative" ref={emojiPickerRef}>
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-primary-500 transition-colors">
                            <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-4 z-50">
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </div>
                        )}
                    </div>
                    <button type="button" className="p-2 text-slate-400 hover:text-primary-500 transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        className="flex-1 py-3 px-4 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"
                        placeholder="Type your message..."
                        value={input}
                        onChange={handleTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* Delete Confirmation Popup */}
            {showDeletePopup && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h4 className="text-lg font-bold text-slate-800 mb-2">Delete Message?</h4>
                        <p className="text-sm text-slate-500 mb-6">Would you like to delete this message for yourself or for everyone?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { deleteMessage(showDeletePopup, otherUser.id, true); setShowDeletePopup(null); }}
                                className="w-full py-2.5 bg-transparent text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                            >
                                Delete for Everyone
                            </button>
                            <button
                                onClick={() => { deleteMessage(showDeletePopup, otherUser.id, false); setShowDeletePopup(null); }}
                                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                            >
                                Delete for Me
                            </button>
                            <button
                                onClick={() => setShowDeletePopup(null)}
                                className="w-full py-2.5 text-slate-500 font-medium hover:text-slate-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatArea;
