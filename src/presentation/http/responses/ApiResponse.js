export class ApiResponse {
  static success(data, message = "Thành công", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static error(message = "Lỗi", statusCode = 500, error = null) {
    return {
      success: false,
      message,
      error: error?.message || error,
      statusCode,
    };
  }
}

