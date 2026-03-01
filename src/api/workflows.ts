import api from "./client";

// ─── Types ──────────────────────────────────────────────────

/** Raw workflow shape from the backend (snake_case). */
export interface ApiWorkflow {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    nodes?: ApiNode[];
    connections?: ApiConnection[];
}

export interface ApiNode {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
    credential_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiConnection {
    id: string;
    from_node_id: string;
    to_node_id: string;
    from_output: string;
    to_input: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// ─── API Calls ──────────────────────────────────────────────

/** Fetch paginated workflows for the current user. */
export async function getWorkflows(params: { page?: number; pageSize?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

    const res = await api
        .get("api/workflows", { searchParams })
        .json<ApiResponse<{ workflows: ApiWorkflow[]; total: number; page: number; pageSize: number }>>();
    return res.data;
}

/** Fetch a single workflow with its nodes and connections. */
export async function getWorkflow(id: string) {
    const res = await api
        .get(`api/workflows/${id}`)
        .json<ApiResponse<{ workflow: ApiWorkflow }>>();
    return res.data.workflow;
}

/** Create a new workflow. */
export async function createWorkflow(payload: { name: string }) {
    const res = await api
        .post("api/workflows", { json: payload })
        .json<ApiResponse<{ workflow: ApiWorkflow }>>();
    return res.data.workflow;
}

/** Rename a workflow. */
export async function updateWorkflowName(id: string, name: string) {
    const res = await api
        .patch(`api/workflows/${id}/name`, { json: { name } })
        .json<ApiResponse<{ workflow: ApiWorkflow }>>();
    return res.data.workflow;
}

/** Delete a workflow. */
export async function deleteWorkflow(id: string) {
    await api.delete(`api/workflows/${id}`).json();
}

/** Trigger a workflow execution (returns the new execution row). */
export async function executeWorkflow(id: string) {
    const res = await api
        .post(`api/workflows/${id}/execute`)
        .json<ApiResponse<{ execution: { id: string; status: string } }>>();
    return res.data.execution;
}

/** Save the full workflow graph (nodes + connections). */
export async function saveWorkflow(
    id: string,
    payload: {
        nodes: { id: string; type: string; name: string; position: { x: number; y: number }; data: Record<string, unknown>; credential_id?: string | null }[];
        connections: { id: string; from_node_id: string; to_node_id: string; from_output: string; to_input: string }[];
    },
) {
    const res = await api
        .put(`api/workflows/${id}`, { json: payload })
        .json<ApiResponse<{ workflow: ApiWorkflow }>>();
    return res.data.workflow;
}
