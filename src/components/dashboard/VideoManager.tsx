import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DateInputButton } from "@/components/ui/DatePickerDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Video, Search, Plus, RefreshCw, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {cn} from "@/lib/utils.ts";
import HlsPlayer from "@/components/ui/HlsPlayer";


type VideoResource = {
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
    tags: string[];
    image: string;
    platform: string;
    age: string;
    views?: number;
    likes?: number;
    duration?: number;
    file_size?: number;
    s3_url?: string;
    content_type?: string;
    width?: number;
    height?: number;
    thumbnail?: string;
    priority?: string;
};

const videoTypeOptions = [
    { value: "session", label: "Session" },
    { value: "shorts", label: "Shorts" },
];

const platformOptions = [
    { value: "all", label: "All" },
    { value: "web", label: "Web" },
    { value: "app", label: "App" },
];

const statusOptions = [
    { value: "all", label: "All" },
    { value: "published", label: "Published" },
    { value: "unpublished", label: "Unpublished" },
];

export const VideoManager = () => {
    const navigate = useNavigate();

    const [videos, setVideos] = useState<VideoResource[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [platformFilter, setPlatformFilter] = useState("all");
    const [videoTypeFilter, setVideoTypeFilter] = useState("shorts");
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Modal states
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null);
    const [videoPresignedUrl, setVideoPresignedUrl] = useState<string | null>(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<VideoResource | null>(null);


    const fetchVideos = useCallback(async (currentPage: number = 0) => {
        if (isLoading) return;
        setIsLoading(true);
        setApiError(null);
        try {
            const baseUrl = 'https://interactapiverse.com/mahadevasth/shape/videos';
            const params = new URLSearchParams({
                type: videoTypeFilter,
                platform: platformFilter === 'all' ? 'app' : platformFilter.toLowerCase(),
                status: statusFilter === 'all' ? 'all' : statusFilter.toLowerCase(),
                category: categoryFilter === 'all' ? '' : categoryFilter.toLowerCase(),
                // page: String(currentPage + 1),
                // per_page: String(rowsPerPage)
            });
            const response = await fetch(`${baseUrl}?${params}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            let list = [] as any[];
            if (data?.data?.videos) list = data.data.videos; else if (Array.isArray(data)) list = data; else if (data?.videos) list = data.videos; else if (data?.data) list = data.data; else list = [data];
            if (!Array.isArray(list)) list = [];

            const transformed = list.map((video: any, index: number): VideoResource => {
                let tags = video.tags || [];
                if (typeof tags === 'string' && tags.trim().startsWith('[')) {
                    try { tags = JSON.parse(tags); } catch { /* empty */ }
                }
                if (!Array.isArray(tags)) tags = tags ? [tags] : [];
                const status = video.status === 1 ? 'live' : 'draft';
                return {
                    id: video.id || String(Date.now() + index),
                    admin_approval: video.admin_approval || '',
                    title: video.original_filename || video.filename || `Video ${index + 1}`,
                    type: 'video',
                    category_name: video.category || 'General',
                    counsellor_name: video.author || '',
                    publishDate: video.created_at_utc || video.created_at_ist || new Date().toISOString(),
                    status,
                    resource_status: status,
                    description: video.description || '',
                    tags,
                    image: video.s3_url || '',
                    platform: video.platform?.toLowerCase() || 'app',
                    age: video.age_band || '',
                    views: video.views || 0,
                    likes: video.likes || 0,
                    duration: video.duration_seconds,
                    file_size: video.file_size,
                    s3_url: video.s3_url,
                    content_type: video.content_type,
                    width: video.width,
                    height: video.height,
                    thumbnail: video?.thumbnail_presigned_url,
                    priority: video.priority,
                };
            });
            setVideos(transformed);
            if (currentPage === 0) setPage(0);
        } catch (e: any) {
            setApiError(e?.message || 'Failed to fetch videos');
        } finally {
            setIsLoading(false);
        }
    }, [videoTypeFilter, platformFilter, statusFilter, categoryFilter, rowsPerPage, isLoading]);

    // Fetch presigned URL for video playback
    const fetchVideoPresignedUrl = async (videoId: string) => {
        setIsLoadingVideo(true);
        setVideoError(null);
        try {
            const response = await fetch(`https://interactapiverse.com/mahadevasth/shape/videos/${videoId}/play-hls`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.status === '200' && data.data && data.data.hls_url) {
                setVideoPresignedUrl(data.data.hls_url);
            } else {
                throw new Error(data.message || 'Failed to get video URL');
            }
        } catch (error: any) {
            setVideoError(error?.message || 'Failed to load video');
        } finally {
            setIsLoadingVideo(false);
        }
    };

    // Handle video thumbnail click
    const handleVideoThumbnailClick = (video: VideoResource) => {
        setSelectedVideo(video);
        setVideoModalOpen(true);
        setVideoPresignedUrl(null);
        setVideoError(null);
        fetchVideoPresignedUrl(video.id);
    };

    useEffect(() => {
        fetchVideos(0);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchVideos(0), 120);
        return () => clearTimeout(t);
    }, [videoTypeFilter, categoryFilter, statusFilter, platformFilter]);

    useEffect(() => {
        fetchVideos(page);
    }, [page, rowsPerPage]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, categoryFilter, statusFilter, platformFilter, dateRange]);


    const filtered = videos.filter((v) => {
        const matchesSearch = (
            v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        const matchesCategory = categoryFilter === 'all' || v.category_name?.toLowerCase() === categoryFilter.toLowerCase();
        const matchesStatus = statusFilter === 'all' || v.status?.toLowerCase() === statusFilter.toLowerCase();
        let matchesPlatform = true;
        if (platformFilter !== 'all') matchesPlatform = v.platform?.toLowerCase() === platformFilter.toLowerCase();
        let matchesDate = true;
        if (dateRange.from || dateRange.to) {
            const d = new Date(v.publishDate);
            if (dateRange.from) matchesDate = matchesDate && d >= dateRange.from;
            if (dateRange.to) matchesDate = matchesDate && d <= dateRange.to;
        }
        return matchesSearch && matchesCategory && matchesStatus && matchesPlatform && matchesDate;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleDeleteVideo = async (id: string) => {
        try {
            // 🔹 Call API when backend is ready
            // await fetch(`https://interactapiverse.com/mahadevasth/shape/videos/${id}/delete`, { method: "DELETE" });

            // Remove from state immediately
            setVideos((prev) => prev.filter((v) => v.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const isPortraitVideo = useMemo(() => {
        if (!selectedVideo) return false;
        if (selectedVideo.width && selectedVideo.height) {
            return selectedVideo.height > selectedVideo.width;
        }
        return selectedVideo.type === "shorts";
    }, [selectedVideo]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#FF7119]">Videos</h1>
                    <p className="text-gray-600 mt-2 text-[#012765]">Manage wellness videos</p>
                    {apiError && (
                        <p className="text-red-600 mt-1 text-sm">API Error: {apiError}</p>
                    )}
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <Button
                        className="bg-[#012765] text-white"
                        onClick={() => {
                            navigate('/videos/new');
                            sessionStorage.setItem('resourceType', 'video');
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Video
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search videos by title, description, or tags..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={platformFilter} onValueChange={setPlatformFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                {platformOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={videoTypeFilter} onValueChange={setVideoTypeFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Video Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {videoTypeOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="w-full md:w-80 flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <DateInputButton value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''} onChange={(d) => setDateRange((r) => ({ ...r, from: d ? new Date(d) : null }))} placeholder="From" title="Select From Date" className="flex-1" />
                                <span className="mx-1 text-gray-500">-</span>
                                <DateInputButton value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''} onChange={(d) => setDateRange((r) => ({ ...r, to: d ? new Date(d) : null }))} placeholder="To" title="Select To Date" className="flex-1" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                                    {/*<th className="text-left py-3 px-4 font-medium text-gray-600">Duration</th>*/}
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Published</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length > 0 ? (
                                    pageRows.map((v) => (
                                        <tr key={v.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-4">
                                                <div className="h-10 w-10 rounded-md bg-gray-200 cursor-pointer flex items-center justify-center overflow-hidden relative hover:bg-gray-300" onClick={() => handleVideoThumbnailClick(v)}>
                                                    {v.thumbnail ? (
                                                        <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Video className="h-4 w-4" />
                                                    )}
                                                    {/*<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">*/}
                                                    {/*    <Video className="h-4 w-4 text-white" />*/}
                                                    {/*</div>*/}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 max-w-[200px]">
                                                <div className="truncate font-medium" >{v.title}</div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {v.tags.slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="mr-1">#{tag}</span>
                                                    ))}
                                                    {v.tags.length > 2 && <span>+{v.tags.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">{v.counsellor_name}</td>
                                            <td className="py-2 px-4">{v.category_name}</td>
                                            {/*<td className="py-2 px-4">{v.duration ? `${Math.floor((v.duration as number) / 60)}:${((v.duration as number) % 60).toString().padStart(2, '0')}` : 'N/A'}</td>*/}
                                            <td className="py-2 px-4">
                                                <Badge className={v.status?.toLowerCase() === 'live' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                    {v.status?.charAt(0)?.toUpperCase() + v.status?.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="py-2 px-4">{v.publishDate ? format(new Date(v.publishDate), 'MMM dd, yyyy') : 'N/A'}</td>
                                            <td className="py-2 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {/*<DropdownMenuItem onClick={() => navigate(`/videos/edit/${v.id}?view=1`)} className="cursor-pointer">*/}
                                                        {/*    <Eye className="mr-2 h-4 w-4" />*/}
                                                        {/*    View Details*/}
                                                        {/*</DropdownMenuItem>*/}
                                                        {/*<DropdownMenuItem onClick={() => navigate(`/videos/edit/${v.id}`)} className="cursor-pointer">*/}
                                                        {/*    <Edit className="mr-2 h-4 w-4" />*/}
                                                        {/*    Edit Video*/}
                                                        {/*</DropdownMenuItem>*/}
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-red-600"
                                                            onClick={() => {
                                                                setVideoToDelete(v);
                                                                setDeleteConfirmOpen(true);
                                                            }}
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
                                        <td colSpan={8} className="py-8 text-center text-gray-500">
                                            {isLoading ? (
                                                <div className="flex flex-col items-center">
                                                    <RefreshCw className="h-6 w-6 animate-spin text-[#012765] mb-2" />
                                                    <span>Loading videos...</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Video className="h-6 w-6 text-gray-400 mb-2" />
                                                    <span>No videos found matching your filters</span>
                                                    <Button variant="link" className="mt-2 text-[#012765]" onClick={() => { setSearchTerm(""); setCategoryFilter("all"); setPlatformFilter("all"); setStatusFilter("all"); setDateRange({ from: null, to: null }); }}>Clear all filters</Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rows per page:</span>
                            <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
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
                            <span className="text-sm text-gray-600 mr-4">{filtered.length > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filtered.length)} of ${filtered.length}` : '0 of 0'}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
                    <div className="flex flex-col h-full p-6 space-y-4 justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                {selectedVideo?.title || "Video Player"}
                            </DialogTitle>
                        </DialogHeader>

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
                                    poster={selectedVideo?.thumbnail || selectedVideo?.image || undefined}
                                    autoPlay={true}
                                    muted={true}
                                    controls={true}
                                    className={cn(
                                        "w-full",
                                        isPortraitVideo ? "h-full" : ""
                                    )}
                                />
                            </div>
                        ) : null}

                        <div className="flex justify-end pt-2 border-t">
                            <Button onClick={() => setVideoModalOpen(false)} variant="outline">
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>

            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden p-3 pt-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold ">
                            Delete Video
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to delete{" "}
                        <span className="font-medium">{videoToDelete?.title}</span>?
                    </p>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-[#FF7119] text-white font-semibold hover:bg-[#d95e00] transition-colors"
                            onClick={() => {
                                if (videoToDelete) {
                                    handleDeleteVideo(videoToDelete.id);
                                }
                                setDeleteConfirmOpen(false);
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default VideoManager;


