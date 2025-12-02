import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReflectionCardDetail {
  id: string;
  heading: string;
  text: string;
  category: string;
  created_at: string;
  // Add any other properties that might exist
}

export const ReflectionCardDetails = () => {
  const [cardData, setCardData] = useState<ReflectionCardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://interactapiverse.com/mahadevasth/reflection-cards/${id}`);
        setCardData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching reflection card details:', err);
        setError('Failed to load reflection card details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCardDetails();
    }
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
        <CardHeader className="pb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit mb-4"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reflection Cards
          </Button>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-48" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
        <CardHeader>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit mb-4"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reflection Cards
          </Button>
          <CardTitle className="text-2xl text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!cardData) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
        <CardHeader>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit mb-4"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reflection Cards
          </Button>
          <CardTitle className="text-2xl">Reflection Card Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">The requested reflection card could not be found.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGoBack}>Go Back</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 animate-in fade-in duration-300">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reflection Cards
          </Button>
          
          <div>
            <CardTitle className="text-3xl font-bold text-[#012765]">{cardData.heading}</CardTitle>
            <div className="flex items-center mt-3">
              <Badge className="bg-[#FF7119] hover:bg-[#FF7119]/90 text-white">
                {cardData.category || 'General'}
              </Badge>
              <div className="flex items-center ml-4 text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                <time dateTime={cardData.created_at}>
                  {new Date(cardData.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#012765] mb-2">Reflection Content</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {cardData.text}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-6">
        <div className="text-sm text-gray-500">
          Card ID: {cardData.id}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleGoBack}>
            Close
          </Button>
          <Button className="bg-[#012765] hover:bg-[#012765]/90">
            Edit Card
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
