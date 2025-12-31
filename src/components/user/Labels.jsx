import React, { useState } from 'react';
import { MdOutlineLabel } from 'react-icons/md';
import { FiMoreVertical, FiTrash2, FiEdit3, FiXCircle, FiMenu, FiSearch } from 'react-icons/fi';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
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

const Labels = ({ notes = [], selectedLabel, onDelete, onArchive, setLabels, setSelectedLabel, setNotes: onUpdateNotes, onUpdate, settings, toggleSidebar, onSearch }) => {
    const [selectedNote, setSelectedNote] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const labelledNotes = selectedLabel ? notes.filter(n => n.labels && n.labels.includes(selectedLabel) && !n.isTrashed) : [];

    const deleteNote = (id) => {
        onDelete && onDelete(id, 'bin');
        if (selectedNote?.id === id) {
            setSelectedNote(null);
            setIsMenuOpen(false);
        }
    };

    const removeLabel = (id) => {
        if (selectedNote && selectedLabel && onUpdate) {
            const newLabels = (selectedNote.labels || []).filter(l => l !== selectedLabel);
            const updatedNote = { ...selectedNote, labels: newLabels };
            onUpdate(updatedNote);
        }
        setIsMenuOpen(false);
        setSelectedNote(null);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 10 }
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 }
        })
    );

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
        handleResize();
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
        <main className="flex-1 flex flex-col h-full relative bg-white/10 backdrop-blur-2xl text-white font-sans overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="pt-6 px-6 md:pt-10 md:px-10 flex-shrink-0">
                <div className="flex items-center justify-between w-full md:w-[94%] mx-auto mb-5">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden text-white/90 p-2 hover:bg-white/10 rounded-full">
                            <FiMenu size={24} />
                        </button>
                        <h1 className="text-[2.5rem] md:text-[3rem] font-extrabold tracking-widest uppercase text-white/90">
                            LABELS
                        </h1>
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



                {selectedLabel && (
                    <div className="flex items-center justify-start gap-4 w-[94%] mx-auto mb-8 animate-fade-in">
                        <MdOutlineLabel size={32} className="text-white/90" />
                        <h2 className="text-2xl font-bold tracking-wider text-white/90 uppercase">
                            {selectedLabel}
                        </h2>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-20 [&::-webkit-scrollbar]:hidden">
                <div className="w-[94%] mx-auto py-4">
                    {selectedLabel ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter}>
                            {labelledNotes.length > 0 ? (
                                <SortableContext items={labelledNotes} strategy={rectSortingStrategy}>
                                    <div className="flex gap-6 items-start">
                                        {getMasonryColumns(labelledNotes).map((colNotes, colIndex) => (
                                            <div key={colIndex} className="flex flex-col gap-6 flex-1 min-w-0">
                                                {colNotes.map((note) => (
                                                    <SortableNote
                                                        key={note.id}
                                                        note={note}
                                                        onClick={() => { setSelectedNote(note); setIsMenuOpen(false); }}
                                                        className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl h-[240px] p-6 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 hover:border-white/40 hover:shadow-2xl flex flex-col hover:z-10"
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
                                <div className="text-center text-white/50 text-2xl mt-20">No notes for this label</div>
                            )}
                        </DndContext>
                    ) : (
                        <div className="text-center text-white/50 text-2xl mt-20">Select a label to view its notes</div>
                    )}
                </div>
            </div>

            {selectedNote && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-transparent transition-opacity duration-300"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className={`border border-white/20 md:rounded-3xl w-full h-full md:w-[600px] md:h-[600px] p-8 shadow-2xl relative flex flex-col animate-scale-up ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient'}`}
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                    >
                        <div className="absolute top-6 right-6 z-30">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                            >
                                <FiMoreVertical size={24} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e1e2f]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right">
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-white/10 text-white text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => { e.stopPropagation(); removeLabel(selectedNote.id); }}
                                    >
                                        <FiXCircle className="mr-3" /> Remove from label
                                    </button>
                                    <div className="h-px bg-white/10 mx-2"></div>
                                    <button
                                        className="flex items-center w-full px-4 py-3 hover:bg-red-500/20 text-red-400 text-[1.4rem] transition-colors text-left"
                                        onClick={(e) => { e.stopPropagation(); deleteNote(selectedNote.id); }}
                                    >
                                        <FiTrash2 className="mr-3" /> Move to trash
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-transparent border-none outline-none text-[2.5rem] font-bold text-white mb-6 w-[90%]">
                            {selectedNote.title}
                        </div>

                        <div className="bg-transparent border-none outline-none flex-1 text-[1.6rem] text-white/90 resize-none font-medium leading-relaxed overflow-auto [&::-webkit-scrollbar]:hidden">
                            {selectedNote.content}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Labels;
