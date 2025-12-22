import React, { useState } from 'react';
import { FiPlus, FiMoreVertical, FiArchive, FiTrash2, FiUser, FiTag, FiCheckCircle, FiClock, FiArrowLeft, FiCheckSquare, FiXCircle, FiPaperclip, FiImage, FiCircle, FiMenu, FiSearch } from 'react-icons/fi';
import { BsPinAngle, BsPinFill, BsArrowDownUp } from 'react-icons/bs';
import { MdLabel, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
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

    const saveAndCloseNote = () => {
        if (!selectedNote) {
            setIsMenuOpen(false);
            return;
        }

        // Check if it's a new temporary note (id is timestamp from addNote) or existing
        const isExisting = notes.some(n => n.id === selectedNote.id);

        if (isExisting) {
            onUpdate(selectedNote);
        } else {
            // New note
            if (selectedNote.title.trim() || selectedNote.content.trim()) {
                onCreate(selectedNote);
            }
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
                <div className="md:hidden w-full md:w-[94%] mx-auto mb-6 relative">
                    <div className="flex items-center pb-2 border-b border-white/20">
                        <FiSearch size={22} className="text-white/70 mr-3" />
                        <input
                            type="text"
                            placeholder="Search your notes"
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-white placeholder-white/50 text-[1.2rem] w-full font-medium"
                        />
                    </div>
                </div>


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
                                                        className="bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl h-[240px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/40 hover:border-white/60 hover:shadow-2xl flex flex-col group hover:z-10 ring-2 ring-white/20"
                                                    >
                                                        {/* Note Content (Same as below) */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h3 className="font-bold text-2xl truncate pr-6 flex-1 text-white">{note.title || 'Untitled'}</h3>
                                                            {note.isPinned && <BsPinFill className="text-white shrink-0 ml-2" size={18} />}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden relative">
                                                            <p className="text-xl text-white/90 whitespace-pre-wrap leading-relaxed font-medium">
                                                                {getTruncatedContent(note.content)}
                                                            </p>
                                                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
                                                        </div>

                                                        {/* Tags/Labels Preview */}
                                                        {note.labels && note.labels.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3 overflow-hidden h-8">
                                                                {note.labels.slice(0, 3).map((lbl, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-black/20 rounded-md text-xs text-white/80 font-medium truncate max-w-[80px]">
                                                                        {typeof lbl === 'object' ? lbl.name : lbl}
                                                                    </span>
                                                                ))}
                                                                {note.labels.length > 3 && (
                                                                    <span className="px-2 py-0.5 bg-black/20 rounded-md text-xs text-white/80 font-medium">+{note.labels.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-white/60 text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <span className="bg-white/20 p-1.5 rounded-full"><FiClock size={12} /></span>
                                                                <span className="font-medium tracking-wide text-xs">{formatDate(note.createdAt).split(' ')[0]}</span>
                                                            </div>
                                                            {note.status === 'completed' && <FiCheckCircle className="text-green-400" size={16} />}
                                                            {note.status === 'inProgress' && <FiClock className="text-yellow-400" size={16} />}
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
                                                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl h-[240px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 hover:border-white/40 hover:shadow-2xl flex flex-col group hover:z-10"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-bold text-2xl truncate pr-6 flex-1 text-white">{note.title || 'Untitled'}</h3>
                                                </div>
                                                <div className="flex-1 overflow-hidden relative">
                                                    <p className="text-xl text-white/70 whitespace-pre-wrap leading-relaxed">
                                                        {getTruncatedContent(note.content)}
                                                    </p>
                                                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
                                                </div>

                                                {/* Tags/Labels Preview */}
                                                {note.labels && note.labels.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3 overflow-hidden h-8">
                                                        {note.labels.slice(0, 3).map((lbl, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-black/20 rounded-md text-xs text-white/80 font-medium truncate max-w-[80px]">
                                                                {typeof lbl === 'object' ? lbl.name : lbl}
                                                            </span>
                                                        ))}
                                                        {note.labels.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-black/20 rounded-md text-xs text-white/80 font-medium">+{note.labels.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-white/40 text-sm group-hover:text-white/60 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-white/10 p-1.5 rounded-full group-hover:bg-white/20 transition-colors"><FiClock size={12} /></span>
                                                        <span className="font-medium tracking-wide text-xs">{formatDate(note.createdAt).split(' ')[0]}</span>
                                                    </div>
                                                    {note.status === 'completed' && <FiCheckCircle className="text-green-400 group-hover:text-green-300" size={16} />}
                                                    {note.status === 'inProgress' && <FiClock className="text-yellow-400 group-hover:text-yellow-300" size={16} />}
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
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                            >
                                <FiMoreVertical size={24} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e1e2f]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right z-50">
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => handleAction('archive', e)}
                                    >
                                        <FiArchive className="mr-3" /> Archive
                                    </button>
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => handleAction('pin', e)}
                                    >
                                        <BsPinAngle className="mr-3" /> {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <div className="h-px bg-white/10 mx-2"></div>
                                    <div className="px-4 py-2">
                                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Status</span>
                                    </div>
                                    <button
                                        className="flex items-center w-full px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors text-left pl-8 relative"
                                        onClick={(e) => { e.stopPropagation(); updateStatus('inProgress'); }}
                                    >
                                        {selectedNote.status === 'inProgress' && <div className="absolute left-3 w-2 h-2 bg-yellow-400 rounded-full"></div>}
                                        In Progress
                                    </button>
                                    <button
                                        className="flex items-center w-full px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors text-left pl-8 relative"
                                        onClick={(e) => { e.stopPropagation(); updateStatus('completed'); }}
                                    >
                                        {selectedNote.status === 'completed' && <div className="absolute left-3 w-2 h-2 bg-green-400 rounded-full"></div>}
                                        Completed
                                    </button>

                                    <div className="h-px bg-white/10 mx-2 mt-2"></div>
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-red-500/20 text-red-400 text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => handleAction('delete', e)}
                                    >
                                        <FiTrash2 className="mr-3" /> Delete
                                    </button>
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

                        {/* Bottom Toolbar */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative">
                            <div className="flex gap-4 text-white/60">
                                {/* Label Button */}
                                <div className="relative">
                                    <button
                                        className={`hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 ${menuView === 'labels' ? 'bg-white/20 text-white' : ''}`}
                                        title="Add Label"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuView(menuView === 'labels' ? 'main' : 'labels');
                                        }}
                                    >
                                        <FiTag size={20} />
                                    </button>

                                    {/* Label Popover */}
                                    {menuView === 'labels' && (
                                        <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#1e1e2f] border border-white/20 rounded-xl shadow-2xl p-4 animate-fade-in z-50">
                                            <div className="flex items-center border-b border-white/10 pb-2 mb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter label name"
                                                    className="bg-transparent outline-none text-white text-sm w-full"
                                                    value={labelSearch}
                                                    onChange={(e) => setLabelSearch(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            createAndAddLabel(labelSearch);
                                                        }
                                                    }}
                                                />
                                                <FiPlus
                                                    className="cursor-pointer text-white/70 hover:text-white"
                                                    onClick={() => createAndAddLabel(labelSearch)}
                                                />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col gap-1">
                                                <span className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Select Label</span>
                                                {labels.map((l, idx) => {
                                                    const name = getLabelName(l);
                                                    const isSelected = (selectedNote.labels || []).includes(name);
                                                    if (labelSearch && !name.toLowerCase().includes(labelSearch.toLowerCase())) return null;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); toggleLabel(name); }}
                                                        >
                                                            {isSelected ? <MdCheckBox className="text-white" /> : <MdCheckBoxOutlineBlank className="text-white/40" />}
                                                            <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/70'}`}>{name}</span>
                                                        </div>
                                                    );
                                                })}
                                                {labels.length === 0 && <span className="text-white/30 text-xs italic">No labels yet</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                    title="Add Image (Coming Soon)"
                                >
                                    <FiImage size={20} />
                                </button>
                                <button className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" title="Change Color (Coming Soon)">
                                    <FiCircle size={20} />
                                </button>
                            </div>
                            <div className="text-xs text-white/40 font-mono">
                                {selectedNote.id.length > 13 ? 'Editing' : 'New Note'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Notes;
