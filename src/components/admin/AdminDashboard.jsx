import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUsers, FiCheckSquare, FiSquare, FiActivity } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all duration-300 shadow-lg group">
        <div>
            <p className="text-white/60 text-lg font-medium mb-1">{title}</p>
            <h3 className="text-white text-4xl font-bold">{value}</h3>
        </div>
        <div className={`p-4 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300 ${color}`}>
            <Icon size={32} className="text-white" />
        </div>
    </div>
);

const AdminDashboard = ({ API_BASE_URL, getAuthHeader }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTodos: 0,
        completedTodos: 0,
        pendingTodos: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/stats`, getAuthHeader());
                if (response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            }
        };

        fetchStats();
    }, [API_BASE_URL, getAuthHeader]);

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            <h2 className="text-white text-3xl font-bold mb-8">Dashboard Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={FiUsers}
                    color="bg-blue-500/20"
                />
                <StatCard
                    title="Total Todos"
                    value={stats.totalTodos}
                    icon={FiActivity}
                    color="bg-purple-500/20"
                />
                <StatCard
                    title="Completed Tasks"
                    value={stats.completedTodos}
                    icon={FiCheckSquare}
                    color="bg-green-500/20"
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats.pendingTodos}
                    icon={FiSquare}
                    color="bg-orange-500/20"
                />
            </div>

            {/* Placeholder for charts or recent activity if needed locally */}
            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl">
                <h3 className="text-white text-xl font-bold mb-4">Welcome to Admin Portal</h3>
                <p className="text-white/70">
                    Manage users, view statistics, and oversee all todos from this central dashboard.
                    Use the sidebar to navigate between different sections.
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
