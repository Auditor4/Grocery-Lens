// ============================================================
// API Client — Talks to our backend server
// ============================================================
// This file has helper functions that make HTTP requests to
// our Express API. Instead of writing fetch() everywhere,
// we centralize it here.
// ============================================================

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers as any },
            credentials: 'include',  // Send cookies with every request
            ...options,
        });
        const json = await res.json();
        return json;
    } catch (error) {
        return { success: false, error: 'Network error. Please check your connection.' };
    }
}

// ─── Auth ────────────────────────────────────────────────
export const api = {
    // Auth
    register: (userId: string) =>
        request<{ userId: string; uid: string; displayName: string }>('/auth/register', {
            method: 'POST', body: JSON.stringify({ userId }),
        }),

    login: (userId: string, uid: string) =>
        request<{ userId: string; displayName: string }>('/auth/login', {
            method: 'POST', body: JSON.stringify({ userId, uid }),
        }),

    logout: () => request('/auth/logout', { method: 'POST' }),

    me: () => request<{ id: string; userId: string; displayName: string; createdAt: string }>('/auth/me'),

    checkUserId: (userId: string) =>
        request<{ available: boolean }>(`/auth/check-userid?userId=${encodeURIComponent(userId)}`),

    deleteAccount: () => request('/auth/account', { method: 'DELETE' }),

    // Entries
    getEntries: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<{ entries: any[]; pagination: any }>(`/entries?${query}`);
    },

    createEntry: (data: any) =>
        request('/entries', { method: 'POST', body: JSON.stringify(data) }),

    updateEntry: (id: string, data: any) =>
        request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    deleteEntry: (id: string) =>
        request(`/entries/${id}`, { method: 'DELETE' }),

    // Analytics
    getAnalyticsSummary: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<any>(`/analytics/summary?${query}`);
    },

    getAnalyticsByCategory: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<any[]>(`/analytics/by-category?${query}`);
    },

    getAnalyticsByChannel: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<any[]>(`/analytics/by-channel?${query}`);
    },

    getAnalyticsByItem: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<any[]>(`/analytics/by-item?${query}`);
    },

    getAnalyticsTrends: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return request<any[]>(`/analytics/trends?${query}`);
    },

    // Groups
    getGroups: () => request<any[]>('/groups'),

    createGroup: (name: string) =>
        request('/groups', { method: 'POST', body: JSON.stringify({ name }) }),

    addMember: (groupId: string, uid: string) =>
        request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ uid }) }),

    removeMember: (groupId: string, memberId: string) =>
        request(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),

    deleteGroup: (groupId: string) =>
        request(`/groups/${groupId}`, { method: 'DELETE' }),

    // Categories
    getCategories: (groupId?: string) => {
        const query = groupId ? `?groupId=${groupId}` : '';
        return request<any[]>(`/categories${query}`);
    },

    createCategory: (data: { name: string; icon?: string; ownerType?: string; groupId?: string }) =>
        request('/categories', { method: 'POST', body: JSON.stringify(data) }),

    deleteCategory: (id: string) =>
        request(`/categories/${id}`, { method: 'DELETE' }),

    // Autocomplete
    autocomplete: (q: string, scopeType?: string, groupId?: string) => {
        const params = new URLSearchParams({ q });
        if (scopeType) params.set('scopeType', scopeType);
        if (groupId) params.set('groupId', groupId);
        return request<any[]>(`/autocomplete?${params}`);
    },

    // Export
    exportCsv: (params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        window.open(`${API_BASE}/export/csv?${query}`, '_blank');
    },
};
