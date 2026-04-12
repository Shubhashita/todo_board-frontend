import React, { useState } from 'react';
import { FaUser, FaAt, FaLock } from 'react-icons/fa';
import axios from 'axios';

const Signup = ({ onToggle }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [slowWarning, setSlowWarning] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setSlowWarning(false);

        // Show "waking up server" message if it takes more than 5 seconds
        const slowTimer = setTimeout(() => setSlowWarning(true), 5000);

        try {
            const response = await axios.post(`${API_BASE_URL}/user/onboard`, {
                name,
                email,
                password
            });

            clearTimeout(slowTimer);

            if (response.data.success) {
                alert("Account created successfully! Please login.");
                onToggle();
            }
        } catch (err) {
            clearTimeout(slowTimer);
            setError(err.response?.data?.message || err.message || 'Signup failed');
        } finally {
            setLoading(false);
            setSlowWarning(false);
        }
    };

    return (
        <div className="form-container sign-up absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white rounded-lg shadow-lg">
            <form onSubmit={handleSignup} className="w-full max-w-[26rem] px-4">
                <h2 className="text-[3rem] text-center capitalize text-titleColor mb-8">sign up</h2>

                {error && <p className="text-red-500 text-center text-lg mb-4">{error}</p>}

                {slowWarning && !error && (
                    <p className="text-amber-500 text-center text-[1.3rem] mb-4 animate-pulse">
                        ⏳ Server is waking up, please wait...
                    </p>
                )}

                <div className="input-group relative my-8 w-full">
                    <input
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor disabled:opacity-50"
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaUser />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">username</label>
                </div>

                <div className="input-group relative my-8 w-full">
                    <input
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor disabled:opacity-50"
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaAt />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">email</label>
                </div>

                <div className="input-group relative my-8 w-full">
                    <input
                        type="password"
                        required
                        minLength={8}
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor disabled:opacity-50"
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaLock />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">password</label>
                </div>

                <div className="input-group relative my-8 w-full">
                    <input
                        type="password"
                        required
                        minLength={8}
                        disabled={loading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor disabled:opacity-50"
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaLock />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">confirm password</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn w-full h-[4rem] bg-red-gradient text-white capitalize text-[1.6rem] font-medium rounded-lg cursor-pointer shadow-md border-none outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>creating account...</span>
                        </>
                    ) : 'sign up'}
                </button>

                <div className="link text-center text-[1.4rem] text-labelColor mt-10">
                    <p>You already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onToggle(); }} className="signin-link capitalize text-mainColor font-semibold decoration-0 transition-all duration-500 hover:text-[#da4453]"> sign in</a></p>
                </div>
            </form>
        </div>
    );
};

export default Signup;
