/**
 * Standard API response envelope used across every route in the system:
 *   Success -> { success: true, data, message }
 *   Error   -> { success: false, message, code }
 */
class ApiResponse {
  static success(res, { data = null, message = 'Success', statusCode = 200, meta } = {}) {
    const body = { success: true, data, message };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static error(res, { message = 'Something went wrong', code = 'INTERNAL_ERROR', statusCode = 500, details } = {}) {
    const body = { success: false, message, code };
    if (details && !process.env.NODE_ENV === 'production') body.details = details;
    return res.status(statusCode).json(body);
  }
}

module.exports = ApiResponse;
