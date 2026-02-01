import type { ApiResponse } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data: ApiResponse<T> = await response.json();
  
  if (!response.ok || !data.success) {
    throw new ApiError(response.status, data.error || 'An error occurred');
  }
  
  return data.data as T;
}

// Auth API
export const auth = {
  register: (email: string, password: string, name?: string) =>
    request<{ user: import('../types').User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  
  login: (email: string, password: string) =>
    request<{ user: import('../types').User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  me: () => request<import('../types').User>('/auth/me'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    request<import('../types').User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Decks API
export const decks = {
  list: () => request<import('../types').Deck[]>('/decks'),
  
  get: (id: string) => request<import('../types').Deck>(`/decks/${id}`),
  
  create: (data: { name: string; description?: string; parentId?: string }) =>
    request<import('../types').Deck>('/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; description?: string | null; parentId?: string | null }) =>
    request<import('../types').Deck>(`/decks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request(`/decks/${id}`, { method: 'DELETE' }),
  
  getCards: (id: string, includeSubDecks = false) =>
    request<import('../types').Card[]>(`/decks/${id}/cards?includeSubDecks=${includeSubDecks}`),
  
  getDueCards: (id: string, limit = 50, includeSubDecks = true) =>
    request<import('../types').Card[]>(`/decks/${id}/due?limit=${limit}&includeSubDecks=${includeSubDecks}`),
  
  importCsv: async (id: string, file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/decks/${id}/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new ApiError(response.status, data.error);
    }
    return data.data as import('../types').ImportResult;
  },
  
  exportCsv: async (id: string, includeSubDecks = false) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE}/decks/${id}/export?includeSubDecks=${includeSubDecks}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export');
    }
    
    return response.blob();
  },
};

// Cards API
export const cards = {
  get: (id: string) => request<import('../types').Card>(`/cards/${id}`),
  
  create: (data: {
    deckId: string;
    type: import('../types').CardType;
    front: string;
    back: string;
    notes?: string;
    tags?: string[];
  }) =>
    request<import('../types').Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createBulk: (cards: {
    deckId: string;
    type: import('../types').CardType;
    front: string;
    back: string;
    notes?: string;
    tags?: string[];
  }[]) =>
    request<{ count: number }>('/cards/bulk', {
      method: 'POST',
      body: JSON.stringify(cards),
    }),
  
  update: (id: string, data: {
    type?: import('../types').CardType;
    front?: string;
    back?: string;
    notes?: string | null;
    deckId?: string;
    tags?: string[];
  }) =>
    request<import('../types').Card>(`/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request(`/cards/${id}`, { method: 'DELETE' }),
  
  review: (id: string, quality: number, sessionId: string) =>
    request<import('../types').Card>(`/cards/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality, sessionId }),
    }),
  
  reset: (id: string) =>
    request<import('../types').Card>(`/cards/${id}/reset`, { method: 'POST' }),
  
  generate: (text: string) =>
    request<import('../types').GeneratedCard[]>('/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  
  suggestCloze: (text: string) =>
    request<import('../types').ClozeSuggestion[]>('/cards/suggest-cloze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

// Study API
export const study = {
  createSession: (deckId: string) =>
    request<import('../types').StudySession>('/study/sessions', {
      method: 'POST',
      body: JSON.stringify({ deckId }),
    }),
  
  endSession: (id: string) =>
    request<import('../types').StudySession>(`/study/sessions/${id}/end`, {
      method: 'POST',
    }),
  
  getSession: (id: string) =>
    request<import('../types').StudySession>(`/study/sessions/${id}`),
  
  getRecentSessions: (limit = 10) =>
    request<import('../types').StudySession[]>(`/study/sessions?limit=${limit}`),
  
  getStats: () => request<import('../types').StudyStats>('/study/stats'),
};

// Tags API
export const tags = {
  list: () => request<import('../types').Tag[]>('/tags'),
  
  create: (data: { name: string; color?: string }) =>
    request<import('../types').Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; color?: string | null }) =>
    request<import('../types').Tag>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request(`/tags/${id}`, { method: 'DELETE' }),
  
  getCards: (id: string) =>
    request<import('../types').Card[]>(`/tags/${id}/cards`),
};

export { ApiError };
