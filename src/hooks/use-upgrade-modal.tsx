import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

// NOTE: TRPCClientError replaced — handleError now uses a generic billing error check
// TODO: Update error code detection once custom backend error format is established
export const useUpgradeModal = () => {
  const [open, setOpen] = useState(false);

  const handleError = (error: unknown) => {
    // Generic check for billing/forbidden errors from custom backend
    if (
      error instanceof Error &&
      ("code" in error || "status" in error) &&
      ((error as { code?: string }).code === "FORBIDDEN" ||
        (error as { status?: number }).status === 403)
    ) {
      setOpen(true);
      return true;
    }
    return false;
  };

  const modal = <UpgradeModal open={open} onOpenChange={setOpen} />;

  return { handleError, modal };
};
