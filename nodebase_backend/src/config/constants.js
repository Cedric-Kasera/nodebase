// ─── Enums (must match database enum types) ───

export const NodeType = Object.freeze({
  INITIAL: "INITIAL",
  MANUAL_TRIGGER: "MANUAL_TRIGGER",
  HTTP_REQUEST: "HTTP_REQUEST",
  GOOGLE_FORM_TRIGGER: "GOOGLE_FORM_TRIGGER",
  STRIPE_TRIGGER: "STRIPE_TRIGGER",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
  OPENAI: "OPENAI",
  DISCORD: "DISCORD",
  SLACK: "SLACK",
});

export const CredentialType = Object.freeze({
  OPENAI: "OPENAI",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
});

export const ExecutionStatus = Object.freeze({
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});

// ─── Pagination defaults ───

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
});
