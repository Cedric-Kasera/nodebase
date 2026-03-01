import { atom } from "jotai";
import type { User } from "@/api/auth";

/** Holds the currently authenticated user, or null when logged out / unknown. */
export const userAtom = atom<User | null>(null);

/** True while the initial session check (getMe) is in-flight. */
export const authLoadingAtom = atom<boolean>(true);
