import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import RightSidebar from '../components/RightSidebar';

const Dashboard = () => {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            <Sidebar />
            <ChatArea />
            <RightSidebar />
        </div>
    );
};

export default Dashboard;
