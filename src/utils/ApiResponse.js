class ApiResponse {
  /**
   * Helper class to produce consistent JSON responses
   * Shape: { success, message, data }
   * 
   * @param {number} statusCode - HTTP Status code (e.g. 200, 201)
   * @param {any} [data=null] - Payload object or array
   * @param {string} [message='Success'] - Response message
   */
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  /**
   * Send JSON response using Express response object
   * @param {import('express').Response} res 
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  /**
   * Static helper method to directly send response
   * @param {import('express').Response} res 
   * @param {number} statusCode 
   * @param {any} data 
   * @param {string} message 
   */
  static sendResponse(res, statusCode, data = null, message = 'Success') {
    return new ApiResponse(statusCode, data, message).send(res);
  }
}

module.exports = ApiResponse;
