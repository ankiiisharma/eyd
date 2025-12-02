import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDateSelect: (date: string) => void;
    title: string;
    selectedDate?: string;
    placeholder?: string;
    disablePast?: boolean;
}

const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateString = (value?: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if ([year, month, day].some(isNaN)) return null;
    return new Date(year, month - 1, day);
};

export const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
    isOpen,
    onClose,
    onDateSelect,
    title,
    selectedDate,
    placeholder = "Select date",
    disablePast = false
}) => {
    const todayStart = startOfDay(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

    // Helper functions
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        if (!tempSelectedDate) return false;
        return date.toDateString() === tempSelectedDate.toDateString();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const handleDateSelect = (date: Date) => {
        if (disablePast && startOfDay(date) < todayStart) return;
        setTempSelectedDate(date);
    };

    const handleOK = () => {
        if (tempSelectedDate) {
            const formattedDate = formatLocalDate(tempSelectedDate);
            onDateSelect(formattedDate);
            onClose();
        }
    };

    const handleToday = () => {
        const today = new Date();
        if (disablePast && startOfDay(today) < todayStart) {
            setTempSelectedDate(todayStart);
        } else {
            setTempSelectedDate(today);
        }
    };

    React.useEffect(() => {
        if (!isOpen) return;
        const parsedSelected = parseDateString(selectedDate);
        if (parsedSelected) {
            setCurrentDate(new Date(parsedSelected.getFullYear(), parsedSelected.getMonth(), 1));
            setTempSelectedDate(parsedSelected);
        } else {
            const now = new Date();
            setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
            setTempSelectedDate(disablePast ? todayStart : now);
        }
    }, [isOpen, selectedDate, disablePast, todayStart]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#012765]">
                        {title}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h4 className="text-lg font-semibold text-[#012765]">
                        {currentDate.toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                        })}
                    </h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="mb-4">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => (
                            <div key={`empty-${i}`} className="h-10"></div>
                        ))}
                        {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => {
                            const day = i + 1;
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isTodayDate = isToday(date);
                            const isSelectedDate = isSelected(date);
                            const isPastDate = disablePast && startOfDay(date) < todayStart;
                            
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateSelect(date)}
                                    className={`h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isSelectedDate
                                            ? 'bg-[#FF6600] text-white shadow-lg border border-[#FF6600]'
                                            : isTodayDate
                                            ? 'bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    } ${isPastDate ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}`}
                                    disabled={isPastDate}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleToday}
                        className="flex-1 text-sm border-gray-300 hover:bg-gray-50"
                    >
                        Today
                    </Button>
                    {/*<Button*/}
                    {/*    variant="outline"*/}
                    {/*    onClick={onClose}*/}
                    {/*    className="flex-1 text-sm border-gray-300 hover:bg-gray-50"*/}
                    {/*>*/}
                    {/*    Cancel*/}
                    {/*</Button>*/}
                    <Button
                        onClick={handleOK}
                        className="flex-1 text-sm bg-[#FF6600] text-white hover:bg-[#FF6600]/90"
                    >
                        OK
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Date Input Button Component
interface DateInputButtonProps {
    value?: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    title?: string;
    disablePast?: boolean;
}

export const DateInputButton: React.FC<DateInputButtonProps> = ({
    value,
    onChange,
    placeholder = "Select date",
    className = "",
    title = "Select Date",
    disablePast = false
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleDateSelect = (date: string) => {
        onChange(date);
        setIsOpen(false);
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={handleOpen}
                className={`h-10 flex items-center justify-between border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700 ${className}`}
            >
                <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#FF6600]" />
                    {value || placeholder}
                </span>
            </Button>
            
            <DatePickerDialog
                isOpen={isOpen}
                onClose={handleClose}
                onDateSelect={handleDateSelect}
                title={title}
                selectedDate={value}
                placeholder={placeholder}
                disablePast={disablePast}
            />
        </>
    );
}; 