import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import RightSidebar from '../components/RightSidebar';
import { useChat } from '../context/ChatContext';

const Dashboard = () => {
    const { activeConversation } = useChat();
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            <div className={`${activeConversation ? 'hidden lg:block' : 'block'} w-full lg:w-80`}>
                <Sidebar />
            </div>
            <div className={`${activeConversation ? 'block' : 'hidden lg:block'} flex-1`}>
                <ChatArea />
            </div>
            <RightSidebar />
        </div>
    );
};

export default Dashboard;
