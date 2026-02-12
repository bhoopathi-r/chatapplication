import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:3000', {
                auth: {
                    token: localStorage.getItem('token'),
                },
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('userOnline', (userId) => {
                setOnlineUsers((prev) => new Set([...prev, userId]));
            });

            newSocket.on('userOffline', (userId) => {
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
