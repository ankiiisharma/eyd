import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Calendar,
    User,
    MessageSquare,
    Star,
    Clock,
    X
} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

interface Recommendation {
    id: string;
    appointment_id: number;
    client_name: string;
    counselor_name: string;
    recommendation_type: string;
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

const INITIAL_RECOMMENDATIONS = [
    {
        id: '1',
        appointment_id: 1,
        client_name: 'Rahul Jain',
        counselor_name: 'Dr. Sarah Johnson',
        recommendation_type: 'Therapy',
        title: 'Cognitive Behavioral Therapy Session',
        description: 'Recommended weekly CBT sessions to address exam stress and sleep issues. Focus on stress management techniques and sleep hygiene practices.',
        status: 'approved',
        created_at: '2025-01-15',
        updated_at: '2025-01-16'
    },
    {
        id: '2',
        appointment_id: 2,
        client_name: 'Priya Sharma',
        counselor_name: 'Dr. Michael Chen',
        recommendation_type: 'Meditation',
        title: 'Mindfulness Meditation Program',
        description: 'Daily mindfulness meditation practice for 20 minutes to improve focus and reduce anxiety levels.',
        status: 'pending',
        created_at: '2025-01-14',
        updated_at: '2025-01-14'
    },
    {
        id: '3',
        appointment_id: 3,
        client_name: 'Amit Patel',
        counselor_name: 'Dr. Emily Davis',
        recommendation_type: 'Exercise',
        title: 'Physical Activity Routine',
        description: 'Regular exercise routine including 30 minutes of cardio and strength training to improve mood and energy levels.',
        status: 'approved',
        created_at: '2025-01-13',
        updated_at: '2025-01-15'
    }
];

const Recommendations = () => {
    const navigate = useNavigate();
    const {user_id} = useParams();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [editingRecommendation, setEditingRecommendation] = useState<Recommendation | null>(null);

    // Form state for adding/editing recommendations
    const [formData, setFormData] = useState({
        title: '',
        recommendation_type: '',
        description: '',
        status: 'pending'
    });

    // Load recommendations from localStorage on component mount
    useEffect(() => {
        const storedRecommendations = localStorage.getItem(`recommendations_${user_id}`);
        if (storedRecommendations) {
            setRecommendations(JSON.parse(storedRecommendations));
        } else {
            // Initialize with default data if no data exists
            localStorage.setItem(`recommendations_${user_id}`, JSON.stringify(INITIAL_RECOMMENDATIONS));
            setRecommendations(INITIAL_RECOMMENDATIONS);
        }
    }, [user_id]);

    // Save recommendations to localStorage whenever recommendations change
    const saveRecommendationsToStorage = (newRecommendations: Recommendation[]) => {
        localStorage.setItem(`recommendations_${user_id}`, JSON.stringify(newRecommendations));
        setRecommendations(newRecommendations);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRecommendation) {
            // Update existing recommendation
            const updatedRecommendations = recommendations.map(rec =>
                rec.id === editingRecommendation.id
                    ? {...rec, ...formData, updated_at: new Date().toISOString().split('T')[0]}
                    : rec
            );
            saveRecommendationsToStorage(updatedRecommendations);
            setEditingRecommendation(null);
        } else {
            // Add new recommendation
            const newRecommendation: Recommendation = {
                id: Date.now().toString(),
                appointment_id: parseInt(user_id || '1'),
                client_name: 'Client Name', // This would come from appointment data
                counselor_name: 'Counselor Name', // This would come from user session
                recommendation_type: formData.recommendation_type,
                title: formData.title,
                description: formData.description,
                status: formData.status as 'pending' | 'approved' | 'rejected',
                created_at: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString().split('T')[0]
            };
            saveRecommendationsToStorage([...recommendations, newRecommendation]);
        }

        setFormData({
            title: '',
            recommendation_type: '',
            description: '',
            status: 'pending'
        });
        setShowDialog(false);
    };

    const handleEdit = (recommendation: Recommendation) => {
        setEditingRecommendation(recommendation);
        setFormData({
            title: recommendation.title,
            recommendation_type: recommendation.recommendation_type,
            description: recommendation.description,
            status: recommendation.status
        });
        setShowDialog(true);
    };

    const handleDelete = (id: string) => {
        const updatedRecommendations = recommendations.filter(rec => rec.id !== id);
        saveRecommendationsToStorage(updatedRecommendations);
    };

    const handleAddNew = () => {
        setEditingRecommendation(null);
        setFormData({
            title: '',
            recommendation_type: '',
            description: '',
            status: 'pending'
        });
        setShowDialog(true);
    };

    const handleCancel = () => {
        setShowDialog(false);
        setEditingRecommendation(null);
        setFormData({
            title: '',
            recommendation_type: '',
            description: '',
            status: 'pending'
        });
    };

    const filteredRecommendations = recommendations.filter(rec => {
        const matchesSearch =
            rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.counselor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.recommendation_type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <Star className="h-4 w-4 text-green-600"/>;
            case 'rejected':
                return <Trash2 className="h-4 w-4 text-red-600"/>;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600"/>;
            default:
                return <MessageSquare className="h-4 w-4 text-gray-600"/>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <ArrowLeft className="h-4 w-4"/>
                Back
            </button>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#FF7119]">Recommendations</h1>
                        <p className="text-gray-600 mt-2 text-[#012765]">
                            Manage recommendations for appointment #{user_id}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF7119] text-white rounded-lg hover:bg-[#FF6600] transition-colors"
                >
                    <Plus className="h-4 w-4"/>
                    Add Recommendation
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input
                        type="text"
                        placeholder="Search recommendations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger
                        className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700">
                        <SelectValue placeholder="All Status"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-gray-700 hover:bg-gray-100">All Status</SelectItem>
                        <SelectItem value="pending" className="text-gray-700 hover:bg-gray-100">Pending</SelectItem>
                        <SelectItem value="approved" className="text-gray-700 hover:bg-gray-100">Approved</SelectItem>
                        <SelectItem value="rejected" className="text-gray-700 hover:bg-gray-100">Rejected</SelectItem>
                    </SelectContent>
                </Select>

            </div>

            {/* Recommendations List */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                    {filteredRecommendations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No recommendations found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecommendations.map((recommendation) => (
                                <div
                                    key={recommendation.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-lg font-semibold text-[#012765]">
                                                    {recommendation.title}
                                                </h4>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recommendation.status)}`}>
                                                    {recommendation.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-3">{recommendation.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-4 w-4"/>
                                                    {recommendation.client_name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4"/>
                                                    {recommendation.created_at}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4"/>
                                                    {recommendation.recommendation_type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(recommendation)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="h-4 w-4"/>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(recommendation.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-[#012765]">
                                {editingRecommendation ? 'Edit Recommendation' : 'Add New Recommendation'}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <Select
                                        value={formData.recommendation_type}
                                        onValueChange={(value) =>
                                            handleInputChange({target: {name: 'recommendation_type', value}})
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700">
                                            <SelectValue placeholder="Select Type"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Therapy"
                                                        className="text-gray-700 hover:bg-gray-100">Therapy</SelectItem>
                                            <SelectItem value="Meditation"
                                                        className="text-gray-700 hover:bg-gray-100">Meditation</SelectItem>
                                            <SelectItem value="Exercise"
                                                        className="text-gray-700 hover:bg-gray-100">Exercise</SelectItem>
                                            <SelectItem value="Diet"
                                                        className="text-gray-700 hover:bg-gray-100">Diet</SelectItem>
                                            <SelectItem value="Medication"
                                                        className="text-gray-700 hover:bg-gray-100">Medication</SelectItem>
                                            <SelectItem value="Other"
                                                        className="text-gray-700 hover:bg-gray-100">Other</SelectItem>
                                        </SelectContent>
                                    </Select>

                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        handleInputChange({target: {name: 'status', value}})
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7119] focus:border-transparent bg-white hover:bg-gray-50 text-gray-700">
                                        <SelectValue placeholder="Select Status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending" className="text-gray-700 hover:bg-gray-100">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="approved" className="text-gray-700 hover:bg-gray-100">
                                            Approved
                                        </SelectItem>
                                        <SelectItem value="rejected" className="text-gray-700 hover:bg-gray-100">
                                            Rejected
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#FF7119] text-white rounded-lg hover:bg-[#FF6600] transition-colors"
                                >
                                    {editingRecommendation ? 'Update' : 'Add'} Recommendation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations; 