import React, {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {ArrowLeft, Plus, Edit, Trash2, Save} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {DateInputButton} from "@/components/ui/DatePickerDialog";

// Mock data and types (replace with real data fetching in production)
const mockAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");

export default function AssessmentForm({view}) {
    const navigate = useNavigate();
    const {id} = useParams();
    const isEdit = Boolean(id);
    const isViewMode = view === true;
    const [form, setForm] = useState({
        id: Date.now(),
        userId: "",
        userName: "",
        category: "",
        date: "",
        score: 0,
        duration: "",
        recommendations: [],
        issues: [],
        questions: [],
        active: true,
        minAge: 0,
        maxAge: 0,
    });
    const [showQuestionDialog, setShowQuestionDialog] = useState(false);
    const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);
    const [questionText, setQuestionText] = useState("");
    // Change questionOptions to be an array of objects: { text: string, score: number }
    const [questionOptions, setQuestionOptions] = useState([
        {text: "", score: 0},
        {text: "", score: 0}
    ]);
    const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
    const [editingRecommendationIdx, setEditingRecommendationIdx] = useState(null);
    const [recommendationText, setRecommendationText] = useState("");
    const [showIssueDialog, setShowIssueDialog] = useState(false);
    const [editingIssueIdx, setEditingIssueIdx] = useState(null);
    const [issueText, setIssueText] = useState("");
    const {toast} = useToast();

    useEffect(() => {
        if (isEdit) {
            const stored = localStorage.getItem("assessments");
            const assessments = stored ? JSON.parse(stored) : [];
            const found = assessments.find((a) => String(a.id) === String(id));
            if (found) setForm(found);
        } else {
            // Reset form to initial blank values in Add mode
            setForm({
                id: Date.now(),
                userId: "",
                userName: "",
                category: "",
                date: "",
                score: 0,
                duration: "",
                recommendations: [],
                issues: [],
                questions: [],
                active: true,
                minAge: 0,
                maxAge: 0,
            });
        }
    }, [id, isEdit]);

    // Auto-save form to localStorage when form changes (only for editing)
    useEffect(() => {
        if (isEdit && (form.userName || form.category || form.date)) {
            // Only auto-save when editing existing assessments
            const stored = localStorage.getItem("assessments");
            let assessments = stored ? JSON.parse(stored) : [];
            assessments = assessments.map((a) => (a.id === form.id ? {...form} : a));
            localStorage.setItem("assessments", JSON.stringify(assessments));
        }
    }, [form, isEdit]);

    const handleFormChange = (field, value) => {
        setForm((f) => ({...f, [field]: value}));
    };

    const handleSave = () => {
        if (!form.userName || !form.date) {
            toast({
                title: "Validation Error",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }
        const stored = localStorage.getItem("assessments");
        let assessments = stored ? JSON.parse(stored) : [];
        let updated;
        if (isEdit) {
            updated = assessments.map((a) => (a.id === form.id ? {...form} : a));
        } else {
            // Ensure unique ID for new assessments
            const newAssessment = {...form, id: Date.now()};
            updated = [newAssessment, ...assessments];
        }
        localStorage.setItem("assessments", JSON.stringify(updated));
        toast({
            title: isEdit ? "Assessment Updated" : "Assessment Added",
            description: isEdit ? "Assessment updated successfully." : "Assessment added successfully.",
        });
        setTimeout(() => navigate("/assessments"), 800);
    };

    // Question handlers
    const handleEditQuestion = (idx) => {
        setEditingQuestionIdx(idx);
        setQuestionText(form.questions[idx].text);
        // If options are objects, use as is; if strings (old data), convert
        const opts = form.questions[idx].options.length > 0 && typeof form.questions[idx].options[0] === 'object'
            ? form.questions[idx].options
            : form.questions[idx].options.map(opt => ({text: String(opt), score: 0}));
        setQuestionOptions(opts.length > 0 ? opts : [
            {text: "", score: 0},
            {text: "", score: 0}
        ]);
        setShowQuestionDialog(true);
    };

    const handleRemoveQuestion = (idx) => {
        const updatedQuestions = form.questions.filter((_, i) => i !== idx);
        setForm((f) => ({...f, questions: updatedQuestions}));
        setShowQuestionDialog(false);
        setEditingQuestionIdx(null);
        setQuestionText("");
        setQuestionOptions([
            {text: "", score: 0},
            {text: "", score: 0}
        ]);
        toast({
            title: "Question Deleted",
            description: "Question deleted successfully.",
        });
    };

    const handleSaveQuestion = () => {
        if (!questionText || questionOptions.length < 2 || questionOptions.some(opt => !opt.text)) {
            toast({
                title: "Validation Error",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }
        let updatedQuestions;
        if (editingQuestionIdx === null) {
            // Add new question
            updatedQuestions = [
                ...form.questions,
                {
                    text: questionText,
                    options: questionOptions,
                },
            ];
        } else {
            // Edit existing question
            updatedQuestions = [
                ...form.questions.slice(0, editingQuestionIdx),
                {
                    text: questionText,
                    options: questionOptions,
                },
                ...form.questions.slice(editingQuestionIdx + 1),
            ];
        }
        setForm((f) => ({...f, questions: updatedQuestions}));
        setShowQuestionDialog(false);
        setEditingQuestionIdx(null);
        toast({
            title: "Question Saved",
            description: "Question saved successfully.",
        });
    };

    // Recommendation handlers
    const handleEditRecommendation = (idx) => {
        setEditingRecommendationIdx(idx);
        setRecommendationText(form.recommendations[idx]);
        setShowRecommendationDialog(true);
    };

    const handleRemoveRecommendation = (idx) => {
        const updatedRecommendations = form.recommendations.filter((_, i) => i !== idx);
        setForm((f) => ({...f, recommendations: updatedRecommendations}));
        setShowRecommendationDialog(false);
        setEditingRecommendationIdx(null);
        setRecommendationText("");
        toast({
            title: "Recommendation Deleted",
            description: "Recommendation deleted successfully.",
        });
    };

    const handleSaveRecommendation = () => {
        if (!recommendationText.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter a recommendation.",
                variant: "destructive",
            });
            return;
        }
        let updatedRecommendations;
        if (editingRecommendationIdx === null) {
            // Add new recommendation
            updatedRecommendations = [...form.recommendations, recommendationText.trim()];
        } else {
            // Edit existing recommendation
            updatedRecommendations = [
                ...form.recommendations.slice(0, editingRecommendationIdx),
                recommendationText.trim(),
                ...form.recommendations.slice(editingRecommendationIdx + 1),
            ];
        }
        setForm((f) => ({...f, recommendations: updatedRecommendations}));
        setShowRecommendationDialog(false);
        setEditingRecommendationIdx(null);
        toast({
            title: "Recommendation Saved",
            description: "Recommendation saved successfully.",
        });
    };

    // Issue handlers
    const handleEditIssue = (idx) => {
        setEditingIssueIdx(idx);
        setIssueText(form.issues[idx]);
        setShowIssueDialog(true);
    };

    const handleRemoveIssue = (idx) => {
        const updatedIssues = form.issues.filter((_, i) => i !== idx);
        setForm((f) => ({...f, issues: updatedIssues}));
        setShowIssueDialog(false);
        setEditingIssueIdx(null);
        setIssueText("");
        toast({
            title: "Issue Deleted",
            description: "Issue deleted successfully.",
        });
    };

    const handleSaveIssue = () => {
        if (!issueText.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter an issue.",
                variant: "destructive",
            });
            return;
        }
        let updatedIssues;
        if (editingIssueIdx === null) {
            // Add new issue
            updatedIssues = [...form.issues, issueText.trim()];
        } else {
            // Edit existing issue
            updatedIssues = [
                ...form.issues.slice(0, editingIssueIdx),
                issueText.trim(),
                ...form.issues.slice(editingIssueIdx + 1),
            ];
        }
        setForm((f) => ({...f, issues: updatedIssues}));
        setShowIssueDialog(false);
        setEditingIssueIdx(null);
        toast({
            title: "Issue Saved",
            description: "Issue saved successfully.",
        });
    };

    const handleAddOption = () => {
        setQuestionOptions([...questionOptions, {text: `Option ${questionOptions.length + 1}`, score: 0}]);
    };

    const handleRemoveOption = (idx) => {
        const updatedOptions = questionOptions.filter((_, i) => i !== idx);
        setQuestionOptions(updatedOptions);
    };

    const handleOptionChange = (idx, value) => {
        const updatedOptions = questionOptions.map((opt, i) => i === idx ? {...opt, text: value} : opt);
        setQuestionOptions(updatedOptions);
    };

    const handleOptionScoreChange = (idx, value) => {
        const updatedOptions = questionOptions.map((opt, i) => i === idx ? {...opt, score: Number(value)} : opt);
        setQuestionOptions(updatedOptions);
    };

    const handleCloseDialog = () => {
        setShowQuestionDialog(false);
        setEditingQuestionIdx(null);
        setQuestionText("");
        setQuestionOptions([
            {text: "", score: 0},
            {text: "", score: 0}
        ]);
    };

    const handleCloseRecommendationDialog = () => {
        setShowRecommendationDialog(false);
        setEditingRecommendationIdx(null);
        setRecommendationText("");
    };

    const handleCloseIssueDialog = () => {
        setShowIssueDialog(false);
        setEditingIssueIdx(null);
        setIssueText("");
    };

    console.log(form)

    return (
        <div className="p-2">
            <div className="mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#012765]">
                            {isViewMode ? "View Assessment" : isEdit ? "Edit Assessment" : "Create Assessment"}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isViewMode ? "View the details of this assessment." : isEdit ? "Update the details of this assessment." : "Fill in the details to create a new assessment."}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#012765]">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="userName">Assessment Name *</Label>
                                    <Input 
                                        id="userName" 
                                        value={form.userName}
                                        onChange={e => handleFormChange('userName', e.target.value)}
                                        placeholder="Assessment name..."
                                        className="mt-1"
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date">Date *</Label>
                                    <DateInputButton
                                        value={form.date}
                                        onChange={(date) => handleFormChange('date', date)}
                                        placeholder="Select date"
                                        title="Select Assessment Date"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="score">Score</Label>
                                        <Input 
                                            id="score" 
                                            type="number" 
                                            value={form.score}
                                            onChange={e => handleFormChange('score', Number(e.target.value))}
                                            className="mt-1"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="duration">Duration (min)</Label>
                                        <Input 
                                            id="duration" 
                                            value={form.duration}
                                            onChange={e => handleFormChange('duration', e.target.value)} 
                                            placeholder="10"
                                            className="mt-1"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="minAge">Min Age</Label>
                                        <Input 
                                            id="minAge" 
                                            type="number" 
                                            value={form.minAge}
                                            onChange={e => handleFormChange('minAge', Number(e.target.value))}
                                            className="mt-1"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxAge">Max Age</Label>
                                        <Input 
                                            id="maxAge" 
                                            type="number" 
                                            value={form.maxAge}
                                            onChange={e => handleFormChange('maxAge', Number(e.target.value))}
                                            className="mt-1"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Stats */}
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-[#012765]">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Questions:</span>
                                        <Badge variant="secondary">{form.questions.length}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Recommendations:</span>
                                        <Badge variant="secondary">{form.recommendations.length}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Issues:</span>
                                        <Badge variant="secondary">{form.issues.length}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Tabs Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="questions" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="questions">Questions ({form.questions.length})</TabsTrigger>
                                <TabsTrigger value="recommendations">Recommendations ({form.recommendations.length})</TabsTrigger>
                                <TabsTrigger value="issues">Issues ({form.issues.length})</TabsTrigger>
                            </TabsList>

                            {/* Questions Tab */}
                            <TabsContent value="questions" className="mt-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-[#012765]">Assessment Questions</CardTitle>
                                        {!isViewMode && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    setShowQuestionDialog(true);
                                                    setEditingQuestionIdx(null);
                                                    setQuestionText("");
                                                    setQuestionOptions([
                                                        {text: "", score: 0},
                                                        {text: "", score: 0}
                                                    ]);
                                                }}
                                            >
                                                + Add Question
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {form.questions.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                No questions added yet. {!isViewMode && "Click \"Add Question\" to get started."}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {form.questions.map((q, idx) => (
                                                    <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900 mb-2">
                                                                    <span className="text-[#FF7119] font-semibold">Q{idx + 1}:</span> {q.text}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {q.options.map((opt, oIdx) => (
                                                                        <Badge key={oIdx} variant="outline" className="text-xs">
                                                                            {typeof opt === 'object' ? `${opt.text} (${opt.score})` : opt}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {!isViewMode && (
                                                                <div className="flex gap-1 ml-3">
                                                                    <Button size="sm" variant="outline" onClick={() => handleEditQuestion(idx)}>
                                                                        Edit
                                                                    </Button>
                                                                    <Button size="sm" variant="destructive" onClick={() => handleRemoveQuestion(idx)}>
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Recommendations Tab */}
                            <TabsContent value="recommendations" className="mt-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-green-800">Recommendations</CardTitle>
                                        {!isViewMode && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    setShowRecommendationDialog(true);
                                                    setEditingRecommendationIdx(null);
                                                    setRecommendationText("");
                                                }}
                                            >
                                                + Add Recommendation
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {form.recommendations.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                No recommendations added yet. {!isViewMode && "Click \"Add Recommendation\" to get started."}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {form.recommendations.map((r, idx) => (
                                                    <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50 hover:bg-green-100 transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 text-gray-900">
                                                                {r}
                                                            </div>
                                                            {!isViewMode && (
                                                                <div className="flex gap-1 ml-3">
                                                                    <Button size="sm" variant="outline" onClick={() => handleEditRecommendation(idx)}>
                                                                        Edit
                                                                    </Button>
                                                                    <Button size="sm" variant="destructive" onClick={() => handleRemoveRecommendation(idx)}>
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Issues Tab */}
                            <TabsContent value="issues" className="mt-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-red-800">Issues</CardTitle>
                                        {!isViewMode && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    setShowIssueDialog(true);
                                                    setEditingIssueIdx(null);
                                                    setIssueText("");
                                                }}
                                            >
                                                + Add Issue
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {form.issues.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                No issues added yet. {!isViewMode && "Click \"Add Issue\" to get started."}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {form.issues.map((i, idx) => (
                                                    <div key={idx} className="border border-red-200 rounded-lg p-3 bg-red-50 hover:bg-red-100 transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 text-gray-900">
                                                                {i}
                                                            </div>
                                                            {!isViewMode && (
                                                                <div className="flex gap-1 ml-3">
                                                                    <Button size="sm" variant="outline" onClick={() => handleEditIssue(idx)}>
                                                                        Edit
                                                                    </Button>
                                                                    <Button size="sm" variant="destructive" onClick={() => handleRemoveIssue(idx)}>
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={() => navigate("/assessments")}>
                        {isViewMode ? "Back" : "Cancel"}
                    </Button>
                    {!isViewMode && (
                        <Button onClick={handleSave} className="bg-[#FF7119] hover:bg-[#FF7119]/90">
                            {isEdit ? "Save Changes" : "Add Assessment"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Dialogs - Only show if not in view mode */}
            {!isViewMode && showQuestionDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">{editingQuestionIdx !== null ? 'Edit Question' : 'Add Question'}</h2>
                        <div className="mb-4">
                            <Label>Question Text</Label>
                            <Input 
                                value={questionText} 
                                onChange={e => setQuestionText(e.target.value)}
                                placeholder="Enter question..."
                                className="mt-1"
                            />
                        </div>
                        <div className="mb-4">
                            <Label>Options</Label>
                            {questionOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-center">
                                    <Input 
                                        value={opt.text} 
                                        onChange={e => handleOptionChange(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        className="flex-1"
                                    />
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        className="w-20" 
                                        value={opt.score}
                                        onChange={e => handleOptionScoreChange(i, e.target.value)}
                                        placeholder="Score"
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        onClick={() => handleRemoveOption(i)}
                                        disabled={questionOptions.length <= 1}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            <Button size="sm" className="mt-2" onClick={handleAddOption}>+ Add Option</Button>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                            <Button onClick={handleSaveQuestion}>{editingQuestionIdx !== null ? 'Save' : 'Add'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {!isViewMode && showRecommendationDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">{editingRecommendationIdx !== null ? 'Edit Recommendation' : 'Add Recommendation'}</h2>
                        <div className="mb-4">
                            <Label>Recommendation</Label>
                            <Input 
                                value={recommendationText} 
                                onChange={e => setRecommendationText(e.target.value)}
                                placeholder="Enter recommendation..."
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleCloseRecommendationDialog}>Cancel</Button>
                            <Button onClick={handleSaveRecommendation}>{editingRecommendationIdx !== null ? 'Save' : 'Add'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {!isViewMode && showIssueDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">{editingIssueIdx !== null ? 'Edit Issue' : 'Add Issue'}</h2>
                        <div className="mb-4">
                            <Label>Issue</Label>
                            <Input 
                                value={issueText} 
                                onChange={e => setIssueText(e.target.value)}
                                placeholder="Enter issue..."
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleCloseIssueDialog}>Cancel</Button>
                            <Button onClick={handleSaveIssue}>{editingIssueIdx !== null ? 'Save' : 'Add'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 