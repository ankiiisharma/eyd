"use client"

import React, {useState} from "react"
import {Bell, Search, Menu, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {useNavigate, useLocation} from "react-router-dom"
import {useUserContext} from "@/UserContext";
import AppointmentPage from "@/pages/AppointmentPage.tsx";
import SlotPage from "@/pages/SlotPage.tsx";

interface DashboardHeaderProps {
    toggleSidebar: () => void
    sidebarCollapsed: boolean
}

const pages = [
    {name: "Dashboard", path: "/dashboard"},
    {name: "Beneficieries", path: "/beneficieries"},
    {name: "Assessments", path: "/assessments"},
    {name: "Inquiries", path: "/inquiries"},
    {name: "Users", path: "/users"},
    {name: "Feedback", path: "/feedback"},
    {name: "Resources", path: "/resources"},
    {name: "Notification", path: "/notifications"},
    {name: "Settings", path: "/settings"},
    {name: "Appointments", path: "/appointments"},
    {name: "Slot", path: "/slot"},
]

export const DashboardHeader = ({toggleSidebar}: DashboardHeaderProps) => {
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredPages, setFilteredPages] = useState<typeof pages>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation();
    const {user, logout} = useUserContext();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        const filtered = pages.filter((page) =>
            page.name.toLowerCase().includes(value.toLowerCase())
        )
        setFilteredPages(filtered)
    }

    const clearSearch = () => {
        setSearchQuery("")
        setFilteredPages([])
    }

    const handleSearchResultClick = (path: string) => {
        setIsDialogOpen(false)
        clearSearch()
        navigate(path)
    }

    return (
        <header className="bg-white shadow-md border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left section */}
                <div className="flex items-center space-x-4 relative">
                    {/* Menu Button (mobile) */}
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
                        <Menu className="h-5 w-5"/>
                    </Button>

                    {/* Search Button (mobile) */}
                    <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)} className="lg:hidden">
                        <Search className="h-5 w-5"/>
                    </Button>

                    {/* Desktop Search Input */}
                    <div className="relative w-64 hidden lg:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <Input
                            placeholder="Search users, assessments..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {searchQuery && filteredPages.length > 0 && (
                            <div
                                className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                {filteredPages.map((page) => (
                                    <div
                                        key={page.path}
                                        onClick={() => handleSearchResultClick(page.path)}
                                        className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        {page.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center space-x-4">
                    {/* Notification bell */}
            {/*        <Button variant="ghost" size="sm" className="relative">*/}
            {/*            <Bell className="h-5 w-5"/>*/}
            {/*            <span*/}
            {/*                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">*/}
            {/*  3*/}
            {/*</span>*/}
            {/*        </Button>*/}

                    {/* Avatar dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
                                    <AvatarFallback className="bg-[#012765] text-white">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || ""}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator/>
                            {location.pathname !== "/settings" && (
                                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                                    Profile Settings
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                    logout();
                                    navigate("/login");
                                }}
                            >
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Mobile Search Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md p-10 rounded-3xl ">
                    <DialogHeader className="mb-2 text-center font-semibold text-lg">
                        Search
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10 pr-10 w-full"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsDialogOpen(false)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-gray-500"/>
                        </Button>
                    </div>

                    {searchQuery && filteredPages.length > 0 && (
                        <div className="mt-3 border rounded-md shadow-sm bg-white max-h-60 overflow-auto">
                            {filteredPages.map((page) => (
                                <div
                                    key={page.path}
                                    onClick={() => handleSearchResultClick(page.path)}
                                    className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    {page.name}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </header>
    )
}
