import React, {useState, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Search, MoreHorizontal, Trash2, Edit, UserPlus} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    User as UserIcon,
    TrendingUp,
    Calendar,
    CheckCircle,
    Eye,
    Key,
    EyeOff, FileText, Clock
} from "lucide-react";
import AddEditUserForm, {UserFormValues} from "@/components/dashboard/AddEditUserForm";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";

interface User {
    id: number;
    profilePic?: string | null;
    fullName: string;
    phone?: string;
    email?: string;
    role?: string;
    expertise?: string;
    experience?: string;
    education?: string;
    status?: string;
    joinDate?: string;

    [key: string]: any;
}

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const ROWS_PER_PAGE = 5;
// Remove FIXED_ROLES and instead compute available roles from users

// --- User Data Helpers (API-ready) ---
// Remove localStorage-based helpers:
// function getUsers() { ... }
// function deleteUser(id: number) { ... }

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const navigate = useNavigate();
    const [addCredentialsDialogOpen, setAddCredentialsDialogOpen] = useState(false);
    const [credentialsUser, setCredentialsUser] = useState<User | null>(null);
    const [credentialsForm, setCredentialsForm] = useState({user_id: null, username: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const {toast} = useToast();

    useEffect(() => {
        // Fetch users from API
        const fetchUsers = async () => {
            try {
                const response = await fetch("https://interactapiverse.com/mahadevasth/users");
                if (!response.ok) throw new Error("Failed to fetch users");
                const data = await response.json();
                // If API returns { data: [...] }, use data.data, else use data
                setUsers(Array.isArray(data) ? data : data.data || []);
            } catch (error) {
                setUsers([]);
            }
        };
        fetchUsers();
    }, []);

    // Use a hardcoded list of roles for the filter
    const availableRoles = [
        'admin',
        'super-admin',
        'wellness-coach',
        'counsellor',
        'support staff',
    ];

    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase().trim();
        const fullName = (user.full_name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const matchesSearch = fullName.includes(search) || email.includes(search) || phone.includes(search);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });


    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


    const totalUsers = users.length;
    const activeUsers = Math.max(1, Math.floor(totalUsers * 0.8));
    const thisWeekCount = users.filter(u => {
        if (!u.joinDate) return false;
        const d = new Date(u.joinDate);
        const startOfWeek = getStartOfWeek(new Date());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return d >= startOfWeek && d <= endOfWeek;
    }).length;
    const completionRate = totalUsers > 0 ? "100%" : "0%";

    useEffect(() => {
        setPage(0);
    }, [searchTerm, roleFilter, users.length, rowsPerPage]);

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`https://interactapiverse.com/mahadevasth/user/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete user");
            // Refetch users after delete
            const res = await fetch("https://interactapiverse.com/mahadevasth/user");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : data.data || []);
            toast({
                title: "User deleted",
                description: "User has been deleted.",
            });
        } catch (error) {
            toast({
                title: "Error deleting user",
                description: "Failed to delete user.",
                variant: "destructive",
            });
        }
    };

    const handleView = (user: User) => {
        setViewUser(user);
        setViewDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        navigate(`/edit-user?id=${user.id}`);
    };

    const handleAddCredentials = (user: User) => {
        setCredentialsUser(user);
        setCredentialsForm({user_id: null, username: '', password: ''});
        setShowPassword(false);
        setAddCredentialsDialogOpen(true);
    };

    const handleAddCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credentialsUser) return;
        const payload = {
            user_id: credentialsUser.user_id,
            username: credentialsForm.username,
            password: credentialsForm.password,
        };
        console.log(credentialsUser, "cre");
        try {
            const response = await fetch("https://interactapiverse.com/mahadevasth/user/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error("Failed to add credentials");
            }
            setAddCredentialsDialogOpen(false);
            setSuccessDialogOpen(true);
        } catch (error: any) {
            toast({
                title: "Error adding credentials",
                description: error.message || "An error occurred while adding credentials.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Users</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">List of all users added via the Settings page</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button className="bg-[#012765] text-white" onClick={() => navigate("/new-user")}>Add User</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Total Users</p>
                                <p className="text-3xl font-bold text-[#012765]">{totalUsers}</p>
                            </div>
                            <UserIcon className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Active Users</p>
                                <p className="text-3xl font-bold text-[#012765]">{activeUsers}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">This Week</p>
                                <p className="text-3xl font-bold text-[#012765]">{thisWeekCount}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-purple-500"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Completion Rate</p>
                                <p className="text-3xl font-bold text-[#012765]">{completionRate}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-500"/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Role"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {availableRoles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-lg">
                <CardContent>
                    {paginatedUsers.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No users found. Add users from the Settings
                            page.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Profile</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Full Name</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Email</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Phone</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Role</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedUsers.map((user, idx) => (
                                    <tr key={user.id}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-2 ">
                                            {user.profilePic ? (
                                                <img src={user.profilePic} alt="Profile"
                                                     className="w-10 h-10 rounded-full object-cover"/>
                                            ) : (
                                                <div
                                                    className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-white font-semibold text-lg">
                                                    {user.full_name?.[0] || "?"}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-2 text-[15px]">{user.full_name}</td>
                                        <td className="py-4 px-2 text-[15px]">{user.email}</td>
                                        <td className="py-4 px-2 text-[15px]">{user.phone}</td>
                                        <td className="py-4 px-2 text-[15px]">{user.role}</td>
                                        <td className="py-4 px-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {/*<DropdownMenuItem onClick={() => handleView(user)}>*/}
                                                    {/*    <Eye className="h-4 w-4 mr-2 text-blue-600"/> View*/}
                                                    {/*</DropdownMenuItem>*/}
                                                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                        <span className="mr-2">✏️</span> Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAddCredentials(user)}>
                                                        <Key className="h-4 w-4 mr-2 text-yellow-600"/> Add Credentials
                                                    </DropdownMenuItem>
                                                    {user.role === "counsellor" && (
                                                        <DropdownMenuItem onClick={() =>
                                                            navigate("/appointments")
                                                        }>
                                                            <Clock className="h-4 w-4 mr-2"/> Appointments
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-red-600"
                                                                      onClick={() => handleDelete(user.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2"/> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination Controls */}
                    <div className="w-full flex justify-end mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 ">
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 0}
                                aria-label="Previous page"
                            >
                                &#60;
                            </button>
                            <span
                                className="font-medium">{filteredUsers.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredUsers.length)}</span>
                            <span className="text-gray-400">of</span>
                            <span className="font-semibold text-[#012765] text-base ml-2">{filteredUsers.length}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                aria-label="Next page"
                            >
                                &#62;
                            </button>
                            <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                            <Select value={String(rowsPerPage)} onValueChange={val => {
                                setRowsPerPage(Number(val));
                                setPage(0);
                            }}>
                                <SelectTrigger
                                    className="w-16 h-8 border-gray-200 rounded-md shadow-sm text-gray-700 text-sm focus:ring-2 ">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent className="w-16 rounded-md shadow-lg border-gray-200">
                                    <SelectItem value="5"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden">5</SelectItem>
                                    <SelectItem value="10"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden">10</SelectItem>
                                    <SelectItem value="25"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden">25</SelectItem>
                                    <SelectItem value="100"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Add Credentials Dialog */}
                    <Dialog open={addCredentialsDialogOpen} onOpenChange={setAddCredentialsDialogOpen}>
                        <DialogContent className="max-w-md p-0 bg-transparent">
                            <form
                                onSubmit={handleAddCredentialsSubmit}
                                className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4"
                            >
                                <DialogHeader>
                                    <DialogTitle>Add Credentials</DialogTitle>
                                </DialogHeader>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={credentialsForm.username}
                                        onChange={e => setCredentialsForm(f => ({...f, username: e.target.value}))}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                        value={credentialsForm.password}
                                        onChange={e => setCredentialsForm(f => ({...f, password: e.target.value}))}
                                        required
                                    />
                                    <button type="button" tabIndex={-1} className="absolute right-3 top-9 text-gray-400"
                                            onClick={() => setShowPassword(v => !v)}>
                                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                    </button>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="outline"
                                            onClick={() => setAddCredentialsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-[#012765] text-white">
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    {/* End Add Credentials Dialog */}
                    
                    {/* Success Dialog */}
                    <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                        <DialogContent className="max-w-md mx-auto">
                            <div className="text-center space-y-6 p-6">
                                <div className="space-y-4">
                                    <h2 className="text-[20px] font-bold text-[#012765]">
                                        Credentials Added Successfully!
                                    </h2>
                                    <p className="text-[#012765] text-sm">
                                        Thank you for adding the credentials. They have been saved successfully!
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => setSuccessDialogOpen(false)}
                                    className="w-full bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                                >
                                    OK
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {/* View User Dialog */}
                    {/*<Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>*/}
                    {/*    <DialogContent className="max-w-md p-0 bg-transparent">*/}
                    {/*        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">*/}
                    {/*            {viewUser && (*/}
                    {/*                <>*/}
                    {/*                    <Avatar className="h-20 w-20 mb-4">*/}
                    {/*                        {viewUser.profilePic ? (*/}
                    {/*                            <img src={viewUser.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />*/}
                    {/*                        ) : (*/}
                    {/*                            <AvatarFallback className="bg-[#012765] text-white text-2xl">*/}
                    {/*                                {viewUser.firstName?.[0]?.toUpperCase() || viewUser.name?.[0]?.toUpperCase() || "U"}*/}
                    {/*                            </AvatarFallback>*/}
                    {/*                        )}*/}
                    {/*                    </Avatar>*/}
                    {/*                    <div className="text-center mb-4">*/}
                    {/*                        <div className="text-xl font-bold text-gray-900">{viewUser.firstName ? `${viewUser.firstName} ${viewUser.lastName}` : viewUser.name}</div>*/}
                    {/*                        <div className="text-sm text-gray-600 mt-1">{viewUser.email}</div>*/}
                    {/*                        <div className="text-sm text-gray-500 mt-1">{viewUser.role}</div>*/}
                    {/*                    </div>*/}
                    {/*                    {viewUser.role === "counsellor" && (*/}
                    {/*                        <div className="w-full mt-4">*/}
                    {/*                            <div className="font-semibold text-gray-700 mb-2">Counsellor Details</div>*/}
                    {/*                            <div className="grid grid-cols-1 gap-2">*/}
                    {/*                                <div><span className="font-medium">Expertise:</span> {viewUser.expertise}</div>*/}
                    {/*                                <div><span className="font-medium">Experience:</span> {viewUser.experience}</div>*/}
                    {/*                                <div><span className="font-medium">Education:</span> {viewUser.education}</div>*/}
                    {/*                            </div>*/}
                    {/*                        </div>*/}
                    {/*                    )}*/}
                    {/*                </>*/}
                    {/*            )}*/}
                    {/*        </div>*/}
                    {/*    </DialogContent>*/}
                    {/*</Dialog>*/}
                </CardContent>
            </Card>
        </div>
    );
} 