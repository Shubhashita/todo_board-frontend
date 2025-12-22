import React, { useState } from 'react';
import Signup from './Signup';
import Login from './Login';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <div className="flex justify-center gap-60 items-center min-h-screen bg-red-gradient overflow-hidden font-sans">
            <div className="text-white flex flex-col justify-center items-start z-10 opacity-90">
                <h1 className="text-[12rem] font-bold font-['Playfair_Display'] leading-none text-[#fff]">SLATE</h1>
                <p className="text-[2.5rem] mt-2 font-light tracking-wide italic text-gray-200">Clear task, Clear mind</p>
            </div>
            <div className={`wrapper relative w-[30rem] h-[45rem] sm:w-[35rem] ${isSignUp ? 'animated-signin' : 'animated-signup'}`}>
                <Login onToggle={toggleForm} />
                <Signup onToggle={toggleForm} />
            </div>
        </div>
    );
};

export default Auth;
