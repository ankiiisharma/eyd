import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import {Search, Send, Mail, Smartphone, Bell, Plus, Clock, CheckCircle} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {DateInputButton} from "@/components/ui/DatePickerDialog";
import {TimeInputButton} from "@/components/ui/TimePickerDialog";

const mockNotifications = [
    {
        id: 1,
        title: "Welcome to EmotionallyYours!",
        message: "Thank you for joining our wellness platform. Complete your first assessment to get personalized recommendations.",
        type: "email",
        recipient: "All new users",
        sentDate: "2024-06-23",
        status: "sent",
        recipients: 127,
        openRate: 68
    },
    {
        id: 2,
        title: "Weekly Wellness Check-in",
        message: "It's time for your weekly wellness assessment. Track your progress and discover new insights.",
        type: "in-app",
        recipient: "Active users",
        sentDate: "2024-06-22",
        status: "sent",
        recipients: 3456,
        openRate: 82
    },
    {
        id: 3,
        title: "New Stress Management Resources",
        message: "Check out our latest articles and videos on stress management techniques.",
        type: "email",
        recipient: "K12 students",
        sentDate: "2024-06-21",
        status: "scheduled",
        recipients: 1890,
        openRate: null
    },
    {
        id: 4,
        title: "Assessment Reminder",
        message: "You haven't completed your assessment this week. Take 10 minutes to check in with yourself.",
        type: "push",
        recipient: "Inactive users (7 days)",
        sentDate: "2024-06-20",
        status: "draft",
        recipients: 234,
        openRate: null
    }
];

const notificationTypes = [
    {value: "email", label: "Email", icon: Mail},
    {value: "in-app", label: "In-App", icon: Bell},
    {value: "push", label: "Push Notification", icon: Smartphone}
];

const targetGroups = [
    "All users",
    "New users",
    "Active users",
    "Inactive users",
    "K12 students",
    "Primary students",
    "Aspirants",
    "Employees",
    "High wellness scores",
    "Low wellness scores"
];

export const NotificationsCenter = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const filteredNotifications = mockNotifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || notification.type === typeFilter;
        const matchesStatus = statusFilter === "all" || notification.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    const getTypeIcon = (type: string) => {
        const typeObj = notificationTypes.find(t => t.value === type);
        const Icon = typeObj?.icon || Bell;
        return <Icon className="h-4 w-4"/>;
    };

    const getTypeColor = (type: string) => {
        const colors = {
            email: "bg-blue-100 text-blue-800",
            "in-app": "bg-purple-100 text-purple-800",
            push: "bg-green-100 text-green-800"
        };
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getStatusColor = (status: string) => {
        const colors = {
            sent: "bg-green-100 text-green-800",
            scheduled: "bg-blue-100 text-blue-800",
            draft: "bg-yellow-100 text-yellow-800"
        };
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "sent":
                return <CheckCircle className="h-4 w-4"/>;
            case "scheduled":
                return <Clock className="h-4 w-4"/>;
            default:
                return <Bell className="h-4 w-4"/>;
        }
    };

    const totalSent = mockNotifications.filter(n => n.status === "sent").length;
    const totalRecipients = mockNotifications.reduce((sum, n) => sum + n.recipients, 0);
    const avgOpenRate = mockNotifications
        .filter(n => n.openRate !== null)
        .reduce((sum, n) => sum + (n.openRate || 0), 0) / mockNotifications.filter(n => n.openRate !== null).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">
                        Notifications
                    </h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Send updates and reminders to users</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mt-4 md:mt-0 bg-[#012765] text-white">
                            <Plus className="h-4 w-4 mr-2"/>
                            Create Notification
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Notification</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" placeholder="Notification title..."/>
                                </div>
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {notificationTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center space-x-2">
                                                        <type.icon className="h-4 w-4"/>
                                                        <span>{type.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Notification message..." rows={4}/>
                            </div>
                            <div>
                                <Label htmlFor="recipients">Target Audience</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target group"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetGroups.map(group => (
                                            <SelectItem key={group} value={group}>
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label>Scheduling Options</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sendNow"/>
                                    <Label htmlFor="sendNow">Send immediately</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="schedule"/>
                                    <Label htmlFor="schedule">Schedule for later</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <DateInputButton
                                        onChange={() => {}}
                                        placeholder="Select date"
                                        title="Select Schedule Date"
                                    />
                                    <TimeInputButton
                                        onChange={() => {}}
                                        placeholder="Select time"
                                        title="Select Schedule Time"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Save Draft
                                </Button>
                                <Button onClick={() => setIsAddDialogOpen(false)}>
                                    Send Now
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Total Sent</p>
                                <p className="text-3xl font-bold text-[#012765]">{totalSent}</p>
                            </div>
                            <Send className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Recipients</p>
                                <p className="text-3xl font-bold text-[#012765]">{totalRecipients.toLocaleString()}</p>
                            </div>
                            <Mail className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Avg. Open Rate</p>
                                <p className="text-3xl font-bold text-[#012765]">{avgOpenRate.toFixed(0)}%</p>
                            </div>
                            <Bell className="h-8 w-8 text-purple-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg ">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Scheduled</p>
                                <p className="text-3xl font-bold text-[#012765]">
                                    {mockNotifications.filter(n => n.status === "scheduled").length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500"/>
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
                                placeholder="Search notifications by title or message..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="in-app">In-App</SelectItem>
                                <SelectItem value="push">Push</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-32">
                                <SelectValue placeholder="Status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications Table */}
            <Card className="border-0 shadow-lg">
                {/*<CardHeader>*/}
                {/*  <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>*/}
                {/*</CardHeader>*/}
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Title</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Type</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Recipients</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Date</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Status</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Open Rate</th>
                                <th className="text-left py-4 px-2 font-medium text-gray-600">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredNotifications.map((notification) => (
                                <tr key={notification.id}
                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{notification.message}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <Badge
                                            className={getTypeColor(notification.type) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                            <div className="flex items-center space-x-1">
                                                {getTypeIcon(notification.type)}
                                                <span>{notification.type}</span>
                                            </div>
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{notification.recipients.toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">{notification.recipient}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-gray-600">
                                        {new Date(notification.sentDate).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-2">
                                        <Badge
                                            className={getStatusColor(notification.status) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                            <div className="flex items-center space-x-1">
                                                {getStatusIcon(notification.status)}
                                                <span>{notification.status}</span>
                                            </div>
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-2 text-gray-600">
                                        {notification.openRate ? `${notification.openRate}%` : "-"}
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                            {notification.status === "draft" && (
                                                <Button size="sm">
                                                    Send
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
