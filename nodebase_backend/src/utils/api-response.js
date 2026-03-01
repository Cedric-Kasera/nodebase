/**
 * Unified API response helper.
 *
 * Usage:
 *   ApiResponse.success(res, { user }, "Login successful");
 *   ApiResponse.success(res, { workflow }, "Workflow created", 201);
 *   ApiResponse.success(res, null, "Deleted");
 */
class ApiResponse {
  /**
   * Send a standardised success JSON response.
   *
   * @param {import('express').Response} res
   * @param {object|null}  [data=null]      Payload to include under `data` key
   * @param {string}       [message="Success"]  Human-readable message
   * @param {number}       [statusCode=200]     HTTP status code
   */
  static success(res, data = null, message = "Success", statusCode = 200) {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    return res.status(statusCode).json(body);
  }
}

export default ApiResponse;
