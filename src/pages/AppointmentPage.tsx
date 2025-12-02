import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreHorizontal,
    Trash2,
    FileText,
    ArrowLeft,
    Clock,
    Calendar,
    MessageSquare,
    CheckCircle,
    XCircle,
    RefreshCw,
    Settings
} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {DateInputButton} from "@/components/ui/DatePickerDialog";

const INITIAL_APPOINTMENTS = [
    {
        user_id: 1,
        appointment_date: "2025-08-10",
        slot_time: "10:00AM-11:00AM",
        client_name: "Rahul Jain",
        client_email: "rahul@example.com",
        client_phone: "9876501234",
        consultation_reason: "Exam stress and sleep issues",
        notes: "Prefers Hindi-speaking counsellor",
        status: "attended", // attended, not-attended, rescheduled
    },
    {
        user_id: 2,
        appointment_date: "2025-08-10",
        slot_time: "10:00AM-11:00AM",
        client_name: "Rahul Jain",
        client_email: "rahul@example.com",
        client_phone: "9876501234",
        consultation_reason: "Exam stress and sleep issues",
        notes: "Prefers Hindi-speaking counsellor",
        status: "not-attended",
    },
    // Add more mock data as needed
];

const ROWS_PER_PAGE = 5;

export default function AppointmentPage() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE);
    const role = sessionStorage.getItem("user-role");
    


    // Load appointments from localStorage on component mount
    useEffect(() => {
        const storedAppointments = localStorage.getItem('appointments');
        if (storedAppointments) {
            setAppointments(JSON.parse(storedAppointments));
        } else {
            // Initialize with default data if no data exists
            localStorage.setItem('appointments', JSON.stringify(INITIAL_APPOINTMENTS));
            setAppointments(INITIAL_APPOINTMENTS);
        }
    }, []);

    // Save appointments to localStorage whenever appointments change
    const saveAppointmentsToStorage = (newAppointments) => {
        localStorage.setItem('appointments', JSON.stringify(newAppointments));
        setAppointments(newAppointments);
    };

    const filtered = appointments.filter((a) => {
        const matchesSearch =
            a.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.client_phone.includes(searchTerm);

        const matchesDateFrom = !dateFrom || a.appointment_date >= dateFrom;
        const matchesDateTo = !dateTo || a.appointment_date <= dateTo;

        const matchesStatus = statusFilter === "all" || a.status === statusFilter;

        return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filtered.length / rowsPerPage);

    const handleDelete = (appt) => {
        const updatedAppointments = appointments.filter(a => a !== appt);
        saveAppointmentsToStorage(updatedAppointments);
    };

    const handleNotes = (appt, idx) => {
        navigate(`/appointments/${idx}/notes`);
    };

    const handleStatusChange = (appt, newStatus) => {
        const updatedAppointments = appointments.map(a =>
            a === appt ? {...a, status: newStatus} : a
        );
        saveAppointmentsToStorage(updatedAppointments);
        console.log(`Status changed to ${newStatus} for appointment with ${appt.client_name}`);
    };

    const handleReschedule = (appt) => {
        // Navigate to reschedule call page with user_id parameter
        navigate(`/reschedule-call/${appt.user_id}`);
    };

    const handleRecommendations = (appt) => {
        navigate(`/appointments/${appt.user_id}/recommendations`);
    };

    // Function to format time with AM/PM
    const formatTimeWithAMPM = (timeString) => {
        if (!timeString) return '';

        // If already in AM/PM format, return as is
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }

        // If it's a time range (contains dash), format both parts
        if (timeString.includes('-')) {
            const [startTime, endTime] = timeString.split('-');
            const formattedStart = formatSingleTime(startTime);
            const formattedEnd = formatSingleTime(endTime);
            return `${formattedStart}-${formattedEnd}`;
        }

        // Single time
        return formatSingleTime(timeString);
    };

    const formatSingleTime = (time) => {
        if (!time) return '';

        // If already has AM/PM, return as is
        if (time.includes('AM') || time.includes('PM')) {
            return time;
        }

        // Handle 24-hour format (HH:MM)
        if (time.includes(':')) {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes}${ampm}`;
        }

        // Handle other formats or return as is
        return time;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'attended':
                return <CheckCircle className="h-4 w-4 text-green-600"/>;
            case 'not-attended':
                return <XCircle className="h-4 w-4 text-red-600"/>;
            case 'rescheduled':
                return <RefreshCw className="h-4 w-4 text-yellow-600"/>;
            default:
                return <Clock className="h-4 w-4 text-gray-600"/>;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'attended':
                return 'Attended';
            case 'not-attended':
                return 'Not Attended';
            case 'rescheduled':
                return 'Rescheduled';
            default:
                return 'Pending';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'attended':
                return 'bg-green-100 text-green-800';
            case 'not-attended':
                return 'bg-red-100 text-red-800';
            case 'rescheduled':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {role !== "counsellor" && <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className=" h-4 w-4"/>
                Back
            </Button>}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Appointments</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Manage and view all your scheduled appointments</p>
                </div>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search by client name, email, or phone"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <DateInputButton
                            value={dateFrom}
                            onChange={setDateFrom}
                            placeholder="From date"
                            title="Select From Date"
                            className="md:w-48"
                        />
                        <div className="mt-1.5 text-gray-500">to</div>
                        <DateInputButton
                            value={dateTo}
                            onChange={setDateTo}
                            placeholder="To date"
                            title="Select To Date"
                            className="md:w-48"
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger
                                className="w-full md:w-48 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700">
                                <SelectValue placeholder="All Status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-gray-700 hover:bg-gray-100">All
                                    Status</SelectItem>
                                <SelectItem value="attended"
                                            className="text-gray-700 hover:bg-gray-100">Attended</SelectItem>
                                <SelectItem value="not-attended" className="text-gray-700 hover:bg-gray-100">Not
                                    Attended</SelectItem>
                                <SelectItem value="rescheduled"
                                            className="text-gray-700 hover:bg-gray-100">Rescheduled</SelectItem>
                            </SelectContent>
                        </Select>

                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-600">
                                {/*<th className="py-4 px-2 font-medium">#</th>*/}
                                <th className="py-4 px-2 font-medium">#</th>
                                <th className="py-4 px-2 font-medium">Date</th>
                                <th className="py-4 px-2 font-medium">Slot</th>
                                <th className="py-4 px-2 font-medium">Client Name</th>
                                <th className="py-4 px-2 font-medium">Email</th>
                                <th className="py-4 px-2 font-medium">Phone</th>
                                <th className="py-4 px-2 font-medium">Reason</th>
                                <th className="py-4 px-2 font-medium">Status</th>
                                <th className="py-4 px-2 font-medium">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center text-gray-400 py-8">No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((a, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        {/*<td className="py-4 px-2">{page * rowsPerPage + idx + 1}</td>*/}
                                        <td className="py-4 px-2">{a.user_id}</td>
                                        <td className="py-4 px-2">{a.appointment_date}</td>
                                        <td className="py-4 px-2">{formatTimeWithAMPM(a.slot_time)}</td>
                                        <td className="py-4 px-2">{a.client_name}</td>
                                        <td className="py-4 px-2">{a.client_email}</td>
                                        <td className="py-4 px-2">{a.client_phone}</td>
                                        <td className="py-4 px-2">{a.consultation_reason}</td>
                                        <td className="py-4 px-2">
                                            <Badge className={
                                                a.status === 'attended'
                                                    ? 'bg-blue-100 text-blue-800 transition-colors duration-150 hover:bg-[#012765] hover:text-white'
                                                    : a.status === 'not-attended'
                                                        ? 'bg-yellow-200 text-yellow-700 transition-colors duration-150 hover:bg-[#012765] hover:text-white'
                                                        : 'bg-gray-200 text-gray-700 transition-colors duration-150 hover:bg-[#012765] hover:text-white'
                                            }>
                                                {getStatusText(a.status)}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    {/* Status Submenu */}
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-yellow-500" />
                                                            Status
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(a, 'attended')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="h-4 w-4 text-green-600"/>
                                                                Attended
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(a, 'not-attended')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <XCircle className="h-4 w-4 text-red-600"/>
                                                                Not Attended
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(a, 'rescheduled')}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <RefreshCw className="h-4 w-4 text-yellow-600"/>
                                                                Rescheduled
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

                                                    <DropdownMenuSeparator/>

                                                    {/* Reschedule Call */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleReschedule(a)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Calendar className="h-4 w-4"/>
                                                        Reschedule Call
                                                    </DropdownMenuItem>

                                                    {/* Notes */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleNotes(a, idx)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <FileText className="h-4 w-4"/>
                                                        Notes
                                                    </DropdownMenuItem>

                                                    {/* Recommendations */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleRecommendations(a)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <MessageSquare className="h-4 w-4"/>
                                                        Recommendations
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator/>

                                                    {/* Delete */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(a)}
                                                        className="text-red-600 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
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
                                className="font-medium">{filtered.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filtered.length)}</span>
                            <span className="text-gray-400">of</span>
                            <span className="font-semibold text-[#012765] text-base ml-2">{filtered.length}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                aria-label="Next page"
                            >
                                &#62;
                            </button>
                            <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={rowsPerPage}
                                onChange={e => {
                                    setRowsPerPage(Number(e.target.value));
                                    setPage(0);
                                }}
                                className="w-16 h-8 border-gray-200 rounded-md shadow-sm text-gray-700 text-sm focus:ring-2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>


        </div>
    );
} 