import {Sidebar} from "@/components/dashboard/Sidebar";
import {DashboardHeader} from "@/components/dashboard/DashboardHeader";
import {Outlet} from "react-router-dom";
import {useState} from "react";
import {useIsMobile} from "@/hooks/use-mobile";

export default function DashboardLayout({children}: { children?: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    return (
        <div className="min-h-screen ">
            <div className="flex">
                {/* Sidebar as drawer on mobile, fixed on desktop */}
                <Sidebar
                    collapsed={sidebarCollapsed}
                    setCollapsed={setSidebarCollapsed}
                    isMobile={isMobile}
                    mobileOpen={mobileSidebarOpen}
                    setMobileOpen={setMobileSidebarOpen}
                />
                <div
                    className={`flex-1 transition-all duration-300 ${
                        !isMobile ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''
                    }`}
                >
                    <DashboardHeader
                        toggleSidebar={() => {
                            if (isMobile) {
                                setMobileSidebarOpen(true);
                            } else {
                                setSidebarCollapsed(!sidebarCollapsed);
                            }
                        }}
                        sidebarCollapsed={sidebarCollapsed}
                    />
                    <main className="p-6">
                        {children ? children : <Outlet/>}
                    </main>
                </div>
            </div>
        </div>
    );
} 