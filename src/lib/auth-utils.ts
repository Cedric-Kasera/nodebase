/**
 * Auth checks are now handled client-side by the AuthProvider.
 * These stubs remain so that existing server-component page files
 * continue to compile without changes.
 */
export async function requireAuth() {
    // Handled by AuthProvider — no server-side check needed
}

export async function requireUnauth() {
    // Handled by AuthProvider — no server-side check needed
}
