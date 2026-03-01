import { Inngest } from "inngest";
import env from "../config/env.js";

export const inngest = new Inngest({
  id: "nodebase",
  // In development, use the Dev Server (no event key needed).
  // In production, set INNGEST_EVENT_KEY in your environment.
  ...(env.isDev ? { isDev: true } : { eventKey: process.env.INNGEST_EVENT_KEY }),
});
