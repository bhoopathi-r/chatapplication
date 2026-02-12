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

    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (message) => {
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setMessages((prev) => [...prev, message]);
                    api.post(`/messages/read/${activeConversation.id}`);
                }
                updateConversations(message);
            });

            socket.on('messageSent', (message) => {
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setMessages((prev) => [...prev, message]);
                }
                updateConversations(message);
            });

            socket.on('typing', ({ conversationId, userId }) => {
                setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
            });

            socket.on('stopTyping', ({ conversationId, userId }) => {
                setTypingUsers((prev) => {
                    const newState = { ...prev };
                    delete newState[conversationId];
                    return newState;
                });
            });

            return () => {
                socket.off('receiveMessage');
                socket.off('messageSent');
                socket.off('typing');
                socket.off('stopTyping');
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

    const updateConversations = (message) => {
        // Logic to update the latest message in conversations list
        // and move it to top (simplified here)
        loadConversations();
    };

    const sendMessage = (receiverId, content) => {
        if (socket && activeConversation) {
            socket.emit('sendMessage', {
                conversationId: activeConversation.id,
                receiverId,
                content,
            });
        }
    };

    const sendTyping = (receiverId, isTyping) => {
        if (socket && activeConversation) {
            socket.emit(isTyping ? 'typing' : 'stopTyping', {
                conversationId: activeConversation.id,
                receiverId,
            });
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
            sendTyping
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
