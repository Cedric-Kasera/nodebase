import {
  WorkflowsContainer,
  WorkflowsList,
  WorkflowsLoading,
  WorkflowsError,
} from "@/features/workflows/components/workflows";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams: _searchParams }: Props) => {
  // await requireAuth(); // TODO: Re-enable when custom backend auth is ready

  return (
    <WorkflowsContainer>
      <ErrorBoundary fallback={<WorkflowsError />}>
        <Suspense fallback={<WorkflowsLoading />}>
          <WorkflowsList />
        </Suspense>
      </ErrorBoundary>
    </WorkflowsContainer>
  )
};

export default Page;
