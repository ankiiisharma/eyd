import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

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

export default function ViewAssessment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<AssessmentWithQuestions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch assessment data from localStorage (same as AssessmentData component)
        const stored = localStorage.getItem("assessments");
        if (stored) {
            const assessments = JSON.parse(stored);
            const foundAssessment = assessments.find((a: AssessmentWithQuestions) => a.id === Number(id));
            if (foundAssessment) {
                setAssessment(foundAssessment);
            }
        }
        setLoading(false);
    }, [id]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100";
        if (score >= 60) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const SummaryBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="text-center p-3 bg-gray-50 rounded border border-gray-100">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{label}</div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-lg text-gray-600 mb-4">Assessment not found</div>
                    <Button onClick={() => navigate("/assessments")} className="bg-[#012765] text-white">
                        Back to Assessments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/assessments")}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Assessments
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119] flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Assessment Details
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Complete information and insights about this assessment
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {/* Overview and Summary Cards */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Overview Card */}
                    <Card className="flex-1 min-w-[300px] border border-gray-100 shadow-sm bg-white">
                        <CardHeader className="pb-4 border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-blue-950">Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4 text-base text-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Assessment Name</span>
                                <span className="font-semibold text-right break-all">{assessment.userName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Category</span>
                                <Badge className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold">
                                    {assessment.category}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Date</span>
                                <span className="font-semibold text-right">
                                    {new Date(assessment.date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Score</span>
                                <Badge className={`${getScoreColor(assessment.score)} bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white`}>
                                    {assessment.score}/100
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Duration</span>
                                <span className="font-semibold">{assessment.duration} min</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Age Group</span>
                                <Badge className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                                    {assessment.maxAge && assessment.maxAge !== assessment.minAge
                                        ? `${assessment.minAge}-${assessment.maxAge} yrs`
                                        : `${assessment.minAge} yrs`}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="flex-1 min-w-[300px] border border-gray-100 shadow-sm bg-white">
                        <CardHeader className="pb-4 border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-blue-950">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-2 gap-4">
                                <SummaryBox
                                    label="Questions"
                                    value={assessment.questions.length}
                                    color="text-blue-700"
                                />
                                <SummaryBox
                                    label="Recommendations"
                                    value={assessment.recommendations.length}
                                    color="text-green-700"
                                />
                                <SummaryBox
                                    label="Issues"
                                    value={assessment.issues.length}
                                    color="text-orange-600"
                                />
                                <SummaryBox
                                    label="Score"
                                    value={assessment.score}
                                    color="text-purple-700"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assessment Questions */}
                <Card className="border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-4 border-b border-gray-100 flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-blue-950">Assessment Questions</CardTitle>
                        <Badge className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                            {assessment.questions.length} Questions
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 max-h-96 overflow-y-auto">
                        {assessment.questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                                <FileText className="w-10 h-10 mb-3" />
                                <p className="text-base">No questions added to this assessment</p>
                            </div>
                        ) : (
                            assessment.questions.map((q, qIdx) => (
                                <div key={qIdx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                                        {qIdx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-base text-gray-900 mb-2">{q.text}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {q.options.map((opt, oIdx) => (
                                                <Badge key={oIdx} className="text-base bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full">
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

                {/* Recommendations */}
                <Card className="border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-4 border-b border-gray-100 flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-blue-950">Recommendations</CardTitle>
                        <Badge className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                            {assessment.recommendations.length} Items
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 max-h-64 overflow-y-auto">
                        {assessment.recommendations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                    <div className="w-6 h-6 bg-green-400 rounded-full" />
                                </div>
                                <p className="text-base font-medium">No recommendations available</p>
                            </div>
                        ) : (
                            assessment.recommendations.map((rec, rIdx) => (
                                <div key={rIdx} className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                                    <div className="w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-lg font-bold">
                                        ✓
                                    </div>
                                    <p className="text-base text-green-900 font-medium">{rec}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Issues Identified */}
                <Card className="border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-4 border-b border-gray-100 flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-blue-950">Issues Identified</CardTitle>
                        <Badge className="bg-blue-100 text-[#012765] px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150 hover:bg-[#012765] hover:text-white">
                            {assessment.issues.length} Items
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 max-h-64 overflow-y-auto">
                        {assessment.issues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                    <div className="w-6 h-6 bg-red-400 rounded-full" />
                                </div>
                                <p className="text-base font-medium">No issues identified</p>
                            </div>
                        ) : (
                            assessment.issues.map((issue, iIdx) => (
                                <div key={iIdx} className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <div className="w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center text-lg font-bold">
                                        ⚠
                                    </div>
                                    <p className="text-base text-red-900 font-medium">{issue}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}