import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiTrash2, FiSearch } from 'react-icons/fi';

const AdminTodos = ({ API_BASE_URL, getAuthHeader }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTodos = React.useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/todos`, getAuthHeader());
            setTodos(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching todos:", error);
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeader]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const handleDeleteTodo = async (todoId) => {
        if (!window.confirm("Are you sure you want to delete this todo?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/todos/${todoId}`, getAuthHeader());
            setTodos(todos.filter(t => t._id !== todoId));
        } catch (error) {
            console.error("Error deleting todo:", error);
            alert("Failed to delete todo.");
        }
    };

    const filteredTodos = todos.filter(todo =>
        (todo.title && todo.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (todo.description && todo.description.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="text-white p-8">Loading todos...</div>;

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-white text-3xl font-bold">Todo Management</h2>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search todos..."
                        className="bg-white/10 border border-white/20 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto bg-white/5 border border-white/20 rounded-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/60 uppercase text-sm tracking-wider">
                            <th className="p-5 font-medium w-1/4">Title</th>
                            <th className="p-5 font-medium w-1/3">Content</th>
                            <th className="p-5 font-medium">Status</th>
                            <th className="p-5 font-medium">Created At</th>
                            <th className="p-5 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredTodos.map(todo => (
                            <tr key={todo._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-5 text-white font-medium">{todo.title}</td>
                                <td className="p-5 text-white/70 line-clamp-2 max-w-xs">{todo.description?.join(' ')}</td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${todo.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                        todo.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                                            'bg-white/10 text-white/60'
                                        }`}>
                                        {todo.status}
                                    </span>
                                </td>
                                <td className="p-5 text-white/60 text-sm">
                                    {new Date(todo.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Potential future View feature
                                        <button 
                                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-blue-300 transition-colors"
                                            title="View Details"
                                        >
                                            <FiEye size={18} />
                                        </button>
                                        */}
                                        <button
                                            onClick={() => handleDeleteTodo(todo._id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                                            title="Delete Todo"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTodos.length === 0 && (
                    <div className="p-8 text-center text-white/50">No todos found.</div>
                )}
            </div>
        </div>
    );
};

export default AdminTodos;
