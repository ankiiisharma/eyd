import React, {useState, useEffect} from 'react';
import {format as formatDate, addDays, parse, addHours} from 'date-fns';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Calendar, User, Mail, FileText, GraduationCap, Star, ChevronLeft, ChevronRight} from 'lucide-react';

const PRIMARY_BLUE = '#012765';
const ACCENT_ORANGE = '#FF6600';
const WHITE = '#fff';
const FONT_FAMILY = 'Poppins, sans-serif';

// TypeScript interfaces
interface FormData {
    user_id: string;
    appointment_date: string;
    from_time: string;
    to_time: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    consultation_reason: string;
    notes: string;
}

interface FormErrors {
    user_id?: string;
    appointment_date?: string;
    from_time?: string;
    to_time?: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    consultation_reason?: string;
    notes?: string;
}

interface OriginalAppointment {
    user_id: number;
    appointment_date: string;
    slot_time: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    consultation_reason: string;
    notes: string;
}

interface Appointment {
    user_id: number;
    appointment_date: string;
    slot_time: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    consultation_reason: string;
    notes: string;
    status: string;
}

const staticSlots = {
    1: {
        '2023-11-09': ['09:30', '10:30', '11:30', '17:30'],
        '2023-11-10': ['10:00', '12:00', '15:00'],
        '2023-11-11': ['09:30', '11:00', '13:00'],
    },
    2: {
        '2023-11-09': ['10:00', '11:00', '13:00', '16:00'],
        '2023-11-10': ['09:30', '11:30', '14:30'],
        '2023-11-11': ['10:00', '12:00', '15:00'],
    },
    3: {
        '2023-11-09': ['09:00', '10:00', '12:00', '15:00'],
        '2023-11-10': ['09:30', '11:00', '13:30'],
        '2023-11-11': ['10:30', '12:30', '16:00'],
    },
};

const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = addDays(new Date('2023-11-09'), i);
        days.push(date);
    }
    return days;
};

const RescheduleCall = () => {
    const navigate = useNavigate();
    const {user_id} = useParams();
    const days = getNext7Days();
    const [selectedCounselorIdx, setSelectedCounselorIdx] = useState(0);
    const [selectedDate, setSelectedDate] = useState(formatDate(days[0], 'yyyy-MM-dd'));
    const [selectedSlot, setSelectedSlot] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [originalAppointment, setOriginalAppointment] = useState<OriginalAppointment | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        user_id: '',
        appointment_date: '',
        from_time: '',
        to_time: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        consultation_reason: '',
        notes: '',
    });

    // Form validation errors
    const [errors, setErrors] = useState<FormErrors>({});

    // Validation function
    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.user_id) newErrors.user_id = 'Counselor is required';
        if (!formData.appointment_date) newErrors.appointment_date = 'Appointment date is required';
        if (!formData.from_time) newErrors.from_time = 'From time is required';
        if (!formData.to_time) newErrors.to_time = 'To time is required';

        if (!formData.client_name || formData.client_name.trim() === '') {
            newErrors.client_name = 'Full Name is required';
        } else if (formData.client_name.length < 2) {
            newErrors.client_name = 'Full Name must be at least 2 characters';
        }

        if (!formData.client_email || formData.client_email.trim() === '') {
            newErrors.client_email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
            newErrors.client_email = 'Enter a valid email';
        }

        if (!formData.client_phone || formData.client_phone.trim() === '') {
            newErrors.client_phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.client_phone)) {
            newErrors.client_phone = 'Phone number must be exactly 10 digits';
        }

        if (!formData.consultation_reason || formData.consultation_reason.trim() === '') {
            newErrors.consultation_reason = 'Consultation reason is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // CRUD Operations with localStorage
    const getAppointmentsFromStorage = (): Appointment[] => {
        const stored = localStorage.getItem('appointments');
        return stored ? JSON.parse(stored) : [];
    };

    const saveAppointmentsToStorage = (appointments: Appointment[]) => {
        localStorage.setItem('appointments', JSON.stringify(appointments));
    };

    const createAppointment = (appointmentData: FormData): Appointment => {
        const newAppointment: Appointment = {
            user_id: parseInt(appointmentData.user_id),
            appointment_date: appointmentData.appointment_date,
            slot_time: `${appointmentData.from_time}-${appointmentData.to_time}`,
            client_name: appointmentData.client_name,
            client_email: appointmentData.client_email,
            client_phone: appointmentData.client_phone,
            consultation_reason: appointmentData.consultation_reason,
            notes: appointmentData.notes,
            status: 'open', // Default status for new appointments
        };
        return newAppointment;
    };

    const addAppointmentToStorage = (appointment: Appointment) => {
        const existingAppointments = getAppointmentsFromStorage();
        const updatedAppointments = [...existingAppointments, appointment];
        saveAppointmentsToStorage(updatedAppointments);
        return updatedAppointments;
    };

    // Handle form submission
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setConfirmOpen(true);
        }
    };

    useEffect(() => {
        fetch('https://interactapiverse.com/mahadevasth/counsellors')
            .then(res => res.json())
            .then(result => {
                setCounselors(result.data || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load counselors');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        // Load original appointment data if user_id is provided
        if (user_id) {
            // Get appointment data from localStorage
            const appointments = getAppointmentsFromStorage();
            const originalAppt = appointments.find(appt => appt.user_id === parseInt(user_id));

            if (originalAppt) {
                setOriginalAppointment({
                    user_id: originalAppt.user_id,
                    appointment_date: originalAppt.appointment_date,
                    slot_time: originalAppt.slot_time,
                    client_name: originalAppt.client_name,
                    client_email: originalAppt.client_email,
                    client_phone: originalAppt.client_phone,
                    consultation_reason: originalAppt.consultation_reason,
                    notes: originalAppt.notes,
                });
            } else {
                // Fallback to mock data if not found in localStorage
                setOriginalAppointment({
                    user_id: parseInt(user_id),
                    appointment_date: "2025-08-10",
                    slot_time: "10:00AM-11:00AM",
                    client_name: "Rahul Jain",
                    client_email: "rahul@example.com",
                    client_phone: "9876501234",
                    consultation_reason: "Exam stress and sleep issues",
                    notes: "Prefers Hindi-speaking counsellor",
                });
            }
        }
    }, [user_id]);

    useEffect(() => {
        if (confirmOpen) {
            (async () => {
                setFormOpen(false);
                setConfirmOpen(false);
                try {
                    // Create new appointment object
                    const newAppointment = createAppointment(formData);

                    // Add to localStorage
                    addAppointmentToStorage(newAppointment);

                    // Optional: Also send to API if needed
                    const payload = {...formData};
                    if (!isEdit) delete payload.notes;

                    // API call (commented out for now, using localStorage only)
                    /*
                    const response = await fetch('https://interactapiverse.com/mahadevasth/appointments', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) throw new Error('Failed to book appointment');
                    */

                    setSuccessOpen(true);
                    setSelectedSlot('');
                    setFormData({
                        user_id: '',
                        appointment_date: '',
                        from_time: '',
                        to_time: '',
                        client_name: '',
                        client_email: '',
                        client_phone: '',
                        consultation_reason: '',
                        notes: '',
                    });
                } catch (err) {
                    setError(err.message || 'Failed to book appointment');
                }
            })();
        }
    }, [confirmOpen]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;

    const counselor = counselors[selectedCounselorIdx] || {};
    const slots = staticSlots[counselor.user_id]?.[selectedDate] || [];

    const handleReschedule = () => {
        // Parse the selected slot to get from and to times
        const timeRange = selectedSlot.split('-');
        const fromTime = timeRange[0] || '';
        const toTime = timeRange[1] || '';

        setFormData({
            user_id: counselor.user_id || '',
            appointment_date: selectedDate,
            from_time: fromTime,
            to_time: toTime,
            client_name: originalAppointment?.client_name || '',
            client_email: originalAppointment?.client_email || '',
            client_phone: originalAppointment?.client_phone || '',
            consultation_reason: originalAppointment?.consultation_reason || '',
            notes: originalAppointment?.notes || '',
        });
        setIsEdit(false);
        setFormOpen(true);
    };

    const handleCloseSuccess = () => {
        setSuccessOpen(false);
        navigate('/appointments');
    };

    return (
        <div className="font-poppins mt-8 md:mt-5">
            <div className="max-w-[83vw] font-poppins">
                {/* Header with Back Button */}
                <div className="flex items-center font-poppins">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#012765] text-[#012765] font-semibold rounded-lg hover:border-[#FF6600] hover:text-[#FF6600] transition-colors font-poppins"
                    >
                        <ArrowLeft className="h-4 w-4"/>
                        Back
                    </button>
                </div>

                <div className="p-2 mt-4 font-poppins">
                    {/* Page Title */}
                    <h1 className="text-3xl font-bold text-[#012765] mb-1">
                        Reschedule Appointment
                    </h1>

                    <p className="text-[#FF6600] font-semibold mb-8 opacity-90 font-poppins">
                        Choose a new date and time for your appointment
                    </p>

                    {/* Original Appointment Info */}
                    {originalAppointment && (
                        <div className="mb-8 border-2 border-[#FF6600] rounded-2xl bg-[#fff7f0] p-6 font-poppins">
                            <h2 className="text-xl font-bold text-[#012765] mb-4 font-poppins">
                                Original Appointment
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-poppins">
                                <div>
                                    <p className="text-sm font-semibold text-[#012765] font-poppins">
                                        Date: {originalAppointment.appointment_date}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#012765] font-poppins">
                                        Time: {originalAppointment.slot_time}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#012765] font-poppins">
                                        Client: {originalAppointment.client_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#012765] font-poppins">
                                        Email: {originalAppointment.client_email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Counselor Slider */}
                    <h3 className="text-xl font-bold text-[#012765] mb-4 ">
                        Choose Your Counselor
                    </h3>

                    <div className="relative font-poppins">
                        <Swiper
                            modules={[Navigation]}
                            navigation={{
                                nextEl: '.swiper-button-nex',
                                prevEl: '.swiper-button-pre',
                            }}
                            spaceBetween={24}
                            slidesPerView={1}
                            breakpoints={{
                                600: {slidesPerView: 2, spaceBetween: 20},
                                900: {slidesPerView: 3, spaceBetween: 24},
                            }}
                            style={{
                                paddingBottom: 32,
                                paddingTop: 16,
                                paddingLeft: 8,
                                paddingRight: 8,
                            }}
                        >
                            {counselors.map((c) => (
                                <SwiperSlide key={c.user_id}>
                                    <div
                                        onClick={() => {
                                            setSelectedCounselorIdx(counselors.findIndex(cou => cou.user_id === c.user_id));
                                            setSelectedSlot('');
                                        }}
                                        className={`min-w-[260px] h-full rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col overflow-hidden font-poppins ${
                                            counselors.find(cou => cou.user_id === c.user_id) === counselor
                                                ? 'border-2 border-[#FF6600] shadow-2xl bg-[#fff7f0] hover:shadow-3xl hover:-translate-y-1 hover:border-[#FF6600] before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[#FF6600]'
                                                : 'border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-gray-300'
                                        }`}
                                    >
                                        <div
                                            className="flex flex-col items-center p-5 sm:p-6 h-full min-h-[220px] flex-1 font-poppins">
                                            {/* Avatar Section */}
                                            <div className="flex flex-col items-center mb-1.5 w-full font-poppins">
                                                <img
                                                    src="https://static.vecteezy.com/system/resources/thumbnails/000/439/863/small_2x/Basic_Ui__28186_29.jpg"
                                                    alt={c.full_name}
                                                    className="w-[80px] h-[80px] mb-3 rounded-full border-2 border-[#012765] shadow-md object-cover"
                                                />
                                                <h4 className="text-xl font-[600] text-[#012765] text-center mb-1 leading-snug font-poppins">
                                                    {c.full_name} ({c.experience || '5+ years'})
                                                </h4>
                                                <p className="text-[#FF6600] font-semibold text-center text-sm opacity-90 font-poppins">
                                                    {c.role} ({c.education || 'Masters in Psychology'})
                                                </p>
                                            </div>

                                            {/* Expertise Section */}
                                            <div className="grid grid-cols-1 text-sm text-[#012765] w-full flex-1 font-poppins">
                                                <div className="flex items-start gap-1 font-poppins">
                                                 <span className="text-[#FF6600] text-center flex-1 font-poppins">
                                                   {c.expertise || 'General Counseling'}
                                                 </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Custom Navigation Arrows */}
                        <button
                            className="swiper-button-pre absolute left-0 top-32 transform -translate-y-1/2 z-10 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors font-poppins">
                            <ChevronLeft className="h-6 w-6 text-[#012765]"/>
                        </button>
                        <button
                            className="swiper-button-nex absolute right-0 top-32 transform -translate-y-1/2 z-10 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors font-poppins">
                            <ChevronRight className="h-6 w-6 text-[#012765]"/>
                        </button>
                    </div>

                    {/* Date Picker */}
                    <h3 className="text-xl font-bold text-[#012765] mt-12 mb-4 text-lg">
                        Choose New Date
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 px-1 sm:px-0 scrollbar-hide font-poppins">
                        {days.map((date) => {
                            const dateStr = formatDate(date, 'yyyy-MM-dd');
                            const isSelected = selectedDate === dateStr;
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        setSelectedSlot('');
                                    }}
                                    className={`px-6 py-3 rounded-2xl font-bold text-base shadow-sm flex items-center gap-2 transition-all font-poppins ${
                                        isSelected
                                            ? 'bg-[#FF6600] text-white shadow-lg'
                                            : 'bg-white text-[#012765] border border-[#FF6600] hover:bg-[#FF6600] hover:text-white'
                                    }`}
                                >
                                    {isSelected && <Calendar className="h-4 w-4"/>}
                                    <div className="font-poppins">
                                        <p className="font-bold font-poppins">{formatDate(date, 'EEE')}</p>
                                        <p className="text-xs font-poppins">{formatDate(date, 'd MMM')}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Time Slots */}
                    <h3 className="text-xl font-bold text-[#012765] mt-12 mb-4 text-lg">
                        Choose New Time Slot
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-4 font-poppins">
                        {slots.length === 0 ? (
                            <p className="text-[#FF6600] font-semibold font-poppins">No slots available for this day.</p>
                        ) : (
                            slots.map((slot, index) => {
                                // Create time ranges: each slot is 1 hour duration
                                const startTime = slot;
                                const endTime = slots[index + 1] || addHours(parse(slot, 'HH:mm', new Date()), 1);
                                
                                // Convert to AM/PM format
                                const startParsed = parse(startTime, 'HH:mm', new Date());
                                const endParsed = typeof endTime === 'string' ? parse(endTime, 'HH:mm', new Date()) : endTime;
                                
                                const startAMPM = formatDate(startParsed, 'h:mm a');
                                const endAMPM = formatDate(endParsed, 'h:mm a');
                                
                                const timeRange = `${startAMPM} - ${endAMPM}`;
                                
                                return (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(`${startTime}-${formatDate(endParsed, 'HH:mm')}`)}
                                        className={`px-6 py-3 rounded-lg font-bold text-base min-w-[140px] transition-all font-poppins ${
                                            selectedSlot === `${startTime}-${formatDate(endParsed, 'HH:mm')}`
                                                ? 'bg-[#FF6600] text-white shadow-lg'
                                                : 'bg-white text-[#012765] border-2 border-[#FF6600] hover:bg-[#FF6600] hover:text-white'
                                        }`}
                                    >
                                        {timeRange}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Reschedule Button */}
                    <div className="text-center mt-16 font-poppins">
                        <button
                            disabled={!selectedSlot}
                            onClick={handleReschedule}
                            className="px-12 py-4 rounded-2xl font-bold bg-[#FF6600] text-white text-lg shadow-lg tracking-wide transition-all hover:bg-[#FE6A00] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                        >
                            Reschedule Appointment
                        </button>
                    </div>
                </div>

                {/* Book Appointment Form Dialog */}
                {formOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-poppins">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 font-poppins shadow-xl">
                            <h2 className="text-[#012765] font-bold text-2xl text-center mb-6 font-poppins">
                                Book Appointment
                            </h2>
                            <form onSubmit={handleFormSubmit} className="w-full space-y-3 font-poppins">
                                {/* Appointment Date */}
                                <div className="font-poppins">
                                    <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                        Appointment Date
                                    </label>
                                    <input
                                        type="date"
                                        name="appointment_date"
                                        value={formData.appointment_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent font-poppins text-gray-700 bg-gray-100"
                                        readOnly
                                    />
                                    {errors.appointment_date && (
                                        <p className="text-red-500 text-xs mt-1 font-poppins">{errors.appointment_date}</p>
                                    )}
                                </div>

                                {/* From Time */}
                                <div className="flex flex-col md:flex-row gap-4 font-poppins">
                                    {/* From Time */}
                                    <div className="w-full md:w-1/2">
                                        <label className="block text-sm font-medium text-[#012765] mb-2">
                                            From Time
                                        </label>
                                        <input
                                            type="time"
                                            name="from_time"
                                            value={formData.from_time}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent text-gray-700 bg-gray-100"
                                            readOnly
                                        />
                                        {errors.from_time && (
                                            <p className="text-red-500 text-xs mt-1">{errors.from_time}</p>
                                        )}
                                    </div>

                                    {/* To Time */}
                                    <div className="w-full md:w-1/2">
                                        <label className="block text-sm font-medium text-[#012765] mb-2">
                                            To Time
                                        </label>
                                        <input
                                            type="time"
                                            name="to_time"
                                            value={formData.to_time}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent text-gray-700 bg-gray-100"
                                            readOnly
                                        />
                                        {errors.to_time && (
                                            <p className="text-red-500 text-xs mt-1">{errors.to_time}</p>
                                        )}
                                    </div>
                                </div>


                                {/* Full Name */}
                                <div className="font-poppins">
                                    <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="client_name"
                                        value={formData.client_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent font-poppins text-gray-700"
                                    />
                                    {errors.client_name && (
                                        <p className="text-red-500 text-xs mt-1 font-poppins">{errors.client_name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="font-poppins">
                                    <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="client_email"
                                        value={formData.client_email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent font-poppins text-gray-700"
                                    />
                                    {errors.client_email && (
                                        <p className="text-red-500 text-xs mt-1 font-poppins">{errors.client_email}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="font-poppins">
                                    <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="client_phone"
                                        value={formData.client_phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent font-poppins text-gray-700"
                                    />
                                    {errors.client_phone && (
                                        <p className="text-red-500 text-xs mt-1 font-poppins">{errors.client_phone}</p>
                                    )}
                                </div>

                                {/* Consultation Reason */}
                                <div className="font-poppins">
                                    <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                        Consultation Reason *
                                    </label>
                                    <textarea
                                        name="consultation_reason"
                                        value={formData.consultation_reason}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent resize-none font-poppins text-gray-700"
                                    />
                                    {errors.consultation_reason && (
                                        <p className="text-red-500 text-xs mt-1 font-poppins">{errors.consultation_reason}</p>
                                    )}
                                </div>

                                {/* Notes (for edit mode) */}
                                {isEdit && (
                                    <div className="font-poppins">
                                        <label className="block text-sm font-medium text-[#012765] mb-2 font-poppins">
                                            Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent resize-none font-poppins text-gray-700"
                                        />
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex justify-between gap-4 pt-4 font-poppins">
                                    <button
                                        type="button"
                                        onClick={() => setFormOpen(false)}
                                        className="px-6 py-3 text-[#012765] font-medium rounded-lg hover:text-[#FF6600] transition-colors font-poppins"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-[#FF6600] text-white font-medium rounded-lg hover:bg-[#FE6A00] transition-colors font-poppins"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Success Dialog */}
                {successOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-poppins">
                        <div className="bg-gradient-to-br from-[#fff7f0] to-[#f8fafc] rounded-2xl max-w-sm w-full p-6 font-poppins">
                            <h2 className="text-[#012765] font-bold text-xl text-center tracking-wide pb-0 font-poppins">
                                Appointment Booked Successfully!
                            </h2>
                            <div className="mt-4 font-poppins">
                                <p className="text-[#012765] font-semibold text-center mt-2 mb-6 font-poppins">
                                    Thank you for booking your appointment. We look forward to seeing you!
                                </p>
                            </div>
                            <div className="flex justify-center pb-4 font-poppins">
                                <button
                                    onClick={handleCloseSuccess}
                                    className="px-6 py-2 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-[#FE6A00] transition-colors font-poppins"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RescheduleCall; 