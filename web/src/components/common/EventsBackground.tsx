import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import { motion } from 'framer-motion';
import { eventService, Event } from '@/utils/services/eventService';
import OptImage from '@/components/common/OptImage';

interface EventsBackgroundProps {
  tag_name?: string;
}

const EventsBackground: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridSize = 16; // 4x4 grid

  // Function to get next set of unique events
  const getNextEvents = useCallback(() => {
    if (events.length === 0) return;

    setVisibleEvents((prevEvents) => {
      // Get current image URLs
      const currentImageUrls = prevEvents
        .map((event) => event.content_images?.[0]?.image_url)
        .filter(Boolean);

      // Find events with images not currently displayed
      const nextEvents = events.filter((event) => {
        const imageUrl = event.content_images?.[0]?.image_url;
        return imageUrl && !currentImageUrls.includes(imageUrl);
      }).slice(0, gridSize);

      // If we don't have enough unique events, start over from the beginning
      if (nextEvents.length < gridSize) {
        // Get all unique image URLs
        const uniqueImageUrls = new Set();
        const uniqueEvents = events.filter((event) => {
          const imageUrl = event.content_images?.[0]?.image_url;
          if (imageUrl && !uniqueImageUrls.has(imageUrl)) {
            uniqueImageUrls.add(imageUrl);
            return true;
          }
          return false;
        }).slice(0, gridSize);
        return uniqueEvents;
      }

      return nextEvents;
    });
  }, [events, gridSize]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventService.getAllEvents({
          sortBy: 'event_date',
          sortOrder: 'desc',
          limit: 50,
        });
        if (response.events) {
          // Filter out events without images
          const eventsWithImages = response.events.filter((event) => event.content_images
            && event.content_images[0]
            && event.content_images[0].image_url);
          setEvents(eventsWithImages);
          // Initialize with first grid of unique events
          setVisibleEvents(eventsWithImages.slice(0, gridSize));
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Rotate events every 30 seconds
  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(getNextEvents, 30000);
    return () => clearInterval(interval);
  }, [events, getNextEvents]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {visibleEvents.map((event, index) => {
          const depth = Math.sin(index * 0.5) * 10;
          const scale = 0.98 + Math.abs(Math.sin(index * 0.5)) * 0.02;
          const xOffset = Math.sin(index * 0.3) * 20;
          const column = index % 4;
          const row = Math.floor(index / 4);

          const startY = 100;
          const endY = -800;

          return (
            <motion.div
              key={`${event._id}-${event.content_images?.[0]?.image_url}`}
              className="absolute"
              style={{
                left: `${column * 25}%`,
                top: `${row * 25}%`,
                transform: `translateZ(${depth}px) scale(${scale})`,
                width: '22%',
                height: '22%',
              }}
              initial={{
                y: startY,
                x: xOffset,
                opacity: 0,
              }}
              animate={{
                y: endY,
                x: -xOffset,
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                delay: index * 0.5,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
                {event.content_images && event.content_images[0] && (
                  <OptImage
                    src={event.content_images[0].image_url}
                    alt={event.event_title}
                    className="w-full h-full object-cover opacity-50"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                  <h3 className="text-white text-sm font-semibold mb-1 line-clamp-2">
                    {event.event_title}
                  </h3>
                  <p className="text-white/70 text-xs line-clamp-2">
                    {event.event_summary}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default EventsBackground;
