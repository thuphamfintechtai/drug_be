export class ErrorResponse {
  static fromError(error) {
    let statusCode = 500;
    let message = error.message || "Lỗi server";

    // Determine status code based on error message
    if (message.includes("Không tìm thấy") || message.includes("not found")) {
      statusCode = 404;
    } else if (
      message.includes("Chỉ có") ||
      message.includes("Role không hợp lệ") ||
      message.includes("Unauthorized") ||
      message.includes("Forbidden") ||
      message.includes("không có quyền") ||
      message.includes("chờ phê duyệt")
    ) {
      statusCode = 403;
    } else if (
      message.includes("Unauthenticated") ||
      message.includes("Token") ||
      message.includes("Email hoặc mật khẩu")
    ) {
      statusCode = 401;
    } else if (
      message.includes("validation") ||
      message.includes("Invalid") ||
      message.includes("Vui lòng cung cấp") ||
      message.includes("là bắt buộc")
    ) {
      statusCode = 400;
    }

    return {
      success: false,
      message,
      error: error.message || error,
      statusCode,
    };
  }
}

