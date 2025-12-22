import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiPhone, FiMapPin, FiTrash2, FiEdit2, FiMoon, FiMonitor, FiArrowDown, FiArrowUp, FiMenu } from 'react-icons/fi';
import { BsToggleOn, BsToggleOff } from 'react-icons/bs';

const Settings = ({ settings, setSettings, toggleSidebar }) => {
    // Local state for profile
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : {
            name: 'Guest User',
            email: 'guest@example.com'
        };
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:5000/user/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    const profile = response.data.data;
                    setUser(profile);
                    setNewName(profile.name);
                    // Update local storage to keep in sync
                    localStorage.setItem('user', JSON.stringify(profile));
                }
            } catch (e) {
                console.error("Failed to fetch profile", e);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateName = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.put('http://localhost:5000/user/update', { name: newName }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const updatedUser = { ...user, name: newName };
                setUser(updatedUser);
                setIsEditingName(false);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist update
            }
        } catch (error) {
            console.error("Failed to update name", error);
        }
    };

    const toggleNewNotePosition = () => {
        setSettings(prev => ({ ...prev, addNewAtBottom: !prev.addNewAtBottom }));
    };

    const toggleTheme = () => {
        // Just toggling state for now, logic to apply theme would be global
        setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'system' : 'dark' }));
    };

    return (
        <main className="flex-1 flex flex-col h-full relative bg-white/10 backdrop-blur-2xl text-white font-poppins [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] overflow-hidden">
            {/* Header */}
            <div className="pt-6 px-6 md:pt-10 md:px-10 flex-shrink-0">
                <div className="flex items-center justify-between w-full md:w-[94%] mx-auto mb-5">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden text-white/90 p-2 hover:bg-white/10 rounded-full">
                            <FiMenu size={24} />
                        </button>
                        <h1 className="text-[2.5rem] md:text-[3rem] font-extrabold tracking-widest uppercase text-white/90">SETTINGS</h1>
                    </div>
                </div>
                <div className="h-px bg-white/20 w-[94%] mx-auto mb-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-20 [&::-webkit-scrollbar]:hidden">
                <div className="w-[94%] mx-auto flex flex-col gap-10 pb-20">

                    {/* Profile Section */}
                    <section className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Profile</h2>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            {/* Profile Picture (Left) */}
                            <div className="relative group cursor-pointer">
                                <div className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden">
                                    <FiUser size={64} className="text-white/80" />
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold uppercase tracking-wider">Update</span>
                                </div>
                            </div>

                            {/* User Info (Right) */}
                            <div className="flex-1 w-full relative">
                                {isEditingName ? (
                                    <div className="flex items-center gap-4 mb-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-xl font-bold outline-none text-white w-full max-w-sm"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateName} className="text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">Save</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 mb-1">
                                        <h3 className="text-3xl font-bold">{user.name}</h3>
                                        <FiEdit2
                                            className="cursor-pointer text-white/50 hover:text-white"
                                            size={20}
                                            onClick={() => setIsEditingName(true)}
                                        />
                                    </div>
                                )}
                                <p className="text-lg text-white/60 mb-6">{user.email}</p>

                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <button className="flex items-center gap-2 bg-red-500/20 text-red-200 px-5 py-3 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30">
                                        <FiTrash2 /> Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-white/10 w-full"></div>

                    {/* Display Options Section */}
                    <section className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Display Options</h2>
                        <div className="flex flex-col gap-6">

                            {/* Add Item Position Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {settings.addNewAtBottom ? <FiArrowDown size={24} className="text-white/70" /> : <FiArrowUp size={24} className="text-white/70" />}
                                    <div>
                                        <h3 className="text-xl font-medium">Add new item to bottom</h3>
                                        <p className="text-sm text-white/50">
                                            {settings.addNewAtBottom ? 'New items will appear at the end of the list' : 'New items will appear at the start of the list'}
                                        </p>
                                    </div>
                                </div>
                                <div onClick={toggleNewNotePosition} className="cursor-pointer text-white/80 hover:text-white transition-colors">
                                    {settings.addNewAtBottom ? <BsToggleOn size={40} /> : <BsToggleOff size={40} />}
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {settings.theme === 'dark' ? <FiMoon size={24} className="text-white/70" /> : <FiMonitor size={24} className="text-white/70" />}
                                    <div>
                                        <h3 className="text-xl font-medium">App Theme</h3>
                                        <p className="text-sm text-white/50">
                                            {settings.theme === 'dark' ? 'Dark Mode' : 'System Default (Current Red Gradient)'}
                                        </p>
                                    </div>
                                </div>
                                <div onClick={toggleTheme} className="cursor-pointer text-white/80 hover:text-white transition-colors">
                                    {settings.theme === 'dark' ? <BsToggleOn size={40} /> : <BsToggleOff size={40} />}
                                </div>
                            </div>

                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
};

export default Settings;
