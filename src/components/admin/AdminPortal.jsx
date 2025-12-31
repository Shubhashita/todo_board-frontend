import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminTodos from './AdminTodos';

const AdminPortal = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Simplified settings for now, mirroring Home.jsx structure
    const [settings] = useState(() => {
        const savedSettings = localStorage.getItem('appSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            theme: 'system' // or default to something
        };
    });

    const getAuthHeader = React.useCallback(() => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    }, []);

    // Dynamic API URL logic
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocalhost ? 'http://localhost:5000' : (process.env.REACT_APP_API_URL || 'https://todo-board-backend-9jov.onrender.com');

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token) {
            navigate('/');
        }
        // Only redirect to home if we are SURE it is not an admin
        else if (user && user.role && user.role.toLowerCase() !== 'admin') {
            navigate('/home');
        }
    }, [navigate]);

    const renderView = () => {
        const props = {
            API_BASE_URL,
            getAuthHeader
        };

        switch (activeView) {
            case 'dashboard':
                return <AdminDashboard {...props} />;
            case 'users':
                return <AdminUsers {...props} />;
            case 'todos':
                return <AdminTodos {...props} />;
            default:
                return <AdminDashboard {...props} />;
        }
    };

    return (
        <div className={`flex h-screen w-screen justify-center items-center overflow-hidden ${settings.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient'}`}>
            <div className="flex w-full h-full md:w-[95%] md:h-[90%] border-none md:border md:border-white/20 md:rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                <AdminSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    settings={settings}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <main className="flex-grow h-full overflow-hidden relative flex flex-col pt-16 md:pt-0">
                    {/* Mobile Hamburger */}
                    <div className="md:hidden absolute top-0 left-0 p-4 z-50">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-white">
                            {/* Hamburger Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default AdminPortal;
