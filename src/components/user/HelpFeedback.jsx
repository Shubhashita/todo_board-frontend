
import React from 'react';
import { FiUser, FiMenu } from 'react-icons/fi';

const HelpFeedback = ({ toggleSidebar }) => {
    return (
        <main className="flex-1 flex flex-col h-full relative bg-white/10 backdrop-blur-2xl text-white font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] overflow-hidden">
            <div className="pt-6 px-6 md:pt-10 md:px-10 flex-shrink-0">
                <div className="flex items-center justify-between w-full md:w-[94%] mx-auto mb-5">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden text-white/90 p-2 hover:bg-white/10 rounded-full">
                            <FiMenu size={24} />
                        </button>
                        <h1 className="text-[2rem] md:text-[3rem] font-extrabold tracking-widest uppercase text-white/90 truncate">HELP & FEEDBACK</h1>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-white/30 transition-colors shrink-0">
                        <FiUser size={40} />
                    </div>
                </div>
                <div className="h-px bg-white/20 w-[94%] mx-auto mb-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-10 [&::-webkit-scrollbar]:hidden">
                <div className="w-[94%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Frequently Asked Questions</h2>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-white/90">How do I create a new note?</h3>
                                <p className="text-lg text-white/70">Click the floating + button in the bottom right corner of the Notes page.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-white/90">How do I archive a note?</h3>
                                <p className="text-lg text-white/70">Click the three dots on a note card and select "Archive". You can find archived notes in the Archive tab.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-white/90">Can I recover deleted notes?</h3>
                                <p className="text-lg text-white/70">Yes! Deleted notes go to the Trash tab. You can restore them from there or delete them forever.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Send Feedback</h2>
                        <form className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-colors"
                            />
                            <input
                                type="email"
                                placeholder="Your Email"
                                className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-colors"
                            />
                            <textarea
                                placeholder="Describe your issue or suggestion..."
                                rows="3"
                                className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-colors resize-none h-40"
                            ></textarea>
                            <button className="bg-white text-[#89216b] font-bold py-3 px-8 rounded-xl hover:bg-white/90 transition-colors shadow-lg w-auto self-start">
                                Submit Feedback
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HelpFeedback;
