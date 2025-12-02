import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';
import {Input} from '../ui/input';
import {Button} from '../ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {useLoader} from "@/LoaderContext.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {MoreHorizontal, Edit, Trash2, Eye} from 'lucide-react';
import {useToast} from "@/hooks/use-toast";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useNavigate} from "react-router-dom";

interface ReflectionCard {
    id: string;
    heading: string;
    text: string;
    category: string;
    created_at: string;
    // Add any other properties from your API response
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];
const DEFAULT_ROWS_PER_PAGE = 5;

export const ReflectionCards = () => {
    const [reflectionCards, setReflectionCards] = useState<ReflectionCard[]>([]);
    const [filteredCards, setFilteredCards] = useState<ReflectionCard[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const {toast} = useToast();
    const navigate = useNavigate();

    // const { setIsLoading } = useLoader();

    useEffect(() => {
        const fetchReflectionCards = async () => {
            try {
                // setIsLoading(true);
                const response = await axios.get('https://interactapiverse.com/mahadevasth/reflection-cards');
                setReflectionCards(response.data.data);
                setFilteredCards(response.data.data);
            } catch (error) {
                console.error('Error fetching reflection cards:', error);
            } finally {
                // setIsLoading(false);
            }
        };

        fetchReflectionCards();
    }, []);

    // Get unique categories from all cards
    const categories = ['all', ...Array.from(new Set(reflectionCards.map(card => card.category || 'General')))];

    // Filter cards based on search term and category
    useEffect(() => {
        let results = [...reflectionCards];
        
        if (searchTerm.trim() !== '') {
            results = results.filter(card =>
                card.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (categoryFilter !== 'all') {
            results = results.filter(card => card.category === categoryFilter);
        }
        
        setFilteredCards(results);
        setPage(0); // Reset to first page when filters change
    }, [searchTerm, categoryFilter, reflectionCards]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleCategoryChange = (value: string) => {
        setCategoryFilter(value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCategoryFilter('all');
    };

    const handleDelete = async (id: string) => {
        try {
            // Replace with your actual delete endpoint
            await axios.delete(`https://interactapiverse.com/mahadevasth/reflection-cards/${id}`);
            setReflectionCards(prev => prev.filter(card => card.id !== id));
            toast({
                title: "Card deleted",
                description: "Reflection card has been deleted successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete reflection card.",
                variant: "destructive",
            });
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredCards.length / rowsPerPage);
    const paginatedCards = filteredCards.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Handle rows per page change
    const handleRowsPerPageChange = (value: string) => {
        const newRowsPerPage = value === 'All' ? filteredCards.length : Number(value);
        setRowsPerPage(newRowsPerPage);
        setPage(0); // Reset to first page when changing rows per page
    };

    return (
        <Card className="w-full shadow-lg border-0">
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold text-[#FF7119]">Reflection Cards</CardTitle>
                        <p className="text-gray-600 mt-1 text-[#012765]">Manage all reflection cards in the system</p>
                    </div>
                    <Button className="mt-4 md:mt-0 bg-[#012765] text-white">Add New Card</Button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by title or description..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full"
                        />
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category === 'all' ? 'All Categories' : category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={handleClearSearch}>Clear Filters</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>Heading</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCards.length > 0 ? (
                            paginatedCards.map((card) => (
                                <TableRow key={card.id}>
                                    <TableCell className="font-medium">{card.id}</TableCell>
                                    <TableCell className="font-medium">{card.heading}</TableCell>
                                    <TableCell>{card.category || 'General'}</TableCell>
                                    <TableCell className="max-w-xs truncate">{card.text}</TableCell>
                                    <TableCell>{new Date(card.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => navigate(`/reflection-cards/${card.id}`)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>

                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(card.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                    No reflection cards found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                
                {/* Enhanced Pagination with rows per page selector */}
                {filteredCards.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredCards.length)} of {filteredCards.length} cards
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Rows per page:</span>
                                <Select 
                                    value={rowsPerPage === filteredCards.length ? 'All' : String(rowsPerPage)}
                                    onValueChange={handleRowsPerPageChange}
                                >
                                    <SelectTrigger className="w-16 h-8 border-gray-200 rounded-md shadow-sm text-gray-700 text-sm focus:ring-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="w-16 rounded-md shadow-lg border-gray-200">
                                        {ROWS_PER_PAGE_OPTIONS.map(option => (
                                            <SelectItem 
                                                key={option} 
                                                value={String(option)}
                                                className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black"
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                        <SelectItem 
                                            value="All"
                                            className="text-gray-800 data-[state=checked]:bg-gray-200 data-[state=checked]:text-black"
                                        >
                                            All
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                                    disabled={page === 0}
                                    className="h-8 w-8 p-0"
                                    aria-label="Previous page"
                                >
                                    &lt;
                                </Button>
                                
                                {/* Page number buttons */}
                                <div className="flex items-center">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        // Logic to display page numbers with ellipsis for large page counts
                                        if (
                                            i === 0 || // Always show first page
                                            i === totalPages - 1 || // Always show last page
                                            (i >= page - 1 && i <= page + 1) // Show pages around current page
                                        ) {
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={i === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(i)}
                                                    className={`h-8 w-8 p-0 mx-1 ${i === page ? "bg-[#012765] hover:bg-[#012765]/90" : ""}`}
                                                >
                                                    {i + 1}
                                                </Button>
                                            );
                                        }
                                        
                                        // Show ellipsis for skipped pages
                                        if (i === page - 2 || i === page + 2) {
                                            return <span key={i} className="mx-1">...</span>;
                                        }
                                        
                                        return null;
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="h-8 w-8 p-0"
                                    aria-label="Next page"
                                >
                                    &gt;
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};