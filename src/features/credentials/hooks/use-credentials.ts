"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCredentialsParams } from "./use-credentials-params";
import {
  credentialsAtom,
  credentialsTotalAtom,
  credentialsLoadingAtom,
} from "../store/credential-atoms";
import * as credentialsApi from "@/api/credentials";
import type { ApiCredential } from "@/api/credentials";

// ─── Types ──────────────────────────────────────────────────

export enum CredentialType {
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
  GEMINI = "GEMINI",
}

export type Credential = {
  id: string;
  name: string;
  type: CredentialType;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Map a backend credential row to the frontend shape. */
const mapCredential = (c: ApiCredential): Credential => ({
  id: c.id,
  name: c.name,
  type: c.type as CredentialType,
  value: "", // value is never returned from the API for security
  createdAt: new Date(c.created_at),
  updatedAt: new Date(c.updated_at),
});

// ─── List Hook ──────────────────────────────────────────────

/** Fetch and cache the paginated credentials list. */
export const useSuspenseCredentials = () => {
  const [params] = useCredentialsParams();
  const [items, setItems] = useAtom(credentialsAtom);
  const [total, setTotal] = useAtom(credentialsTotalAtom);
  const [isLoading, setIsLoading] = useAtom(credentialsLoadingAtom);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    credentialsApi
      .getCredentials({ page: params.page, pageSize: params.pageSize })
      .then((res) => {
        if (cancelled) return;
        setItems(res.credentials.map(mapCredential));
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load credentials");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [params.page, params.pageSize, setItems, setTotal, setIsLoading]);

  return { data: { items, total }, isLoading };
};

// ─── Single Credential Hook ────────────────────────────────

/** Fetch a single credential by ID. */
export const useSuspenseCredential = (id: string) => {
  const [data, setData] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    credentialsApi
      .getCredential(id)
      .then((raw) => {
        if (cancelled) return;
        setData(mapCredential(raw));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load credential");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading };
};

// ─── Credentials by Type Hook ──────────────────────────────

/** Fetch credentials filtered by provider type. */
export const useCredentialsByType = (type: CredentialType) => {
  const [data, setData] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    credentialsApi
      .getCredentialsByType(type)
      .then((raw) => {
        if (cancelled) return;
        setData(raw.map(mapCredential));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load credentials");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [type]);

  return { data, isLoading };
};

// ─── Mutations ──────────────────────────────────────────────

/** Create a credential and navigate back to the list. */
export const useCreateCredential = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(credentialsAtom);
  const router = useRouter();

  const mutateAsync = useCallback(
    async (input: { name: string; type: string; value: string }) => {
      setIsPending(true);
      try {
        const raw = await credentialsApi.createCredential(input);
        const mapped = mapCredential(raw);
        setItems((prev) => [mapped, ...prev]);
        toast.success("Credential created");
        router.push("/credentials");
        return mapped;
      } catch {
        toast.error("Failed to create credential");
        throw new Error("Failed to create credential");
      } finally {
        setIsPending(false);
      }
    },
    [setItems, router],
  );

  const mutate = useCallback(
    (input: { name: string; type: string; value: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Update a credential's name or value. */
export const useUpdateCredential = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(credentialsAtom);

  const mutateAsync = useCallback(
    async (input: { id: string; name?: string; value?: string }) => {
      setIsPending(true);
      try {
        const { id, ...payload } = input;
        const raw = await credentialsApi.updateCredential(id, payload);
        const mapped = mapCredential(raw);

        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: mapped.name, updatedAt: mapped.updatedAt } : c)),
        );

        toast.success("Credential updated");
        return mapped;
      } catch {
        toast.error("Failed to update credential");
        throw new Error("Failed to update credential");
      } finally {
        setIsPending(false);
      }
    },
    [setItems],
  );

  const mutate = useCallback(
    (input: { id: string; name?: string; value?: string }) => { mutateAsync(input).catch(() => { }); },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
};

/** Optimistically remove a credential from the list. */
export const useRemoveCredential = () => {
  const [isPending, setIsPending] = useState(false);
  const [, setItems] = useAtom(credentialsAtom);

  const mutateAsync = useCallback(
    async (input: { id: string }) => {
      setIsPending(true);
      let snapshot: Credential[] = [];

      // Optimistic remove
      setItems((prev) => {
        snapshot = prev;
        return prev.filter((c) => c.id !== input.id);
      });

      try {
        await credentialsApi.deleteCredential(input.id);
        toast.success("Credential deleted");
      } catch {
        setItems(snapshot); // rollback
        toast.error("Failed to delete credential");
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
