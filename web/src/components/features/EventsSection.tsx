import React, { useEffect, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { eventService, Event, EventImage } from '@/utils/services/eventService';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

// Container component for the image
const ImageContainer: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => (

  <div className="w-full aspect-video mb-2">
    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative flex items-center justify-center" style={style}>
      {children}
    </div>
  </div>
);

const EventImageGrid: React.FC<{ mainImage?: string }> = ({ mainImage }) => {
  if (mainImage) {
    return (
      <OptImage
        src={mainImage}
        alt="Event main"
        className="absolute inset-0 w-full h-full object-cover"
        appearAfterLoaded
        container={ImageContainer}
      />
    );
  }
  return (
    <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
      <CalendarRange className="w-8 h-8 text-gray-400" />
    </div>
  );
};

interface EventsSectionProps {
    tag_name?: string;
}

const EventsSection: React.FC<EventsSectionProps> = ({ tag_name }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let response;
        if (tag_name) {
          response = await eventService.getEventsByTag(tag_name);
        } else {
          response = await eventService.getAllEvents({ sortBy: 'event_date', sortOrder: 'desc', limit: 50 });
        }
        if (response?.events) {
          setEvents(response.events);
        } else {
          setEvents([]);
          setError('Invalid response format from server');
        }
      } catch (error) {
        console.error('Could not fetch events:', error);
        setEvents([]);
        setError('Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [tag_name]);

  const eventsToShow = showAll ? events : events.slice(0, 10);

  // Return null for loading, error, or empty states
  if (isLoading || error || events.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 p-3">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
          <CalendarRange className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
          Key Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {eventsToShow.map((event) => (
            <Card key={event._id} className="overflow-hidden hover:shadow-sm transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
              <Link to={`/tags/${encodeURIComponent(event.tag_like_title)}`} className="block">
                <div>
                  <EventImageGrid mainImage={event.main_image} />
                  <div className="p-3 flex flex-col justify-center">
                    <h3 className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight text-gray-900 dark:text-gray-100 text-sm">{event.event_title}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">{event.event_summary}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
        {events.length > 10 && (
        <Button variant="outline" className="w-full mt-3 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Less Events' : 'Show More Events'}
        </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsSection;
