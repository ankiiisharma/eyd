import React, {useState, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Search,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Check,
    Calendar,
    TrendingUp,
    FileText,
    UserPlus,
    Edit
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/components/ui/dropdown-menu";
import {MoreVertical, Eye} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {X} from "lucide-react"
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {useToast} from "@/hooks/use-toast";


const API_LIST = "https://interactapiverse.com/mahadevasth/enquiry/list";
const API_SINGLE = (id: string | number) => `https://interactapiverse.com/mahadevasth/enquiry/${id}`;
// API endpoint for assigning inquiries to counselors (currently not connected)
// Expected payload: { assignedTo: "counselor_name" }
const API_ASSIGN = (id: string | number) => `https://interactapiverse.com/mahadevasth/enquiry/${id}/assign`;


interface InquiryBase {
    id: number;
    inquiryType: "Contact" | "Request a Callback";
    email: string;
    phone?: string;
    message: string;
    date: string;
    status: "pending" | "in-progress" | "resolved";
    assignedTo: string | null;
    responses: { content: string; timestamp: string }[];
}

interface ContactInquiry extends InquiryBase {
    inquiryType: "Contact";
    firstName: string;
    lastName: string;
    inquiryCategory: string;
}

interface CallbackInquiry extends InquiryBase {
    inquiryType: "Request a Callback";
    fullName: string;
    age: number;
}

type Inquiry = ContactInquiry | CallbackInquiry;

const getInitialInquiries = (): Inquiry[] => {
    const stored = localStorage.getItem("inquiries");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {

        }
    }
};

const supportTeam = [
    "Support Team A",
    "Support Team B",
    "Wellness Coach A",
    "Wellness Coach B",
    "Technical Support",
];

const inquiryTypes = [
    "Individual Therapy",
    "Student Services",
    "Corporate Wellness",
    "Technical Support",
    "Billing & Payment",
    "Request a Callback - Stress & Anxiety",
    "Request a Callback - Relationships",
    "Request a Callback - Grief & Trauma",
    "Request a Callback - Addiction",
    "Request a Callback - Self-Esteem",
    "Request a Callback - Bullying",
    "Request a Callback - Overthinking",
    "Request a Callback - Career Uncertainty",
];

interface Counselor {
    id: number;
    profilePic?: string | null;
    full_name: string;
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

export const InquiriesManagement = () => {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [loading, setLoading] = useState(false);
    const [selectedInquiryId, setSelectedInquiryId] = useState<string | number | null>(null);
    const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const navigate = useNavigate();
    // Add a state for topCardFilter to control which card is active
    const [topCardFilter, setTopCardFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

    // New states for assignment dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignInquiryId, setAssignInquiryId] = useState<string | number | null>(null);
    const [assignSearchTerm, setAssignSearchTerm] = useState("");
    const [assignPage, setAssignPage] = useState(0);
    const [assignRowsPerPage, setAssignRowsPerPage] = useState(5);
    const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
    const [counselors, setCounselors] = useState<Counselor[]>([]);
    const [counselorsLoading, setCounselorsLoading] = useState(false);
    const [assigningLoading, setAssigningLoading] = useState(false);

    // New states for edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editInquiryId, setEditInquiryId] = useState<string | number | null>(null);
    const [editInquiry, setEditInquiry] = useState<any | null>(null);
    const [editStatus, setEditStatus] = useState<string>("");
    const [editLoading, setEditLoading] = useState(false);

    // Success dialog state
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");


    useEffect(() => {
        setLoading(true);
        fetch(API_LIST)
            .then((res) => res.json())
            .then((data) => {
                const inquiriesData = Array.isArray(data) ? data : data?.data || [];

                // Load assignments from localStorage and merge with inquiry data
                const inquiriesWithAssignments = inquiriesData.map((inquiry: any) => {
                    const assignmentKey = `inquiry_assignment_${inquiry.id}`;
                    const assignedTo = localStorage.getItem(assignmentKey);
                    return {
                        ...inquiry,
                        assignedTo: assignedTo || null
                    };
                });

                setInquiries(inquiriesWithAssignments);
            })
            .finally(() => setLoading(false));
    }, []);


    useEffect(() => {
        if (selectedInquiryId) {
            setDetailLoading(true);
            fetch(API_SINGLE(selectedInquiryId))
                .then((res) => res.json())
                .then((data) => setSelectedInquiry(data?.data || data))
                .finally(() => setDetailLoading(false));
        } else {
            setSelectedInquiry(null);
        }
    }, [selectedInquiryId]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, typeFilter, statusFilter, inquiries]);

    // Fetch counselors from API
    useEffect(() => {
        const fetchCounselors = async () => {
            setCounselorsLoading(true);
            try {
                const response = await fetch("https://interactapiverse.com/mahadevasth/counsellors");
                if (!response.ok) throw new Error("Failed to fetch counselors");
                const data = await response.json();
                // Filter only users with "counsellor" role
                const counselorsData = Array.isArray(data) ? data : data.data || [];
                const filteredCounselors = counselorsData.filter((user: Counselor) =>
                    user.role?.toLowerCase() === 'counsellor'
                );
                setCounselors(filteredCounselors);
            } catch (error) {
                console.error("Error fetching counselors:", error);
                setCounselors([]);
            } finally {
                setCounselorsLoading(false);
            }
        };

        if (assignDialogOpen) {
            fetchCounselors();
        }
    }, [assignDialogOpen]);


    // Adjusted status filtering logic
    const filteredInquiries = inquiries.filter((inquiry) => {
        const matchesSearch =
            (inquiry.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inquiry.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inquiry.message || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || (inquiry.enquiry_type || "").toLowerCase() === typeFilter.toLowerCase();
        // Use topCardFilter for status filtering
        let matchesStatus = true;
        if (topCardFilter === 'resolved') {
            matchesStatus = String(inquiry.status).toLowerCase() === "resolved";
        } else if (topCardFilter === 'unresolved') {
            matchesStatus = String(inquiry.status).toLowerCase() !== "resolved";
        } else if (statusFilter === "resolved") {
            matchesStatus = String(inquiry.status).toLowerCase() === "resolved";
        } else if (statusFilter === "unresolved") {
            matchesStatus = String(inquiry.status).toLowerCase() !== "resolved";
        }
        return matchesSearch && matchesType && matchesStatus;
    });


    const uniqueTypes = Array.from(new Set(inquiries.map((inq) => inq.enquiry_type).filter(Boolean)));

    const paginatedInquiries = filteredInquiries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filteredInquiries.length / rowsPerPage);

    // Calculate summary values
    const totalInquiries = inquiries.length;
    const unresolvedInquiries = inquiries.filter(i => String(i.status).toLowerCase() !== 'resolved').length;
    const resolvedInquiries = filteredInquiries.filter(i => String(i.status).toLowerCase() === 'resolved').length;
    const completionRate = totalInquiries > 0 ? ((resolvedInquiries / totalInquiries) * 100).toFixed(0) : '0';

    // Filter counselors based on search
    const filteredCounselors = counselors.filter((counselor) =>
        counselor.full_name?.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
        counselor.email?.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
        counselor.expertise?.toLowerCase().includes(assignSearchTerm.toLowerCase())
    );

    const paginatedCounselors = filteredCounselors.slice(
        assignPage * assignRowsPerPage,
        assignPage * assignRowsPerPage + assignRowsPerPage
    );
    const totalAssignPages = Math.ceil(filteredCounselors.length / assignRowsPerPage);

    // Handle assignment
    const handleAssignInquiry = (inquiryId: string | number) => {
        setAssignInquiryId(inquiryId);
        setAssignDialogOpen(true);
        setAssignSearchTerm("");
        setAssignPage(0);

        // Find the current inquiry to get the assigned counselor
        const currentInquiry = inquiries.find(inquiry => inquiry.id === inquiryId);
        const previouslyAssigned = currentInquiry?.assignedTo || null;
        setSelectedTeamMember(previouslyAssigned);
    };

    const handleConfirmAssignment = async () => {
        if (selectedTeamMember && assignInquiryId) {
            setAssigningLoading(true);
            try {
                // Find the current inquiry to check if assignment is the same
                const currentInquiry = inquiries.find(inquiry => inquiry.id === assignInquiryId);
                const previouslyAssigned = currentInquiry?.assignedTo;

                // If the same counselor is already assigned, just close the dialog
                if (previouslyAssigned === selectedTeamMember) {
                    toast({
                        title: `Inquiry is already assigned to ${selectedTeamMember}`,
                        description: "You can re-assign if needed.",
                    });
                    setAssignDialogOpen(false);
                    setAssignInquiryId(null);
                    setSelectedTeamMember(null);
                    setAssigningLoading(false);
                    return;
                }

                // TODO: Uncomment when API is ready
                // Make API call to assign the inquiry
                /*
                const response = await fetch(API_ASSIGN(assignInquiryId), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        assignedTo: selectedTeamMember
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to assign inquiry');
                }
                */

                // Static assignment for now - save to localStorage
                const assignmentKey = `inquiry_assignment_${assignInquiryId}`;
                localStorage.setItem(assignmentKey, selectedTeamMember);

                // Update the inquiry in the local state
                setInquiries(prev => prev.map(inquiry =>
                    inquiry.id === assignInquiryId
                        ? {...inquiry, assignedTo: selectedTeamMember}
                        : inquiry
                ));

                console.log(`Successfully assigned inquiry ${assignInquiryId} to ${selectedTeamMember}`);

                // Show success dialog instead of toast
                const message =`Successfully assigned inquiry to ${selectedTeamMember}`;
                setSuccessMessage(message);
                setSuccessDialogOpen(true);

                setAssignDialogOpen(false);
                setAssignInquiryId(null);
                setSelectedTeamMember(null);
            } catch (error) {
                console.error('Error assigning inquiry:', error);
                toast({
                    title: "Failed to Assign Inquiry",
                    description: "Failed to assign inquiry. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setAssigningLoading(false);
            }
        }
    };

    const {toast} = useToast();

    return (
        <div className="space-y-6">
            {/* Title and description section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Inquiries</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Manage and monitor all user inquiries</p>
                </div>
            </div>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'all' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('all')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Total Inquiries</p>
                                <p className="text-3xl font-bold text-[#012765]">{totalInquiries}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </button>
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'unresolved' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('unresolved')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Unresolved</p>
                                <p className="text-3xl font-bold text-[#012765]">{unresolvedInquiries}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-yellow-500"/>
                        </div>
                    </CardContent>
                </button>
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'resolved' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('resolved')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Resolved</p>
                                <p className="text-3xl font-bold text-[#012765]">{resolvedInquiries}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </button>
                <div className="border-0 shadow-lg bg-white rounded-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Completion Rate</p>
                                <p className="text-3xl font-bold text-[#012765]">{completionRate}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-500"/>
                        </div>
                    </CardContent>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search inquiries by name, email, or message"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full md:w-80">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value="all"
                                        className={
                                            typeFilter === 'all'
                                                ? 'bg-gray-200 text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-gray-800'
                                                : 'hover:bg-gray-200 hover:text-gray-800'
                                        }
                                    >
                                        All Types
                                    </SelectItem>
                                    {inquiryTypes.map((type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            className={
                                                typeFilter === type
                                                    ? 'bg-gray-200 text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-gray-800'
                                                    : 'hover:bg-gray-200 hover:text-gray-800'
                                            }
                                        >
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="unresolved">Unresolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Inquiries Table */}
            <Card className="border-0 shadow-lg">
                <CardContent>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">#</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Name</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Email</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Phone</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Date</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Inquiry Type</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Counselor Name</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Message</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Status</th>
                                    <th className="text-left py-4 px-2 font-medium text-gray-600">Actions</th>
                                </tr>
                                </thead>
                                <tbody>

                                {paginatedInquiries.map((inquiry, idx) => (
                                    <tr key={inquiry.id}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-2 text-[15px]">{page * rowsPerPage + idx + 1}</td>
                                        <td className="py-4 px-2 text-[15px]">{inquiry.name}</td>
                                        <td className="py-4 px-2 text-[15px]">{inquiry.email}</td>
                                        <td className="py-4 px-2 text-[15px]">{inquiry.mobile || "-"}</td>
                                        <td className="py-4 px-2 text-[15px]">
                                            {new Date(inquiry.created_at).toLocaleDateString("en-GB")}
                                        </td>

                                        <td className="py-4 px-2">
                                            <Badge
                                                className="bg-blue-100 text-blue-800 transition-colors duration-150 hover:bg-[#012765] hover:text-white">{inquiry.enquiry_type}</Badge>
                                        </td>
                                        <td className="py-4 px-2 text-[15px]">
                                            {inquiry.assignedTo ? (
                                                <span className="text-[#000] font-medium">{inquiry.assignedTo}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-2 text-[15px] max-w-xs truncate"
                                            title={inquiry.message}>{inquiry.message}</td>
                                        <td className="py-4 px-2">
                                            <Badge className={
                                                String(inquiry.status).toLowerCase() === 'resolved'
                                                    ? 'bg-blue-100 text-blue-800 transition-colors duration-150 hover:bg-[#012765] hover:text-white'
                                                    : 'bg-yellow-200 text-yellow-700 transition-colors duration-150 hover:bg-[#012765] hover:text-white'
                                            }>
                                                {String(inquiry.status).toLowerCase() === 'resolved' ? 'Resolved' : 'Unresolved'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-5 w-5 text-gray-500"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedInquiryId(inquiry.id);
                                                            setDialogOpen(true);
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2 text-gray-600"/>
                                                        View Inquiry
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleAssignInquiry(inquiry.id)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <UserPlus className="h-4 w-4 mr-2 text-gray-600"/>
                                                        Assign Inquiry
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/inquiries/${inquiry.id}/notes`)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2 text-gray-600"/>
                                                        Add Notes
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Dialog open={dialogOpen && selectedInquiryId === inquiry.id}
                                                    onOpenChange={(open) => {
                                                        setDialogOpen(open);
                                                        if (!open) {
                                                            setSelectedInquiryId(null);
                                                        }
                                                    }}>
                                                <DialogContent className="max-w-xl">
                                                    <button
                                                        onClick={() => {
                                                            setDialogOpen(false);
                                                            setSelectedInquiryId(null);
                                                        }}
                                                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                    >
                                                        <X className="h-5 w-5"/>
                                                        <span className="sr-only">Close</span>
                                                    </button>
                                                    <DialogHeader>
                                                        <DialogTitle>Inquiry Details</DialogTitle>
                                                    </DialogHeader>
                                                    {detailLoading ? (
                                                        <div className="p-8 text-center text-gray-500">Loading...</div>
                                                    ) : selectedInquiry ? (
                                                        <div className="overflow-x-auto">
                                                            <table
                                                                className="min-w-full text-sm border border-gray-200 rounded-lg bg-white">
                                                                <tbody>
                                                                <tr className="border-b">
                                                                    <td className="font-medium text-gray-600 px-4 py-2">Date</td>
                                                                    <td className="px-4 py-2 bg-gray-50">
                                                                        {new Date(selectedInquiry.created_at).toLocaleDateString('en-GB')}
                                                                    </td>
                                                                </tr>
                                                                <tr className="border-b">
                                                                    <td className="font-medium text-gray-600 px-4 py-2">Firstname</td>
                                                                    <td className="px-4 py-2 bg-gray-50">{selectedInquiry.name}</td>
                                                                </tr>
                                                                <tr className="border-b">
                                                                    <td className="font-medium text-gray-600 px-4 py-2">Inquiry
                                                                        Type
                                                                    </td>
                                                                    <td className="px-4 py-2 bg-gray-50">{selectedInquiry.enquiry_type}</td>
                                                                </tr>
                                                                <tr className="border-b">
                                                                    <td className="font-medium text-gray-600 px-4 py-2">Email</td>
                                                                    <td className="px-4 py-2 bg-gray-50">{selectedInquiry.email}</td>
                                                                </tr>
                                                                <tr className="border-b">
                                                                    <td className="font-medium text-gray-600 px-4 py-2">Phone</td>
                                                                    <td className="px-4 py-2 bg-gray-50">{selectedInquiry.mobile || "-"}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="font-medium text-gray-600 px-4 py-2 align-top">Message</td>
                                                                    <td className="px-4 py-2 whitespace-pre-line bg-gray-50 rounded">
                                                                        <div
                                                                            className="max-h-[400px] overflow-y-auto whitespace-pre-line">
                                                                            {selectedInquiry.message}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-gray-500">No data
                                                            found.</div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInquiries.length === 0 && (
                                    <tr>
                                        <td className="py-4 px-2 text-center" colSpan={9}>No inquiries found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination Controls */}
                    {!loading && (
                        <div className="w-full flex justify-end mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <button
                                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 0}
                                    aria-label="Previous page"
                                >
                                    &#60;
                                </button>
                                <span
                                    className="font-medium">{filteredInquiries.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredInquiries.length)}</span>
                                <span className="text-gray-400">of</span>
                                <span
                                    className="font-semibold text-[#012765] text-base ml-2">{filteredInquiries.length}</span>
                                <button
                                    className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= totalPages - 1}
                                    aria-label="Next page"
                                >
                                    &#62;
                                </button>
                                <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                                <Select value={rowsPerPage === filteredInquiries.length ? 'All' : String(rowsPerPage)}
                                        onValueChange={val => {
                                            if (val === 'All') {
                                                setRowsPerPage(filteredInquiries.length || 1);
                                                setPage(0);
                                            } else {
                                                setRowsPerPage(Number(val));
                                                setPage(0);
                                            }
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
                                        <SelectItem value="All"
                                                    className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden">All</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    {/*<button*/}
                    {/*    onClick={() => setAssignDialogOpen(false)}*/}
                    {/*    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"*/}
                    {/*>*/}
                    {/*    <X className="h-5 w-5"/>*/}
                    {/*    <span className="sr-only">Close</span>*/}
                    {/*</button>*/}
                    <DialogHeader>
                        <DialogTitle>Assign Inquiry to Counselor</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search for counselors */}
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search counselors by name, email"
                                value={assignSearchTerm}
                                onChange={(e) => setAssignSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Counselors table */}
                        <div className="overflow-x-auto">
                            {counselorsLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading counselors...</div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">#</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Profile</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Name</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Email</th>
                                        <th className="text-left py-4 px-2 font-medium text-gray-600">Phone</th>
                                        {/*<th className="text-left py-4 px-2 font-medium text-gray-600">Select</th>*/}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedCounselors.map((counselor, idx) => (
                                        <tr key={counselor.id}
                                            className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                                                selectedTeamMember === counselor.full_name 
                                                    ? 'bg-blue-50 border-2 border-blue-500' 
                                                    : ''
                                            }`}
                                            onClick={() => setSelectedTeamMember(counselor.full_name)}
                                        >
                                            <td className="py-4 px-2">{assignPage * assignRowsPerPage + idx + 1}</td>
                                            <td className="py-4 px-2">
                                                {counselor.profilePic ? (
                                                    <img src={counselor.profilePic} alt="Profile"
                                                         className="w-10 h-10 rounded-full object-cover"/>
                                                ) : (
                                                    <div
                                                        className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-white font-semibold text-xl">
                                                        {counselor.full_name?.[0] || "?"}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-2">{counselor.full_name}</td>
                                            <td className="py-4 px-2">{counselor.email}</td>
                                            <td className="py-4 px-2">{counselor.phone || "-"}</td>
                                            <td className="py-4 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeamMember === counselor.full_name}
                                                    onChange={() => setSelectedTeamMember(counselor.full_name)}
                                                    className="h-4 w-4 text-white border-gray-300  rounded-full focus:ring-[#012765] focus:ring-2 checked:bg-[#012765]"
                                                />
                                            </td>

                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Assignment pagination */}
                        {filteredCounselors.length > 0 && !counselorsLoading && (
                            <div className="w-full flex justify-end">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <button
                                        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                        onClick={() => setAssignPage(assignPage - 1)}
                                        disabled={assignPage === 0}
                                        aria-label="Previous page"
                                    >
                                        &#60;
                                    </button>
                                    <span className="font-medium">
        {assignPage * assignRowsPerPage + 1} -{" "}
                                        {Math.min((assignPage + 1) * assignRowsPerPage, filteredCounselors.length)}
      </span>
                                    <span className="text-gray-400">of</span>
                                    <span className="font-semibold text-[#012765] text-base ml-2">
        {filteredCounselors.length}
      </span>
                                    <button
                                        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                        onClick={() => setAssignPage(assignPage + 1)}
                                        disabled={assignPage >= totalAssignPages - 1}
                                        aria-label="Next page"
                                    >
                                        &#62;
                                    </button>
                                    <span className="text-sm text-gray-500 ml-4">Rows per page:</span>

                                    <Select
                                        value={
                                            assignRowsPerPage === filteredCounselors.length
                                                ? "All"
                                                : String(assignRowsPerPage)
                                        }
                                        onValueChange={(val) => {
                                            if (val === "All") {
                                                setAssignRowsPerPage(filteredCounselors.length);
                                            } else {
                                                setAssignRowsPerPage(Number(val));
                                            }
                                            setAssignPage(0);
                                        }}
                                    >
                                        <SelectTrigger
                                            className="w-20 h-8 border-gray-200 rounded-md shadow-sm text-gray-700 text-sm focus:ring-2">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent className="w-20 rounded-md shadow-lg border-gray-200">
                                            <SelectItem
                                                value="5"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden"
                                            >
                                                5
                                            </SelectItem>
                                            <SelectItem
                                                value="10"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden"
                                            >
                                                10
                                            </SelectItem>
                                            <SelectItem
                                                value="25"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden"
                                            >
                                                25
                                            </SelectItem>
                                            <SelectItem
                                                value="All"
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black [&>[data-select-item-indicator]]:hidden"
                                            >
                                                All
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}


                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setAssignDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmAssignment}
                                disabled={!selectedTeamMember || assigningLoading}
                                className="bg-[#012765] text-white hover:bg-[#012765]/90"
                            >
                                {assigningLoading ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Assigning...
                                    </>
                                ) : (
                                    "Assign Inquiry"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent className="max-w-md">
                    <div className="text-center space-y-4">
                        <div className="mx-auto flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#012765] mb-2">
                                Inquiry Assigned Successfully!
                            </h3>
                            <p className="text-sm text-[#012765]">
                                {successMessage}
                            </p>
                        </div>
                        <Button
                            onClick={() => setSuccessDialogOpen(false)}
                            className="bg-[#FF7119] text-white hover:bg-[#FF7119]/90 font-bold uppercase px-8 py-2"
                        >
                            OK
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
