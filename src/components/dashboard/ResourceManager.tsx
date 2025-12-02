import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search,
    Plus,
    Eye,
    Heart,
    BookOpen,
    Video,
    FileText,
    Edit,
    Trash2,
    MoreVertical,
    TrendingUp,
    FilePen,
    RefreshCw,
    ChevronLeft,
    ChevronRight, Calendar, Clock
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DateInputButton } from "@/components/ui/DatePickerDialog";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {useArticleCategories} from "@/hooks/useArticleCategories.tsx";
import {toast} from "sonner";
import HlsPlayer from "@/components/ui/HlsPlayer";
import { cn } from "@/lib/utils.ts";

// Types and constants
type ResourceFormErrors = {
    title?: string;
    counsellor_code?: string;
    type?: string;
    category_name?: string;
    platform?: string;
    age?: string;
    description?: string;
    tags?: string;
    image?: string;
    emptyImage?: string;
};

type Resource = {
    id: string;
    admin_approval: string;
    title: string;
    type: string;
    category_name: string;
    counsellor_name: string;
    publishDate: string;
    status: string;
    resource_status: string;
    description: string;
    tags: any;
    image: string;
    platform: string;
    age: string;
    views?: number;
    likes?: number;
    // Video-specific fields
    duration?: number;
    file_size?: number;
    s3_url?: string;
    content_type?: string;
    width?: number;
    height?: number;
    article_thumbnail?: string;
}

const mockResources = [
    // Mock resources array - remained the same
];

const resourceTypes = [
    { value: "article", label: "Article", icon: FileText },
    { value: "tip", label: "Tip", icon: BookOpen },
];

const videoTypeOptions = [
    { value: "session", label: "Session" },
    { value: "shorts", label: "Shorts" },
];

const platformOptions = [
    { value: "web", label: "Web" },
    { value: "app", label: "App" },
    { value: "both", label: "Both" },
];

const resourceStatusOptions = [
    { value: "Live", label: "Live" },
    { value: "Hide", label: "Hide" },
    { value: "Draft", label: "Draft" },
];

const statusOptions = [
    { value: "Published", label: "Published" },
    { value: "Unpublished", label: "Unpublished" },
];

// Helper functions
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// 1. Change form.tags to be an array, add tagInput state
const getInitialForm = () => ({
    title: "",
    counsellor_code: "",
    type: "",
    category_name: "",
    description: "",
    tags: [] as string[],
    image: null,
    emptyImage: null,
    platform: "",
    age: "",
    status: "live",
});

// 2. Update getInitialResources to support both string and array tags
const getTagsArray = (tags): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
        return tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [];
};

const getInitialResources = (): Resource[] => {
    const stored = localStorage.getItem("resources");
    if (stored) {
        try {
            return JSON.parse(stored).map((r) => ({
                ...r,
                tags: getTagsArray(r.tags),
            }));
        } catch {
            // fallback to mock if corrupted
        }
    }
    return [...mockResources];
};

export const ResourceManager = () => {
    const navigate = useNavigate();

    // State management
    const [resources, setResources] = useState<Resource[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [resourceStatusFilter, setResourceStatusFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [platformFilter, setPlatformFilter] = useState("all");
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
    const [topCardFilter, setTopCardFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [approveModel, setApproveModel] = useState({open:false,id:null});
    const [deleteModel, setDeleteModel] = useState({open:false,id:null});
    const [videoTypeFilter, setVideoTypeFilter] = useState("session");
    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Form states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [form, setForm] = useState(getInitialForm());
    const [tagInput, setTagInput] = useState("");
    const [thumbPreview, setThumbPreview] = useState(null);
    const [emptyPreview, setEmptyPreview] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [viewingResource, setViewingResource] = useState<Resource | null>(null);
    const [errors, setErrors] = useState<ResourceFormErrors>({});
    
    // Video modal states
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null);
    const [videoPresignedUrl, setVideoPresignedUrl] = useState<string | null>(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isPortraitVideo, setIsPortraitVideo] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emptyInputRef = useRef<HTMLInputElement>(null);
    const statsImageInputRef = useRef<HTMLInputElement>(null);

    // API states
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingArticles, setIsLoadingArticles] = useState(false);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Stats states
    const [statsImage, setStatsImage] = useState(null);
    const [statsImagePreview, setStatsImagePreview] = useState(null);
    
    // Resource type counts
    const [articleCount, setArticleCount] = useState(0);
    const [videoCount, setVideoCount] = useState(0);
    const [tipCount, setTipCount] = useState(0);
    
    // Store all resources separately
    const [allArticles, setAllArticles] = useState<Resource[]>([]);
    const [allVideos, setAllVideos] = useState<Resource[]>([]);
    const [allTips, setAllTips] = useState<Resource[]>([]);

    // Stats calculations
    const draftCount = resources.filter((r) => r.status === "draft").length;
    const liveCount = resources.filter((r) => r.status === "live").length;
    const publishedCount = resources.filter((r) => r.status === "live").length;

    const { categories, categoriesLoading, categoriesError } = useArticleCategories();

    // Helper function to get API URL based on platform filter
    const getApiUrl = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'app':
                return 'https://interactapiverse.com/mahadevasth/articles/platform/app';
            case 'web':
                return 'https://interactapiverse.com/mahadevasth/shape/articles';
            case 'all':
            case 'both':
            default:
                return null; // Will fetch from both APIs
        }
    };

    // Fetch from multiple APIs and combine results
    const fetchFromMultipleApis = async () => {
        const appUrl = 'https://interactapiverse.com/mahadevasth/articles/platform/app';
        const webUrl = 'https://interactapiverse.com/mahadevasth/shape/articles';

        try {
            const [appResponse, webResponse] = await Promise.allSettled([
                fetch(appUrl),
                fetch(webUrl)
            ]);

            let combinedArticles = [];

            // Process app API response
            if (appResponse.status === 'fulfilled' && appResponse.value.ok) {
                try {
                    const appData = await appResponse.value.json();
                    let appArticles = Array.isArray(appData) ? appData :
                        appData.articles || appData.data || appData.results || [appData];
                    if (Array.isArray(appArticles)) {
                        combinedArticles = [...combinedArticles, ...appArticles];
                    }
                } catch (error) {
                    console.warn('Error processing app API response:', error);
                }
            }

            // Process web API response
            if (webResponse.status === 'fulfilled' && webResponse.value.ok) {
                try {
                    const webData = await webResponse.value.json();
                    let webArticles = Array.isArray(webData) ? webData :
                        webData.articles || webData.data || webData.results || [webData];
                    if (Array.isArray(webArticles)) {
                        combinedArticles = [...combinedArticles, ...webArticles];
                    }
                } catch (error) {
                    console.warn('Error processing web API response:', error);
                }
            }

            return combinedArticles;
        } catch (error) {
            console.error('Error fetching from multiple APIs:', error);
            return [];
        }
    };

    // Fetch videos from API
    const fetchVideos = useCallback(async (currentPage: number = 0) => {
        if (isLoadingVideos) return; // Prevent multiple calls
        setIsLoadingVideos(true);
        setApiError(null);

        try {
            const baseUrl = 'https://interactapiverse.com/shape/videos';
            const params = new URLSearchParams({
                type: videoTypeFilter,
                platform: platformFilter === 'all' ? 'app' : platformFilter.toLowerCase(),
                status: statusFilter === 'all' ? 'all' : statusFilter.toLowerCase(),
                category: categoryFilter === 'all' ? '' : categoryFilter.toLowerCase(),
                page: String(currentPage + 1),
                per_page: String(rowsPerPage)
            });

            const response = await fetch(`${baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);  
            }

            const data = await response.json();
            // Extract videos from the correct API response structure
            let videos = [];
            if (data && data.data && data.data.videos) {
                videos = data.data.videos;
            } else if (Array.isArray(data)) {
                videos = data;
            } else if (data.videos) {
                videos = data.videos;
            } else if (data.data) {
                videos = data.data;
            } else {
                videos = [data];
            }

            if (!Array.isArray(videos)) {
                videos = [];
            }

            // Transform video data to match our resource format
            const transformedVideos = videos.map((video, index: number) => {
                // Handle tags - the API returns tags as an array
                let tags = video.tags || [];
                if (typeof tags === 'string' && tags.trim().startsWith('[')) {
                    try {
                        tags = JSON.parse(tags);
                    } catch { /* empty */ }
                }
                if (!Array.isArray(tags)) {
                    tags = tags ? [tags] : [];
                }

                // Handle status - API returns 1 for active, 0 for inactive
                const status = video.status === 1 ? 'live' : 'draft';
                const resourceStatus = video.status === 1 ? 'live' : 'draft';

                return {
                    id: video.id || Date.now() + index,
                    admin_approval: video.admin_approval || '',
                    title: video.title || video.original_filename || video.filename || `Video ${index + 1}`,
                    type: 'video',
                    category_name: video.category || 'General',
                    counsellor_name: video.author || '',
                    publishDate: video.created_at_utc || video.created_at_ist || new Date().toISOString(),
                    status: status,
                    resource_status: resourceStatus,
                    description: video.description || `Video content: ${video.original_filename || video.filename}`,
                    tags,
                    image: video.s3_url || '', // Use S3 URL as thumbnail
                    platform: video.platform?.toLowerCase() || 'app',
                    age: video.age_band || '',
                    views: video.views || 0,
                    likes: video.likes || 0,
                    // Additional video-specific fields
                    duration: video.duration_seconds,
                    file_size: video.file_size,
                    s3_url: video.s3_url,
                    content_type: video.content_type,
                    width: video.width,
                    height: video.height,
                };
            });

            setAllVideos(transformedVideos);
            setVideoCount(transformedVideos.length);
            // Only reset page if this is a filter change (currentPage is 0)
            if (currentPage === 0) {
                setPage(0);
            }

        } catch (error) {
            console.error('Error fetching videos:', error);
            setApiError(error instanceof Error ? error.message : 'Failed to fetch videos');
        } finally {
            setIsLoadingVideos(false);
        }
    }, [videoTypeFilter, platformFilter, statusFilter, categoryFilter, rowsPerPage, isLoadingVideos]);

    // Fetch articles from API based on platform
    const fetchArticles = useCallback(async (platform: string = 'all', currentPage: number = 0) => {
        if (isLoadingArticles) return; // Prevent multiple calls
        setIsLoadingArticles(true);
        setApiError(null);

        try {
            // If video type is selected, fetch videos instead
            if (typeFilter === 'video') {
                await fetchVideos(currentPage);
                return;
            }

            let articles = [];
            const apiUrl = getApiUrl(platform);

            if (apiUrl) {
                // Fetch from single API
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Extract articles from response
                articles = Array.isArray(data) ? data :
                    data.articles || data.data || data.results || [data];

                if (!Array.isArray(articles)) {
                    articles = [data];
                }
                // if(platform === "both"){
                //     articles = articles.filter(data)
                // }
            } else {
                // Fetch from both APIs for 'all' or 'both' platform
                articles = await fetchFromMultipleApis();
            }

            // Transform API data to match our resource format
            const transformedResources = articles.map((article, index: number) => {
                // --- Robust image key handling ---
                let imageUrl = article.image;
                if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('[')) {
                    try {
                        const arr = JSON.parse(imageUrl);
                        if (Array.isArray(arr)) imageUrl = arr[0] || null;
                    } catch { /* empty */ }
                }
                if (Array.isArray(imageUrl)) {
                    imageUrl = imageUrl[0] || null;
                }
                if (typeof imageUrl === 'object' && imageUrl !== null) {
                    imageUrl = imageUrl.url || null;
                }

                // --- Robust tags handling ---
                let tags = article.tags;
                if (typeof tags === 'string' && tags.trim().startsWith('[')) {
                    try {
                        tags = JSON.parse(tags);
                    } catch { /* empty */ }
                }
                if (!Array.isArray(tags)) {
                    tags = tags ? [tags] : [];
                }

                return {
                    id: article.id || Date.now() + index,
                    admin_approval: article.admin_approval || '',
                    title: article.title || ``,
                    type: 'article',
                    category_name: article.category_name || '',
                    counsellor_name: article.counsellor_name,
                    publishDate: article.publish_date || article.created_at || new Date().toISOString(),
                    status: article.status || '',
                    resource_status: article.resource_status || '',
                    description: article.description || '',
                    tags,
                    image: imageUrl,
                    article_thumbnail: article.image_presigned_url,
                    platform: article.platform || 'web',
                    age: article.audience_age || '',
                    views: article.views || 0,
                    likes: article.likes || 0,
                };
            }).filter((article) => article.resource_status !== 'deleted');
            const articlesList = (articles && articles.length > 0) ? transformedResources : [];
            setAllArticles(articlesList);
            setArticleCount(articlesList.length);
            // Only reset page if this is a filter change (currentPage is 0)
            if (currentPage === 0) {
                setPage(0);
            }

        } catch (error) {
            console.error('Error fetching articles:', error);
            setApiError(error instanceof Error ? error.message : 'Failed to fetch articles');
            // Keep existing resources if API fails
        } finally {
            setIsLoadingArticles(false);
        }
    }, [platformFilter, isLoadingArticles, typeFilter, fetchVideos]);

    // Handle platform filter change
    const handleChangePlatform = (value: string) => {
        setPlatformFilter(value);
        // The useEffect will handle the API call with debouncing
    };

    // Handle video type filter change
    const handleVideoTypeChange = (value: string) => {
        setVideoTypeFilter(value);
        // The useEffect will handle the API call with debouncing
    };

    // Fetch HLS URL for video playback
    const fetchVideoPresignedUrl = async (videoId: string) => {
        setIsLoadingVideo(true);
        setVideoError(null);
        
        try {
            const response = await fetch(`https://interactapiverse.com/shape/videos/${videoId}/play-hls`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.status === '200' && data.data && data.data.hls_url) {
                setVideoPresignedUrl(data.data.hls_url);
            } else {
                throw new Error(data.message || 'Failed to get video URL');
            }
        } catch (error) {
            console.error('Error fetching video HLS URL:', error);
            setVideoError(error instanceof Error ? error.message : 'Failed to load video');
        } finally {
            setIsLoadingVideo(false);
        }
    };

    // Handle video thumbnail click
    const handleVideoThumbnailClick = (resource: Resource) => {
        if (resource.type === 'video') {
            setSelectedVideo(resource);
            setVideoModalOpen(true);
            setVideoPresignedUrl(null);
            setVideoError(null);
            fetchVideoPresignedUrl(resource.id);
        }
    };

    // Fetch resources on component mount
    useEffect(() => {
        fetchArticles('all', 0);
    }, []);

    // Handle type filter changes - only fetch when needed
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeFilter === 'article') {
                fetchArticles(platformFilter, 0);
            }
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [typeFilter, categoryFilter, statusFilter, platformFilter]);

    // Update resources when data changes
    useEffect(() => {
        if (typeFilter === 'all') {
            setResources([...allArticles, ...allTips]);
        } else if (typeFilter === 'article') {
            setResources(allArticles);
        }
    }, [allArticles, allTips, typeFilter]);

    // Save to localStorage whenever resources change
    useEffect(() => {
        localStorage.setItem("resources", JSON.stringify(resources));
    }, [resources]);


    // Handle pagination changes - fetch new data for current page
    useEffect(() => {
        if (typeFilter === 'article') {
            fetchArticles(platformFilter, page);
        }
    }, [page, rowsPerPage]);

    // Reset page to 0 when filters change
    useEffect(() => {
        setPage(0);
    }, [searchTerm, typeFilter, categoryFilter, statusFilter, resourceStatusFilter, platformFilter, dateRange, topCardFilter]);

    // Filter resources based on current filters
    const filteredResources = resources.filter((resource) => {
        const matchesSearch =
            resource?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource?.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
        let matchesType = true;
        // Use topCardFilter for status filtering
        if (topCardFilter === 'published') {
            matchesType = resource?.status === 'live';
        } else if (topCardFilter === 'draft') {
            matchesType = resource?.status === 'draft';
        } else if (typeFilter === 'published') {
            matchesType = resource?.status === 'live';
        } else if (typeFilter !== 'all') {
            matchesType = resource?.type === typeFilter;
        }

        const matchesCategory = categoryFilter === "all" || resource?.category_name.toLowerCase() === categoryFilter.toLowerCase();
        const matchesResourceStatus = typeFilter === 'video' ? true : (resourceStatusFilter === "all" || resource?.resource_status.toLowerCase() === resourceStatusFilter.toLowerCase());
        const matchesStatus = statusFilter === "all" || resource?.status.toLowerCase() === statusFilter.toLowerCase();

        // Updated platform matching logic
        let matchesPlatform = true;
        if (platformFilter !== "all") {
            if (platformFilter.toLowerCase() === "both") {
                matchesPlatform = true; // Show all when "Both" is selected
            } else {
                console.log(resource?.platform,"resource?.platform")
                console.log(platformFilter,"platformFilter")
                matchesPlatform = resource?.platform.toLowerCase() === platformFilter.toLowerCase();
            }
        }
        let matchesDate = true;
        if (dateRange.from && dateRange.to) {
            const d = new Date(resource?.publishDate);
            matchesDate = d >= dateRange.from && d <= dateRange.to;
        } else if (dateRange.from) {
            const d = new Date(resource?.publishDate);
            matchesDate = d >= dateRange.from;
        } else if (dateRange.to) {
            const d = new Date(resource?.publishDate);
            matchesDate = d <= dateRange.to;
        }

        return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesPlatform && matchesDate && matchesResourceStatus;
    });
    // Apply pagination
    const totalPages = Math.ceil(filteredResources.length / rowsPerPage);
    const paginatedResources = filteredResources.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Form validation
    const validateForm = () => {
        const newErrors: ResourceFormErrors = {};
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (!form.counsellor_code.trim()) newErrors.counsellor_code = "Author is required";
        if (!form.type) newErrors.type = "Type is required";
        if (!form.category_name) newErrors.category_name = "Category is required";
        if (!form.platform) newErrors.platform = "Platform is required";
        if (!form.age.trim()) newErrors.age = "Age is required";
        if (!form.description.trim()) newErrors.description = "Description is required";
        if (!form.tags || form.tags.length === 0) newErrors.tags = "At least one tag is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Helper function for average rate (likes per resource)
    const getAverageRate = () => {
        if (resources.length === 0) return "0.00";
        const totalLikes = resources.reduce((sum: number, r: Resource) => sum + (r.likes || 0), 0);
        return (totalLikes / resources.length).toFixed(2);
    };

    // Event handlers
    const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        if (id === "tagInput") {
            setTagInput(value);
        } else {
            setForm((f) => ({ ...f, [id]: value }));
        }
    };

    // Handler for Select fields
    const handleSelect = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    // Handler for file inputs
    const handleFile = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                setErrors((prev) => ({ ...prev, [field]: "Only JPG, GIF, or PNG files are allowed." }));
                return;
            }
            if (file.size > 1024 * 1024) {
                setErrors((prev) => ({ ...prev, [field]: "File size must be 1MB or less." }));
                return;
            }
            setErrors((prev) => ({ ...prev, [field]: undefined }));
            const base64 = await fileToBase64(file);
            setForm((f) => ({ ...f, [field]: base64 }));
            if (field === "image") setThumbPreview(base64);
            if (field === "emptyImage") setEmptyPreview(base64);
        }
    };

    const handleStatsImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                return;
            }
            if (file.size > 1024 * 1024) {
                return;
            }
            const base64 = await fileToBase64(file);
            setStatsImage(base64);
            setStatsImagePreview(base64);
        }
    };

    // 4. Add handleTagKeyDown
    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
            e.preventDefault();
            if (!form.tags.includes(tagInput.trim())) {
                setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
            }
            setTagInput("");
        }
    };

    // 5. Remove tag
    const handleRemoveTag = (tag: string) => {
        setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
    };

    // 6. Update openEditDialog to support array tags
    const handlePublish = () => {
        if (!validateForm()) return;
        const newResource: Resource = {
            id: String(Date.now()),
            admin_approval: '',
            title: form.title,
            counsellor_name: form.counsellor_code,
            type: form.type,
            category_name: form.category_name,
            description: form.description,
            tags: form.tags,
            status: form.status,
            resource_status: form.status,
            publishDate: new Date().toISOString(),
            views: 0,
            likes: 0,
            image: thumbPreview || '',
            platform: form.platform,
            age: form.age,
        };
        setResources((prev) => [newResource, ...prev]);
        setIsAddDialogOpen(false);
        setForm(getInitialForm());
        setTagInput("");
        setThumbPreview(null);
        setEmptyPreview(null);
        setErrors({});
    };

    // Add handler for Save Draft (Add dialog)
    const handleSaveDraft = () => {
        if (!form.title.trim()) {
            setErrors((prev) => ({ ...prev, title: "Title is required" }));
            return;
        }
        const newResource: Resource = {
            id: String(Date.now()),
            admin_approval: '',
            title: form.title,
            counsellor_name: form.counsellor_code,
            type: form.type,
            category_name: form.category_name,
            description: form.description,
            tags: form.tags,
            status: "draft",
            resource_status: "draft",
            publishDate: new Date().toISOString(),
            views: 0,
            likes: 0,
            image: thumbPreview || '',
            platform: form.platform,
            age: form.age,
        };
        setResources((prev) => [newResource, ...prev]);
        setIsAddDialogOpen(false);
        setForm(getInitialForm());
        setTagInput("");
        setThumbPreview(null);
        setEmptyPreview(null);
        setErrors({});
    };

    // Add handler for Save Draft (Edit dialog)
    const handleEditSave = () => {
        if (!validateForm() || !editingResource) return;
        setResources((prev) =>
            prev.map((r) =>
                r.id === editingResource.id
                    ? {
                        ...r,
                        title: form.title,
                        counsellor_code: form.counsellor_code,
                        type: form.type,
                        category_name: form.category_name,
                        description: form.description,
                        tags: form.tags,
                        image: thumbPreview,
                        emptyImage: emptyPreview,
                        platform: form.platform,
                        age: form.age,
                        status: form.status,
                    }
                    : r
            )
        );
        setEditDialogOpen(false);
        setEditingResource(null);
        setForm(getInitialForm());
        setTagInput("");
        setThumbPreview(null);
        setEmptyPreview(null);
        setErrors({});
    };

    // 7. Update handlePublish and handleEditSave to use array tags
    const handleEditSaveDraft = () => {
        if (!form.title.trim() || !editingResource) {
            setErrors((prev) => ({ ...prev, title: "Title is required" }));
            return;
        }
        setResources((prev) =>
            prev.map((r) =>
                r.id === editingResource.id
                    ? {
                        ...r,
                        title: form.title,
                        counsellor_code: form.counsellor_code,
                        type: form.type,
                        category_name: form.category_name,
                        description: form.description,
                        tags: form.tags,
                        image: thumbPreview,
                        emptyImage: emptyPreview,
                        platform: form.platform,
                        age: form.age,
                        status: "draft",
                    }
                    : r
            )
        );
        setEditDialogOpen(false);
        setEditingResource(null);
        setForm(getInitialForm());
        setTagInput("");
        setThumbPreview(null);
        setEmptyPreview(null);
        setErrors({});
    };

    const openEditDialog = (resource: Resource) => {
        setEditingResource(resource);
        setForm({
            title: resource.title,
            counsellor_code: resource.counsellor_name,
            type: resource.type,
            category_name: resource.category_name,
            description: resource.description,
            tags: getTagsArray(resource.tags),
            image: resource.image,
            emptyImage: null,
            platform: resource.platform,
            age: resource.age,
            status: resource.status,
        });
        setTagInput("");
        setThumbPreview(resource.image);
        setEditDialogOpen(true);
    };

    const openViewDialog = (resource: Resource) => {
        setViewingResource(resource);
        setViewDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setResources((prev) => prev.filter((r) => r.id !== id));
    };

    // UI helper functions
    const getTypeIcon = (type: string) => {
        const typeObj = resourceTypes.find((t) => t.value === type);
        const Icon = typeObj?.icon || FileText;
        return <Icon className="h-4 w-4" />;
    };

    const getTypeColor = (type: string) => {
        const colors = {
            sarticle: "bg-blue-100 text-blue-800",
            video: "bg-purple-100 text-purple-800",
            tip: "bg-green-100 text-green-800",
        };
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getStatusColor = (status: string) => {
        return status?.toLowerCase() === "live"
            ? "bg-green-100 text-green-800"
            : status?.toLowerCase() === "hide"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800";
    };

    const handleSubmitArticle = async () => {
        try {
            const response = await fetch(
                `https://interactapiverse.com/mahadevasth/shape/articles/${approveModel.id}/approval`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        admin_approval: "approved",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to approve article");
            }
            setApproveModel({open:false,id:null})
            toast.success("Article approved! The article has been successfully approved.");

        } catch (error: any) {
            setApproveModel({open:false,id:null})
            toast.error(error.message || "An error occurred while approving the article.");
        }
    }

    const handleDeleteArticle = async () => {
        try {
            const response = await fetch(
                `https://interactapiverse.com/mahadevasth/shape/articles/${deleteModel.id}/delete`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        admin_approval: "rejected",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete article");
            }
            setDeleteModel({open:false,id:null})
            toast.success("Article deleted! The article has been successfully approved.");

        } catch (error: any) {
            setDeleteModel({open:false,id:null})
            toast.error(error.message || "An error occurred while deleting the article.");
        }
    }

    useEffect(() => {
        if (!selectedVideo) {
            setIsPortraitVideo(false);
            return;
        }

        if (selectedVideo.width && selectedVideo.height) {
            setIsPortraitVideo(selectedVideo.height > selectedVideo.width);
            return;
        }

        const previewSource = selectedVideo.article_thumbnail || selectedVideo.image;
        if (!previewSource) {
            setIsPortraitVideo(false);
            return;
        }

        let isMounted = true;
        const img = new Image();
        img.onload = () => {
            if (isMounted) {
                setIsPortraitVideo(img.naturalHeight > img.naturalWidth);
            }
        };
        img.onerror = () => {
            if (isMounted) {
                setIsPortraitVideo(false);
            }
        };
        img.src = previewSource;

        return () => {
            isMounted = false;
        };
    }, [selectedVideo]);

    return (
        <div className="space-y-6">
            <Dialog open={approveModel?.open} onOpenChange={()=>setApproveModel({open:false,id:null})}>
                <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden p-3 pt-4">
                    <div>Are you sure you want to approve this article?</div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                setApproveModel({open:false,id:null});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                            onClick={() => handleSubmitArticle()}
                        >
                            Ok
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={deleteModel?.open} onOpenChange={()=>setDeleteModel({open:false,id:null})}>
                <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden p-3 pt-4">
                    <div>Are you sure you want to delete this article?</div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                setDeleteModel({open:false,id:null});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                            onClick={() => handleDeleteArticle()}
                        >
                            Ok
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">
                        Articles
                    </h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">
                        Manage wellness articles, videos, and tips
                    </p>
                    {apiError && (
                        <p className="text-red-600 mt-1 text-sm">
                            API Error: {apiError}
                        </p>
                    )}
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <Button
                        className="bg-[#012765] text-white"
                        onClick={() => {
                            navigate("/resources/new")
                            sessionStorage.setItem('resourceType',"article")
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2"/>
                        Add Article
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'all' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('all')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Total Articles</p>
                                <p className="text-3xl font-bold text-[#012765]">{resources.length}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-500"/>
                        </div>
                    </CardContent>
                </button>
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'published' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('published')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Published</p>
                                <p className="text-3xl font-bold text-[#012765]">{publishedCount}</p>
                            </div>
                            <FileText className="h-8 w-8 text-green-500"/>
                        </div>
                    </CardContent>
                </button>
                <button
                    className={`border-0 shadow-lg bg-white rounded-lg focus:outline-none transition ring-2 ${topCardFilter === 'draft' ? 'ring-[#012765]' : 'ring-transparent'}`}
                    onClick={() => setTopCardFilter('draft')}
                    style={{textAlign: 'left'}}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Draft</p>
                                <p className="text-3xl font-bold text-[#012765]">{draftCount}</p>
                                <p className="text-xs text-gray-500 mt-1">{draftCount} draft(s) saved</p>
                            </div>
                            <FilePen className="h-8 w-8 text-yellow-500"/>
                        </div>
                    </CardContent>
                </button>
                <div className="border-0 shadow-lg bg-white rounded-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#012765]">Rate</p>
                                <p className="text-3xl font-bold text-[#012765]">{getAverageRate()}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-500"/>
                        </div>
                    </CardContent>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Search resources by title, description, or tags..."
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
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.category}>
                                        {category.category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Platform filter */}
                        <Select value={platformFilter} onValueChange={handleChangePlatform}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Platform"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                {platformOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Video Type filter - only show when video tab is selected */}
                        {typeFilter === 'video' && (
                            <Select value={videoTypeFilter} onValueChange={handleVideoTypeChange}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Video Type"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {videoTypeOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {/* Resource Status filter - hide when video tab is selected */}
                        {typeFilter !== 'video' && (
                            <Select value={resourceStatusFilter} onValueChange={setResourceStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Resources</SelectItem>
                                    {resourceStatusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {/* Status filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Date range filter */}
                        <div className="w-full md:w-80 flex flex-col justify-center">
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

            {/* Type Filter Chips */}
            {/*<div className="mb-6">*/}
            {/*    <div className="flex flex-wrap gap-2">*/}
            {/*        <button*/}
            {/*            onClick={() => setTypeFilter('all')}*/}
            {/*            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${*/}
            {/*                typeFilter === 'all'*/}
            {/*                    ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-2'*/}
            {/*                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'*/}
            {/*            }`}*/}
            {/*        >*/}
            {/*            <FileText className="w-4 h-4 mr-2" />*/}
            {/*            All Types ({articleCount + videoCount + tipCount})*/}
            {/*        </button>*/}
            {/*        {resourceTypes.map((type) => {*/}
            {/*            const count = type.value === 'article' ? articleCount : */}
            {/*                         type.value === 'video' ? videoCount : */}
            {/*                         type.value === 'tip' ? tipCount : 0;*/}
            {/*            const Icon = type.icon;*/}
            {/*            const colors = {*/}
            {/*                article: {*/}
            {/*                    active: 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500 ring-offset-2',*/}
            {/*                    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200'*/}
            {/*                },*/}
            {/*                video: {*/}
            {/*                    active: 'bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-2',*/}
            {/*                    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200'*/}
            {/*                },*/}
            {/*                tip: {*/}
            {/*                    active: 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 ring-offset-2',*/}
            {/*                    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200'*/}
            {/*                }*/}
            {/*            };*/}
            {/*            const typeColor = colors[type.value as keyof typeof colors];*/}

            {/*            return (*/}
            {/*                <button*/}
            {/*                    key={type.value}*/}
            {/*                    onClick={() => setTypeFilter(type.value)}*/}
            {/*                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${*/}
            {/*                        typeFilter === type.value*/}
            {/*                            ? typeColor.active*/}
            {/*                            : typeColor.default*/}
            {/*                    }`}*/}
            {/*                >*/}
            {/*                    <Icon className="w-4 h-4 mr-2" />*/}
            {/*                    {type.label} ({count})*/}
            {/*                </button>*/}
            {/*            );*/}
            {/*        })}*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Resources Table */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                                {/*<th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>*/}
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                                {/*<th className="text-left py-3 px-4 font-medium text-gray-600">Duration</th>*/}
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Resource Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Approve Articles</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Published</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedResources.length > 0 ? (
                                paginatedResources.map((resource) => (
                                    <tr key={resource.id} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-4">
                                            <div
                                                className={`h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden relative ${
                                                    resource.type === 'video' ? 'cursor-pointer hover:bg-gray-300 transition-colors' : ''
                                                }`}
                                                onClick={() => resource.type === 'video' ? handleVideoThumbnailClick(resource) : null}
                                            >
                                                {resource.type === 'video' ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                                                        <Video className="h-4 w-4 text-white" />
                                                    </div>
                                                ) :  resource?.article_thumbnail ? (
                                                    <img src={resource?.article_thumbnail} alt={resource.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    getTypeIcon(resource.type)
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 max-w-[200px]">
                                            <div className="truncate font-medium">{resource.title}</div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {resource.tags.slice(0, 2).map((tag, i) => (
                                                    <span key={i} className="mr-1">#{tag}</span>
                                                ))}
                                                {resource.tags.length > 2 && <span>+{resource.tags.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="py-2 px-4">{resource.counsellor_name}</td>
                                        {/*<td className="py-2 px-4">*/}
                                        {/*    <Badge className={`${getTypeColor(resource.type)} flex items-center gap-1 font-normal`}>*/}
                                        {/*        {getTypeIcon(resource.type)}*/}
                                        {/*        <span>{resource.type}</span>*/}
                                        {/*    </Badge>*/}
                                        {/*</td>*/}
                                        <td className="py-2 px-4">
                                            {resource.category_name
                                                .replace("-", " ")
                                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </td>
                                        {/*<td className="py-2 px-4">*/}
                                        {/*    {resource.type === 'video' && resource.duration ? */}
                                        {/*        `${Math.floor(resource.duration / 60)}:${(resource.duration % 60).toString().padStart(2, '0')}` : */}
                                        {/*        resource.type === 'video' ? 'N/A' : '-'*/}
                                        {/*    }*/}
                                        {/*</td>*/}
                                        <td className="py-2 px-4">
                                            <Badge className={getStatusColor(resource?.resource_status)}>
                                                {resource?.resource_status?.charAt(0)?.toUpperCase() + resource?.resource_status?.slice(1)}
                                            </Badge>
                                        </td>
                                        <td className="py-2 px-4">
                                            <Badge className={getStatusColor(resource.status)}>
                                                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                                            </Badge>
                                        </td>
                                        <td>
                                        <div
                                            onClick={() => setApproveModel({open:true,id:resource.id})}
                                            className="flex justify-center items-center"
                                        >
                                            <Button
                                                variant="outline"
                                                className={`bg-green-100 cursor-pointer text-green-800 hover:bg-green-200 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                disabled={resource?.admin_approval === "approved"}
                                            >
                                                Approve Article
                                            </Button>

                                        </div>
                                        </td>
                                        <td className="py-2 px-4">
                                            {resource.publishDate
                                                ? format(new Date(resource.publishDate), "MMM dd, yyyy")
                                                : "N/A"}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {/*<DropdownMenuItem*/}
                                                    {/*    disabled={resource?.admin_approval === "approved"}*/}
                                                    {/*    onClick={() => setApproveModel({open:true,id:resource.id})}*/}
                                                    {/*    className="cursor-pointer"*/}
                                                    {/*>*/}
                                                    {/*    <Eye className="mr-2 h-4 w-4" />*/}
                                                    {/*    Approve Article*/}
                                                    {/*</DropdownMenuItem>*/}
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/resources/edit/${resource.id}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openEditDialog(resource)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Resource
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteModel({open:true,id:resource.id})}
                                                        className="cursor-pointer text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-gray-500">
                                        {isLoadingArticles || isLoadingVideos ? (
                                            <div className="flex flex-col items-center">
                                                <RefreshCw className="h-6 w-6 animate-spin text-[#012765] mb-2" />
                                                <span>Loading resources...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <FileText className="h-6 w-6 text-gray-400 mb-2" />
                                                <span>No resources found matching your filters</span>
                                                <Button
                                                    variant="link"
                                                    className="mt-2 text-[#012765]"
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setCategoryFilter("all");
                                                        setPlatformFilter("all");
                                                        setStatusFilter("all");
                                                        setResourceStatusFilter("all");
                                                        setTopCardFilter("all");
                                                        setDateRange({ from: null, to: null });
                                                    }}
                                                >
                                                    Clear all filters
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rows per page:</span>
                            <Select
                                value={String(rowsPerPage)}
                                onValueChange={(value) => setRowsPerPage(Number(value))}
                            >
                                <SelectTrigger className="w-16 h-8">
                                    <SelectValue placeholder={rowsPerPage} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                {filteredResources.length > 0 ?
                    `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredResources.length)} of ${filteredResources.length}` :
                    '0 of 0'}
              </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl">
                    {viewingResource && (
                        <div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{viewingResource.title}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            {viewingResource.image ? (
                                                <img
                                                    src={viewingResource.image}
                                                    alt={viewingResource.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    {getTypeIcon(viewingResource.type)}
                                                    <span className="ml-2 text-gray-500">No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4 text-gray-500" />
                                                <span>{viewingResource.views} views</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="h-4 w-4 text-gray-500" />
                                                <span>{viewingResource.likes} likes</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Author</h3>
                                            <p>{viewingResource.counsellor_name}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Type</h3>
                                            <Badge className={`${getTypeColor(viewingResource.type)} mt-1 flex items-center gap-1 font-normal`}>
                                                {getTypeIcon(viewingResource.type)}
                                                <span>{viewingResource.type}</span>
                                            </Badge>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Category</h3>
                                            <p>
                                                {viewingResource.category_name
                                                    .replace("-", " ")
                                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <Badge className={getStatusColor(viewingResource.status)}>
                                                {viewingResource.status.charAt(0).toUpperCase() + viewingResource.status.slice(1)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Published Date</h3>
                                            <p>
                                                {viewingResource.publishDate
                                                    ? format(new Date(viewingResource.publishDate), "MMMM dd, yyyy")
                                                    : "Not published"}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Platform</h3>
                                            <p>{viewingResource.platform}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Age Group</h3>
                                            <p>{viewingResource.age}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                    <p className="mt-1">{viewingResource.description}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {viewingResource.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Video Modal */}
            <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                <DialogContent
                    className={cn(
                        "overflow-hidden p-0",
                        isPortraitVideo
                            ? "w-full max-w-md h-[90vh]"
                            : "w-full max-w-4xl h-[90vh]"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {selectedVideo?.title || 'Video Player'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        {isLoadingVideo ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-[#012765] mb-4" />
                                <p className="text-gray-600">Loading video...</p>
                            </div>
                        ) : videoError ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="text-red-500 mb-4">
                                    <Video className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-center">{videoError}</p>
                                </div>
                                <Button 
                                    onClick={() => selectedVideo && fetchVideoPresignedUrl(selectedVideo.id)}
                                    variant="outline"
                                    className="mt-2"
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : videoPresignedUrl ? (
                            <div className="space-y-4">
                                <div
                                    className={cn(
                                        "relative bg-black rounded-2xl overflow-hidden flex items-center justify-center mx-auto w-full",
                                        isPortraitVideo
                                            ? "max-w-xs sm:max-w-sm h-[620px]"
                                            : "min-h-[450px]"
                                    )}
                                >
                                    <HlsPlayer
                                        src={videoPresignedUrl}
                                        poster={selectedVideo?.article_thumbnail || selectedVideo?.image || undefined}
                                        autoPlay={true}
                                        muted={true}
                                        controls={true}
                                        className={cn(
                                            "w-full",
                                            isPortraitVideo ? "h-full" : ""
                                        )}
                                    />
                                </div>
                                
                                {selectedVideo && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Video Details</h4>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="font-medium">Author:</span> {selectedVideo.counsellor_name}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Category:</span> {selectedVideo.category_name}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Duration:</span> {selectedVideo.duration ? 
                                                        `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 
                                                        'N/A'
                                                    }
                                                </div>
                                                <div>
                                                    <span className="font-medium">File Size:</span> {selectedVideo.file_size ? 
                                                        `${(selectedVideo.file_size / (1024 * 1024)).toFixed(2)} MB` : 
                                                        'N/A'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedVideo.tags.map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                            
                                            <h4 className="font-semibold text-gray-700 mb-2 mt-4">Description</h4>
                                            <p className="text-sm text-gray-600">
                                                {selectedVideo.description || 'No description available'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                    
                    <div className="flex justify-end mt-6 pt-4 border-t">
                        <Button 
                            onClick={() => setVideoModalOpen(false)}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Other dialogs would go here (Add/Edit dialogs, etc.) */}
        </div>
    );
};