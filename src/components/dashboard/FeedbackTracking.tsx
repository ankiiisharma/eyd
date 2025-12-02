import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Search, Star, ThumbsUp, MessageSquare, TrendingUp} from "lucide-react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell} from "recharts";

const mockFeedback = [
    {
        id: 1,
        userName: "Sarah Johnson",
        userEmail: "sarah.j@email.com",
        category: "K12",
        rating: 5,
        feedback: "The platform has been incredibly helpful for managing my stress. The assessment was thorough and the recommendations were spot-on!",
        date: "2024-06-23",
        followUpType: "email",
        status: "positive"
    },
    {
        id: 2,
        userName: "Michael Chen",
        userEmail: "m.chen@email.com",
        category: "Employee",
        rating: 4,
        feedback: "Good platform overall. The wellness score helped me understand my mental state better. Would like more specific workplace tips.",
        date: "2024-06-22",
        followUpType: "in-app",
        status: "positive"
    },
    {
        id: 3,
        userName: "Emma Wilson",
        userEmail: "emma.w@email.com",
        category: "Aspirant",
        rating: 3,
        feedback: "The assessment was okay but I felt some questions were repetitive. The results could be more detailed.",
        date: "2024-06-21",
        followUpType: "email",
        status: "neutral"
    },
    {
        id: 4,
        userName: "David Kumar",
        userEmail: "d.kumar@email.com",
        category: "Primary",
        rating: 5,
        feedback: "Excellent experience! My child enjoyed the interactive elements and we've seen real improvements in their emotional awareness.",
        date: "2024-06-20",
        followUpType: "phone",
        status: "positive"
    },
    {
        id: 5,
        userName: "Lisa Rodriguez",
        userEmail: "lisa.r@email.com",
        category: "K12",
        rating: 2,
        feedback: "The platform is slow and some features don't work properly on mobile. Also, the assessment took too long.",
        date: "2024-06-19",
        followUpType: "email",
        status: "negative"
    }
];

const ratingDistributionData = [
    {rating: '1 Star', count: 12, percentage: 8},
    {rating: '2 Stars', count: 18, percentage: 12},
    {rating: '3 Stars', count: 35, percentage: 23},
    {rating: '4 Stars', count: 45, percentage: 30},
    {rating: '5 Stars', count: 40, percentage: 27}
];

const categoryFeedbackData = [
    {name: 'K12', positive: 75, neutral: 15, negative: 10},
    {name: 'Primary', positive: 82, neutral: 12, negative: 6},
    {name: 'Aspirant', positive: 68, neutral: 22, negative: 10},
    {name: 'Employee', positive: 71, neutral: 18, negative: 11}
];

const sentimentData = [
    {name: 'Positive', value: 74, color: '#10b981'},
    {name: 'Neutral', value: 17, color: '#f59e0b'},
    {name: 'Negative', value: 9, color: '#ef4444'}
];

export const FeedbackTracking = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredFeedback = mockFeedback.filter(feedback => {
        const matchesSearch = feedback.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "all" || feedback.category === categoryFilter;
        const matchesRating = ratingFilter === "all" || feedback.rating.toString() === ratingFilter;
        const matchesStatus = statusFilter === "all" || feedback.status === statusFilter;

        return matchesSearch && matchesCategory && matchesRating && matchesStatus;
    });

    const getRatingStars = (rating: number) => {
        return Array.from({length: 5}, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
            />
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "positive":
                return "bg-green-100 text-green-800";
            case "neutral":
                return "bg-yellow-100 text-yellow-800";
            case "negative":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            K12: "bg-purple-100 text-purple-800",
            Primary: "bg-blue-100 text-blue-800",
            Aspirant: "bg-green-100 text-green-800",
            Employee: "bg-orange-100 text-orange-800"
        };
        return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const averageRating = (mockFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / mockFeedback.length).toFixed(1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">
                        Feedback
                    </h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Monitor user feedback and satisfaction levels</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Total Feedback</p>
                                <p className="text-3xl font-bold text-[#012765]">{mockFeedback.length}</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Average Rating</p>
                                <p className="text-3xl font-bold text-[#012765]">{averageRating}</p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Positive Feedback</p>
                                <p className="text-3xl font-bold text-[#012765]">74%</p>
                            </div>
                            <ThumbsUp className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Response Rate</p>
                                <p className="text-3xl font-bold text-[#012765]">68%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500"/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#FF7119]">Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ratingDistributionData}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="rating"/>
                                <YAxis/>
                                <Tooltip/>
                                <Bar dataKey="count" fill="#012765" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#FF7119]">Feedback Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {sentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color}/>
                                    ))}
                                </Pie>
                                <Tooltip/>
                            </PieChart>
                        </ResponsiveContainer>
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
                                placeholder="Search feedback by user name or content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Category"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="K12">K12 Students</SelectItem>
                                <SelectItem value="Primary">Primary Students</SelectItem>
                                <SelectItem value="Aspirant">Aspirants</SelectItem>
                                <SelectItem value="Employee">Employees</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-full md:w-32">
                                <SelectValue placeholder="Rating"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-32">
                                <SelectValue placeholder="Sentiment"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback Table */}
            <Card className="border-0 shadow-lg">
                {/*<CardHeader>*/}
                {/*  <CardTitle>User Feedback ({filteredFeedback.length})</CardTitle>*/}
                {/*</CardHeader>*/}
                <CardContent>
                    <div className="space-y-4">
                        {filteredFeedback.map((feedback) => (
                            <div key={feedback.id}
                                 className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                                    <div className="flex items-center space-x-4 mb-2 md:mb-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{feedback.userName}</p>
                                            <p className="text-sm text-gray-500">{feedback.userEmail}</p>
                                        </div>
                                        <Badge
                                            className={getCategoryColor(feedback.category) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                            {feedback.category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1">
                                            {getRatingStars(feedback.rating)}
                                        </div>
                                        <Badge
                                            className={getStatusColor(feedback.status) + " transition-colors duration-150 hover:bg-[#012765] hover:text-white"}>
                                            {feedback.status}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-3 italic">"{feedback.feedback}"</p>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Follow-up: {feedback.followUpType}</span>
                                    <span>{new Date(feedback.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
