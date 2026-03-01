"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

import "@xyflow/react/dist/style.css";
import { nodeComponents } from "@/config/node-components";
import { AddNodeButton } from "./add-node-button";
import { useSetAtom } from "jotai";
import { editorAtom } from "../store/atoms";
import { NodeType } from "@/config/node-components";
import { ExecuteWorkflowButton } from "./execute-workflow-button";
import { useExecutionStream } from "../hooks/use-execution-stream";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow, isLoading } = useSuspenseWorkflow(workflowId);

  const setEditor = useSetAtom(editorAtom);

  // Subscribe to workflow-level SSE so webhook-triggered executions
  // (Google Form, Stripe, etc.) also show real-time node status.
  const { subscribeToWorkflow } = useExecutionStream();
  useEffect(() => {
    subscribeToWorkflow(workflowId);
  }, [workflowId, subscribeToWorkflow]);

  const workflowData = workflow as
    | (typeof workflow & { nodes?: Node[]; edges?: Edge[] })
    | null;
  const [nodes, setNodes] = useState<Node[]>(workflowData?.nodes ?? []);
  const [edges, setEdges] = useState<Edge[]>(workflowData?.edges ?? []);

  // Sync fetched workflow data into local state when it arrives
  useEffect(() => {
    if (workflowData?.nodes) setNodes(workflowData.nodes);
    if (workflowData?.edges) setEdges(workflowData.edges);
  }, [workflowData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);

  if (isLoading) return <EditorLoading />;

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
