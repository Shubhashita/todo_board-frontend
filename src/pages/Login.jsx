import config from '../config';
import React from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onToggle }) => {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${config.API_BASE_URL}/user/login`, {
                email,
                password
            });
            if (response.data.success) {
                const token = response.data.data.token;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    name: response.data.data.name,
                    email: response.data.data.email,
                    id: response.data.data.id
                }));
                navigate('/home');
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            console.error(err);
        }
    };

    return (
        <div className="form-container sign-in absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white rounded-lg shadow-lg">
            <form onSubmit={handleLogin} className="w-full max-w-[26rem] px-4">
                <h2 className="text-[3rem] text-center capitalize text-titleColor mb-8">login</h2>

                {error && <p className="text-red-500 text-center text-lg mb-4">{error}</p>}

                <div className="input-group relative my-8 w-full">
                    <input
                        type="email"
                        required
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaUser />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">email</label>
                </div>

                <div className="input-group relative my-8 w-full">
                    <input
                        type="password"
                        required
                        className="w-full h-[3.5rem] px-4 rounded-lg border border-labelColor text-[1.6rem] text-labelColor bg-transparent outline-none focus:border-labelColor"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <i className="absolute top-1/2 -translate-y-1/2 left-2 text-[1.6rem] text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">
                        <FaLock />
                    </i>
                    <label className="absolute top-1/2 -translate-y-1/2 left-10 text-[1.6rem] capitalize text-labelColor pointer-events-none transition-all duration-500 bg-white px-2">password</label>
                </div>

                <div className="forgot-pass -mt-6 mb-6">
                    <a href="#" className="text-labelColor decoration-0 text-[1.4rem] capitalize transition-all duration-500 hover:text-mainColor">forgot password?</a>
                </div>

                <button type="submit" className="btn w-full h-[4rem] bg-red-gradient text-white capitalize text-[1.6rem] font-medium rounded-lg cursor-pointer shadow-md border-none outline-none">login</button>

                <div className="link text-center text-[1.4rem] text-labelColor mt-10">
                    <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onToggle(); }} className="signup-link capitalize text-mainColor font-semibold decoration-0 transition-all duration-500 hover:text-[#da4453]"> sign up</a></p>
                </div>
            </form>
        </div>
    );
};

export default Login;
