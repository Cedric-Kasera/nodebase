/**
 * Zod validation middleware factory.
 *
 * @param {import('zod').ZodSchema} schema  A Zod schema to validate against
 * @param {'body'|'query'|'params'} source  Which part of the request to validate (default: "body")
 * @returns {import('express').RequestHandler}
 */
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Replace with parsed (and potentially transformed) data
    req[source] = result.data;
    next();
  };

export default validate;
