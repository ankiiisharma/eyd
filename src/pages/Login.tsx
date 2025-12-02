import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "@/UserContext";
import logo from "../../public/Emotionally Yours Logo.png";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const { setUser } = useUserContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (sessionStorage.getItem("user-token")) {
            const role = sessionStorage.getItem("user-role");
            if (role === "admin") navigate("/dashboard", { replace: true });
            else if (role === "counsellor") navigate("/slot", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("https://interactapiverse.com/mahadevasth/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: email, // API expects `username`
                    password: password, // API expects `password`
                }),
            });

            const data = await res.json();

            if (res.ok && data.status === 200) {
                // Set context user
                setUser({
                    id: data.user.user_id,
                    name: data.user.full_name,
                    email: data.user.username,
                    role: data.user.role,
                });

                // Store in sessionStorage
                sessionStorage.setItem("user-token", data.user.user_id);
                sessionStorage.setItem("user-role", data.user.role);

                // Redirect based on role
                if (data.user.role === "admin") navigate("/dashboard");
                else if (data.user.role === "counsellor") navigate("/slot");
                else navigate("/");
            } else {
                setError(data.message || "Invalid username or password");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border-t-4 border-[#FF7119]">
                <div className="mb-6 text-center">
                    <div className="mx-auto h-[70px] w-[220px] md:w-[210px] lg:w-[250px]">
                        <img
                            src={logo}
                            alt="Emotionally Yours Logo"
                            className="h-full w-full object-contain cursor-pointer"
                        />
                    </div>
                    <p className="text-[#012765] mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#012765]">Username</label>
                        <input
                            id="email"
                            type="text"
                            autoComplete="username"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF7119] focus:ring-[#FF7119] text-[#012765]"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#012765]">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF7119] focus:ring-[#FF7119] text-[#012765]"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={togglePasswordVisibility}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-[#012765]" />
                                ) : (
                                    <Eye className="h-5 w-5 text-[#012765]" />
                                )}
                            </button>
                        </div>
                    </div>
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-[#FF7119] text-white font-semibold rounded hover:bg-[#012765] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="text-[#FF7119] hover:underline">Register</a>
                </div>
            </div>
        </div>
    );
}
