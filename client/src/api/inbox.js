import axios from './axios';

export const inboxApi = {
  getInbox: (params) => axios.get('/inbox', { params }),
  getSent: (params) => axios.get('/inbox/sent', { params }),
  getMessage: (id) => axios.get(`/inbox/${id}`),
  sendMessage: (data) => axios.post('/inbox/send', data),
  markAsRead: (id) => axios.put(`/inbox/${id}/read`),
  getBasicUser: (id) => axios.get(`/users/basic/${id}`),
};
