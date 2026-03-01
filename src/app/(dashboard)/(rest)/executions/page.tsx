import { ExecutionsContainer, ExecutionsError, ExecutionsList, ExecutionsLoading } from "@/features/executions/components/executions";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams: _searchParams }: Props) => {
  // await requireAuth(); // TODO: Re-enable when custom backend auth is ready

  return (
    <ExecutionsContainer>
      <ErrorBoundary fallback={<ExecutionsError />}>
        <Suspense fallback={<ExecutionsLoading />}>
          <ExecutionsList />
        </Suspense>
      </ErrorBoundary>
    </ExecutionsContainer>
  );
};

export default Page;
