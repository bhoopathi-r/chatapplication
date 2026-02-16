import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({}); // conversationId -> userId
    const [showUserInfo, setShowUserInfo] = useState(false);

    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
            // Mark messages as read on backend
            api.post(`/messages/read/${activeConversation.id}`);
            // Reset unread count for active conversation
            setConversations((prev) => prev.map(conv => {
                if (conv.id === activeConversation.id) {
                    return { ...conv, unreadCount: 0 };
                }
                return conv;
            }));
        }
    }, [activeConversation]);

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (message) => {
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setMessages((prev) => [...prev, message]);
                    api.post(`/messages/read/${activeConversation.id}`);
                } else {
                    // Increment unread count for the conversation
                    setConversations((prev) => prev.map(conv => {
                        if (conv.id === message.conversation_id) {
                            return { ...conv, unreadCount: (conv.unreadCount || 0) + 1 };
                        }
                        return conv;
                    }));
                }
            });

            socket.on('messageSent', (message) => {
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            socket.on('conversationUpdated', ({ conversationId, last_message_at, lastMessage }) => {
                setConversations((prev) => {
                    const conversationIndex = prev.findIndex(c => c.id === conversationId);
                    if (conversationIndex === -1) return prev;

                    const updatedConversations = [...prev];
                    const existingConv = updatedConversations[conversationIndex];

                    const updatedConversation = {
                        ...existingConv,
                        last_message_at,
                        lastMessage: lastMessage || existingConv.lastMessage
                    };

                    updatedConversations.splice(conversationIndex, 1);
                    // Move to top
                    return [updatedConversation, ...updatedConversations];
                });
            });

            socket.on('typing', ({ conversationId, userId }) => {
                console.log('Received typing event:', { conversationId, userId });
                setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
            });

            socket.on('stopTyping', ({ conversationId, userId }) => {
                console.log('Received stopTyping event:', { conversationId, userId });
                setTypingUsers((prev) => {
                    const newState = { ...prev };
                    delete newState[conversationId];
                    return newState;
                });
            });

            socket.on('messageEdited', (editedMessage) => {
                setMessages((prev) => prev.map(m => m.id === editedMessage.id ? editedMessage : m));
            });

            socket.on('messageDeleted', ({ id, deleteForEveryone }) => {
                if (deleteForEveryone) {
                    setMessages((prev) => prev.map(m => m.id === id ? { ...m, content: 'This message was deleted', is_deleted_everyone: true } : m));
                } else {
                    setMessages((prev) => prev.filter(m => m.id !== id));
                }
            });

            socket.on('messagePinned', (pinnedMessage) => {
                setMessages((prev) => prev.map(m => m.id === pinnedMessage.id ? pinnedMessage : m));
            });

            socket.on('messagePinned', (pinnedMessage) => {
                setMessages((prev) => prev.map(m => m.id === pinnedMessage.id ? pinnedMessage : m));
            });

            socket.on('chatCleared', ({ conversationId }) => {
                if (activeConversation && conversationId === activeConversation.id) {
                    setMessages([]);
                }
            });

            socket.on('searchResults', ({ messages }) => {
                console.log('Search results received:', messages);
                // The UI will handle displaying these results
            });

            return () => {
                socket.off('receiveMessage');
                socket.off('messageSent');
                socket.off('conversationUpdated');
                socket.off('typing');
                socket.off('stopTyping');
                socket.off('messageEdited');
                socket.off('messageDeleted');
                socket.off('messagePinned');
                socket.off('chatCleared');
                socket.off('searchResults');
            };
        }
    }, [socket, activeConversation]);

    const loadConversations = async () => {
        try {
            const response = await api.get('/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await api.get(`/messages/${conversationId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const sendMessage = (receiverId, content, replyToId = null) => {
        if (socket && activeConversation) {
            socket.emit('sendMessage', {
                conversationId: activeConversation.id,
                receiverId,
                content,
                replyToId
            });
        }
    };

    const sendTyping = (receiverId, isTyping) => {
        if (socket && activeConversation) {
            console.log('Sending typing event:', {
                event: isTyping ? 'typing' : 'stopTyping',
                conversationId: activeConversation.id,
                receiverId
            });
            socket.emit(isTyping ? 'typing' : 'stopTyping', {
                conversationId: activeConversation.id,
                receiverId,
            });
        }
    };

    const toggleUserInfo = () => {
        setShowUserInfo((prev) => !prev);
    };

    const editMessage = (id, receiverId, content) => {
        if (socket) {
            socket.emit('editMessage', { id, receiverId, content });
        }
    };

    const deleteMessage = (id, receiverId, deleteForEveryone) => {
        if (socket) {
            socket.emit('deleteMessage', { id, receiverId, deleteForEveryone });
        }
    };

    const pinMessage = (id, receiverId, isPinned) => {
        if (socket) {
            socket.emit('pinMessage', { id, receiverId, isPinned });
        }
    };

    const clearChat = (conversationId) => {
        if (socket) {
            socket.emit('clearChat', { conversationId });
        }
    };

    const searchMessages = (conversationId, query) => {
        if (socket) {
            socket.emit('searchMessages', { conversationId, query });
        }
    };

    const startConversation = async (otherUserId) => {
        try {
            const response = await api.post('/conversations', { userId: otherUserId });
            const conversation = response.data;
            if (!conversations.find(c => c.id === conversation.id)) {
                setConversations(prev => [conversation, ...prev]);
            }
            setActiveConversation(conversation);
        } catch (error) {
            console.error('Failed to start conversation', error);
        }
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            activeConversation,
            setActiveConversation,
            messages,
            sendMessage,
            startConversation,
            typingUsers,
            sendTyping,
            showUserInfo,
            setShowUserInfo,
            toggleUserInfo,
            editMessage,
            deleteMessage,
            pinMessage,
            clearChat,
            searchMessages
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
