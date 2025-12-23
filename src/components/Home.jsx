import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar';
import Notes from './Notes';
import Archive from './Archive';
import Trash from './Trash';
import Labels from './Labels';
import HelpFeedback from './HelpFeedback';
import Settings from './Settings';

const Home = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [activeView, setActiveView] = useState('notes');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDate, setFilterDate] = useState({ start: null, end: null });
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('appSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            addNewAtBottom: false,
            theme: 'system'
        };
    });

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const [labels, setLabels] = useState([]);
    const [dbLabels, setDbLabels] = useState([]);
    const [noteLabels, setNoteLabels] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState(null);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchNotes = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        try {

            const response = await axios.get(`${config.API_BASE_URL}/todo/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const mappedNotes = response.data.data.map(todo => ({
                    id: todo._id,
                    title: todo.title,
                    content: todo.description ? todo.description.join('\n') : '',
                    isPinned: todo.isPinned || false,
                    isArchived: todo.isArchived || false,
                    isTrashed: todo.status === 'bin',
                    labels: todo.labels ? [...new Set(todo.labels.map(l => l.name || l))] : [],
                    status: todo.status === 'in-progress' ? 'inProgress' : (todo.status === 'completed' ? 'completed' : 'open'),
                    createdAt: todo.createdAt || new Date().toISOString(),
                    attachments: todo.attachments || [],
                    // Legacy fallback
                    attachmentUrl: todo.attachmentUrl,
                    attachmentFilename: todo.attachmentFilename
                }));

                setNotes(mappedNotes);

                // Extract unique labels from active notes only (exclude trash)
                const activeNotesForLabels = mappedNotes.filter(n => !n.isTrashed);
                const uniqueNoteLabels = [...new Set(activeNotesForLabels.flatMap(note => note.labels))];
                setNoteLabels(uniqueNoteLabels);
            }
        } catch (err) {
            console.error("Failed to fetch notes", err);
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        }
    };

    const fetchLabels = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await axios.get(`${config.API_BASE_URL}/label/list`, getAuthHeader());
            if (response.data.success) {
                setDbLabels(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch labels", err);
        }
    };

    // Merge DB labels and Note labels
    useEffect(() => {
        const dbLabelNames = new Set(dbLabels.map(l => l.name));
        // Filter out note labels that already exist in DB labels
        const uniqueNoteOnlyLabels = noteLabels.filter(l => !dbLabelNames.has(l));
        // Combine: DB labels (objects) + Note labels (strings)
        // This ensures DB labels take precedence (keeping their IDs)
        setLabels([...dbLabels, ...uniqueNoteOnlyLabels]);
    }, [dbLabels, noteLabels]);

    useEffect(() => {
        fetchNotes();
        fetchLabels();
    }, [navigate]);

    // --- API Handlers ---

    const handleCreate = async (noteObject) => {
        try {
            let payload;
            let headers = getAuthHeader().headers;

            if ((noteObject.files && noteObject.files.length > 0) || noteObject.file) {
                const formData = new FormData();
                formData.append('title', noteObject.title || 'Untitled');
                if (noteObject.content) {
                    // Backend expects description as array of strings
                    const descLines = noteObject.content.split('\n');
                    descLines.forEach(line => formData.append('description[]', line));
                }
                formData.append('status', 'open');
                formData.append('isPinned', noteObject.isPinned || false);
                formData.append('isArchived', noteObject.isArchived || false);

                // Handle multiple files
                if (noteObject.files && noteObject.files.length > 0) {
                    Array.from(noteObject.files).forEach((file) => {
                        formData.append('files', file);
                    });
                }
                // Fallback for single file property if used
                if (noteObject.file) {
                    formData.append('file', noteObject.file);
                }

                payload = formData;
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                payload = {
                    title: noteObject.title || 'Untitled',
                    description: noteObject.content ? noteObject.content.split('\n') : [],
                    status: 'open',
                    isPinned: noteObject.isPinned,
                    isArchived: noteObject.isArchived
                };
            }

            await axios.post(`${config.API_BASE_URL}/todo/create`, payload, { headers });
            fetchNotes();
        } catch (error) {
            console.error("Error creating note:", error);
        }
    };

    const handleUpdate = async (updatedNote, skipFetch = false) => {
        try {
            let payload;
            let headers = getAuthHeader().headers;

            // Map label names to IDs
            const labelIds = await Promise.all((updatedNote.labels || []).map(async (name) => {
                const labelObj = labels.find(l => (l.name === name || l === name));
                if (labelObj && labelObj._id) return labelObj._id;
                // Create new label if it doesn't exist
                const newLabel = await handleCreateLabel(name);
                return newLabel ? newLabel._id : null;
            }));

            const validLabelIds = labelIds.filter(id => id);

            if ((updatedNote.files && updatedNote.files.length > 0) || updatedNote.file || updatedNote.deletedAttachmentFilenames) {
                const formData = new FormData();
                formData.append('title', updatedNote.title);
                if (updatedNote.content) {
                    const descLines = updatedNote.content.split('\n');
                    descLines.forEach(line => formData.append('description', line));
                }
                formData.append('status', updatedNote.isTrashed ? 'bin' : (updatedNote.status === 'inProgress' ? 'in-progress' : (updatedNote.status === 'completed' ? 'completed' : 'open')));
                formData.append('isPinned', updatedNote.isPinned);
                formData.append('isArchived', updatedNote.isArchived);

                // Handle deletion of attachments
                if (updatedNote.deletedAttachmentFilenames && updatedNote.deletedAttachmentFilenames.length > 0) {
                    updatedNote.deletedAttachmentFilenames.forEach(filename => {
                        formData.append('deletedAttachmentFilenames', filename);
                    });
                }
                // Legacy delete flag
                if (updatedNote.deleteAttachment) {
                    formData.append('deleteAttachment', 'true');
                }

                validLabelIds.forEach(id => formData.append('labels', id));

                // Handle multiple files
                if (updatedNote.files && updatedNote.files.length > 0) {
                    Array.from(updatedNote.files).forEach((file) => {
                        formData.append('files', file);
                    });
                }
                // Fallback for single file
                if (updatedNote.file) {
                    formData.append('file', updatedNote.file);
                }

                payload = formData;
                // headers['Content-Type'] = 'multipart/form-data'; // axios sets this auto
            } else {
                payload = {
                    title: updatedNote.title,
                    description: updatedNote.content ? updatedNote.content.split('\n') : [],
                    status: updatedNote.isTrashed ? 'bin' : (updatedNote.status === 'inProgress' ? 'in-progress' : (updatedNote.status === 'completed' ? 'completed' : 'open')),
                    isPinned: updatedNote.isPinned,
                    isArchived: updatedNote.isArchived,
                    labels: validLabelIds,
                    deleteAttachment: updatedNote.deleteAttachment,
                    deletedAttachmentFilenames: updatedNote.deletedAttachmentFilenames
                };
            }

            // 1. Basic Update (Handles labels too now)
            await axios.put(`${config.API_BASE_URL}/todo/update/${updatedNote.id}`, payload, { headers });

            // Optimistic UI Update
            setNotes(prevNotes => prevNotes.map(n => n.id === updatedNote.id ? { ...n, ...updatedNote } : n));

            if (!skipFetch) fetchNotes();
        } catch (error) {
            console.error("Error updating note:", error);
        }
    };

    const handleDelete = async (id, action = 'bin') => {
        try {
            await axios.delete(`${config.API_BASE_URL}/todo/delete/${id}?action=${action}`, getAuthHeader());
            fetchNotes();
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const handleArchive = async (id, archiveStatus) => {
        try {
            await axios.put(`${config.API_BASE_URL}/todo/update/${id}`, { isArchived: archiveStatus }, getAuthHeader());
            fetchNotes();
        } catch (error) {
            console.error("Error archiving note:", error);
        }
    };

    const handlePin = async (id, pinStatus) => {
        try {
            await axios.put(`${config.API_BASE_URL}/todo/update/${id}`, { isPinned: pinStatus }, getAuthHeader());
            fetchNotes(); // Optimistic update would be better but fetch is safer
        } catch (error) {
            console.error("Error pinning note:", error);
        }
    };

    // --- Label Handlers ---
    // --- Label Handlers ---
    const handleCreateLabel = async (name) => {
        try {
            const response = await axios.post(`${config.API_BASE_URL}/label/create`, { name }, getAuthHeader());
            await fetchLabels();
            return response.data.data;
        } catch (error) {
            console.error("Error creating label:", error.response?.data?.message || error.message);
            return null;
        }
    };

    const handleUpdateLabel = async (id, name, oldName) => {
        const isValidId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
        const newName = name.trim();
        if (!newName) return;

        try {
            if (isValidId) {
                await axios.put(`${config.API_BASE_URL}/label/update/${id}`, { name: newName }, getAuthHeader());
            } else {
                // Legacy Label Rename: find by index or name
                let targetLabelName = '';
                if (typeof id === 'number' && labels[id]) {
                    targetLabelName = labels[id].name || labels[id];
                } else if (labels[id]) {
                    targetLabelName = labels[id];
                }

                if (targetLabelName) {
                    const notesToUpdate = notes.filter(n => n.labels.includes(targetLabelName));
                    for (const note of notesToUpdate) {
                        const newLabels = note.labels.map(l => l === targetLabelName ? newName : l);
                        await handleUpdate({ ...note, labels: newLabels });
                    }
                }
            }
            await fetchLabels();
            fetchNotes();
        } catch (error) {
            console.error("Error updating label:", error.response?.data?.message || error.message);
        }
    };

    const handleDeleteLabel = async (id, name) => {
        // Check if ID is a valid MongoDB ObjectId (24 hex chars)
        const isValidId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

        try {
            // Optimistic UI Update: Remove the deleted label from the local state immediately
            setLabels(prev => prev.filter(l => (l._id && l._id !== id) || (l.name || l) !== name));

            // Also update the notes state to remove this label from their labels list so UI updates instantly
            setNotes(prevNotes => prevNotes.map(note => ({
                ...note,
                labels: note.labels.filter(l => l !== name && l !== (labels.find(lbl => lbl._id === id)?.name))
            })));

            // Real DB Label: Backend handles deletion
            if (isValidId) {
                await axios.delete(`${config.API_BASE_URL}/label/delete/${id}`, getAuthHeader());
            }

            // Ensure frontend consistency by manually removing label from mapped notes
            const notesToUnlabel = notes.filter(n => !n.isTrashed && n.labels.includes(name));

            // Execute all updates in parallel
            await Promise.all(notesToUnlabel.map(note => {
                const newLabels = note.labels.filter(l => l !== name);
                return handleUpdate({ ...note, labels: newLabels }, true);
            }));

            // Final sync after all operations are done
            fetchLabels();
            fetchNotes();


            if (activeView === 'label' && (selectedLabel === name || labels.find(l => l._id === id)?.name === selectedLabel)) {
                setSelectedLabel(null);
                setActiveView('notes');
            }
        } catch (error) {
            console.error("Error deleting label:", error.response?.data?.message || error.message);
        }
    };

    // Filter Logic
    const filteredNotes = notes.filter(n => {
        const matchesSearch = (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on mobile when view changes
    const handleViewChange = (view) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const renderView = () => {
        const commonProps = {
            notes: filteredNotes,
            setNotes: setNotes,
            onUpdate: handleUpdate,
            onCreate: handleCreate,
            onDelete: handleDelete,
            onArchive: handleArchive,
            onPin: handlePin,
            settings,
            labels, // object array now
            setLabels,
            onCreateLabel: handleCreateLabel,
            selectedLabel,
            setSelectedLabel,
            toggleSidebar, // Pass toggle function
            onSearch: setSearchQuery
        };

        switch (activeView) {
            case 'notes':
                return <Notes {...commonProps} filterStatus={filterStatus} filterDate={filterDate} />;
            case 'archive':
                return <Archive {...commonProps} />;
            case 'trash':
                return <Trash {...commonProps} />;
            case 'label':
                return <Labels
                    notes={notes}
                    setNotes={setNotes}
                    labels={labels}
                    setLabels={setLabels}
                    selectedLabel={selectedLabel}
                    setSelectedLabel={setSelectedLabel}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onUpdate={handleUpdate}
                    settings={settings}
                    toggleSidebar={toggleSidebar}
                    onSearch={setSearchQuery}
                />;
            case 'help & feedback':
                return <HelpFeedback toggleSidebar={toggleSidebar} />;
            case 'setting':
                return <Settings settings={settings} setSettings={setSettings} toggleSidebar={toggleSidebar} />;
            default:
                return <Notes {...commonProps} filterStatus={filterStatus} filterDate={filterDate} />;
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

                <SideBar
                    activeView={activeView}
                    setActiveView={handleViewChange}
                    onSearch={setSearchQuery}
                    onFilter={({ status }) => setFilterStatus(status)}
                    currentFilter={filterStatus}
                    labels={labels}
                    setLabels={setLabels}
                    selectedLabel={selectedLabel}
                    setSelectedLabel={setSelectedLabel}
                    setNotes={setNotes}
                    onCreateLabel={handleCreateLabel}
                    onUpdateLabel={handleUpdateLabel}
                    onDeleteLabel={handleDeleteLabel}
                    filterDate={filterDate}
                    onDateFilter={setFilterDate}
                    settings={settings}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
                {renderView()}
            </div>
        </div>
    );
};

export default Home;

