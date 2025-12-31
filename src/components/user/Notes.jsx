import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiClock, FiCheckCircle, FiMoreVertical, FiPaperclip, FiXCircle, FiArchive, FiArrowLeft, FiDroplet, FiMenu, FiCopy, FiUser } from 'react-icons/fi';
import { BsPinAngle, BsPinFill, BsArrowDownUp } from 'react-icons/bs';
import { MdCheckBoxOutlineBlank, MdCheckBox, MdLabel, MdLabelOutline } from 'react-icons/md';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableNote = ({ note, onClick, children, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={className}
        >
            {children}
        </div>
    );
};

const Notes = ({ notes, setNotes, settings, labels, setLabels, onCreate, onUpdate, onDelete, onArchive, onPin, filterStatus, onCreateLabel, isLabelView, currentLabel, filterDate, toggleSidebar, onSearch }) => {
    const getAttachmentUrl = (attachment) => {
        if (attachment.filename) {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            return `${API_URL}/upload/${attachment.filename}`;
        }
        return attachment.url;
    };
    const [selectedNote, setSelectedNote] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuView, setMenuView] = useState('main');
    const [labelSearch, setLabelSearch] = useState('');

    // Helper to extract label name safely
    const getLabelName = (l) => (typeof l === 'object' && l !== null ? (l.name || '') : String(l));
    const normalizedLabels = labels.map(getLabelName);

    const getTruncatedContent = (content) => {
        const text = (content || '').replace(/\s+/g, ' ').trim();
        if (!text) return 'No content';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
    };

    const fileInputRef = React.useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        e.target.value = ''; // Reset input to allow re-selection

        e.target.value = ''; // Reset input to allow re-selection

        if (files.length > 0) {
            setSelectedNote(prev => ({
                ...prev,
                files: [...(prev.files || []), ...files]
            }));
        }
    };

    const removePendingFile = (index) => {
        setSelectedNote(prev => {
            const newFiles = [...(prev.files || [])];
            newFiles.splice(index, 1);
            return { ...prev, files: newFiles };
        });
    };

    const removeExistingFile = (attachment) => {
        if (window.confirm("Delete this attachment?")) {
            setSelectedNote(prev => ({
                ...prev,
                attachments: prev.attachments.filter(a => a.filename !== attachment.filename),
                deletedAttachmentFilenames: [...(prev.deletedAttachmentFilenames || []), attachment.filename]
            }));
        }
    };

    const handlePinWithConfirmation = (e, noteId, isPinned) => {
        e.stopPropagation();
        const action = isPinned ? 'Unpin' : 'Pin';
        if (window.confirm(`Are you sure you want to ${action} this note?`)) {
            onPin(noteId, !isPinned);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Filter active notes
    const activeNotes = notes.filter(n => {
        const isNotArchivedOrTrashed = !n.isArchived && !n.isTrashed;
        const matchesStatus = !filterStatus || filterStatus === 'All' ||
            (filterStatus === 'InProgress' && n.status === 'inProgress') ||
            (filterStatus === 'Completed' && n.status === 'completed');

        // Date Filter Logic
        let matchesDate = true;
        if (filterDate && filterDate.start) {
            const noteDate = new Date(n.createdAt);
            const startDate = new Date(filterDate.start);
            startDate.setHours(0, 0, 0, 0);

            const endDate = filterDate.end ? new Date(filterDate.end) : new Date(filterDate.start);
            endDate.setHours(23, 59, 59, 999);

            // Compare timestamps
            matchesDate = noteDate >= startDate && noteDate <= endDate;
        }

        return isNotArchivedOrTrashed && matchesStatus && matchesDate;
    });

    const createAndAddLabel = async (label) => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) return;

        // Check against normalized names
        if (!normalizedLabels.includes(trimmedLabel)) {
            // Create globally via API if provided
            if (onCreateLabel) {
                const newLabel = await onCreateLabel(trimmedLabel);
                // Optimistically add to list so it appears immediately
                if (newLabel) {
                    setLabels(prev => [...prev, newLabel]);
                }
            } else {
                // Fallback local update if handler missing
                setLabels(prev => [...prev, trimmedLabel]);
            }
        }
        toggleLabel(trimmedLabel);
        setLabelSearch('');
    };
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = Newest to Oldest

    // Derived sorted notes
    const sortedNotes = React.useMemo(() => {
        if (sortOrder === 'custom') return activeNotes;
        return [...activeNotes].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [activeNotes, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const saveAndCloseNote = async () => {
        if (!selectedNote) {
            setIsMenuOpen(false);
            return;
        }

        const isExisting = notes.some(n => n.id === selectedNote.id);

        try {
            if (isExisting) {
                await onUpdate(selectedNote);
            } else {
                // New note creation logic
                if (selectedNote.title.trim() || selectedNote.content.trim() || (selectedNote.files && selectedNote.files.length > 0)) {
                    // 1. Create the note first (without files if possible, or with files if backend supports it)
                    // Currently backend supports file upload during create, so we can send it all at once.
                    // However, if the user explicitly wants to "update" to add files, we can split it.
                    // But your backend handleCreate supports files, so single call is better for atomicity.

                    const newNoteData = await onCreate(selectedNote);

                    // If onCreate returns the new note, we could perform additional operations if needed.
                    // For now, relying on handleCreate to handle both text and files is standard.
                }
            }
        } catch (err) {
            console.error(err)
        }
        setSelectedNote(null);
        setIsMenuOpen(false);
    };

    const toggleLabel = (label) => {
        if (!selectedNote) return;
        const currentLabels = selectedNote.labels || [];
        const newLabels = currentLabels.includes(label)
            ? currentLabels.filter(l => l !== label)
            : [...currentLabels, label];

        const updated = { ...selectedNote, labels: newLabels };
        setSelectedNote(updated);
        onUpdate(updated);
    };



    const updateStatus = (status) => {
        const newStatus = selectedNote.status === status ? 'open' : status;
        const updated = { ...selectedNote, status: newStatus };
        setSelectedNote(updated);
        onUpdate(updated);
        setIsMenuOpen(false);
    };

    const addNote = () => {
        const newNote = {
            id: Date.now().toString(), // Temp ID
            title: '',
            content: '',
            isPinned: false,
            isArchived: false,
            isTrashed: false,
            labels: [],
            status: 'inProgress',
            createdAt: new Date().toISOString(),
            files: [],
            deletedAttachmentFilenames: []
        };
        setSelectedNote(newNote);
        setMenuView('main');
    };

    const deleteNote = (id) => {
        // Soft delete: move to trash
        onDelete(id, 'bin');
        if (selectedNote?.id === id) {
            setSelectedNote(null);
            setIsMenuOpen(false);
        }
    };

    const togglePin = (id) => {
        // We need to find the note to toggle its state if not selected
        const noteToToggle = notes.find(n => n.id === id);
        if (noteToToggle) {
            onPin(id, !noteToToggle.isPinned);
        }
    };

    const archiveNote = (id) => {
        onArchive(id, true);
        setSelectedNote(null);
        setIsMenuOpen(false);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            setNotes((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            setSortOrder('custom');
        }
    };

    const handleAction = (action, e) => {
        e.stopPropagation();
        if (!selectedNote) return;

        switch (action) {
            case 'archive':
                archiveNote(selectedNote.id);
                break;
            case 'removeLabel':
                // Remove the current label from the note
                if (currentLabel) {
                    const newLabels = (selectedNote.labels || []).filter(l => l !== currentLabel);
                    const updated = { ...selectedNote, labels: newLabels };
                    setSelectedNote(updated);
                    onUpdate(updated);
                }
                setIsMenuOpen(false);
                break;
            case 'pin':
                const newPinnedStatus = !selectedNote.isPinned;
                // Update local state so it doesn't get reverted by saveAndCloseNote
                setSelectedNote({ ...selectedNote, isPinned: newPinnedStatus });
                onPin(selectedNote.id, newPinnedStatus);
                setIsMenuOpen(false);
                break;
            case 'delete':
                deleteNote(selectedNote.id);
                break;
            default:
                break;
        }
        setIsMenuOpen(false);
    };

    const pinnedNotes = sortedNotes.filter(note => note.isPinned);
    const otherNotes = sortedNotes.filter(note => !note.isPinned);

    const [numCols, setNumCols] = useState(3);

    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setNumCols(2);
            else if (width < 1024) setNumCols(3);
            else if (width < 1440) setNumCols(4);
            else setNumCols(6);
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [username, setUsername] = useState('User');

    React.useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUsername(parsed.name || 'User');
            } catch (e) {
                console.error('Error parsing user data', e);
            }
        }
    }, []);

    const getMasonryColumns = (list) => {
        const columns = Array.from({ length: numCols }, () => []);
        list.forEach((note, index) => {
            columns[index % numCols].push(note);
        });
        return columns;
    };

    return (
        <main className="flex-1 flex flex-col h-full relative bg-white/10 backdrop-blur-2xl text-white font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] overflow-hidden">
            <div className="pt-6 px-6 md:pt-10 md:px-10 flex-shrink-0">
                <div className="flex items-center justify-between w-full md:w-[94%] mx-auto mb-5">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden text-white/90 p-2 hover:bg-white/10 rounded-full">
                            <FiMenu size={24} />
                        </button>
                        <h1 className="text-[2.5rem] md:text-[4rem] font-sans font-bold tracking-wide text-white/90">SLATE</h1>
                    </div>
                    <div className="flex items-center gap-5">
                        {/* Profile Section */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-white/30 transition-colors">
                                <FiUser size={40} />
                            </div>
                            <span className="text-xl font-bold text-white/90 max-w-[150px] truncate">{username}</span>
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {/* <div className="md:hidden w-full md:w-[94%] mx-auto mb-6 relative">
                    <div className="flex items-center pb-2 border-b border-white/20">
                        <FiSearch size={22} className="text-white/70 mr-3" />
                        <input
                            type="text"
                            placeholder="Search your notes"
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-white placeholder-white/50 text-[1.2rem] w-full font-medium"
                        />
                    </div>
                </div> */}


            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-20 [&::-webkit-scrollbar]:hidden">
                <div className="w-[94%] mx-auto">
                    {/* Sort Button Area */}
                    <div className="flex justify-end mb-4">
                        <div
                            onClick={toggleSort}
                            className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/20 bg-white/5"
                            title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
                        >
                            <span className="text-sm font-medium uppercase tracking-wider text-white/70">
                                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                            </span>
                            <BsArrowDownUp size={16} className="text-white/70" />
                        </div>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={activeNotes} strategy={rectSortingStrategy}>

                            {/* Pinned Notes Section */}
                            {pinnedNotes.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-xl font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <BsPinFill /> Pinned
                                    </h2>
                                    <div className="flex gap-6 items-start">
                                        {getMasonryColumns(pinnedNotes).map((colNotes, colIndex) => (
                                            <div key={colIndex} className="flex flex-col gap-6 flex-1 min-w-0">
                                                {colNotes.map((note) => (
                                                    <SortableNote
                                                        key={note.id}
                                                        note={note}
                                                        onClick={() => { setSelectedNote(note); setIsMenuOpen(false); }}
                                                        className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl h-[200px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 hover:border-white/40 hover:shadow-2xl flex flex-col group hover:z-10"
                                                    >
                                                        {/* Note Content (Same as below) */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h3 className="font-bold text-2xl truncate pr-6 flex-1 text-white">{note.title || 'Untitled'}</h3>
                                                            {note.isPinned && <BsPinFill className="text-white shrink-0 ml-2" size={18} />}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden relative">
                                                            <p className="text-xl text-white/90 whitespace-pre-wrap leading-relaxed font-medium mb-4">
                                                                {getTruncatedContent(note.content)}
                                                            </p>
                                                            <div className="absolute bottom-0 right-0 text-[10px] text-white/50 font-medium">
                                                                {formatDate(note.createdAt)}
                                                            </div>


                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-white/60 text-sm">
                                                            <div className="shrink-0 mr-2">
                                                                {note.status === 'completed' && <FiCheckCircle className="text-green-400" size={16} />}
                                                                {note.status === 'inProgress' && <FiClock className="text-yellow-400" size={16} />}
                                                            </div>

                                                            <div className="flex items-center gap-3 flex-1 overflow-hidden h-6 justify-end">
                                                                {/* Attachment Count */}
                                                                {note.attachments && note.attachments.length > 0 && (
                                                                    <div className="flex items-center gap-1.5 text-white/70 shrink-0" title={`${note.attachments.length} Attachment(s)`}>
                                                                        <FiPaperclip size={14} />
                                                                        <span className="text-xs font-bold">{note.attachments.length}</span>
                                                                    </div>
                                                                )}

                                                                {/* Divider */}
                                                                {note.attachments && note.attachments.length > 0 && note.labels && note.labels.length > 0 && (
                                                                    <div className="w-px h-4 bg-white/30 shrink-0"></div>
                                                                )}

                                                                {/* Labels Inline */}
                                                                {note.labels && note.labels.length > 0 && (
                                                                    <div className="flex items-center gap-2 overflow-hidden justify-end">
                                                                        {note.labels.map((lbl, idx) => (
                                                                            <span key={idx} className="flex items-center gap-1 text-[12px] text-white/90 font-medium whitespace-nowrap">
                                                                                <MdLabel size={13} className="opacity-90" />
                                                                                <span className="truncate max-w-[80px]">{typeof lbl === 'object' ? lbl.name : lbl}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </SortableNote>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Notes Section */}
                            {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                                <h2 className="text-xl font-bold text-white/50 uppercase tracking-widest mb-6 border-t border-white/10 pt-8">Others</h2>
                            )}

                            <div className="flex gap-6 items-start">
                                {getMasonryColumns(otherNotes).map((colNotes, colIndex) => (
                                    <div key={colIndex} className="flex flex-col gap-6 flex-1 min-w-0">
                                        {colNotes.map((note) => (
                                            <SortableNote
                                                key={note.id}
                                                note={note}
                                                onClick={() => { setSelectedNote(note); setIsMenuOpen(false); }}
                                                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl h-[200px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 hover:border-white/40 hover:shadow-2xl flex flex-col group hover:z-10"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-bold text-2xl truncate pr-6 flex-1 text-white">{note.title || 'Untitled'}</h3>
                                                </div>
                                                <div className="flex-1 overflow-hidden relative">
                                                    <p className="text-xl text-white/70 whitespace-pre-wrap leading-relaxed mb-4">
                                                        {getTruncatedContent(note.content)}
                                                    </p>
                                                    <div className="absolute bottom-0 right-0 text-[10px] text-white/40 font-medium group-hover:text-white/60 transition-colors">
                                                        {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>


                                                </div>

                                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-white/40 text-sm group-hover:border-white/20 group-hover:text-white/60 transition-colors">
                                                    <div className="shrink-0 mr-2">
                                                        {note.status === 'completed' && <FiCheckCircle className="text-green-400 group-hover:text-green-300" size={16} />}
                                                        {note.status === 'inProgress' && <FiClock className="text-yellow-400 group-hover:text-yellow-300" size={16} />}
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-1 overflow-hidden h-6 justify-end">
                                                        {/* Attachment Count */}
                                                        {note.attachments && note.attachments.length > 0 && (
                                                            <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white/80 transition-colors shrink-0" title={`${note.attachments.length} Attachment(s)`}>
                                                                <FiPaperclip size={14} />
                                                                <span className="text-xs font-bold">{note.attachments.length}</span>
                                                            </div>
                                                        )}

                                                        {/* Divider */}
                                                        {note.attachments && note.attachments.length > 0 && note.labels && note.labels.length > 0 && (
                                                            <div className="w-px h-4 bg-white/20 group-hover:bg-white/30 shrink-0 transition-colors"></div>
                                                        )}

                                                        {/* Labels Inline */}
                                                        {note.labels && note.labels.length > 0 && (
                                                            <div className="flex items-center gap-2 overflow-hidden justify-end">
                                                                {note.labels.map((lbl, idx) => (
                                                                    <span key={idx} className="flex items-center gap-1 text-[12px] text-white/90 font-medium whitespace-nowrap">
                                                                        <MdLabel size={13} className="opacity-90" />
                                                                        <span className="truncate max-w-[80px]">{typeof lbl === 'object' ? lbl.name : lbl}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </SortableNote>
                                        ))}
                                    </div>
                                ))}
                            </div>

                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                className="absolute bottom-10 right-10 w-20 h-20 bg-white text-[#89216b] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-300 z-40 group"
                onClick={addNote}
            >
                <FiPlus size={40} />
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 animate-ping"></div>
            </button>


            {/* Edit Modal Overlay */}
            {selectedNote && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    onClick={saveAndCloseNote}
                >
                    <div
                        className={`border border-white/20 md:rounded-3xl w-full h-full md:w-[600px] md:h-[600px] p-8 shadow-2xl relative flex flex-col animate-scale-up ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient'}`}
                        style={{ backgroundColor: selectedNote.color }}
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                    >
                        {/* 3-Dot Menu Button */}
                        <div className="absolute top-6 right-6 z-30 flex gap-2">
                            <button
                                onClick={(e) => handlePinWithConfirmation(e, selectedNote.id, selectedNote.isPinned)}
                                className={`transition-colors p-2 rounded-full hover:bg-white/10 ${selectedNote.isPinned ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                title={selectedNote.isPinned ? "Unpin note" : "Pin note"}
                            >
                                {selectedNote.isPinned ? <BsPinFill size={20} /> : <BsPinAngle size={20} />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isMenuOpen) setMenuView('main');
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                            >
                                <FiMoreVertical size={24} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e1e2f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right z-50 flex flex-col max-h-[400px]">
                                    {/* Main Menu View */}
                                    {(!menuView || menuView === 'main') && (
                                        <>
                                            <button className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.1rem] transition-colors text-left gap-3" onClick={(e) => handleAction('archive', e)}>
                                                <FiArchive /> Archive
                                            </button>
                                            <button className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.1rem] transition-colors text-left gap-3" onClick={(e) => handleAction('pin', e)}>
                                                <BsPinAngle /> {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                                            </button>
                                            <button
                                                className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.1rem] transition-colors text-left gap-3"
                                                onClick={(e) => { e.stopPropagation(); setMenuView('labels'); }}
                                            >
                                                <MdLabelOutline /> Add Label
                                            </button>


                                            <div className="h-px bg-white/10 mx-2 my-1"></div>

                                            <div className="px-4 py-2">
                                                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Status</span>
                                            </div>
                                            <button className="flex items-center w-full px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors text-left pl-8 relative" onClick={(e) => { e.stopPropagation(); updateStatus('inProgress'); }}>
                                                {selectedNote.status === 'inProgress' && <div className="absolute left-3 w-2 h-2 bg-yellow-400 rounded-full"></div>} In Progress
                                            </button>
                                            <button className="flex items-center w-full px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors text-left pl-8 relative" onClick={(e) => { e.stopPropagation(); updateStatus('completed'); }}>
                                                {selectedNote.status === 'completed' && <div className="absolute left-3 w-2 h-2 bg-green-400 rounded-full"></div>} Completed
                                            </button>

                                            <div className="h-px bg-white/10 mx-2 mt-2"></div>
                                            <button className="flex items-center w-full px-4 py-3 hover:bg-red-500/20 text-red-400 text-[1.1rem] transition-colors text-left gap-3" onClick={(e) => handleAction('delete', e)}>
                                                <FiTrash2 /> Delete
                                            </button>
                                        </>
                                    )}

                                    {/* Labels View */}
                                    {menuView === 'labels' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center gap-2 p-3 border-b border-white/10">
                                                <button onClick={(e) => { e.stopPropagation(); setMenuView('main'); }} className="p-1 hover:bg-white/10 rounded-full text-white/70"><FiArrowLeft /></button>
                                                <input
                                                    type="text"
                                                    placeholder="Enter label name"
                                                    className="bg-transparent outline-none text-white text-sm w-full"
                                                    value={labelSearch}
                                                    onChange={(e) => setLabelSearch(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => { if (e.key === 'Enter') createAndAddLabel(labelSearch); }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <FiPlus className="cursor-pointer text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); createAndAddLabel(labelSearch); }} />
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1 [&::-webkit-scrollbar]:hidden">
                                                {labels.map((l, idx) => {
                                                    const name = getLabelName(l);
                                                    const isSelected = (selectedNote.labels || []).includes(name);
                                                    if (labelSearch && !name.toLowerCase().includes(labelSearch.toLowerCase())) return null;
                                                    return (
                                                        <div key={idx} className="flex items-center gap-2 px-2 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); toggleLabel(name); }}>
                                                            {isSelected ? <MdCheckBox className="text-white shrink-0" /> : <MdCheckBoxOutlineBlank className="text-white/40 shrink-0" />}
                                                            <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/70'} truncate`}>{name}</span>
                                                        </div>
                                                    );
                                                })}
                                                {labels.length === 0 && <span className="text-white/30 text-xs italic p-2">No labels yet</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Colors View */}
                                    {menuView === 'colors' && (
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 p-3 border-b border-white/10 mb-2">
                                                <button onClick={(e) => { e.stopPropagation(); setMenuView('main'); }} className="p-1 hover:bg-white/10 rounded-full text-white/70"><FiArrowLeft /></button>
                                                <span className="text-sm font-bold text-white/90">Pick a color</span>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2 p-3">
                                                {['#202124', '#5c2b29', '#614a19', '#635d19', '#345920', '#16504b', '#2d555e', '#42275e', '#5b2245', '#442f19'].map((c) => (
                                                    <div
                                                        key={c}
                                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${selectedNote.color === c ? 'border-white' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedNote({ ...selectedNote, color: c }); }}
                                                        title={c}
                                                    ></div>
                                                ))}
                                                <div
                                                    className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 flex items-center justify-center bg-transparent border-white/20 hover:border-white/50 text-white/50`}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedNote({ ...selectedNote, color: null }); }}
                                                    title="Default"
                                                >
                                                    <FiXCircle size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Title Input */}
                        <input
                            type="text"
                            placeholder="Title"
                            value={selectedNote.title}
                            onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                            className="bg-transparent border-none outline-none text-[2.5rem] font-bold text-white placeholder-white/50 mb-6 w-[85%]"
                        />

                        {/* Content Textarea */}
                        <textarea
                            placeholder="Type something..."
                            value={selectedNote.content}
                            onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                            className="bg-transparent border-none outline-none flex-1 text-[1.6rem] text-white/90 placeholder-white/50 resize-none font-medium leading-relaxed overflow-auto [&::-webkit-scrollbar]:hidden"
                        ></textarea>

                        {/* Selected Labels Chips */}
                        {selectedNote.labels && selectedNote.labels.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4 mt-4">
                                {selectedNote.labels.map((lbl, idx) => (
                                    <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-sm text-white/90 border border-white/10">
                                        <MdLabel size={14} className="opacity-70" />
                                        {typeof lbl === 'object' ? lbl.name : lbl}
                                        <FiXCircle
                                            size={14}
                                            className="cursor-pointer ml-1 hover:text-red-400 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); toggleLabel(lbl); }}
                                        />
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Attachments List (Gmail Style) */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            {/* Existing Attachments */}
                            {selectedNote.attachments && selectedNote.attachments.map((att, idx) => (
                                <div key={`exist-${idx}`} className="relative group flex items-center gap-3 p-2 pr-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors max-w-[250px]">
                                    {/* Preview/Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0 overflow-hidden text-white/70">
                                        {att.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img src={getAttachmentUrl(att)} alt="attachment" className="w-full h-full object-cover" />
                                        ) : (
                                            <FiPaperclip size={18} />
                                        )}
                                    </div>

                                    {/* Filename */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-sm text-white/90 font-medium truncate w-full" title={att.filename}>{att.filename}</p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeExistingFile(att); }}
                                        className="text-white/30 hover:text-red-400 transition-colors"
                                        title="Delete Attachment"
                                    >
                                        <FiXCircle size={18} />
                                    </button>
                                </div>
                            ))}

                            {/* Pending Files */}
                            {selectedNote.files && selectedNote.files.map((file, idx) => (
                                <div key={`pending-${idx}`} className="relative group flex items-center gap-3 p-2 pr-4 rounded-xl bg-white/5 border border-dashed border-white/30 hover:bg-white/10 transition-colors max-w-[250px]">
                                    {/* Preview/Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0 overflow-hidden text-white/70">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <FiPaperclip size={18} />
                                        )}
                                    </div>

                                    {/* Filename */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-sm text-white/90 font-medium truncate w-full" title={file.name}>{file.name}</p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removePendingFile(idx); }}
                                        className="text-white/30 hover:text-red-400 transition-colors"
                                        title="Remove File"
                                    >
                                        <FiXCircle size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            className="hidden"
                        />

                        {/* Bottom Toolbar */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative">
                            <div className="flex gap-4 text-white/60">
                                <button
                                    className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                    title="Add Attachment"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current.click();
                                    }}
                                >
                                    <FiPaperclip size={20} />
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); saveAndCloseNote(); }}
                                className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                            >
                                {selectedNote.id.length > 13 ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Notes;
