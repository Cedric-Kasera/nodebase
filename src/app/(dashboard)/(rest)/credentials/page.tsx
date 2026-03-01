import { CredentialsContainer, CredentialsError, CredentialsList, CredentialsLoading } from "@/features/credentials/components/credentials";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams: _searchParams }: Props) => {
  // await requireAuth(); // TODO: Re-enable when custom backend auth is ready

  return (
    <CredentialsContainer>
      <ErrorBoundary fallback={<CredentialsError />}>
        <Suspense fallback={<CredentialsLoading />}>
          <CredentialsList />
        </Suspense>
      </ErrorBoundary>
    </CredentialsContainer>
  );
};

export default Page;
