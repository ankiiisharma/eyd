import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import logo from "../../public/Emotionally Yours Logo.png"
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirm) {
            setError("All fields are required");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setSuccess(true);
        setError("");
        setTimeout(() => navigate("/login"), 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border-t-4 border-[#FF7119]">
                <div className="mb-6 text-center">
                    <div className="mb-6 text-center">
                        <div className="mx-auto h-[70px] w-[220px] md:w-[210px] lg:w-[250px]">
                            <img
                                src={logo}
                                alt="Emotionally Yours Logo"
                                className="h-full w-full object-contain cursor-pointer"
                            />
                        </div>
                        <p className="text-[#012765] mt-2">Create your account</p>
                    </div>

                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#012765]">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF7119] focus:ring-[#FF7119] text-[#012765]"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-[#012765]">Password</label>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF7119] focus:ring-[#FF7119] text-[#012765] pr-10"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                        />
                        <button type="button" tabIndex={-1} className="absolute right-3 top-9 text-gray-400" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <div className="relative">
                        <label htmlFor="confirm" className="block text-sm font-medium text-[#012765]">Confirm Password</label>
                        <input
                            id="confirm"
                            type={showConfirm ? "text" : "password"}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF7119] focus:ring-[#FF7119] text-[#012765] pr-10"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                        <button type="button" tabIndex={-1} className="absolute right-3 top-9 text-gray-400" onClick={() => setShowConfirm(v => !v)}>
                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    {success &&
                        <div className="text-green-600 text-sm text-center">Registration successful! Redirecting to
                            login...</div>}
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-[#FF7119] text-white font-semibold rounded hover:bg-[#012765] transition-colors"
                    >
                        Register
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account? <a href="/login" className="text-[#FF7119] hover:underline">Login</a>
                </div>
            </div>
        </div>
    );
} 