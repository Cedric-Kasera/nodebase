"use client";

import { formatDistanceToNow } from "date-fns";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
} from "@/components/entity-components";
import {
  useCreateWorkflow,
  useRemoveWorkflow,
  useSuspenseWorkflows,
} from "../hooks/use-workflows";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import type { Workflow } from "../hooks/use-workflows";
import { WorkflowIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PAGINATION } from "@/config/constants";

export const WorkflowsSearch = () => {
  const [params, setParams] = useWorkflowsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search workflows"
    />
  );
};

/** Skeleton placeholder for a single workflow card. */
const WorkflowItemSkeleton = () => (
  <Card className="p-4 shadow-none">
    <CardContent className="flex flex-row items-center justify-between p-0">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[140px]" />
          <Skeleton className="h-3 w-[220px]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/** Skeleton list shown while workflows are loading. */
export const WorkflowsListSkeleton = () => (
  <div className="flex flex-col gap-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <WorkflowItemSkeleton key={i} />
    ))}
  </div>
);

export const WorkflowsList = () => {
  const { data, isLoading } = useSuspenseWorkflows();

  if (isLoading) return <WorkflowsListSkeleton />;

  return (
    <EntityList
      items={data.items}
      getKey={(workflow) => workflow.id}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
      emptyView={<WorkflowsEmpty />}
    />
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();

  const handleCreate = () => {
    createWorkflow.mutate({ name: "Untitled Workflow" });
    // TODO: Redirect to new workflow when backend returns created ID
  };

  return (
    <>
      {modal}
      <EntityHeader
        title="Workflows"
        description="Create and manage your workflows"
        onNew={handleCreate}
        newButtonLabel="New workflow"
        disabled={disabled}
        isCreating={createWorkflow.isPending}
      />
    </>
  );
};

export const WorkflowsPagination = () => {
  const { data, isLoading } = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();

  const pageSize = params.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <EntityPagination
      disabled={isLoading}
      totalPages={totalPages}
      page={params.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const WorkflowsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<WorkflowsSearch />}
      pagination={<WorkflowsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowsLoading = () => {
  return <WorkflowsListSkeleton />;
};

export const WorkflowsError = () => {
  return <ErrorView message="Error loading workflows" />;
};

export const WorkflowsEmpty = () => {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();

  const handleCreate = () => {
    createWorkflow.mutate({ name: "Untitled Workflow" });
    // TODO: Redirect to new workflow when backend returns created ID
  };

  return (
    <>
      {modal}
      <EmptyView
        onNew={handleCreate}
        message="You haven't created any workflows yet. Get started by creating your first workflow"
      />
    </>
  );
};

export const WorkflowItem = ({ data }: { data: Workflow }) => {
  const removeWorkflow = useRemoveWorkflow();

  const handleRemove = () => {
    removeWorkflow.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
          &bull; Created{" "}
          {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeWorkflow.isPending}
    />
  );
};
