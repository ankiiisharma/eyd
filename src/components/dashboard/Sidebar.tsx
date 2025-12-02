import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    User,
    FileText,
    Inbox,
    Users,
    BookOpen,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CalendarClock,
    PlusCircle,
    FileText as ArticleIcon,
    PlayCircle as VideoIcon,
    StickyNote,
    Dot,
} from "lucide-react";

import logo from "../../../public/Emotionally Yours Logo.png";
import logo1 from "../../../public/logo.jpg";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "@/UserContext";

// ---------------------- CONFIG ----------------------
interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    route?: string;
    children?: MenuItem[];
}

const menusConfig: Record<string, MenuItem[]> = {
    admin: [
        { id: "dashboard", label: "Dashboard", icon: BarChart3, route: "/dashboard" },
        { id: "beneficieries", label: "Beneficiaries", icon: User, route: "/Beneficieries" },
        { id: "assessments", label: "Assessments", icon: FileText, route: "/assessments" },
        { id: "inquiries", label: "Inquiries", icon: Inbox, route: "/inquiries" },
        { id: "users", label: "Users", icon: Users, route: "/users" },
        {
            id: "resources",
            label: "Resources",
            icon: BookOpen,
            children: [
                { id: "articles", label: "Articles", icon: ArticleIcon, route: "/resources" },
                { id: "videos", label: "Videos", icon: VideoIcon, route: "/videos" },
            ],
        },
        { id: "reflection-cards", label: "Reflection Cards", icon: StickyNote, route: "/reflection-cards" },
        { id: "settings", label: "Settings", icon: Settings, route: "/settings" },
    ],
    counsellor: [
        { id: "slot", label: "Slot", icon: PlusCircle, route: "/slot" },
        { id: "appointments", label: "Appointments", icon: CalendarClock, route: "/appointments" },
    ],
};

// ---------------------- COMPONENT ----------------------
interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    isMobile?: boolean;
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    collapsed,
    setCollapsed,
    isMobile = false,
    mobileOpen = false,
    setMobileOpen,
}) => {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const role = user?.role === "counsellor" ? "counsellor" : "admin";
    const dashboardLabel = role === "counsellor" ? "Counsellor Dashboard" : "Admin Dashboard";
    const menuItems = menusConfig[role];

    const toggleMenu = (id: string) => {
        setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile && setMobileOpen) setMobileOpen(false);
    };

    // Check if any child route is active
    const isParentActive = (item: MenuItem) => {
        if (!item.children) return false;
        return item.children.some(child => location.pathname === child.route);
    };

    // ---------------------- MOBILE ----------------------
    if (isMobile) {
        return (
            <>
                {/* Overlay */}
                <div
                    className={cn(
                        "fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300",
                        mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                />
                {/* Drawer */}
                <div
                    className={cn(
                        "fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-transform duration-300 w-64",
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 relative">
                        <Link to="/dashboard">
                            <img src={logo} alt="Full Logo" className="h-14 w-56 object-contain" />
                        </Link>
                        <button
                            onClick={() => setMobileOpen && setMobileOpen(false)}
                            className="ml-2 bg-white border border-gray-300 shadow-md p-1.5 rounded-md hover:bg-gray-100 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Menu */}
                    <nav className="mt-4 px-2">
                        {menuItems.map((item) =>
                            item.children ? (
                                <div key={item.id} className="mb-1">
                                    <button
                                        onClick={() => toggleMenu(item.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-left transition-all duration-300 rounded-lg group",
                                            isParentActive(item) || location.pathname.startsWith("/resources")
                                                ? "bg-gradient-to-r from-orange-50 to-orange-100 text-[#FF7119] shadow-sm border border-orange-200"
                                                : "text-slate-700 hover:text-[#FF7119] hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <div className={cn(
                                                "p-1.5 rounded-md transition-all duration-300",
                                                isParentActive(item) ? "bg-orange-200 text-[#FF7119]" : "group-hover:bg-orange-200"
                                            )}>
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-sm ml-3">{item.label}</span>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-all duration-300 text-slate-400",
                                                openMenus[item.id] && "rotate-180 text-[#FF7119]"
                                            )}
                                        />
                                    </button>
                                    
                                    {/* Animated submenu */}
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openMenus[item.id] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-orange-100 pl-4">
                                            {item.children.map((child, index) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => handleNavigation(child.route!)}
                                                    className={cn(
                                                        "w-full flex items-center px-3 py-2 rounded-lg transition-all duration-300 group text-left",
                                                        "transform hover:translate-x-1",
                                                        location.pathname === child.route
                                                            ? "bg-gradient-to-r from-[#FF7119] to-orange-500 text-white shadow-md"
                                                            : "text-slate-600 hover:text-[#FF7119] hover:bg-orange-50 hover:shadow-sm"
                                                    )}
                                                    style={{
                                                        animationDelay: `${index * 50}ms`
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-300",
                                                        location.pathname === child.route 
                                                            ? "bg-white/20" 
                                                            : "group-hover:bg-orange-100"
                                                    )}>
                                                        <child.icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-sm font-medium ml-3">{child.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={item.id} className="mb-1">
                                    <NavLink
                                        to={item.route!}
                                        className={({ isActive }) =>
                                            cn(
                                                "w-full flex items-center px-3 py-2 text-left transition-all duration-300 rounded-lg group",
                                                isActive
                                                    ? "bg-gradient-to-r from-orange-50 to-orange-100 text-[#FF7119] shadow-sm border border-orange-200"
                                                    : "text-slate-700 hover:text-[#FF7119] hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm"
                                            )
                                        }
                                        onClick={() => setMobileOpen && setMobileOpen(false)}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-md transition-all duration-300",
                                            "group-hover:bg-orange-200"
                                        )}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-sm ml-3">{item.label}</span>
                                    </NavLink>
                                </div>
                            )
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 rounded-xl border border-orange-200 shadow-sm">
                        <div className="text-sm text-slate-700">
                            <p className="font-semibold text-sm text-[#FF7119]">{dashboardLabel}</p>
                            <p className="text-xs text-slate-500 mt-1">Wellness Management System</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ---------------------- DESKTOP ----------------------
    return (
        <div
            className={cn(
                "fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-all duration-300 border-r border-gray-100",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 relative">
                <Link to="/dashboard">
                    {collapsed ? (
                        <img src={logo1} alt="Logo small" className="h-10 w-10 rounded-full mx-auto" />
                    ) : (
                        <img src={logo} alt="Full Logo" className="h-14 w-56 object-contain" />
                    )}
                </Link>
                <div className="absolute top-6 -right-4 z-50">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="bg-white border border-gray-300 shadow-md p-1.5 rounded-md hover:bg-gray-100 transition-all hover:shadow-lg"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Menu */}
            <nav className={cn("mt-4", collapsed ? "px-2" : "px-3")}>
                {menuItems.map((item) =>
                    item.children ? (
                        <div key={item.id} className="mb-1 relative group">
                            <button
                                onClick={() => toggleMenu(item.id)}
                                className={cn(
                                    "w-full flex items-center justify-between text-left transition-all duration-300 rounded-lg group/button",
                                    collapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
                                    isParentActive(item) || location.pathname.startsWith("/resources")
                                        ? "bg-gradient-to-r from-orange-50 to-orange-100 text-[#FF7119] shadow-sm border border-orange-200"
                                        : "text-slate-700 hover:text-[#FF7119] hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-center">
                                    <div className={cn(
                                        "p-1.5 rounded-md transition-all duration-300",
                                        isParentActive(item) ? "bg-orange-200 text-[#FF7119]" : "group-hover/button:bg-orange-200"
                                    )}>
                                        <item.icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
                                    </div>
                                    {!collapsed && <span className="font-medium text-sm ml-3">{item.label}</span>}
                                </div>
                                {!collapsed && (
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 transition-all duration-300 text-slate-400",
                                            openMenus[item.id] && "rotate-180 text-[#FF7119]"
                                        )}
                                    />
                                )}
                            </button>

                            {/* Expanded Submenu */}
                            {openMenus[item.id] && (
                                <>
                                    {/* Expanded sidebar submenu */}
                                    {!collapsed && (
                                        <div className={cn(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            openMenus[item.id] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-orange-100 pl-4">
                                                {item.children.map((child, index) => (
                                                    <NavLink
                                                        key={child.id}
                                                        to={child.route!}
                                                        className={({ isActive }) =>
                                                            cn(
                                                                "w-full flex items-center px-3 py-2 rounded-lg transition-all duration-300 group text-left",
                                                                "transform hover:translate-x-1",
                                                                isActive
                                                                    ? "bg-gradient-to-r from-[#FF7119] to-orange-500 text-white shadow-md"
                                                                    : "text-slate-600 hover:text-[#FF7119] hover:bg-orange-50 hover:shadow-sm"
                                                            )
                                                        }
                                                        style={{
                                                            animationDelay: `${index * 50}ms`
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-300",
                                                            location.pathname === child.route 
                                                                ? "bg-white/20" 
                                                                : "group-hover:bg-orange-100"
                                                        )}>
                                                            <child.icon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-sm font-medium ml-3">{child.label}</span>
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Flyout submenu (collapsed mode) */}
                                    {collapsed && (
                                        <div className="absolute left-full top-0 ml-3 bg-white shadow-2xl rounded-xl border border-gray-200 py-3 z-50 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                            <div className="px-3 pb-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-[#FF7119] flex items-center">
                                                    <item.icon className="h-4 w-4 mr-2" />
                                                    {item.label}
                                                </p>
                                            </div>
                                            <div className="mt-2 space-y-0.5">
                                                {item.children.map((child, index) => (
                                                    <NavLink
                                                        key={child.id}
                                                        to={child.route!}
                                                        className={({ isActive }) =>
                                                            cn(
                                                                "flex items-center px-4 py-2 text-sm transition-all duration-300 mx-2 rounded-lg",
                                                                "transform hover:translate-x-1",
                                                                isActive
                                                                    ? "bg-gradient-to-r from-[#FF7119] to-orange-500 text-white shadow-md"
                                                                    : "text-slate-600 hover:text-[#FF7119] hover:bg-orange-50"
                                                            )
                                                        }
                                                        style={{
                                                            animationDelay: `${index * 50}ms`
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-300 mr-3",
                                                            location.pathname === child.route 
                                                                ? "bg-white/20" 
                                                                : "group-hover:bg-orange-100"
                                                        )}>
                                                            <child.icon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">{child.label}</span>
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div key={item.id} className="mb-1">
                            <NavLink
                                to={item.route!}
                                className={({ isActive }) =>
                                    cn(
                                        "w-full flex items-center text-left transition-all duration-300 rounded-lg group",
                                        collapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
                                        isActive
                                            ? "bg-gradient-to-r from-orange-50 to-orange-100 text-[#FF7119] shadow-sm border border-orange-200"
                                            : "text-slate-700 hover:text-[#FF7119] hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm"
                                    )
                                }
                                end={item.route === "/dashboard"}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-all duration-300",
                                    "group-hover:bg-orange-200"
                                )}>
                                    <item.icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
                                </div>
                                {!collapsed && <span className="font-medium text-sm ml-3">{item.label}</span>}
                            </NavLink>
                        </div>
                    )
                )}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 rounded-xl border border-orange-200 shadow-sm">
                    <div className="text-sm text-slate-700">
                        <p className="font-semibold text-sm text-[#FF7119]">{dashboardLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">Wellness Management System</p>
                    </div>
                </div>
            )}
        </div>
    );
};
