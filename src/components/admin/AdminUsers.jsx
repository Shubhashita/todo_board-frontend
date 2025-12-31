import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiTrash2, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';

const AdminUsers = ({ API_BASE_URL, getAuthHeader }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = React.useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/users`, getAuthHeader());
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users:", error);
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeader]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (userId) => {
        try {
            await axios.patch(`${API_BASE_URL}/admin/users/${userId}/status`, {}, getAuthHeader());
            // Optimistic update
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
        } catch (error) {
            console.error("Error toggling user status:", error);
            alert("Failed to toggle user status.");
        }
    };

    // Note: Backend service hardcodes role to "admin" for now
    const handleMakeAdmin = async (userId) => {
        if (!window.confirm("Are you sure you want to promote this user to Admin?")) return;
        try {
            await axios.patch(`${API_BASE_URL}/admin/users/${userId}/role`, {}, getAuthHeader());
            setUsers(users.map(u => u._id === userId ? { ...u, role: 'admin' } : u));
        } catch (error) {
            console.error("Error changing user role:", error);
            alert("Failed to change user role.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, getAuthHeader());
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    if (loading) return <div className="text-white p-8">Loading users...</div>;

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            <h2 className="text-white text-3xl font-bold mb-8">User Management</h2>

            <div className="overflow-x-auto bg-white/5 border border-white/20 rounded-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/60 uppercase text-sm tracking-wider">
                            <th className="p-5 font-medium">User</th>
                            <th className="p-5 font-medium">Email</th>
                            <th className="p-5 font-medium">Role</th>
                            <th className="p-5 font-medium">Status</th>
                            <th className="p-5 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {users.map(user => (
                            <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-5 text-white font-medium flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    {user.name}
                                </td>
                                <td className="p-5 text-white/80">{user.email}</td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleMakeAdmin(user._id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-purple-300 transition-colors"
                                            title="Promote to Admin"
                                            disabled={user.role === 'admin'}
                                        >
                                            <FiShield size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(user._id)}
                                            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${user.isActive ? 'text-white/60 hover:text-orange-300' : 'text-white/60 hover:text-green-300'}`}
                                            title={user.isActive ? "Deactivate User" : "Activate User"}
                                        >
                                            {user.isActive ? <FiUserX size={18} /> : <FiUserCheck size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                                            title="Delete User"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-white/50">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
