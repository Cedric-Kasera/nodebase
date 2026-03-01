"use client";

import { useAtomValue } from "jotai";
import { nodeStatusMapAtom } from "../store/execution-atoms";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

/** Read the current execution status for a specific node. */
export const useNodeExecutionStatus = (nodeId: string): NodeStatus | undefined => {
  const statusMap = useAtomValue(nodeStatusMapAtom);
  return statusMap[nodeId];
};
