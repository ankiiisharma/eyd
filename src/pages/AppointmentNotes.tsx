import {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

import {format} from "date-fns";
import {ArrowLeft, Search, Calendar, Clock} from "lucide-react";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/components/ui/dropdown-menu";
import {MoreHorizontal, Eye, X} from "lucide-react";
import {DateInputButton} from "@/components/ui/DatePickerDialog";
import {TimeInputButton} from "@/components/ui/TimePickerDialog";

interface Note {
    note: string;
    createdAt: string;
    counsellor: string;
}

const API_SINGLE = (id: string | number) => `https://interactapiverse.com/mahadevasth/appointments/${id}`;

// Helper function to format time in AM/PM format
const formatTimeAMPM = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
};

// Helper function to get current time in HH:mm format (IST: UTC+5:30)
const getCurrentTime = () => {
    const now = new Date();
    // Add 5 hours and 30 minutes for IST
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const hours = istTime.getHours().toString().padStart(2, '0');
    const minutes = istTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export default function AppointmentNotes() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<Note>({
        note: "",
        createdAt: "",
        counsellor: "Admin User",
    });
    const [appointmentName, setAppointmentName] = useState("");

    // Pagination and filtering states
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({from: null, to: null});

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedNoteIdx, setSelectedNoteIdx] = useState<number | null>(null);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

    // Validation states
    const [errors, setErrors] = useState<{ note?: string; createdAt?: string }>({});

    useEffect(() => {
        if (id) {
            const stored = localStorage.getItem(`appointment-notes-${id}`);
            if (stored) setNotes(JSON.parse(stored));

            // Get client name from actual appointments in localStorage
            const storedAppointments = localStorage.getItem('appointments');
            if (storedAppointments) {
                try {
                    const appointments = JSON.parse(storedAppointments);
                    const appointmentIndex = parseInt(id as string);

                    // Find appointment by index or by user_id
                    const appointment = appointments[appointmentIndex] || appointments.find(appt => appt.user_id === appointmentIndex);

                    if (appointment && appointment.client_name) {
                        setAppointmentName(appointment.client_name);
                    } else {
                        // Fallback to mock data if not found
                        const MOCK_APPOINTMENTS = [
                            {
                                user_id: 1,
                                appointment_date: "2025-08-10",
                                slot_time: "10:00AM-11:00AM",
                                client_name: "Rahul Jain",
                                client_email: "rahul@example.com",
                                client_phone: "9876501234",
                                consultation_reason: "Exam stress and sleep issues",
                                notes: "Prefers Hindi-speaking counsellor",
                            },
                            {
                                user_id: 1,
                                appointment_date: "2025-08-10",
                                slot_time: "10:00AM-11:00AM",
                                client_name: "Rahul Jain",
                                client_email: "rahul@example.com",
                                client_phone: "9876501234",
                                consultation_reason: "Exam stress and sleep issues",
                                notes: "Prefers Hindi-speaking counsellor",
                            },
                        ];

                        if (MOCK_APPOINTMENTS[appointmentIndex]) {
                            setAppointmentName(MOCK_APPOINTMENTS[appointmentIndex].client_name);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing appointments from localStorage:', error);
                    // Fallback to mock data
                    const MOCK_APPOINTMENTS = [
                        {
                            user_id: 1,
                            appointment_date: "2025-08-10",
                            slot_time: "10:00AM-11:00AM",
                            client_name: "Rahul Jain",
                            client_email: "rahul@example.com",
                            client_phone: "9876501234",
                            consultation_reason: "Exam stress and sleep issues",
                            notes: "Prefers Hindi-speaking counsellor",
                        },
                    ];

                    const appointmentIndex = parseInt(id as string);
                    if (MOCK_APPOINTMENTS[appointmentIndex]) {
                        setAppointmentName(MOCK_APPOINTMENTS[appointmentIndex].client_name);
                    }
                }
            } else {
                // Fallback to mock data if no appointments in localStorage
                const MOCK_APPOINTMENTS = [
                    {
                        user_id: 1,
                        appointment_date: "2025-08-10",
                        slot_time: "10:00AM-11:00AM",
                        client_name: "Rahul Jain",
                        client_email: "rahul@example.com",
                        client_phone: "9876501234",
                        consultation_reason: "Exam stress and sleep issues",
                        notes: "Prefers Hindi-speaking counsellor",
                    },
                ];

                const appointmentIndex = parseInt(id as string);
                if (MOCK_APPOINTMENTS[appointmentIndex]) {
                    setAppointmentName(MOCK_APPOINTMENTS[appointmentIndex].client_name);
                }
            }
        }
    }, [id]);

    // Filter notes based on search term and date range
    const filteredNotes = notes.filter((note) => {
        const matchesSearch =
            note.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.counsellor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointmentName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateRange.from && dateRange.to) {
            const noteDate = new Date(note.createdAt);
            matchesDate = noteDate >= dateRange.from && noteDate <= dateRange.to;
        } else if (dateRange.from) {
            const noteDate = new Date(note.createdAt);
            matchesDate = noteDate >= dateRange.from;
        } else if (dateRange.to) {
            const noteDate = new Date(note.createdAt);
            matchesDate = noteDate <= dateRange.to;
        }

        return matchesSearch && matchesDate;
    });

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [searchTerm, dateRange]);

    // Paginate notes
    const paginatedNotes = filteredNotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filteredNotes.length / rowsPerPage);

    const handleInput = (e: any) => {
        const {id, value} = e.target;
        setForm((f) => ({...f, [id]: value}));

        // Clear error when user starts typing
        if (errors[id as keyof typeof errors]) {
            setErrors(prev => ({...prev, [id]: undefined}));
        }
    };

    const validateForm = () => {
        const newErrors: { note?: string; createdAt?: string } = {};

        if (!form.note.trim()) {
            newErrors.note = "Note is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const noteData = {
            ...form,
            createdAt: form.createdAt,
            counsellor: "Admin User"
        };

        const newNotes = [...notes, noteData];
        setNotes(newNotes);
        localStorage.setItem(`appointment-notes-${id}`, JSON.stringify(newNotes));
        setModalOpen(false);
        setForm({note: "", createdAt: "", counsellor: "Admin User"});
        setErrors({});
        setSuccessDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className=" h-4 w-4"/>
                Back
            </Button>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Appointments Notes</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">All notes for Appointment #{id}</p>
                </div>
                <Button className="bg-[#012765] text-white" onClick={() => {
                    setForm({
                        note: "",
                        createdAt: new Date().toISOString().slice(0, 16).replace('T', 'T'),
                        counsellor: "Admin User"
                    });
                    setModalOpen(true);
                }}>
                    + Add Note
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search by note content, counsellor, or client name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full md:w-80 flex flex-col justify-center">
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

            <Card className="border-0 shadow-lg">
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-600">
                                <th className="text-left py-4 px-2 font-medium text-gray-600">#</th>
                                <th className="py-3 px-2">Client Name</th>
                                <th className="py-3 px-2">Counsellor Name</th>
                                <th className="py-3 px-2">Created At</th>
                                <th className="py-3 px-2">Note</th>
                                <th className="py-3 px-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedNotes.map((n, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="py-4 px-2">{page * rowsPerPage + idx + 1}</td>
                                    <td className="py-3 px-2 font-medium text-gray-800">{appointmentName}</td>
                                    <td className="py-3 px-2 text-gray-600">{n.counsellor}</td>
                                    <td className="py-3 px-2 text-gray-600">{new Date(n.createdAt).toLocaleString()}</td>
                                    <td className="py-3 px-2 text-gray-900 max-w-xs truncate"
                                        title={n.note}>{n.note}</td>
                                    <td className="py-3 px-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" aria-label="Actions">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedNoteIdx(idx);
                                                        setViewDialogOpen(true);
                                                    }}
                                                    className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4"/> View
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredNotes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-400 py-8">No notes found.</td>
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
                                className="font-medium">{filteredNotes.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredNotes.length)}</span>
                            <span className="text-gray-400">of</span>
                            <span
                                className="font-semibold text-[#012765] text-base ml-2">{filteredNotes.length}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                aria-label="Next page"
                            >
                                &#62;
                            </button>
                            <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                            <Select value={rowsPerPage === filteredNotes.length ? 'All' : String(rowsPerPage)}
                                    onValueChange={val => {
                                        if (val === 'All') {
                                            setRowsPerPage(filteredNotes.length || 1);
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
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
                    <div className="bg-[#012765] px-6 py-4 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl font-bold">
                                Add Note
                            </DialogTitle>
                        </DialogHeader>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => {
                                setModalOpen(false);
                                setErrors({});
                                setForm({note: "", createdAt: "", counsellor: "Admin User"});
                            }}
                            className="ml-2 rounded-full p-1 hover:bg-[#FF7119] transition-colors flex items-center justify-center"
                            style={{lineHeight: 0}}
                        >
                            <X className="h-6 w-6 text-white"/>
                        </button>
                    </div>
                    <form className="space-y-6 px-6 py-6 bg-white" onSubmit={(e) => { 
                        e.preventDefault(); 
                        handleSubmit(); 
                    }}>
                        <div>
                            <Label htmlFor="note" className="block text-md font-semibold mb-2 text-[#012765]">Note</Label>
                            <Textarea
                                id="note"
                                value={form.note}
                                onChange={handleInput}
                                placeholder="Enter note..."
                                className={`min-h-[80px] border-gray-300 focus:ring-2 focus:ring-[#FF6600] focus:border-transparent ${errors.note ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {errors.note && (
                                <p className="text-red-500 text-sm mt-1">{errors.note}</p>
                            )}
                        </div>
                        
                        <div>
                            <Label htmlFor="createdAt" className="block text-md font-semibold mb-4 text-[#012765]">Created At</Label>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                    <div className="h-10 flex items-center justify-between border border-gray-300 rounded-lg bg-gray-50 px-3 text-gray-700">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[#FF6600]" />
                                            {form.createdAt.split('T')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                    <div className="h-10 flex items-center justify-between border border-gray-300 rounded-lg bg-gray-50 px-3 text-gray-700">
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-[#FF6600]" />
                                            {formatTimeAMPM(form.createdAt.split('T')[1] || getCurrentTime())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                            <Button 
                                type="button"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    setModalOpen(false);
                                    setErrors({});
                                    setForm({note: "", createdAt: "", counsellor: "Admin User"});
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                className="bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">Note Details</DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewDialogOpen(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                    {selectedNoteIdx !== null && paginatedNotes[selectedNoteIdx] && (() => {
                        const selectedNote = paginatedNotes[selectedNoteIdx];
                        return (
                            <div>
                                <table className="min-w-full text-sm border border-gray-300 rounded-lg bg-white">
                                    <tbody>
                                    <tr className="border-b border-gray-200">
                                        <td className="w-1/3 px-4 py-3 font-medium text-gray-700 border-r">Client Name
                                        </td>
                                        <td className="w-2/3 px-4 py-3 text-gray-900">{appointmentName}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="w-1/3 px-4 py-3 font-medium text-gray-700 border-r">Counsellor
                                            Name
                                        </td>
                                        <td className="w-2/3 px-4 py-3 text-gray-900">{selectedNote.counsellor}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="w-1/3 px-4 py-3 font-medium text-gray-700 border-r">Created At
                                        </td>
                                        <td className="w-2/3 px-4 py-3 text-gray-900">
                                            {new Date(selectedNote.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-1/3 px-4 py-3 font-medium text-gray-700 align-top border-r">Note</td>
                                        <td className="w-2/3 px-4 py-3 text-gray-900">
                                            <div className="max-h-[400px] overflow-y-auto whitespace-pre-line">
                                                {selectedNote.note}
                                            </div>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>


                        );
                    })()}
                </DialogContent>
            </Dialog>
            
            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent className="max-w-md mx-auto">
                    <div className="text-center space-y-6 p-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#012765]">
                                Note Added Successfully!
                            </h2>
                            <p className="text-[#012765] text-sm">
                                Thank you for adding the note. It has been saved successfully!
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
        </div>
    );
}