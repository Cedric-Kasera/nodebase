import Handlebars from "handlebars";
import { decode } from "html-entities";

// ── Register custom helpers

/** Serialize a value to a JSON string: {{json someObject}} */
Handlebars.registerHelper("json", (context) => {
  return JSON.stringify(context, null, 2);
});

/** URI-encode a string: {{encodeURI value}} */
Handlebars.registerHelper("encodeURI", (str) => {
  return encodeURIComponent(String(str ?? ""));
});

/** Equality check: {{#eq a b}}...{{/eq}} */
Handlebars.registerHelper("eq", (a, b) => a === b);

/**
 * Resolve Handlebars `{{expressions}}` inside a node's `data` object.
 *
 * Works recursively on strings, arrays, and plain objects so that any
 * string field in data can reference previous node outputs, e.g.:
 *
 *   "prompt": "Summarise this: {{nodes.abc123.output.text}}"
 *
 * The context supplied should be the current workflow execution context
 * containing `{ nodes: { [nodeId]: { output: ... } } }`.
 *
 * HTML-entities are decoded after template resolution so that values
 * serialised through JSON round-trips are safe.
 *
 * @param {*} value   – any value (string, object, array, primitive)
 * @param {object} ctx – template context (e.g. { nodes: { ... } })
 * @returns {*}        – resolved value with the same shape
 */
export const resolveTemplates = (value, ctx) => {
  if (typeof value === "string") {
    // Only compile if there's actually a placeholder
    if (!value.includes("{{")) return value;
    const template = Handlebars.compile(value, { noEscape: true });
    return decode(template(ctx));
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplates(item, ctx));
  }

  if (value !== null && typeof value === "object") {
    const resolved = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveTemplates(v, ctx);
    }
    return resolved;
  }

  // numbers, booleans, null — pass through
  return value;
};
