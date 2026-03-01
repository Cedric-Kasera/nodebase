import { ExecutionView } from "@/features/executions/components/execution";
import { ExecutionsError, ExecutionsLoading } from "@/features/executions/components/executions";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{
    executionId: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  // await requireAuth(); // TODO: Re-enable when custom backend auth is ready

  const { executionId } = await params;

  return (
    <div className="p-4 md:px-10 md:py-6 h-full">
      <div className="mx-auto max-w-screen-md w-full flex flex-col gap-y-8 h-full">
        <ErrorBoundary fallback={<ExecutionsError />}>
          <Suspense fallback={<ExecutionsLoading />}>
            <ExecutionView executionId={executionId} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
};

export default Page;
