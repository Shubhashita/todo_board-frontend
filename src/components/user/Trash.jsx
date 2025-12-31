import React, { useState } from 'react';
import { FiMoreVertical, FiTrash2, FiUser, FiRefreshCcw, FiXCircle, FiMenu } from 'react-icons/fi';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
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

const Trash = ({ notes, setNotes, onDelete, settings, toggleSidebar }) => {
    const [selectedNote, setSelectedNote] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Filter only trashed notes
    const trashedNotes = notes.filter(n => n.isTrashed);

    const restoreNote = (id) => {
        onDelete(id, 'restore');
        setIsMenuOpen(false);
        setSelectedNote(null);
    };

    const deleteForever = (id) => {
        onDelete(id, 'permanent');
        if (selectedNote?.id === id) {
            setSelectedNote(null);
            setIsMenuOpen(false);
        }
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
        // Skiped drag/reorder in trash
    };

    const handleAction = (action, e) => {
        e.stopPropagation();
        if (!selectedNote) return;

        switch (action) {
            case 'restore':
                restoreNote(selectedNote.id);
                break;
            case 'delete':
                deleteForever(selectedNote.id);
                break;
            default:
                break;
        }
        setIsMenuOpen(false);
    };

    // Masonry Layout Logic
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
                        <h1 className="text-[2.5rem] md:text-[3rem] font-extrabold tracking-widest uppercase text-white/90">TRASH</h1>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-white/30 transition-colors">
                        <FiUser size={40} />
                    </div>
                </div>
                <div className="h-px bg-white/20 w-[94%] mx-auto mb-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-20 [&::-webkit-scrollbar]:hidden">
                <div className="w-[94%] mx-auto py-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        {trashedNotes.length > 0 ? (
                            <SortableContext items={trashedNotes} strategy={rectSortingStrategy}>
                                <div className="flex gap-6 items-start">
                                    {getMasonryColumns(trashedNotes).map((colNotes, colIndex) => (
                                        <div key={colIndex} className="flex flex-col gap-6 flex-1 min-w-0">
                                            {colNotes.map((note) => (
                                                <SortableNote
                                                    key={note.id}
                                                    note={note}
                                                    onClick={() => { setSelectedNote(note); setIsMenuOpen(false); }}
                                                    className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl h-[240px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 hover:border-white/40 hover:shadow-2xl flex flex-col opacity-75 hover:z-10"
                                                >
                                                    <h3 className="font-bold text-2xl mb-3 truncate pr-6 flex-shrink-0">{note.title || 'Untitled'}</h3>
                                                    <p className="text-xl text-white/70 whitespace-pre-wrap overflow-hidden">{(note.content || '').trim() || 'No content'}</p>
                                                </SortableNote>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        ) : (
                            <div className="text-center text-white/50 text-2xl mt-20">Trash is empty</div>
                        )}
                    </DndContext>
                </div>
            </div>

            {/* View/Restore Modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-transparent transition-opacity duration-300"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className={`border border-white/20 md:rounded-3xl w-full h-full md:w-[600px] md:h-[600px] p-8 shadow-2xl relative flex flex-col animate-scale-up ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient'}`}
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                    >
                        {/* 3-Dot Menu Button */}
                        <div className="absolute top-6 right-6 z-30">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                            >
                                <FiMoreVertical size={24} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e1e2f]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right">
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => handleAction('restore', e)}
                                    >
                                        <FiRefreshCcw className="mr-3" /> Restore
                                    </button>
                                    <div className="h-px bg-white/10 mx-2"></div>
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-red-500/20 text-red-400 text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => handleAction('delete', e)}
                                    >
                                        <FiXCircle className="mr-3" /> Delete Forever
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-transparent border-none outline-none text-[2.5rem] font-bold text-white mb-6 w-[90%] opacity-80">
                            {selectedNote.title}
                        </div>

                        <div className="bg-transparent border-none outline-none flex-1 text-[1.6rem] text-white/90 resize-none font-medium leading-relaxed overflow-auto [&::-webkit-scrollbar]:hidden opacity-80">
                            {selectedNote.content}
                        </div>

                        <div className="text-center text-white/40 mt-4 text-sm uppercase tracking-widest">
                            Note in Trash
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Trash;
