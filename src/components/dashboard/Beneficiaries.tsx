import {useState, useEffect} from "react";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Search, Download, MoreHorizontal, Eye, Trash2, FileText, TrendingUp, Calendar} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DateInputButton} from "@/components/ui/DatePickerDialog";
import {format} from "date-fns";
import {X} from "lucide-react"

type BeneficiaryStatus = "Active" | "Inactive";

interface Beneficiary {
    id: number;
    name: string;
    email: string;
    age: number;
    assessmentName: string;
    joinDate: string;
    status: BeneficiaryStatus;
}

const mockBeneficiaries: Beneficiary[] = [
    {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        age: 16,
        assessmentName: "Wellness Basics",
        joinDate: "2024-01-15",
        status: "Active",
    },
    {
        id: 2,
        name: "Michael Chen",
        email: "m.chen@email.com",
        age: 28,
        assessmentName: "Employee Wellness",
        joinDate: "2024-02-20",
        status: "Active",
    },
    {
        id: 3,
        name: "Emma Wilson",
        email: "emma.w@email.com",
        age: 19,
        assessmentName: "Aspirant Mindset",
        joinDate: "2024-03-10",
        status: "Inactive",
    },
    {
        id: 4,
        name: "David Kumar",
        email: "d.kumar@email.com",
        age: 14,
        assessmentName: "Primary Growth",
        joinDate: "2024-01-05",
        status: "Active",
    },
    {
        id: 5,
        name: "Lisa Rodriguez",
        email: "lisa.r@email.com",
        age: 17,
        assessmentName: "K12 Progress",
        joinDate: "2024-04-12",
        status: "Active",
    },
];

const getInitialBeneficiaries = (): Beneficiary[] => {
    const stored = localStorage.getItem("beneficiaries");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            // fallback to mock if corrupted
        }
    }
    return [...mockBeneficiaries];
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

// Helper to capitalize first letter
function capitalizeFirst(str: string) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const Beneficiaries = () => {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(getInitialBeneficiaries);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [viewBeneficiary, setViewBeneficiary] = useState<Beneficiary | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({from: null, to: null});

    useEffect(() => {
        localStorage.setItem("beneficiaries", JSON.stringify(beneficiaries));
    }, [beneficiaries]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, statusFilter, dateRange]);

    const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            beneficiary.name.toLowerCase().includes(term) ||
            beneficiary.email.toLowerCase().includes(term) ||
            beneficiary.assessmentName.toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" || beneficiary.status === statusFilter;
        let matchesDate = true;
        if (dateRange.from && dateRange.to) {
            const join = new Date(beneficiary.joinDate);
            matchesDate = join >= dateRange.from && join <= dateRange.to;
        } else if (dateRange.from) {
            const join = new Date(beneficiary.joinDate);
            matchesDate = join >= dateRange.from;
        } else if (dateRange.to) {
            const join = new Date(beneficiary.joinDate);
            matchesDate = join <= dateRange.to;
        }
        return matchesSearch && matchesStatus && matchesDate;
    });

    const paginatedBeneficiaries = filteredBeneficiaries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filteredBeneficiaries.length / rowsPerPage);

    const getStatusColor = (status: BeneficiaryStatus) =>
        status === "Active"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800";

    const handleExport = () => {
        const header = ["Name", "Email", "Age", "Assessment Name", "Join Date", "Status"];
        const rows = beneficiaries.map((u) => [u.name, u.email, u.age, u.assessmentName, u.joinDate, u.status]);
        const csv = [header, ...rows].map((row) => row.map(String).map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], {type: "text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "beneficiaries.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = (id: number) => {
        setBeneficiaries((prev) => prev.filter((u) => u.id !== id));
    };

    const handleView = (beneficiary: Beneficiary) => {
        setViewBeneficiary(beneficiary);
        setViewDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Add summary cards row at the top, styled like Assessment page, with dynamic values for Total Beneficiaries, Active Beneficiaries, This Week, Completion Rate. Use icons and layout matching Assessment page. */}
            {/* Remove the summary cards row from the top. */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Beneficiaries</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Manage and monitor beneficiary accounts</p>
                </div>
                <Button className="mt-4 md:mt-0 bg-[#012765] text-white" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2"/>
                    Export Data
                </Button>
            </div>

            {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">*/}
            {/*    <Card className="border-0 shadow-lg bg-white">*/}
            {/*        <CardContent className="p-6">*/}
            {/*            <div className="flex items-center justify-between">*/}
            {/*                <div>*/}
            {/*                    <p className="text-sm font-medium text-[#012765]">Total Beneficiaries</p>*/}
            {/*                    <p className="text-3xl font-bold text-[#012765]">{filteredBeneficiaries.length}</p>*/}
            {/*                </div>*/}
            {/*                <FileText className="h-8 w-8 text-blue-500"/>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*    <Card className="border-0 shadow-lg bg-white">*/}
            {/*        <CardContent className="p-6">*/}
            {/*            <div className="flex items-center justify-between">*/}
            {/*                <div>*/}
            {/*                    <p className="text-sm font-medium text-[#012765]">Active Beneficiaries</p>*/}
            {/*                    <p className="text-3xl font-bold text-[#012765]">{filteredBeneficiaries.filter(b => b.status === 'active').length}</p>*/}
            {/*                </div>*/}
            {/*                <TrendingUp className="h-8 w-8 text-green-500"/>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*    <Card className="border-0 shadow-lg bg-white">*/}
            {/*        <CardContent className="p-6">*/}
            {/*            <div className="flex items-center justify-between">*/}
            {/*                <div>*/}
            {/*                    <p className="text-sm font-medium text-[#012765]">This Week</p>*/}
            {/*                    <p className="text-3xl font-bold text-[#012765]">{filteredBeneficiaries.filter(b => new Date(b.joinDate).getTime() >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()).length}</p>*/}
            {/*                </div>*/}
            {/*                <Calendar className="h-8 w-8 text-purple-500"/>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*    <Card className="border-0 shadow-lg bg-white">*/}
            {/*        <CardContent className="p-6">*/}
            {/*            <div className="flex items-center justify-between">*/}
            {/*                <div>*/}
            {/*                    <p className="text-sm font-medium text-[#012765]">Completion Rate</p>*/}
            {/*                    <p className="text-3xl font-bold text-[#012765]">{(filteredBeneficiaries.length > 0 ? (filteredBeneficiaries.filter(b => b.status === 'active').length / filteredBeneficiaries.length) * 100 : 0).toFixed(0)}%</p>*/}
            {/*                </div>*/}
            {/*                <TrendingUp className="h-8 w-8 text-orange-500"/>*/}
            {/*            </div>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*</div>*/}

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search Beneficiaries by name, email, or assessment name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-80 flex flex-col justify-center">
                            {/* <label className="text-xs font-medium text-gray-600 mb-1">Join Date Range</label> */}
                            <div className="flex items-center gap-2">
                                <DateInputButton
                                    value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                                    onChange={(date) => {
                                        const dateObj = date ? new Date(date) : null;
                                        setDateRange(r => ({...r, from: dateObj}));
                                    }}
                                    placeholder="From"
                                    title="Select From Date"
                                    className="flex-1"
                                />
                                <span className="mx-1 text-gray-500">-</span>
                                <DateInputButton
                                    value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                                    onChange={(date) => {
                                        const dateObj = date ? new Date(date) : null;
                                        setDateRange(r => ({...r, to: dateObj}));
                                    }}
                                    placeholder="To"
                                    title="Select To Date"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Beneficiaries Table */}
            <Card className="border-0 shadow-lg">
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-4 px-2 font-medium text-gray-600">#</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Name</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Email</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Age</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Assessment Name</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Join Date</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Status</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedBeneficiaries.map((beneficiary, idx) => (
                                <tr key={beneficiary.id}
                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-2">{page * rowsPerPage + idx + 1}</td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-10 h-10 rounded-full bg-[#012765] flex items-center justify-center text-white font-semibold text-sm">
                                                {getInitials(beneficiary.name)}
                                            </div>
                                            <span className="font-medium text-gray-900 text-[15px]">{beneficiary.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-[15px] text-gray-600">{beneficiary.email}</td>
                                    <td className="py-4 px-2 text-[15px] text-gray-600">{beneficiary.age}</td>
                                    <td className="py-4 px-2 text-[15px] text-gray-600">{beneficiary.assessmentName}</td>
                                    <td className="py-4 px-2 text-[15px] text-gray-600">{new Date(beneficiary.joinDate).toLocaleDateString()}</td>
                                    <td className="py-4 px-2">
                                        <Badge
                                            className={getStatusColor(beneficiary.status) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                            {capitalizeFirst(beneficiary.status)}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(beneficiary)}>
                                                    <Eye className="h-4 w-4 mr-2 text-blue-600"/> View Beneficiary
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600"
                                                                  onClick={() => handleDelete(beneficiary.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredBeneficiaries.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-400 py-8">No Beneficiaries found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
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
                                className="font-medium">{filteredBeneficiaries.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredBeneficiaries.length)}</span>
                            <span className="text-gray-400">of</span>
                            <span
                                className="font-semibold text-[#012765] text-base ml-2">{filteredBeneficiaries.length}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                aria-label="Next page"
                            >
                                &#62;
                            </button>
                            <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                            <Select value={rowsPerPage === filteredBeneficiaries.length ? 'All' : String(rowsPerPage)}
                                    onValueChange={val => {
                                        if (val === 'All') {
                                            setRowsPerPage(filteredBeneficiaries.length || 1);
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
                </CardContent>
            </Card>

            {/* View Beneficiary Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Beneficiary Details</DialogTitle>
                    </DialogHeader>
                    <button
                        onClick={() => setViewDialogOpen(false)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-5 w-5"/>
                        <span className="sr-only">Close</span>
                    </button>
                    {viewBeneficiary && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-12 h-12 rounded-full bg-[#012765] flex items-center justify-center text-white font-semibold text-xl">
                                    {getInitials(viewBeneficiary.name)}
                                </div>
                                <span className="text-lg font-semibold text-gray-900">{viewBeneficiary.name}</span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border border-gray-200 rounded-lg bg-white">
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="font-medium text-gray-600 px-4 py-2">Name</td>
                                            <td className="px-4 py-2 bg-gray-50">{viewBeneficiary.name}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="font-medium text-gray-600 px-4 py-2">Email</td>
                                            <td className="px-4 py-2 bg-gray-50">{viewBeneficiary.email}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="font-medium text-gray-600 px-4 py-2">Age</td>
                                            <td className="px-4 py-2 bg-gray-50">{viewBeneficiary.age}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="font-medium text-gray-600 px-4 py-2">Assessment Name</td>
                                            <td className="px-4 py-2 bg-gray-50">{viewBeneficiary.assessmentName}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="font-medium text-gray-600 px-4 py-2">Join Date</td>
                                            <td className="px-4 py-2 bg-gray-50">
                                                {new Date(viewBeneficiary.joinDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="font-medium text-gray-600 px-4 py-2">Status</td>
                                            <td className="px-4 py-2 bg-gray-50">
                                                <Badge
                                                    className={getStatusColor(viewBeneficiary.status) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                                    {capitalizeFirst(viewBeneficiary.status)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
