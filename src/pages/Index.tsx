import {useState} from "react";
import {Sidebar} from "@/components/dashboard/Sidebar";
import {DashboardHeader} from "@/components/dashboard/DashboardHeader";
import {DashboardOverview} from "@/components/dashboard/DashboardOverview";
import {Beneficiaries} from "@/components/dashboard/Beneficiaries.tsx";
import {AssessmentData} from "@/components/dashboard/AssessmentData";
import {InquiriesManagement} from "@/components/dashboard/InquiriesManagement";
import {FeedbackTracking} from "@/components/dashboard/FeedbackTracking";
import {ResourceManager} from "@/components/dashboard/ResourceManager";
import {NotificationsCenter} from "@/components/dashboard/NotificationsCenter";
import {SettingsPage} from "@/components/dashboard/SettingsPage";

const Index = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardOverview/>;
            case "Beneficieries":
                return <Beneficiaries/>;
            case "assessments":
                return <AssessmentData/>;
            case "inquiries":
                return <InquiriesManagement/>;
            case "feedback":
                return <FeedbackTracking/>;
            case "resources":
                return <ResourceManager/>;
            case "notifications":
                return <NotificationsCenter/>;
            case "settings":
                return <SettingsPage/>;
            default:
                return <DashboardOverview/>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="flex">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    setCollapsed={setSidebarCollapsed}
                />
                <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                    <DashboardHeader
                        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                        sidebarCollapsed={sidebarCollapsed}
                    />
                    <main className="p-6">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Index;
