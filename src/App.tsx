import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import React from "react";
import {UserProvider, useUserContext} from "@/UserContext";
import {Toaster} from "@/components/ui/toaster";

// Layouts
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Dashboard Pages
import {DashboardOverview} from "@/components/dashboard/DashboardOverview";
import {Beneficiaries} from "@/components/dashboard/Beneficiaries";
import {AssessmentData} from "@/components/dashboard/AssessmentData";
import {InquiriesManagement} from "@/components/dashboard/InquiriesManagement";
import {FeedbackTracking} from "@/components/dashboard/FeedbackTracking";
import {ResourceManager} from "@/components/dashboard/ResourceManager";
import {VideoManager} from "@/components/dashboard/VideoManager";
import {NotificationsCenter} from "@/components/dashboard/NotificationsCenter";
import {SettingsPage} from "@/components/dashboard/SettingsPage";
import Users from "@/components/dashboard/Users";

// Regular Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import AssessmentForm from "@/pages/assessment/AssessmentForm";
import InquiryNotes from "@/pages/InquiryNotes";
import AppointmentNotes from "@/pages/AppointmentNotes";
import UserNotes from "@/pages/UserNotes";
import SlotPage from "@/pages/SlotPage";
import NewUserPage from "@/pages/NewUserPage";
import AppointmentPage from "@/pages/AppointmentPage.tsx";
import ResourceFormPage from "@/pages/ResourceFormPage";
import RescheduleCall from "@/pages/RescheduleCall";
import Recommendations from "@/pages/Recommendations";
import {ReflectionCards} from "@/components/dashboard/ReflectionCardsComponent.tsx";
import {ReflectionCardDetails} from "@/components/dashboard/ReflectionCardDetails.tsx";

// Role constants
const ROLE = {
    ADMIN: "admin",
    COUNSELLOR: "counsellor"
};

// Auth Components
function PrivateRoute({children}: { children: React.ReactNode }) {
    const {user} = useUserContext();
    return user ? <>{children}</> : <Navigate to="/login" replace/>;
}

function RoleProtectedRoute({
                                children,
                                allowedRoles
                            }: {
    children: React.ReactNode,
    allowedRoles: string[]
}) {
    const {user} = useUserContext();

    if (!user) return <Navigate to="/login" replace/>;

    if (!allowedRoles.includes(user.role)) {
        if (user.role === ROLE.COUNSELLOR) return <Navigate to="/slot" replace/>;
        return <Navigate to="/notfound" replace/>;
    }

    return <>{children}</>;
}

function RoleBasedDefaultRedirect() {
    const {user} = useUserContext();

    if (!user) return <Navigate to="/login" replace/>;

    switch (user.role) {
        case ROLE.ADMIN:
            return <Navigate to="/dashboard" replace/>;
        case ROLE.COUNSELLOR:
            return <Navigate to="/slot" replace/>;
        default:
            return <Navigate to="/login" replace/>;
    }
}

// Route configuration
const adminRoutes = [
    {path: "/dashboard", element: <DashboardOverview/>},
    {path: "/beneficieries", element: <Beneficiaries/>},
    {path: "/users", element: <Users/>},
    {path: "/reflection-cards", element: <ReflectionCards/>},
    {path:"/reflection-cards/:id", element: <ReflectionCardDetails />},
    {path: "/new-user", element: <NewUserPage/>},
    {path: "/edit-user", element: <NewUserPage/>},
    {path: "/assessments", element: <AssessmentData/>},
    {path: "/assessments/new", element: <AssessmentForm view={false}/>},
    {path: "/assessments/edit/:id", element: <AssessmentForm view={false}/>},
    {path: "/assessments/view/:id", element: <AssessmentForm view={true}/>},
    {path: "/inquiries", element: <InquiriesManagement/>},
    {path: "/inquiries/:id/notes", element: <InquiryNotes/>},
    {path: "/feedback", element: <FeedbackTracking/>},
    {path: "/resources", element: <ResourceManager/>},
    {path: "/videos", element: <VideoManager/>},
    {path: "/videos/new", element: <ResourceFormPage/>},
    {path: "/videos/edit/:id", element: <ResourceFormPage/>},
    {path: "/resources/new", element: <ResourceFormPage/>},
    {path: "/resources/edit/:id", element: <ResourceFormPage/>},
    {path: "/notifications", element: <NotificationsCenter/>},
    {path: "/settings", element: <SettingsPage/>},
];

const counsellorRoutes = [
    {path: "/slot", element: <SlotPage/>},
];
const allRole = [
    {path: "/appointments", element: <AppointmentPage/>},
    {path: "/appointments/:id/notes", element: <AppointmentNotes/>},
    {path: "/reschedule-call/:user_id", element: <RescheduleCall/>},
    {path: "/appointments/:user_id/recommendations", element: <Recommendations/>},
]

const App = () => (
    <UserProvider>
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>

                {/* Private dashboard routes */}
                <Route
                    element={
                        <PrivateRoute>
                            <DashboardLayout/>
                        </PrivateRoute>
                    }
                >
                    <Route path="/" element={<RoleBasedDefaultRedirect/>}/>

                    {/* Admin routes */}
                    {adminRoutes.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <RoleProtectedRoute allowedRoles={[ROLE.ADMIN]}>
                                    {route.element}
                                </RoleProtectedRoute>
                            }
                        />
                    ))}

                    {/* Counsellor routes */}
                    {counsellorRoutes.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <RoleProtectedRoute allowedRoles={[ROLE.COUNSELLOR]}>
                                    {route.element}
                                </RoleProtectedRoute>
                            }
                        />
                    ))}

                    {allRole.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <RoleProtectedRoute allowedRoles={[ROLE.COUNSELLOR, ROLE.ADMIN]}>
                                    {route.element}
                                </RoleProtectedRoute>
                            }
                        />
                    ))}

                </Route>

                {/* Fallback route */}
                <Route path="*" element={<NotFound/>}/>
            </Routes>
            <Toaster/>
        </BrowserRouter>
    </UserProvider>
);

export default App;