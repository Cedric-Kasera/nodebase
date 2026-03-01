import api from "./client";

// ─── Types ──────────────────────────────────────────────────

/** Raw credential shape from the backend (snake_case, value excluded). */
export interface ApiCredential {
    id: string;
    name: string;
    type: string;
    created_at: string;
    updated_at: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// ─── API Calls ──────────────────────────────────────────────

/** Fetch paginated credentials for the current user. */
export async function getCredentials(params: { page?: number; pageSize?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

    const res = await api
        .get("api/credentials", { searchParams })
        .json<ApiResponse<{ credentials: ApiCredential[]; total: number; page: number; pageSize: number }>>();
    return res.data;
}

/** Fetch a single credential by ID (value is excluded for safety). */
export async function getCredential(id: string) {
    const res = await api
        .get(`api/credentials/${id}`)
        .json<ApiResponse<{ credential: ApiCredential }>>();
    return res.data.credential;
}

/** Fetch credentials filtered by type. */
export async function getCredentialsByType(type: string) {
    const res = await api
        .get(`api/credentials/type/${type}`)
        .json<ApiResponse<{ credentials: ApiCredential[] }>>();
    return res.data.credentials;
}

/** Create a new credential. */
export async function createCredential(payload: { name: string; type: string; value: string }) {
    const res = await api
        .post("api/credentials", { json: payload })
        .json<ApiResponse<{ credential: ApiCredential }>>();
    return res.data.credential;
}

/** Update a credential (name and/or value). */
export async function updateCredential(id: string, payload: { name?: string; value?: string }) {
    const res = await api
        .patch(`api/credentials/${id}`, { json: payload })
        .json<ApiResponse<{ credential: ApiCredential }>>();
    return res.data.credential;
}

/** Delete a credential. */
export async function deleteCredential(id: string) {
    await api.delete(`api/credentials/${id}`).json();
}
