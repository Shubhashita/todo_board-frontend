import React from 'react';
import { MdDashboard, MdPeople, MdAssignment } from 'react-icons/md';
import { FiGrid, FiUsers, FiList, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ activeView, setActiveView, settings, isOpen, onClose }) => {
    const navigate = useNavigate();

    const navItems = [
        { name: 'Dashboard', icon: FiGrid, activeIcon: MdDashboard },
        { name: 'Users', icon: FiUsers, activeIcon: MdPeople },
        { name: 'Todos', icon: FiList, activeIcon: MdAssignment },
        // { name: 'Settings', icon: FiSettings, activeIcon: MdSettings },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <aside className={`
            w-[280px] 
            ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient md:bg-none'} 
            md:bg-white/10 backdrop-blur-none md:backdrop-blur-2xl flex flex-col px-5 py-8 shrink-0 text-white font-sans 
            fixed inset-y-0 left-0 z-50 transition-transform duration-300 shadow-2xl md:shadow-none
            md:relative md:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Title / Logo Area */}
            <div className="flex items-center pb-2.5 border-b border-white/30 mb-8">
                <span className="text-white ml-2.5 w-full font-bold text-[1.6rem] uppercase tracking-widest">
                    Admin Portal
                </span>
            </div>

            {/* Menu Navigation */}
            <nav className="flex flex-col gap-2 flex-grow">
                {navItems.map((item) => {
                    const isActive = activeView === item.name.toLowerCase();
                    const Icon = isActive ? item.activeIcon : item.icon;
                    return (
                        <div
                            key={item.name}
                            onClick={() => {
                                setActiveView(item.name.toLowerCase());
                                if (window.innerWidth < 768) onClose();
                            }}
                            className={`flex items-center py-3 cursor-pointer transition-all duration-200 font-medium text-[1.6rem] hover:translate-x-1 hover:opacity-100 ${isActive ? 'opacity-100 font-bold ml-2' : 'opacity-70'}`}
                        >
                            <Icon size={22} className={`mr-3 ${isActive ? 'text-white' : 'text-white/80'}`} />
                            <span>{item.name}</span>
                        </div>
                    );
                })}
            </nav>

            <div className="h-px bg-white/30 my-6 w-full"></div>

            {/* Logout */}
            <div
                onClick={handleLogout}
                className="flex items-center py-3 cursor-pointer transition-all duration-200 font-medium text-[1.6rem] hover:translate-x-1 opacity-70 hover:opacity-100 text-red-200"
            >
                <FiLogOut size={22} className="mr-3 text-red-200" />
                <span>Logout</span>
            </div>

            {/* Vertical Divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[90%] w-px bg-white/20"></div>
        </aside>
    );
};

export default AdminSidebar;
