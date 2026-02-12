import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';

const ChatArea = () => {
    const { user } = useAuth();
    const { activeConversation, messages, sendMessage, typingUsers, sendTyping } = useChat();
    const { onlineUsers } = useSocket();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const otherUser = activeConversation
        ? (activeConversation.user1_id === user.id ? activeConversation.user2 : activeConversation.user1)
        : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim() && otherUser) {
            sendMessage(otherUser.id, input);
            setInput('');
            sendTyping(otherUser.id, false);
        }
    };

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (otherUser) {
            sendTyping(otherUser.id, e.target.value.length > 0);
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
        <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                        {otherUser.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">{otherUser.name}</h3>
                        <span className="text-xs text-green-500 font-medium">
                            {onlineUsers.has(otherUser.id) ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
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
                <form onSubmit={handleSend} className="flex items-center gap-3">
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
        </div>
    );
};

export default ChatArea;
