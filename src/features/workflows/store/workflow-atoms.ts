import { atom } from "jotai";
import type { Workflow } from "../hooks/use-workflows";

/** Cached list of workflows for the current page. */
export const workflowsAtom = atom<Workflow[]>([]);

/** Total workflow count (for pagination). */
export const workflowsTotalAtom = atom(0);

/** Whether workflows are currently being fetched. */
export const workflowsLoadingAtom = atom(true);