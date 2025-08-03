import React, { useEffect, useState } from 'react';
import {
  CalendarRange, CalendarDays, MapPin, Clock, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { eventService, Event } from '@/utils/services/eventService';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface EventsFeedProps {
    tag_name?: string;
}

const EventsFeed: React.FC<EventsFeedProps> = ({ tag_name }) => {
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

  const eventsToShow = showAll ? events : events.slice(0, 8);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-start space-x-3">
              <Skeleton className="w-32 h-24 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        {error ? `Error loading events: ${error}` : 'No events found.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Standardized Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 px-3 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
            <CalendarRange className="mr-1.5 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Key Events
            {tag_name && (
            <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">
              for "
              {tag_name}
              "
            </span>
            )}
          </h1>
          {events.length > 8 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="ml-auto h-5 px-2 text-xs"
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {eventsToShow.map((event) => (
          <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600">
            <Link to={`/tags/${encodeURIComponent(event.tag_like_title)}`} className="block">
              <div className="flex items-start space-x-3 p-3">
                <div className="flex-shrink-0 w-32 h-24 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                  {event.main_image ? (
                    <OptImage
                        src={event.main_image}
                        alt={event.event_title}
                        className="w-full h-full object-cover"
                        width={128}
                        height={96}
                      />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center">
                          <CalendarRange className="w-8 h-8 text-gray-400" />
                        </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors leading-tight text-gray-900 dark:text-gray-100 mb-2">
                        {event.event_title}
                      </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {event.event_summary}
                      </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                          </span>
                      </div>
                    {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    {event.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.duration}</span>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                        {event.tag_like_title}
                      </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsFeed;
