import { atom } from "jotai";
import type { Credential } from "../hooks/use-credentials";

/** Cached list of credentials for the current page. */
export const credentialsAtom = atom<Credential[]>([]);

/** Total credential count (for pagination). */
export const credentialsTotalAtom = atom(0);

/** Whether credentials are currently being fetched. */
export const credentialsLoadingAtom = atom(true);
