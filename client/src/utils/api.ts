import { API_BASE } from '../config';

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include',
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(data.detail || `Error ${res.status}`);
    }

    return res.json();
}

export function apiGet(path: string) {
    return request(path);
}

export function apiPost(path: string, body?: object) {
    return request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}

export function apiPut(path: string, body?: object) {
    return request(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}

export function apiDelete(path: string) {
    return request(path, { method: 'DELETE' });
}

export async function apiUpload(path: string, formData: FormData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(data.detail || `Error ${res.status}`);
    }

    return res.json();
}
