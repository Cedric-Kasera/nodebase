"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSetAtom } from "jotai";
import {
    nodeStatusMapAtom,
    activeExecutionIdAtom,
} from "../store/execution-atoms";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Subscribe to SSE streams for workflow executions.
 *
 * - `connect(executionId)` — execution-level stream (node status updates).
 * - `subscribeToWorkflow(workflowId)` — workflow-level stream that
 *    auto-connects to execution-level SSE whenever any execution starts
 *    (including webhook-triggered ones from Google Form / Stripe).
 */
export const useExecutionStream = () => {
    const setNodeStatusMap = useSetAtom(nodeStatusMapAtom);
    const setActiveExecutionId = useSetAtom(activeExecutionIdAtom);
    const executionEsRef = useRef<EventSource | null>(null);
    const workflowEsRef = useRef<EventSource | null>(null);

    /** Close the current execution-level SSE connection. */
    const disconnectExecution = useCallback(() => {
        if (executionEsRef.current) {
            executionEsRef.current.close();
            executionEsRef.current = null;
        }
    }, []);

    /** Start listening to SSE events for a given execution. */
    const connect = useCallback(
        (executionId: string) => {
            // Close any previous execution connection
            disconnectExecution();

            setActiveExecutionId(executionId);
            setNodeStatusMap({});

            const url = `${API_BASE_URL}/api/executions/${executionId}/stream`;
            const es = new EventSource(url, { withCredentials: true });
            executionEsRef.current = es;

            es.addEventListener("node:start", (e) => {
                const { nodeId } = JSON.parse(e.data);
                setNodeStatusMap((prev) => ({
                    ...prev,
                    [nodeId]: "loading" as NodeStatus,
                }));
            });

            es.addEventListener("node:complete", (e) => {
                const { nodeId } = JSON.parse(e.data);
                setNodeStatusMap((prev) => ({
                    ...prev,
                    [nodeId]: "success" as NodeStatus,
                }));
            });

            es.addEventListener("node:error", (e) => {
                const { nodeId } = JSON.parse(e.data);
                setNodeStatusMap((prev) => ({
                    ...prev,
                    [nodeId]: "error" as NodeStatus,
                }));
            });

            es.addEventListener("execution:complete", () => {
                setActiveExecutionId(null);
                es.close();
                executionEsRef.current = null;
            });

            es.addEventListener("execution:error", () => {
                setActiveExecutionId(null);
                es.close();
                executionEsRef.current = null;
            });

            es.onerror = () => {
                es.close();
                executionEsRef.current = null;
                setActiveExecutionId(null);
            };
        },
        [disconnectExecution, setActiveExecutionId, setNodeStatusMap],
    );

    /**
     * Subscribe to the workflow-level SSE stream.
     * When a new execution starts (e.g. via webhook), this auto-connects
     * to the execution-level stream so nodes show live status.
     */
    const subscribeToWorkflow = useCallback(
        (workflowId: string) => {
            // Close any previous workflow subscription
            disconnectWorkflow();

            const url = `${API_BASE_URL}/api/workflows/${workflowId}/stream`;
            const ws = new EventSource(url, { withCredentials: true });
            workflowEsRef.current = ws;

            ws.addEventListener("execution:started", (e) => {
                const { executionId } = JSON.parse(e.data);
                connect(executionId);
            });

            ws.onerror = () => {
                // Silently reconnect — EventSource auto-reconnects in most browsers
            };
        },
        [connect],
    );

    /** Close the workflow-level SSE subscription. */
    const disconnectWorkflow = useCallback(() => {
        if (workflowEsRef.current) {
            workflowEsRef.current.close();
            workflowEsRef.current = null;
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnectExecution();
            disconnectWorkflow();
        };
    }, [disconnectExecution, disconnectWorkflow]);

    return { connect, disconnectExecution, subscribeToWorkflow, disconnectWorkflow };
};
