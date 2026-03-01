"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkflowsParams } from "./use-workflows-params";
import {
  workflowsAtom,
  workflowsTotalAtom,
  workflowsLoadingAtom,
} from "../store/workflow-atoms";
import * as workflowsApi from "@/api/workflows";
import type { ApiWorkflow, ApiNode, ApiConnection } from "@/api/workflows";
import type { Node, Edge } from "@xyflow/react";

// ─── Types ──────────────────────────────────────────────────

export type Workflow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  nodes?: Node[];
  connections?: ApiConnection[];
};

/** Map a backend workflow row to the frontend shape. */
const mapWorkflow = (w: ApiWorkflow): Workflow => ({
  id: w.id,
  name: w.name,
  createdAt: new Date(w.created_at),
  updatedAt: new Date(w.updated_at),
  nodes: w.nodes?.map(mapNodeToReactFlow),
  connections: w.connections,
});

/** Map a backend node row to a React Flow Node. */
const mapNodeToReactFlow = (n: ApiNode): Node => ({
  id: n.id,
  type: n.type,
  position: n.position ?? { x: 0, y: 0 },
  data: { ...n.data, name: n.name, credentialId: n.credential_id },
});

/** Map backend connections to React Flow edges. */
const mapConnectionsToEdges = (conns: ApiConnection[]): Edge[] =>
  conns.map((c) => ({
    id: c.id,
    source: c.from_node_id,
    target: c.to_node_id,
    sourceHandle: c.from_output || undefined,
    targetHandle: c.to_input || undefined,
  }));

// ─── List Hook ──────────────────────────────────────────────

/** Fetch and cache the paginated workflows list. */
export const useSuspenseWorkflows = () => {
  const [params] = useWorkflowsParams();
  const [items, setItems] = useAtom(workflowsAtom);
  const [total, setTotal] = useAtom(workflowsTotalAtom);
  const [isLoading, setIsLoading] = useAtom(workflowsLoadingAtom);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    workflowsApi
      .getWorkflows({ page: params.page, pageSize: params.pageSize })
      .then((res) => {
        if (cancelled) return;
        setItems(res.workflows.map(mapWorkflow));
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load workflows");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [params.page, params.pageSize, setItems, setTotal, setIsLoading]);

  return { data: { items, total }, isLoading };
};

// ─── Single Workflow Hook ───────────────────────────────────

/** Fetch a single workflow by ID (with nodes + connections). */
export const useSuspenseWorkflow = (id: string) => {
  const [data, setData] = useState<(Workflow & { edges?: Edge[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    workflowsApi
      .getWorkflow(id)
      .then((raw) => {
        if (cancelled) return;
        const mapped = mapWorkflow(raw);
        setData({
          ...mapped,
          edges: raw.connections ? mapConnectionsToEdges(raw.connections) : [],
        });
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load workflow");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading };
};

// ─── Mutations ──────────────────────────────────────────────

/** Create a workflow and navigate to the editor. */
export const useCreateWorkflow = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(workflowsAtom);
  const router = useRouter();

  const mutateAsync = useCallback(
    async (input: { name: string }) => {
      setIsPending(true);
      try {
        const raw = await workflowsApi.createWorkflow(input);
        const mapped = mapWorkflow(raw);
        setItems((prev) => [mapped, ...prev]);
        toast.success("Workflow created");
        router.push(`/workflows/${mapped.id}`);
        return mapped;
      } catch {
        toast.error("Failed to create workflow");
        throw new Error("Failed to create workflow");
      } finally {
        setIsPending(false);
      }
    },
    [setItems, router],
  );

  const mutate = useCallback(
    (input: { name: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Optimistically remove a workflow from the list. */
export const useRemoveWorkflow = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(workflowsAtom);

  const mutateAsync = useCallback(
    async (input: { id: string }) => {
      setIsPending(true);
      let snapshot: Workflow[] = [];

      // Optimistic remove
      setItems((prev) => {
        snapshot = prev;
        return prev.filter((w) => w.id !== input.id);
      });

      try {
        await workflowsApi.deleteWorkflow(input.id);
        toast.success("Workflow deleted");
      } catch {
        setItems(snapshot); // rollback
        toast.error("Failed to delete workflow");
      } finally {
        setIsPending(false);
      }
    },
    [setItems],
  );

  const mutate = useCallback(
    (input: { id: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Rename a workflow. */
export const useUpdateWorkflowName = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(workflowsAtom);

  const mutateAsync = useCallback(
    async (input: { id: string; name: string }) => {
      setIsPending(true);
      try {
        const raw = await workflowsApi.updateWorkflowName(input.id, input.name);
        const mapped = mapWorkflow(raw);

        // Update the item in the list cache
        setItems((prev) =>
          prev.map((w) => (w.id === input.id ? { ...w, name: mapped.name, updatedAt: mapped.updatedAt } : w)),
        );

        toast.success("Workflow renamed");
        return mapped;
      } catch {
        toast.error("Failed to rename workflow");
        throw new Error("Failed to rename workflow");
      } finally {
        setIsPending(false);
      }
    },
    [setItems],
  );

  const mutate = useCallback(
    (input: { id: string; name: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Save the workflow graph (nodes + edges) to the backend. */
export const useUpdateWorkflow = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (input: { id: string; nodes: Node[]; edges: Edge[] }) => {
      setIsPending(true);
      try {
        const payload = {
          nodes: input.nodes
            .filter((n) => n.type !== "INITIAL")
            .map((n) => ({
              id: n.id,
              type: n.type ?? "",
              name: (n.data as Record<string, unknown>)?.name as string ?? "",
              position: n.position,
              data: n.data as Record<string, unknown>,
              credential_id:
                ((n.data as Record<string, unknown>)?.credentialId as string) ?? null,
            })),
          connections: input.edges.map((e) => ({
            id: e.id,
            from_node_id: e.source,
            to_node_id: e.target,
            from_output: e.sourceHandle ?? "main",
            to_input: e.targetHandle ?? "main",
          })),
        };

        const saved = await workflowsApi.saveWorkflow(input.id, payload);
        toast.success("Workflow saved");
        return mapWorkflow(saved);
      } catch {
        toast.error("Failed to save workflow");
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const mutate = useCallback(
    (input: { id: string; nodes: Node[]; edges: Edge[] }) => {
      mutateAsync(input).catch(() => { });
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Trigger a workflow execution. */
export const useExecuteWorkflow = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (input: { id: string }) => {
    setIsPending(true);
    try {
      const execution = await workflowsApi.executeWorkflow(input.id);
      toast.success("Workflow execution started");
      return execution;
    } catch {
      toast.error("Failed to execute workflow");
    } finally {
      setIsPending(false);
    }
  }, []);

  const mutate = useCallback(
    (input: { id: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};
