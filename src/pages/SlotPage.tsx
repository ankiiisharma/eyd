import React, {useEffect, useState, useMemo, useCallback} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Plus, X, List, Trash} from "lucide-react";
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import {format} from 'date-fns/format';
import {parse} from 'date-fns/parse';
import {startOfWeek} from 'date-fns/startOfWeek';
import {getDay} from 'date-fns/getDay';
import {enUS} from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {addMinutes} from 'date-fns';
import {DateInputButton} from "@/components/ui/DatePickerDialog";
import {TimeInputButton} from "@/components/ui/TimePickerDialog";
import {useUserContext} from "@/UserContext";

const locales = {'en-US': enUS};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), {weekStartsOn: 0}),
    getDay,
    locales,
});

// API slot structure
interface ApiSlot {
    user_id: number;
    slot_date: string;
    available_slots: string[];
}

// For calendar rendering
interface Slot {
    id: string;
    date: string; // yyyy-mm-dd
    startTime: string; // HH:mm
    endTime: string; // HH:mm
}

function formatTime12h(time: string) {
    if (!time) return "";
    const [h, m] = time.split(":");
    let hour = parseInt(h ?? "0", 10);
    const minute = (m ?? "00").replace(/\D/g, "").padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const displayHour = hour === 0 ? 12 : hour;
    return `${displayHour}:${minute} ${ampm}`;
}

function getTimeOfDayBorderColor(time: string) {
    if (!time) return '#bdbdbd';
    const [h] = time.split(":");
    const hour = parseInt(h, 10);
    if (hour >= 5 && hour < 12) return '#FFD600'; // Morning - yellow
    if (hour >= 12 && hour < 17) return '#FF7119'; // Afternoon - orange
    if (hour >= 17 && hour < 21) return '#7C4DFF'; // Evening - purple
    return '#1976D2'; // Night - blue
}

function SlotPage() {
    const {user} = useUserContext();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogForceOpen, setDialogForceOpen] = useState(false);
    const [editSlotDate, setEditSlotDate] = useState<string>("");
    const [slotTimes, setSlotTimes] = useState<{ startTime: string; endTime: string }[]>([{
        startTime: "",
        endTime: ""
    }]);
    const [errors, setErrors] = useState<{ [k: string]: string }>({});
    const [filterDate, setFilterDate] = useState<string>("");
    const [filterStartTime, setFilterStartTime] = useState<string>("");
    const [filterEndTime, setFilterEndTime] = useState<string>("");
    const [multiSlotDialogOpen, setMultiSlotDialogOpen] = useState(false);
    const [multiSlotDate, setMultiSlotDate] = useState<string | null>(null);
    const [timeOfDayFilter, setTimeOfDayFilter] = useState('all');
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

    const [activeUserId, setActiveUserId] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return sessionStorage.getItem("user-token");
    });

    const formatDateKey = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const startOfToday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    const normalizeDate = useCallback((date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }, []);

    const buildDateWithTime = useCallback((dateStr: string, timeStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const [rawHour, rawMinute] = (timeStr || "").split(":");
        const parsedHour = parseInt(rawHour ?? "", 10);
        const parsedMinute = parseInt(rawMinute ?? "", 10);
        const hour = Number.isNaN(parsedHour) ? 0 : parsedHour;
        const minute = Number.isNaN(parsedMinute) ? 0 : parsedMinute;
        return new Date(year, (month ?? 1) - 1, day ?? 1, hour, minute, 0, 0);
    }, []);

    const getUserSlotsEndpoint = useCallback(
        (userId: string) => `https://interactapiverse.com/mahadevasth/user-slots/${userId}`,
        []
    );

    const transformApiSlots = useCallback((data: ApiSlot[]): Slot[] => {
        const flat: Slot[] = [];
        data.forEach(apiSlot => {
            apiSlot.available_slots.forEach(range => {
                const [start, end] = range.split("-");
                const parseTime = (t: string) => {
                    const cleaned = t.trim().toUpperCase();
                    const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);

                    if (!match) {
                        return "";
                    }

                    let [, hourStr, minuteStr, meridiem] = match;
                    let hour = parseInt(hourStr ?? "0", 10);
                    const minute = minuteStr ?? "00";

                    if (meridiem === "PM" && hour !== 12) hour += 12;
                    if (meridiem === "AM" && hour === 12) hour = 0;

                    return `${hour.toString().padStart(2, "0")}:${minute}`;
                };
                const parsedStart = parseTime(start);
                const parsedEnd = parseTime(end);
                if (!parsedStart || !parsedEnd) {
                    return;
                }
                flat.push({
                    id: `${apiSlot.slot_date}-${range}`,
                    date: apiSlot.slot_date,
                    startTime: parsedStart,
                    endTime: parsedEnd,
                });
            });
        });
        return flat;
    }, []);

    useEffect(() => {
        if (user?.id) {
            setActiveUserId(user.id.toString());
        } else if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("user-token");
            if (stored) setActiveUserId(stored);
        }
    }, [user]);

    const fetchSlotsForUser = useCallback(async (userId: string) => {
        try {
            const response = await fetch(getUserSlotsEndpoint(userId));
            const json = await response.json();
            const slotsData: ApiSlot[] = Array.isArray(json) ? json : json?.data || [];
            setSlots(transformApiSlots(slotsData));
        } catch (error) {
            console.error("Failed to fetch slots:", error);
            setSlots([]);
        }
    }, [getUserSlotsEndpoint, transformApiSlots]);

    useEffect(() => {
        if (!activeUserId) return;
        fetchSlotsForUser(activeUserId);
    }, [activeUserId, fetchSlotsForUser]);

    // Filtering logic (add time of day filter)
    const filteredSlots = useMemo(() => {
        return slots.filter(slot => {
            if (filterDate && slot.date !== filterDate) return false;
            if (filterStartTime && filterEndTime) {
                const slotStart = slot.startTime;
                const slotEnd = slot.endTime;
                if (slotEnd < filterStartTime || slotStart > filterEndTime) return false;
            }
            if (timeOfDayFilter !== 'all') {
                const [h] = slot.startTime.split(":");
                const hour = parseInt(h, 10);
                if (timeOfDayFilter === 'morning' && !(hour >= 5 && hour < 12)) return false;
                if (timeOfDayFilter === 'afternoon' && !(hour >= 12 && hour < 17)) return false;
                if (timeOfDayFilter === 'evening' && !(hour >= 17 && hour < 21)) return false;
                if (timeOfDayFilter === 'night' && !(hour >= 21 || hour < 5)) return false;
            }
            return true;
        });
    }, [slots, filterDate, filterStartTime, filterEndTime, timeOfDayFilter]);

    // Calendar events
    const events = useMemo(() => filteredSlots.map(slot => {
        const start = buildDateWithTime(slot.date, slot.startTime);
        const end = buildDateWithTime(slot.date, slot.endTime);

        return {
            id: slot.id,
            title: `${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)}`,
            start,
            end,
            slot,
        };
    }), [filteredSlots, buildDateWithTime]);

    // Helper: get all slots for a date (yyyy-mm-dd)
    const getSlotsForDate = (dateStr: string) =>
        filteredSlots.filter(slot => slot.date === dateStr);

    // Custom month cell wrapper
    const CustomDateCellWrapper = (props: any) => {
        const date = props.value;
        const dateStr = format(date, "yyyy-MM-dd");
        const slotsForDay = getSlotsForDate(dateStr);
        const isMulti = slotsForDay.length > 1;
        if (!isMulti) return props.children;
        // Clone the child and add the icon button absolutely positioned
        return React.cloneElement(
            props.children,
            {
                style: {...props.children.props.style, position: 'relative'},
            },
            <>
                {props.children.props.children}
                <button
                    type="button"
                    aria-label="Show all slots"
                    onClick={e => {
                        e.stopPropagation();
                        setMultiSlotDate(dateStr);
                        setMultiSlotDialogOpen(true);
                    }}
                    style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: 2,
                        cursor: "pointer",
                        boxShadow: "0 1px 4px #0001",
                        zIndex: 2,
                    }}
                >
                    <List size={16} color="#FF7119"/>
                </button>
            </>
        );
    };

    const openCreateDialog = (date?: Date) => {
        let initialDate: string | "";
        if (date) {
            const normalized = normalizeDate(date);
            initialDate = normalizeDate(normalized) < startOfToday ? formatDateKey(startOfToday) : formatDateKey(normalized);
        } else {
            initialDate = formatDateKey(startOfToday);
        }
        setEditSlotDate(initialDate);
        setSlotTimes([{startTime: "", endTime: ""}]);
        setErrors({});
        setDialogOpen(true);
    };

    const handleAddTimeRange = () => {
        setSlotTimes([...slotTimes, {startTime: "", endTime: ""}]);
    };
    const handleRemoveTimeRange = (idx: number) => {
        setSlotTimes(slotTimes.filter((_, i) => i !== idx));
    };
    const clearError = useCallback((key: string) => {
        setErrors(prev => {
            if (!prev[key]) return prev;
            const {[key]: _, ...rest} = prev;
            return rest;
        });
    }, []);

    const handleTimeChange = (idx: number, field: 'startTime' | 'endTime', value: string) => {
        setSlotTimes(slotTimes.map((t, i) => i === idx ? {...t, [field]: value} : t));
        clearError(`${field}${idx}`);
    };

    const validate = () => {
        const newErrors: { [k: string]: string } = {};
        if (!editSlotDate) newErrors.date = "Date is required";
        if (editSlotDate) {
            const selected = normalizeDate(new Date(editSlotDate));
            if (selected < startOfToday) {
                newErrors.date = "Date cannot be in the past";
            }
        }
        slotTimes.forEach((t, idx) => {
            if (!t.startTime) newErrors[`startTime${idx}`] = "Start time required";
            if (!t.endTime) newErrors[`endTime${idx}`] = "End time required";
            if (t.startTime && t.endTime) {
                const start = new Date(`2000-01-01T${t.startTime}`);
                const end = new Date(`2000-01-01T${t.endTime}`);
                if (end <= addMinutes(start, 29)) {
                    newErrors[`endTime${idx}`] = "Slot must be at least 30 minutes.";
                }
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (!activeUserId) {
            console.error("No active user id found for slot submission");
            return;
        }
        // Format available_slots as ["10:00AM-11:00AM", ...]
        const available_slots = slotTimes.map(t => {
            const to12h = (time: string) => formatTime12h(time).replace(/\s+/g, " ").trim();
            return `${to12h(t.startTime)}-${to12h(t.endTime)}`;
        });
        const payload = {
            user_id: parseInt(activeUserId, 10),
            slot_date: editSlotDate,
            available_slots,
        };
        try {
            await fetch(getUserSlotsEndpoint(activeUserId), {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            await fetchSlotsForUser(activeUserId);
        } catch (error) {
            console.error("Failed to create slot:", error);
        }
        setDialogOpen(false);
        setSuccessDialogOpen(true);
    };

    // Legend/filter options
    const timeOptions = [
        {label: 'Morning', value: 'morning', color: '#FFF9C4', text: '#B59F00', range: '5am-12pm'},
        {label: 'Afternoon', value: 'afternoon', color: '#FFE0B2', text: '#FF7119', range: '12pm-5pm'},
        {label: 'Evening', value: 'evening', color: '#D1C4E9', text: '#5E35B1', range: '5pm-9pm'},
        {label: 'Night', value: 'night', color: '#BBDEFB', text: '#1976D2', range: '9pm-5am'},
        {label: 'Other', value: 'other', color: '#C8E6C9', text: '#388E3C', range: ''},
        {label: 'All', value: 'all', color: '#e5e7eb', text: '#012765', range: ''},
    ];
    const activeOpt = timeOptions.find(opt => opt.value === timeOfDayFilter) || timeOptions[0];
    const slotCount = filteredSlots.length;

    return (
        <div className="font-sans min-h-screen p-2">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#FF7119]">Slot Management</h1>
                <Button onClick={() => openCreateDialog()}
                        className="bg-[#FF7119] hover:bg-[#ff8c42] text-white font-semibold flex items-center gap-2 shadow-md rounded-lg px-5 py-2 text-base">
                    <Plus className="h-5 w-5"/>
                    Create Slot
                </Button>
            </div>
            {/* UI: Color legend and time-of-day filter */}

            {/* Filter Bar */}
            <div className="flex items-center gap-4 mb-6 ">
                <div>
                    <label className="block text-xs font-semibold text-[#012765] mb-1">Filter by Date</label>
                    <DateInputButton
                        value={filterDate}
                        onChange={setFilterDate}
                        placeholder="Filter by date"
                        title="Select Filter Date"
                        className="w-38"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#012765] mb-1">Start Time</label>
                    <TimeInputButton
                        value={filterStartTime}
                        onChange={setFilterStartTime}
                        placeholder="Start time"
                        title="Select Start Time"
                        className="w-32"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#012765] mb-1">End Time</label>
                    <TimeInputButton
                        value={filterEndTime}
                        onChange={setFilterEndTime}
                        placeholder="End time"
                        title="Select End Time"
                        className="w-32"
                    />
                </div>
                <Button variant="outline"
                        className="ml-2 mt-5 rounded-lg border-[#FF7119] text-[#FF7119] hover:bg-[#FF7119] hover:text-white transition-colors font-semibold"
                        onClick={() => {
                            setFilterDate("");
                            setFilterStartTime("");
                            setFilterEndTime("");
                        }}>Clear Filters</Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                {/* Clickable color legend */}
                <div className="flex flex-wrap items-center gap-3">
                    {timeOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTimeOfDayFilter(opt.value)}
                            style={{
                                background: timeOfDayFilter === opt.value ? opt.color : '#fff',
                                color: timeOfDayFilter === opt.value ? opt.text : '#333',
                                border: `1.5px solid ${opt.color}`,
                                borderRadius: 4,
                                fontWeight: 700,
                                fontSize: 13,
                                padding: '6px 16px',
                                display: 'inline-block',
                                boxShadow: timeOfDayFilter === opt.value ? '0 1px 4px #0001' : 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {opt.label}
                            {opt.range && <span className="text-xs font-normal ml-1 text-gray-500">({opt.range})</span>}
                        </button>
                    ))}
                </div>
                {/* Active filter badge with slot count */}
                <div className="flex items-center gap-2">
                    <span
                        style={{
                            background: activeOpt.color,
                            color: activeOpt.text,
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 14,
                            padding: '10px 28px',
                            border: `1.5px solid ${activeOpt.color}`,
                            display: 'inline-block',
                            minWidth: 110,
                            textAlign: 'center',
                        }}
                    >
                        {activeOpt.label}
                        {activeOpt.range && <span className="text-xs font-normal ml-1">({activeOpt.range})</span>}
                        <span className="ml-2 text-xs font-semibold" style={{color: activeOpt.text}}>
                            {slotCount} slot{slotCount === 1 ? '' : 's'}
                        </span>
                    </span>
                </div>
            </div>
            {/* Calendar Container */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{height: 600, fontFamily: 'inherit'}}
                    views={["month"]}
                    defaultView="month"
                    onSelectSlot={slotInfo => {
                        const selectedDate = normalizeDate(slotInfo.start);
                        if (selectedDate < startOfToday) {
                            return;
                        }
                        openCreateDialog(slotInfo.start);
                    }}
                    selectable
                    onSelectEvent={event => {
                        const slot = event.slot;
                        setEditSlotDate(slot.date);
                        setSlotTimes([{startTime: slot.startTime, endTime: slot.endTime}]);
                        setDialogOpen(true);
                    }}
                    popup
                    components={{
                        event: ({event}) => {
                            // Determine background and text color by time of day
                            const getTimeOfDayColors = (time: string) => {
                                if (!time) return {bg: '#bdbdbd', text: '#388E3C'};
                                const [h] = time.split(":");
                                const hour = parseInt(h, 10);
                                if (hour >= 5 && hour < 12) return {bg: '#FFF9C4', text: '#B59F00'}; // Morning - yellow bg, dark yellow text
                                if (hour >= 12 && hour < 17) return {bg: '#FFE0B2', text: '#FF7119'}; // Afternoon - orange bg, orange text
                                if (hour >= 17 && hour < 21) return {bg: '#D1C4E9', text: '#5E35B1'}; // Evening - purple bg, purple text
                                if (hour >= 21 || hour < 5) return {bg: '#BBDEFB', text: '#1976D2'}; // Night/Late night - blue bg, blue text
                                return {bg: '#C8E6C9', text: '#388E3C'}; // Default - green
                            };
                            const {bg, text} = getTimeOfDayColors(event.slot.startTime);
                            return (
                                <span
                                    className="block px-3 py-1 rounded-lg mb-1"
                                    style={{
                                        background: bg,
                                        color: text,
                                        fontWeight: 700,
                                        fontSize: '1em',
                                        borderRadius: '10px',
                                        minHeight: 22,
                                        border: 'none',
                                        marginBottom: 4,
                                        letterSpacing: 1,
                                        display: 'inline-block',
                                    }}
                                >
                                    <span className="font-bold" style={{color: text}}>{event.title}</span>
                                </span>
                            );
                        },
                        month: {
                            dateCellWrapper: CustomDateCellWrapper,
                        },
                    }}
                    eventPropGetter={() => ({
                        style: {
                            background: 'none',
                            border: 'none',
                            boxShadow: 'none',
                            padding: 0
                        }
                    })}
                />
            </div>
            {/* Dialog ... unchanged ... */}
            <Dialog
                open={dialogOpen}
                onOpenChange={open => {
                    if (!open && !dialogForceOpen) return;
                    setDialogOpen(open);
                    setDialogForceOpen(false);
                }}
                modal={true}
            >
                <DialogContent className="max-w-lg rounded-2xl p-0 ">
                    <div className="bg-[#012765] px-6 py-4 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl font-bold">
                                Create Slot
                            </DialogTitle>
                        </DialogHeader>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => {
                                setDialogForceOpen(true);
                                setDialogOpen(false);
                            }}
                            className="ml-2 rounded-full p-1 hover:bg-[#FF7119] transition-colors flex items-center justify-center"
                            style={{lineHeight: 0}}
                        >
                            <X className="h-6 w-6 text-white"/>
                        </button>
                    </div>
                    <form className="space-y-6 px-6 py-6 bg-white" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-[#012765]">Date</label>
                            <DateInputButton
                                value={editSlotDate}
                                onChange={(value) => {
                                    setEditSlotDate(value);
                                    clearError("date");
                                }}
                                placeholder="Select date"
                                title="Select Slot Date"
                                disablePast
                            />
                            {errors.date && (
                                <div className="text-red-500 text-xs mt-1">{errors.date}</div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-[#012765]">Time Slots</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-[#012765] text-[#012765] hover:bg-[#012765] hover:text-white transition-colors text-xs"
                                    onClick={handleAddTimeRange}
                                >
                                    Add Time Range
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                {slotTimes.map((t, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold mb-2 text-[#012765]">
                                                Start Time
                                            </label>
                                            <TimeInputButton
                                                value={t.startTime}
                                                onChange={(time) => handleTimeChange(idx, 'startTime', time)}
                                                placeholder="Start time"
                                                title="Select Start Time"
                                            />
                                            {errors[`startTime${idx}`] && (
                                                <div className="text-red-500 text-xs mt-1">{errors[`startTime${idx}`]}</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold mb-2 text-[#012765]">
                                                End Time
                                            </label>
                                            <TimeInputButton
                                                value={t.endTime}
                                                onChange={(time) => handleTimeChange(idx, 'endTime', time)}
                                                placeholder="End time"
                                                title="Select End Time"
                                            />
                                            {errors[`endTime${idx}`] && (
                                                <div className="text-red-500 text-xs mt-1">{errors[`endTime${idx}`]}</div>
                                            )}
                                        </div>
                                        {slotTimes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTimeRange(idx)}
                                                className="mt-8 p-2 rounded-full hover:bg-red-100 transition-colors"
                                                title="Remove time slot"
                                            >
                                                <Trash className="h-4 w-4 text-red-600"/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    setDialogForceOpen(true);
                                    setDialogOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                className="bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                            >
                                Create Slot
                            </Button>
                        </div>
                    </form>
                        {/* Delete button in left bottom corner, only in edit mode */}
                        {/* This section is removed as per the new_code, as the dialog is now for creating a single slot */}
                </DialogContent>
            </Dialog>
            {/* Multi-slot dialog */}
            <Dialog open={multiSlotDialogOpen} onOpenChange={setMultiSlotDialogOpen}>
                <DialogContent className="rounded-2xl p-0 overflow-hidden"
                               style={{width: 360, maxWidth: '90vw', overflow: 'auto'}}>
                    <div className="bg-[#012765] px-6 py-4 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl font-bold">
                                All Slots for {multiSlotDate}
                            </DialogTitle>
                        </DialogHeader>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => setMultiSlotDialogOpen(false)}
                            className="ml-2 rounded-full p-1 hover:bg-[#FF7119] transition-colors"
                            style={{lineHeight: 0}}
                        >
                            <X className="h-6 w-6 text-white"/>
                        </button>
                    </div>
                    <div className="px-6 py-6 bg-white" style={{maxHeight: 320, overflowY: 'auto'}}>
                        {multiSlotDate && getSlotsForDate(multiSlotDate).length > 0 ? (
                            <ul className="space-y-2">
                                {getSlotsForDate(multiSlotDate).map(slot => (
                                    <li key={slot.id} className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-500">No slots for this day.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent className="max-w-md mx-auto">
                    <div className="text-center space-y-6 p-6">
                        <div className="space-y-4">
                            <h2 className="text-[20px] font-bold text-[#012765]">
                                Slot Created Successfully!
                            </h2>
                            <p className="text-[#012765] text-sm">
                                Thank you for creating the slot. It has been saved successfully!
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
            
            {/* Style calendar navigation buttons */}
            <style>{`
                .rbc-toolbar button {
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    background: #fff;
                    color: #012765;
                    font-weight: 600;
                    padding: 6px 18px;
                    margin: 0 2px;
                    box-shadow: 0 1px 2px #0001;
                    transition: background 0.2s, color 0.2s;
                }
                .rbc-toolbar button:hover, .rbc-toolbar button:focus {
                    background: #FF7119;
                    color: #fff;
                    border-color: #FF7119;
                }
                .rbc-toolbar .rbc-active {
                    background: #FF7119;
                    color: #fff;
                    border-color: #FF7119;
                }
            `}</style>
        </div>
    );
}

export default SlotPage;