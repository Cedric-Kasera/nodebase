import api from "./client";

// ─── Types

export interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    created_at?: string;
}

interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}

interface MeResponse {
    success: boolean;
    data: {
        user: { id: string; email: string };
    };
}

// ─── API calls

export async function registerUser(payload: {
    name: string;
    email: string;
    password: string;
}): Promise<AuthResponse> {
    return api.post("api/auth/register", { json: payload }).json<AuthResponse>();
}

export async function loginUser(payload: {
    email: string;
    password: string;
}): Promise<AuthResponse> {
    return api.post("api/auth/login", { json: payload }).json<AuthResponse>();
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
    return api.post("api/auth/logout").json();
}

/**
 * Check the current session by calling GET /api/auth/me.
 * Returns the user if the cookie token is valid, or null on 401.
 */
export async function getMe(): Promise<User | null> {
    try {
        const res = await api.get("api/auth/me").json<MeResponse>();
        if (res.success && res.data?.user) {
            return res.data.user as User;
        }
        return null;
    } catch {
        return null;
    }
}
