import { atom } from "jotai";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

/** Map of nodeId → execution status, updated in real-time via SSE. */
export const nodeStatusMapAtom = atom<Record<string, NodeStatus>>({});

/** The currently active execution ID (for SSE subscription). */
export const activeExecutionIdAtom = atom<string | null>(null);
