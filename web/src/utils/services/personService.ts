import api from '../api';
import { Person } from '@/types/shared';

// the routes do not start with /api , because api object already has it
const personService = {
  getAllPersons: async (): Promise<Person[]> => {
    const response = await api.get<{ persons: Person[] }>('/admin/persons');
    return response.data.persons;
  },

  addPerson: async (personData: { personName: string }) => {
    const response = await api.post<{ person: Person }>('/admin/persons', personData);
    return response.data.person;
  },

  updatePerson: async (personId: string, updateData: { personName: string }) => {
    await api.put(`/admin/persons/${personId}`, updateData);
  },

  deletePerson: async (personId: string) => {
    await api.delete(`/admin/persons/${personId}`);
  },
};

export default personService;
