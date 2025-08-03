import api from '../api';

export interface EventImage {
  _id: string;
  image_url?: string;
  title?: string;
}

export interface Event {
  _id: string;
  event_title: string;
  event_date: string;
  event_summary: string;
  event_keywords: string[];
  tag_like_title: string;
  contents: string[];
  createdAt: string;
  lastModified: string;
  tag_id?: string;
  affected_tags?: Record<string, { tag_name: string; count: number }[]>;
  content_images?: EventImage[];
  main_image?: string;
  countries_affected?: {
    positive?: string[];
    negative?: string[];
    neutral?: string[];
  };
}

// For creating an event
export interface AddEventPayload {
  event_title: string;
  event_date: string;
  event_summary: string;
  event_keywords: string[];
  tag_like_title: string;
}

// For updating an event
export type UpdateEventPayload = Partial<AddEventPayload>;

export interface GetAllEventsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface GetAllEventsResponse {
    events: Event[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalEvents: number;
        limit: number;
    };
}

const ensureEventDefaults = (event: any): Event => ({
  ...event,
  _id: event._id,
  event_title: event.event_title || '',
  event_date: event.event_date || '',
  event_summary: event.event_summary || '',
  event_keywords: event.event_keywords || [],
  tag_like_title: event.tag_like_title || '',
  createdAt: event.createdAt,
  lastModified: event.lastModified,
  contents: event.contents || [],
  tag_id: event.tag_id,
});

export const eventService = {
  async getAllEvents(params: GetAllEventsParams = {}): Promise<GetAllEventsResponse> {
    const response = await api.get('/events', { params });
    return response.data;
  },

  async addEvent(payload: AddEventPayload): Promise<Event> {
    const response = await api.post('/admin/event/add', payload);
    return response.data.event;
  },

  async updateEvent(id: string, payload: UpdateEventPayload): Promise<Event> {
    const response = await api.put(`/admin/event/update/${id}`, payload);
    return response.data.event;
  },

  async deleteEvent(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/event/delete/${id}`);
    return response.data;
  },

  async addContentsToEvent(eventId: string, contentIds: string[]): Promise<{ message: string; modified_count: number }> {
    const response = await api.post('/admin/event/add_contents', { event_id: eventId, content_ids: contentIds });
    return response.data;
  },

  async deleteAllEvents(): Promise<{ message: string; deleted_events_count: number; deleted_tags_count: number }> {
    const response = await api.delete('/admin/events/delete-all');
    return response.data;
  },

  async getEventsByTag(tag_name: string): Promise<GetAllEventsResponse> {
    const response = await api.get(`/events_by_tag?tag_name=${encodeURIComponent(tag_name)}`);
    return response.data;
  },
};
