import React, { useState, forwardRef, useEffect, useRef } from 'react';
import { MdOutlineLabel, MdLabel, MdDescription, MdArchive, MdDelete, MdSettings, MdHelp, MdFilterList } from 'react-icons/md';
import { FiSearch, FiPlus, FiFilter, FiCalendar, FiArchive, FiTrash2, FiSettings, FiHelpCircle, FiFileText, FiEdit3, FiChevronDown } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Custom Input Component for DatePicker
const CustomDateInput = forwardRef(({ value, onClick, isOpen, onClear, label }, ref) => (
    <div
        onClick={onClick}
        ref={ref}
        className="text-white text-2xl outline-none cursor-pointer w-full flex items-center justify-between hover:opacity-80 transition-opacity bg-white/20 border border-white/30 rounded-xl p-3"
    >
        <span className={value ? "text-white text-lg" : "text-white/50 text-lg"}>
            {value || label || "Select Date"}
        </span>
        <div className="flex items-center gap-2">
            {value && (
                <div
                    onClick={onClear}
                    className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                    <FiTrash2 size={16} className="text-white/80 hover:text-white" />
                </div>
            )}
            <FiCalendar size={22} className="opacity-80 text-white" />
        </div>
    </div>
));

const SideBar = ({ activeView, setActiveView, onSearch, onFilter, currentFilter, labels = [], setLabels, setSelectedLabel, selectedLabel, setNotes, onCreateLabel, onUpdateLabel, onDeleteLabel, filterDate, onDateFilter, settings, isOpen, onClose }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    // const [selectedDate, setSelectedDate] = useState(null); // Removed local state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [showLabelInput, setShowLabelInput] = useState(false);

    // Label Editing State
    const [editingLabelId, setEditingLabelId] = useState(null);
    const [editLabelName, setEditLabelName] = useState('');

    const filterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        if (isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterOpen]);

    const handleCreateLabel = async () => {
        const name = newLabelName.trim();
        if (name && onCreateLabel) {
            try {
                await onCreateLabel(name);
                setNewLabelName('');
                setShowLabelInput(false);
            } catch (error) {
                console.error("Error creating label from sidebar:", error);
            }
        }
    };

    const handleUpdateLabel = (id, oldName) => {
        if (!editLabelName.trim() || editLabelName === oldName) {
            setEditingLabelId(null);
            return;
        }
        const newName = editLabelName.trim();

        if (labels.some(l => l.name === newName && l._id !== id)) {
            alert('Label already exists!');
            return;
        }

        if (onUpdateLabel) {
            onUpdateLabel(id, newName);
            if (selectedLabel === oldName && setSelectedLabel) {
                setSelectedLabel(newName);
            }
        }
        setEditingLabelId(null);
    };

    const handleDeleteLabel = (id, name, e) => {
        e.stopPropagation();
        if (window.confirm(`Delete label "${name}"?`)) {
            if (onDeleteLabel) onDeleteLabel(id, name);
        }
    };

    const startEditing = (id, name, e) => {
        e.stopPropagation();
        setEditingLabelId(id);
        setEditLabelName(name);
    };

    const navItems = [
        { name: 'Notes', icon: FiFileText, activeIcon: MdDescription },
        { name: 'Archive', icon: FiArchive, activeIcon: MdArchive },
        { name: 'Trash', icon: FiTrash2, activeIcon: MdDelete },
        { name: 'Setting', icon: FiSettings, activeIcon: MdSettings },
        { name: 'Help & feedback', icon: FiHelpCircle, activeIcon: MdHelp }
    ];

    return (
        <aside className={`
            w-[280px] 
            ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient md:bg-none'} 
            md:bg-white/10 backdrop-blur-none md:backdrop-blur-2xl flex flex-col px-5 py-8 shrink-0 text-white font-sans 
            fixed inset-y-0 left-0 z-50 transition-transform duration-300 shadow-2xl md:shadow-none
            md:relative md:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Search Bar */}
            <div className="hidden md:flex items-center pb-2.5 border-b border-white/30 mb-8">
                <input
                    type="text"
                    onChange={(e) => onSearch(e.target.value)}
                    className="bg-transparent border-none text-white ml-2.5 w-full outline-none font-medium text-[1.6rem] placeholder-white/70"
                    placeholder="Search"
                />
                <FiSearch size={22} className="cursor-pointer text-white" />
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
                <div
                    className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    {isFilterOpen ? (
                        <MdFilterList size={22} className="text-white mr-3" />
                    ) : (
                        <FiFilter size={22} className="text-white mr-3" />
                    )}
                </div>

                {/* Filter Dropdown Card */}
                {isFilterOpen && (
                    <div className={`absolute top-full left-0 mt-4 w-96 border border-white/20 rounded-xl shadow-2xl p-6 z-50 animate-fade-in origin-top-left flex flex-col gap-6 ${settings?.theme === 'dark' ? 'bg-[#1e1e2f]' : 'bg-red-gradient'}`}>
                        <h3 className="text-white text-2xl font-bold border-b border-white/20 pb-3">Filter</h3>
                        <div className="flex flex-col gap-3">
                            <label className="text-white/80 text-lg font-medium">Status</label>
                            <div className="relative">
                                <div
                                    className="bg-white/20 border border-white/30 rounded-xl p-3 text-white text-lg cursor-pointer flex justify-between items-center hover:bg-white/30 transition-colors"
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                >
                                    <span>{currentFilter || 'All'}</span>
                                    <FiChevronDown className={`transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                                </div>
                                {isStatusOpen && (
                                    <div className={`absolute top-full left-0 w-full mt-2 border border-white/20 rounded-xl overflow-hidden z-20 shadow-xl animate-fade-in-down ${settings?.theme === 'dark' ? 'bg-[#2a2a40]' : 'bg-[#89216b]'}`}>
                                        {['All', 'InProgress', 'Completed'].map((status) => (
                                            <div
                                                key={status}
                                                className={`p-3 text-white text-lg cursor-pointer hover:bg-white/20 transition-colors ${currentFilter === status ? 'bg-white/10 font-bold' : ''}`}
                                                onClick={() => {
                                                    onFilter({ status });
                                                    setIsStatusOpen(false);
                                                }}
                                            >
                                                {status}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-white/80 text-lg font-medium">From</label>
                            <DatePicker
                                selected={filterDate?.start}
                                onChange={(date) => onDateFilter({ ...filterDate, start: date })}
                                selectsStart
                                startDate={filterDate?.start}
                                endDate={filterDate?.end}
                                customInput={
                                    <CustomDateInput
                                        isOpen={isCalendarOpen}
                                        label="Select Start Date"
                                        onClear={(e) => {
                                            e.stopPropagation();
                                            onDateFilter({ ...filterDate, start: null });
                                        }}
                                    />
                                }
                                onCalendarOpen={() => setIsCalendarOpen(true)}
                                onCalendarClose={() => setIsCalendarOpen(false)}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="scroll"
                                placeholderText="Start Date"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-white/80 text-lg font-medium">To</label>
                            <DatePicker
                                selected={filterDate?.end}
                                onChange={(date) => onDateFilter({ ...filterDate, end: date })}
                                selectsEnd
                                startDate={filterDate?.start}
                                endDate={filterDate?.end}
                                minDate={filterDate?.start}
                                customInput={
                                    <CustomDateInput
                                        isOpen={isCalendarOpen}
                                        label="Select End Date"
                                        onClear={(e) => {
                                            e.stopPropagation();
                                            onDateFilter({ ...filterDate, end: null });
                                        }}
                                    />
                                }
                                onCalendarOpen={() => setIsCalendarOpen(true)}
                                onCalendarClose={() => setIsCalendarOpen(false)}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="scroll"
                                placeholderText="End Date"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-white/30 my-6 w-full"></div>

            {/* Labels Section */}
            <div className="text-[1.2rem] uppercase tracking-widest text-white mb-5 font-bold">LABELS</div>

            {/* Dynamic Labels List */}
            <div className="flex flex-col gap-4 mb-4">
                {labels && labels.map((labelObj, index) => {
                    // Handle both object and string labels for backward compatibility during transition
                    const labelName = labelObj.name || labelObj;
                    const labelId = labelObj._id || index; // Fallback index if no ID (shouldn't happen with API)

                    const isActive = activeView === 'label' && selectedLabel === labelName;
                    return (
                        <div
                            key={labelId}
                            className={`group flex items-center justify-between cursor-pointer transition-all duration-200 hover:translate-x-1 hover:opacity-100 ${isActive ? 'opacity-100 font-bold ml-2' : 'opacity-70'}`}
                            onClick={() => { setSelectedLabel && setSelectedLabel(labelName); setActiveView('label'); }}
                        >
                            <div className="flex items-center flex-1 min-w-0">
                                {isActive ? (
                                    <MdLabel size={18} className="mr-3 text-white" />
                                ) : (
                                    <MdOutlineLabel size={18} className="mr-3 text-white/80" />
                                )}

                                {editingLabelId === labelId ? (
                                    <input
                                        type="text"
                                        value={editLabelName}
                                        onChange={(e) => setEditLabelName(e.target.value)}
                                        onBlur={() => handleUpdateLabel(labelId, labelName)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel(labelId, labelName)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-transparent border-b border-white/50 text-white text-[1.6rem] outline-none w-full"
                                    />
                                ) : (
                                    <span className="text-[1.6rem] font-medium truncate">{labelName}</span>
                                )}
                            </div>

                            {/* Hover Actions */}
                            {(!editingLabelId || editingLabelId !== labelId) && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <button
                                        onClick={(e) => startEditing(labelId, labelName, e)}
                                        className="text-white/60 hover:text-white"
                                        title="Rename"
                                    >
                                        <FiEdit3 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteLabel(labelId, labelName, e)}
                                        className="text-white/60 hover:text-red-400"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create New Label */}
            {showLabelInput ? (
                <div className="flex items-center mt-2 mb-4">
                    <MdOutlineLabel size={18} className="mr-3 text-white/80" />
                    <input
                        type="text"
                        autoFocus
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateLabel();
                            }
                        }}
                        onBlur={() => {
                            if (!newLabelName.trim()) {
                                setShowLabelInput(false);
                            }
                        }}
                        className="bg-transparent border-b border-white/50 text-white text-[1.6rem] outline-none w-full"
                        placeholder="Label name"
                    />
                </div>
            ) : (
                <div
                    onClick={() => setShowLabelInput(true)}
                    className="flex items-center mt-2 cursor-pointer font-semibold hover:opacity-100 text-[1.4rem]"
                >
                    <FiPlus size={24} className="mr-3" />
                    <span>Create new label</span>
                </div>
            )}

            <div className="h-px bg-white/20 my-8 w-full"></div>

            {/* Menu Navigation */}
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = activeView === item.name.toLowerCase();
                    const Icon = isActive ? item.activeIcon : item.icon;
                    return (
                        <div
                            key={item.name}
                            onClick={() => {
                                setActiveView(item.name.toLowerCase());
                            }}
                            className={`flex items-center py-3 cursor-pointer transition-all duration-200 font-medium text-[1.6rem] hover:translate-x-1 hover:opacity-100 ${isActive ? 'opacity-100 font-bold ml-2' : 'opacity-70'}`}
                        >
                            <Icon size={22} className={`mr-3 ${isActive ? 'text-white' : 'text-white/80'}`} />
                            <span>{item.name}</span>
                        </div>
                    );
                })}
            </nav>
            {/* Vertical Divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[90%] w-px bg-white/20"></div>
        </aside>
    );
};

export default SideBar;
