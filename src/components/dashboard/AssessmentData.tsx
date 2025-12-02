"use client";

import React, {useState, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Badge} from "@/components/ui/badge";
import {
    Search,
    Calendar,
    TrendingUp,
    FileText,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    X,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {useNavigate} from "react-router-dom";
import {DateInputButton} from "@/components/ui/DatePickerDialog";
import {format} from "date-fns";
import {useToast} from "@/hooks/use-toast";

interface Assessment {
    id: number;
    userId: string;
    userName: string;
    category: string;
    date: string;
    score: number;
    duration: string;
    recommendations: string[];
    issues: string[];
    minAge: number;
    maxAge: number;
}

interface Question {
    text: string;
    options: (string | { text: string; score: number })[];
}

interface AssessmentWithQuestions extends Assessment {
    questions: Question[];
    active?: boolean;
}

const mockAssessments: Assessment[] = [
    {
        id: 1,
        userId: "sarah.j@email.com",
        userName: "Competitive Exam Stress",
        category: "K12",
        date: "2024-06-23",
        score: 85,
        duration: "10",
        recommendations: ["Stress management techniques", "Mindfulness exercises"],
        issues: ["Mild anxiety", "Sleep concerns"],
        minAge: 10,
        maxAge: 12,
    },
    {
        id: 2,
        userId: "m.chen@email.com",
        userName: "General Stress & Anxiety",
        category: "Employee",
        date: "2024-06-22",
        score: 78,
        duration: "6",
        recommendations: ["Work-life balance", "Communication skills"],
        issues: ["Work stress", "Time management"],
        minAge: 20,
        maxAge: 30,
    },
    {
        id: 3,
        userId: "emma.w@email.com",
        userName: "Emotional Awareness & Regulation",
        category: "Aspirant",
        date: "2024-06-21",
        score: 82,
        duration: "7",
        recommendations: ["Goal setting", "Confidence building"],
        issues: ["Exam anxiety", "Self-doubt"],
        minAge: 18,
        maxAge: 20,
    },
    {
        id: 4,
        userId: "d.kumar@email.com",
        userName: "Academic Stress",
        category: "Primary",
        date: "2024-06-20",
        score: 91,
        duration: "10",
        recommendations: ["Continue positive habits", "Social activities"],
        issues: ["Minor social concerns"],
        minAge: 8,
        maxAge: 10,
    },
    {
        id: 5,
        userId: "d.kumar@email.com",
        userName: "Self-Esteem Scale for Pre-Adolescents",
        category: "Primary",
        date: "2024-06-19",
        score: 88,
        duration: "10",
        recommendations: ["Positive reinforcement", "Group interaction"],
        issues: ["Confidence building"],
        minAge: 10,
        maxAge: 12,
    },
    {
        id: 6,
        userId: "d.kumar@email.com",
        userName: "Work-Life Balance",
        category: "Employee",
        date: "2024-06-18",
        score: 74,
        duration: "7",
        recommendations: ["Delegation training"],
        issues: ["Overworking", "Lack of boundaries"],
        minAge: 25,
        maxAge: 35,
    },
    {
        id: 7,
        userId: "d.kumar@email.com",
        userName: "Child Learning Ability",
        category: "Employee",
        date: "2024-06-18",
        score: 74,
        duration: "13",
        recommendations: ["Delegation training"],
        issues: ["Overworking", "Lack of boundaries"],
        minAge: 10,
        maxAge: 15,
    },
];

const scoreDistributionData = [
    {range: "0-20", count: 12},
    {range: "21-40", count: 45},
    {range: "41-60", count: 156},
    {range: "61-80", count: 289},
    {range: "81-100", count: 178},
];

const weeklyAssessmentData = [
    {week: "Week 1", assessments: 245},
    {week: "Week 2", assessments: 289},
    {week: "Week 3", assessments: 312},
    {week: "Week 4", assessments: 298},
    {week: "Week 5", assessments: 334},
    {week: "Week 6", assessments: 367},
];

export const AssessmentData = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [assessments, setAssessments] = useState<AssessmentWithQuestions[]>([...mockAssessments.map(a => ({
        ...a,
        questions: [],
        active: true
    }))]);
    const [viewing, setViewing] = useState<AssessmentWithQuestions | null>(null);
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({from: null, to: null});
    const {toast} = useToast();

    const filteredAssessments = assessments.filter((assessment) => {
        const matchesSearch =
            assessment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.userId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            categoryFilter === "all" || assessment.category === categoryFilter;
        let matchesDate = true;
        if (dateRange.from && dateRange.to) {
            const d = new Date(assessment.date);
            matchesDate = d >= dateRange.from && d <= dateRange.to;
        } else if (dateRange.from) {
            const d = new Date(assessment.date);
            matchesDate = d >= dateRange.from;
        } else if (dateRange.to) {
            const d = new Date(assessment.date);
            matchesDate = d <= dateRange.to;
        }
        return matchesSearch && matchesCategory && assessment.active !== false && matchesDate;
    });

    useEffect(() => {
        setPage(0);
    }, [searchTerm, categoryFilter]);

    const paginatedAssessments = filteredAssessments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filteredAssessments.length / rowsPerPage);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100";
        if (score >= 60) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            K12: "bg-purple-100 text-purple-800",
            Primary: "bg-blue-100 text-blue-800",
            Aspirant: "bg-green-100 text-green-800",
            Employee: "bg-orange-100 text-orange-800",
        };
        return colors[category] || "bg-gray-100 text-gray-800";
    };

    const openViewDialog = (assessment: AssessmentWithQuestions) => {
        setViewing(assessment);
    };

    const handleDeactivate = (assessmentId: number) => {
        const updatedAssessments = assessments.filter(assessment => assessment.id !== assessmentId);
        setAssessments(updatedAssessments);
        localStorage.setItem("assessments", JSON.stringify(updatedAssessments));
        toast({
            title: "Assessment deactivated",
            description: "Assessment deactivated successfully.",
            variant: "success",
        });
    };

    useEffect(() => {
        const stored = localStorage.getItem("assessments");
        if (stored) {
            setAssessments(JSON.parse(stored));
        }
    }, []);

    const SummaryBox = ({label, value, color}: { label: string, value: number, color: string }) => (
        <div className="text-center p-3 bg-gray-50 rounded border border-gray-100">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{label}</div>
        </div>
    );


    const totalAssessments = filteredAssessments.length;
    const avgScore = filteredAssessments.length > 0 ? (filteredAssessments.reduce((sum, a) => sum + a.score, 0) / filteredAssessments.length).toFixed(1) : '0.0';

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const thisWeekCount = filteredAssessments.filter(a => {
        const ad = new Date(a.date);
        return ad >= startOfWeek && ad <= endOfWeek;
    }).length;

    const completionRate = '100%';

    return (
        <div className="space-y-6">

            <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
                <DialogContent
                    className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white rounded-xl shadow-xl border border-gray-200">
                    <DialogHeader className="px-8 py-6 border-b border-gray-100 bg-white">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-blue-950">
                            <FileText className="h-6 w-6 text-[#FF7119]"/>
                            Assessment Details
                        </DialogTitle>
                        <p className="text-gray-500 text-base mt-2">
                            Complete information and insights about this assessment
                        </p>
                    </DialogHeader>
                    <button
                        onClick={() => setViewing(null)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-5 w-5"/>
                        <span className="sr-only">Close</span>
                    </button>
                    {viewing && (
                        <div className="flex flex-col h-full">

                            <div
                                className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50"
                                style={{maxHeight: 'calc(90vh - 120px)'}}>

                                <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto px-0 py-0">

                                    <div className="flex flex-col lg:flex-row gap-4">

                                        <Card
                                            className="flex-1 min-w-[300px] border border-gray-100 shadow-sm bg-white">
                                            <CardHeader className="pb-4 border-b border-gray-100">
                                                <CardTitle
                                                    className="text-lg font-semibold text-blue-950">Overview</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-5 space-y-4 text-base text-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Assessment Name</span>
                                                    <span
                                                        className="font-semibold text-right break-all">{viewing.userName}</span>
                                                </div>
                                                {/*<div className="flex justify-between items-center">*/}
                                                {/*    <span className="text-gray-500">User Email</span>*/}
                                                {/*    <span*/}
                                                {/*        className="font-semibold text-right break-all">{viewing.userId}</span>*/}
                                                {/*</div>*/}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Date</span>
                                                    <span className="font-semibold text-right">
                                                        {new Date(viewing.date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Score</span>
                                                    <Badge
                                                        className={`${getScoreColor(viewing.score)} bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white`}>
                                                        {viewing.score}/100
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Duration</span>
                                                    <span className="font-semibold">{viewing.duration} min</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Age Group</span>
                                                    <Badge
                                                        className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                                        {viewing.maxAge && viewing.maxAge !== viewing.minAge
                                                            ? `${viewing.minAge}-${viewing.maxAge} yrs`
                                                            : `${viewing.minAge} yrs`}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>


                                        <Card
                                            className="flex-1 min-w-[300px] border border-gray-100 shadow-sm bg-white">
                                            <CardHeader className="pb-4 border-b border-gray-100">
                                                <CardTitle
                                                    className="text-lg font-semibold text-blue-950">Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SummaryBox
                                                        label="Questions"
                                                        value={viewing.questions.length}
                                                        color="text-blue-700"
                                                    />
                                                    <SummaryBox
                                                        label="Recommendations"
                                                        value={viewing.recommendations.length}
                                                        color="text-green-700"
                                                    />
                                                    <SummaryBox
                                                        label="Issues"
                                                        value={viewing.issues.length}
                                                        color="text-orange-600"
                                                    />
                                                    <SummaryBox
                                                        label="Score"
                                                        value={viewing.score}
                                                        color="text-purple-700"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>


                                <Card className="border border-gray-100 shadow-sm bg-white">
                                    <CardHeader
                                        className="pb-4 border-b border-gray-100 flex justify-between items-center">
                                        <CardTitle className="text-lg font-semibold text-blue-950">Assessment
                                            Questions</CardTitle>
                                        <Badge
                                            className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                            {viewing.questions.length} Questions
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4 max-h-64 overflow-y-auto">
                                        {viewing.questions.length === 0 ? (
                                            <div
                                                className="flex flex-col items-center justify-center text-gray-400 py-10">
                                                <FileText className="w-10 h-10 mb-3"/>
                                                <p className="text-base">No questions added to this assessment</p>
                                            </div>
                                        ) : (
                                            viewing.questions.map((q, qIdx) => (
                                                <div key={qIdx}
                                                     className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex gap-4 items-start">
                                                    <div
                                                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                                                        {qIdx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-base text-gray-900 mb-2">{q.text}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.options.map((opt, oIdx) => (
                                                                <Badge key={oIdx}
                                                                       className="text-base bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                                                    {typeof opt === "object" && opt?.text
                                                                        ? `${opt.text} (${opt.score})`
                                                                        : String(opt || "")}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 shadow-sm bg-white">
                                    <CardHeader
                                        className="pb-4 border-b border-gray-100 flex justify-between items-center">
                                        <CardTitle
                                            className="text-lg font-semibold text-blue-950">Recommendations</CardTitle>
                                        <Badge
                                            className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                            {viewing.recommendations.length} Items
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4 max-h-40 overflow-y-auto">
                                        {viewing.recommendations.length === 0 ? (
                                            <div
                                                className="flex flex-col items-center justify-center text-gray-400 py-8">
                                                <div
                                                    className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                    <div className="w-6 h-6 bg-green-400 rounded-full"/>
                                                </div>
                                                <p className="text-base font-medium">No recommendations available</p>
                                            </div>
                                        ) : (
                                            viewing.recommendations.map((rec, rIdx) => (
                                                <div key={rIdx}
                                                     className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                                                    <div
                                                        className="w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-lg font-bold">✓
                                                    </div>
                                                    <p className="text-base text-green-900 font-medium">{rec}</p>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 shadow-sm bg-white">
                                    <CardHeader
                                        className="pb-4 border-b border-gray-100 flex justify-between items-center">
                                        <CardTitle className="text-lg font-semibold text-blue-950">Issues
                                            Identified</CardTitle>
                                        <Badge
                                            className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                            {viewing.issues.length} Items
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4 max-h-40 overflow-y-auto">
                                        {viewing.issues.length === 0 ? (
                                            <div
                                                className="flex flex-col items-center justify-center text-gray-400 py-8">
                                                <div
                                                    className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                                    <div className="w-6 h-6 bg-red-400 rounded-full"/>
                                                </div>
                                                <p className="text-base font-medium">No issues identified</p>
                                            </div>
                                        ) : (
                                            viewing.issues.map((issue, iIdx) => (
                                                <div key={iIdx}
                                                     className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                                                    <div
                                                        className="w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center text-lg font-bold">!
                                                    </div>
                                                    <p className="text-base text-red-900 font-medium">{issue}</p>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div
                                className="border-t border-gray-100 bg-white px-8 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-base">
                                <div className="flex flex-wrap gap-4 text-gray-500">
                                    <span>Assessment ID: <span
                                        className="text-gray-900 font-semibold">{viewing.id}</span></span>
                                    <span className="hidden sm:inline-block w-px h-5 bg-gray-300"/>
                                    <span>Created: <span
                                        className="text-gray-900">{new Date(viewing.date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}</span></span>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/assessments/edit/${viewing.id}`)}
                                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-[#FF7119] px-5 py-2 text-base rounded-md"
                                    >
                                        <Pencil className="h-5 w-5"/>
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => setViewing(null)}
                                        className="bg-[#FF7119] hover:bg-[#e55d00] text-white flex items-center gap-2 px-5 py-2 text-base rounded-md"
                                    >
                                        <X className="h-5 w-5"/>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">
                        Assessments
                    </h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">
                        Monitor assessment results and insights
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button className="bg-[#012765] text-white" onClick={() => navigate("/assessments/new")}>+ Add
                        Assessment</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">
                                    Total Assessments
                                </p>
                                <p className="text-3xl font-bold text-[#012765]">{totalAssessments}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Avg. Score</p>
                                <p className="text-3xl font-bold text-[#012765]">{avgScore}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">
                                    This Week
                                </p>
                                <p className="text-3xl font-bold text-[#012765]">{thisWeekCount}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-purple-500"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">
                                    Completion Rate
                                </p>
                                <p className="text-3xl font-bold text-[#012765]">{completionRate}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-500"/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">*/}
            {/*    <Card className="border-0 shadow-lg">*/}
            {/*        <CardHeader>*/}
            {/*            <CardTitle className="text-[#FF7119]">Score Distribution</CardTitle>*/}
            {/*        </CardHeader>*/}
            {/*        <CardContent>*/}
            {/*            <ResponsiveContainer width="100%" height={300}>*/}
            {/*                <BarChart data={scoreDistributionData}>*/}
            {/*                    <CartesianGrid strokeDasharray="3 3"/>*/}
            {/*                    <XAxis dataKey="range"/>*/}
            {/*                    <YAxis/>*/}
            {/*                    <Tooltip/>*/}
            {/*                    <Bar dataKey="count" fill="#012765" radius={[4, 4, 0, 0]}/>*/}
            {/*                </BarChart>*/}
            {/*            </ResponsiveContainer>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}

            {/*    <Card className="border-0 shadow-lg">*/}
            {/*        <CardHeader>*/}
            {/*            <CardTitle className="text-[#FF7119]">Weekly Assessment Trends</CardTitle>*/}
            {/*        </CardHeader>*/}
            {/*        <CardContent>*/}
            {/*            <ResponsiveContainer width="100%" height={300}>*/}
            {/*                <LineChart data={weeklyAssessmentData}>*/}
            {/*                    <CartesianGrid strokeDasharray="3 3"/>*/}
            {/*                    <XAxis dataKey="week"/>*/}
            {/*                    <YAxis/>*/}
            {/*                    <Tooltip/>*/}
            {/*                    <Line*/}
            {/*                        type="monotone"*/}
            {/*                        dataKey="assessments"*/}
            {/*                        stroke="#012765"*/}
            {/*                        strokeWidth={3}*/}
            {/*                        dot={{fill: '#FF7119', strokeWidth: 2, r: 6}}*/}
            {/*                    />*/}
            {/*                </LineChart>*/}
            {/*            </ResponsiveContainer>*/}
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
                                placeholder="Search by Assessment name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {/*<Select value={categoryFilter} onValueChange={setCategoryFilter}>*/}
                        {/*    <SelectTrigger className="w-full md:w-48">*/}
                        {/*        <SelectValue placeholder="Category"/>*/}
                        {/*    </SelectTrigger>*/}
                        {/*    <SelectContent>*/}
                        {/*        <SelectItem value="all">All Categories</SelectItem>*/}
                        {/*        <SelectItem value="K12">K12 Students*/}
                        {/*        <SelectItem value="Primary">Primary Students*/}
                        {/*        <SelectItem value="Aspirant">Aspirants*/}
                        {/*        <SelectItem value="Employee">Employees*/}
                        {/*    </SelectContent>*/}
                        {/*</Select>*/}
                        <div className="w-full md:w-80 flex flex-col justify-center">
                            {/* <label className="text-xs font-medium text-gray-600 mb-1">Assessment Date Range</label> */}
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

            {/* Table */}
            <Card className="border-0 shadow-lg">
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-600">
                                <th className="text-left py-4 px-2 font-medium text-gray-600">#</th>
                                <th className="py-3 px-2">Assessment Name</th>
                                {/*<th className="py-3 px-2">Category</th>*/}
                                <th className="py-3 px-2">Age</th>
                                <th className="py-3 px-2">Score</th>
                                <th className="py-3 px-2">Duration</th>
                                <th className="py-3 px-2">Date</th>
                                <th className="py-3 px-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedAssessments.map((assessment, idx) => (
                                <tr
                                    key={`${assessment.id}-${assessment.userName}`}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="py-4 px-2">{page * rowsPerPage + idx + 1}</td>
                                    <td className="py-3 px-2 text-[15px] text-gray-800">
                                        {assessment.userName}
                                    </td>
                                    {/*<td className="py-3 px-2">*/}
                                    {/*    <Badge className={getCategoryColor(assessment.category)}>*/}
                                    {/*        {assessment.category}*/}
                                    {/*    </Badge>*/}
                                    {/*</td>*/}
                                    <td className="py-3 px-2">
                                        <Badge
                                            className="bg-blue-100 text-[#012765] px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                            {assessment.maxAge && assessment.maxAge !== assessment.minAge ? `${assessment.minAge}-${assessment.maxAge} age group` : `${assessment.minAge} age group`}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-2">
                                        <Badge
                                            className={getScoreColor(assessment.score) + " transition-colors duration-150 hover:bg-transition-colors hover:text-blue-950"}>
                                            {assessment.score}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-2 text-[15px] text-gray-600">
                                        {assessment.duration} min
                                    </td>
                                    <td className="py-3 px-2 text-[15px] text-gray-600">
                                        {new Date(assessment.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/assessments/view/${assessment.id}`)}
                                                    className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4"/> View Assessment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/assessments/edit/${assessment.id}`)}
                                                    className="flex items-center gap-2">
                                                    <Pencil className="h-4 w-4"/> Edit Assessment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 flex items-center gap-2"
                                                                  onClick={() => handleDeactivate(assessment.id)}>
                                                    <Trash2 className="h-4 w-4"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssessments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-400">No assessments found.</td>
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
                                className="font-medium">{filteredAssessments.length === 0 ? 0 : page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAssessments.length)}</span>
                            <span className="text-gray-400">of</span>
                            <span
                                className="font-semibold text-[#012765] text-base ml-2">{filteredAssessments.length}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                aria-label="Next page"
                            >
                                &#62;
                            </button>
                            <span className="text-sm text-gray-500 ml-4">Rows per page:</span>
                            <Select value={rowsPerPage === filteredAssessments.length ? 'All' : String(rowsPerPage)}
                                    onValueChange={val => {
                                        if (val === 'All') {
                                            setRowsPerPage(filteredAssessments.length || 1);
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
        </div>
    );
};
