import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ChevronUp, ChevronDown, X } from 'lucide-react';

interface TimePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onTimeSelect: (time: string) => void;
    title: string;
    selectedTime?: string;
    placeholder?: string;
}

const to12Hour = (hour24: number) => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
};

export const TimePickerDialog: React.FC<TimePickerDialogProps> = ({
    isOpen,
    onClose,
    onTimeSelect,
    title,
    selectedTime,
    placeholder = "Select time"
}) => {
    const now = new Date();
    const deriveHour = (time?: string) => {
        if (!time) return to12Hour(now.getHours());
        const [hour] = time.split(':');
        return to12Hour(parseInt(hour, 10));
    };

    const deriveMinute = (time?: string) => {
        if (!time) return Math.floor(now.getMinutes() / 15) * 15;
        const [, minute] = time.split(':');
        return parseInt(minute, 10);
    };

    const deriveIsAM = (time?: string) => {
        if (!time) return now.getHours() < 12;
        const [hour] = time.split(':');
        return parseInt(hour, 10) < 12;
    };

    const [selectedHour, setSelectedHour] = useState<number>(() => deriveHour(selectedTime));
    const [selectedMinute, setSelectedMinute] = useState<number>(() => deriveMinute(selectedTime));

    const [isAM, setIsAM] = useState<boolean>(() => deriveIsAM(selectedTime));

    React.useEffect(() => {
        if (!isOpen) return;
        setSelectedHour(deriveHour(selectedTime));
        setSelectedMinute(deriveMinute(selectedTime));
        setIsAM(deriveIsAM(selectedTime));
    }, [isOpen, selectedTime]);

    const handleHourChange = (increment: boolean) => {
        setSelectedHour(prev => {
            let newHour = increment ? prev + 1 : prev - 1;
            if (newHour > 12) newHour = 1;
            if (newHour < 1) newHour = 12;
            return newHour;
        });
    };

    const handleMinuteChange = (increment: boolean) => {
        setSelectedMinute(prev => {
            let newMinute = increment ? prev + 15 : prev - 15;
            if (newMinute >= 60) newMinute = 0;
            if (newMinute < 0) newMinute = 45;
            return newMinute;
        });
    };

    const handleTimeSelect = () => {
        let hour24 = selectedHour;
        if (!isAM && selectedHour !== 12) hour24 += 12;
        if (isAM && selectedHour === 12) hour24 = 0;
        
        const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        onTimeSelect(timeString);
        onClose();
    };

    const handleOK = () => {
        handleTimeSelect();
    };

    const handleNow = () => {
        const hour = now.getHours();
        const minute = now.getMinutes();
        setSelectedHour(to12Hour(hour));
        setSelectedMinute(minute);
        setIsAM(hour < 12);
    };

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

                {/* Time Display */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-4">
                        {/* Hour */}
                        <div className="flex flex-col items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHourChange(true)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <div className="text-4xl font-bold text-[#012765] px-4 py-2 rounded-lg bg-gray-50">
                                {selectedHour.toString().padStart(2, '0')}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHourChange(false)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Colon */}
                        <div className="text-4xl font-bold text-[#012765]">:</div>

                        {/* Minute */}
                        <div className="flex flex-col items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMinuteChange(true)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <div className="text-4xl font-bold text-[#012765] px-4 py-2 rounded-lg bg-gray-50">
                                {selectedMinute.toString().padStart(2, '0')}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMinuteChange(false)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* AM/PM */}
                        <div className="flex flex-col gap-2">
                            <Button
                                variant={isAM ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsAM(true)}
                                className={`h-8 px-3 ${isAM ? 'bg-[#FF6600] text-white' : 'border-gray-300'}`}
                            >
                                AM
                            </Button>
                            <Button
                                variant={!isAM ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsAM(false)}
                                className={`h-8 px-3 ${!isAM ? 'bg-[#FF6600] text-white' : 'border-gray-300'}`}
                            >
                                PM
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Time Options */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#012765] mb-3">Quick Options</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: '9:00', value: '09:00' },
                            { label: '12:00', value: '12:00' },
                            { label: '15:00', value: '15:00' },
                            { label: '18:00', value: '18:00' },
                            { label: '21:00', value: '21:00' },
                            { label: '00:00', value: '00:00' },
                        ].map((time) => (
                            <Button
                                key={time.value}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const [hour, minute] = time.value.split(':');
                                    setSelectedHour(parseInt(hour) === 0 ? 12 : parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour));
                                    setSelectedMinute(parseInt(minute));
                                    setIsAM(parseInt(hour) < 12);
                                }}
                                className="text-xs border-gray-300 hover:bg-gray-50"
                            >
                                {time.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleNow}
                        className="flex-1 text-sm border-gray-300 hover:bg-gray-50"
                    >
                        Now
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

// Time Input Button Component
interface TimeInputButtonProps {
    value?: string;
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
    title?: string;
}

export const TimeInputButton: React.FC<TimeInputButtonProps> = ({
    value,
    onChange,
    placeholder = "Select time",
    className = "",
    title = "Select Time"
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleTimeSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    const formatTimeForDisplay = (time: string) => {
        if (!time) return '';
        const [hour, minute] = time.split(':');
        const hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        return `${displayHour}:${minute} ${ampm}`;
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={handleOpen}
                className={`h-10 flex items-center justify-between border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700 ${className}`}
            >
                <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF6600]" />
                    {value ? formatTimeForDisplay(value) : placeholder}
                </span>
            </Button>
            
            <TimePickerDialog
                isOpen={isOpen}
                onClose={handleClose}
                onTimeSelect={handleTimeSelect}
                title={title}
                selectedTime={value}
                placeholder={placeholder}
            />
        </>
    );
}; 