import React, { createContext, useContext, useState, useEffect } from "react";

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'counsellor';
    settings?: Record<string, any>;
};

export type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    updateUser: (fields: Partial<User>) => void;
    logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const DUMMY_USERS = [
    {
        id: "1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin" as const,
    },
    {
        id: "2",
        name: "Counsellor",
        email: "counsellor@example.com",
        role: "counsellor" as const,
    },
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("user-token");
        const role = sessionStorage.getItem("user-role");
        if (token && role) {
            const found = DUMMY_USERS.find(u => u.role === role);
            if (found) setUserState(found);
        }
        setLoading(false);
    }, []);

    const setUser = (user: User | null) => {
        setUserState(user);
        if (user) {
            sessionStorage.setItem("user-token", user.id);
            sessionStorage.setItem("user-role", user.role);
        } else {
            sessionStorage.removeItem("user-token");
            sessionStorage.removeItem("user-role");
        }
    };

    const updateUser = (fields: Partial<User>) => {
        setUserState((prev) => (prev ? { ...prev, ...fields } : prev));
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, logout }}>
            {loading ? null : children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUserContext must be used within a UserProvider");
    return ctx;
}; 