import {
  Editor,
  EditorError,
  EditorLoading
} from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  // await requireAuth(); // TODO: Re-enable when custom backend auth is ready

  const { workflowId } = await params;

  return (
    <ErrorBoundary fallback={<EditorError />}>
      <Suspense fallback={<EditorLoading />}>
        <EditorHeader workflowId={workflowId} />
        <main className="flex-1">
          <Editor workflowId={workflowId} />
        </main>
      </Suspense>
    </ErrorBoundary>
  )
};

export default Page;
