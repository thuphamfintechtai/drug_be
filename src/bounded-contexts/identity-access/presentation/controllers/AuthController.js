import { LoginDTO } from "../../application/dto/LoginDTO.js";
import { RegisterUserDTO } from "../../application/dto/RegisterUserDTO.js";
import { InvalidCredentialsException } from "../../domain/exceptions/InvalidCredentialsException.js";

export class AuthController {
  constructor(
    authenticationApplicationService,
    userManagementApplicationService,
    passwordResetApplicationService = null
  ) {
    this._authService = authenticationApplicationService;
    this._userService = userManagementApplicationService;
    this._passwordResetService = passwordResetApplicationService;
  }

  async login(req, res) {
    try {
      const loginDTO = LoginDTO.fromRequest(req);
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await this._authService.login(loginDTO, ipAddress);

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("là bắt buộc")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng nhập:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng nhập",
        error: error.message,
      });
    }
  }

  async register(req, res) {
    try {
      const registerDTO = RegisterUserDTO.fromRequest(req);

      const user = await this._authService.register(registerDTO, "user");

      return res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản người dùng thành công",
        data: user.toJSON(),
      });
    } catch (error) {
      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng ký:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký",
        error: error.message,
      });
    }
  }

  async registerAdmin(req, res) {
    try {
      const registerDTO = RegisterUserDTO.fromRequest(req);

      const user = await this._authService.register(registerDTO, "system_admin");

      return res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản admin thành công",
        data: user.toJSON(),
      });
    } catch (error) {
      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng ký admin:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký admin",
        error: error.message,
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      const result = await this._userService.getCurrentUser(userId);

      return res.status(200).json({
        success: true,
        data: {
          user: result.user ? result.user.toJSON() : result.user,
          businessProfile: result.businessProfile || null,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin người dùng",
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      return res.status(200).json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng xuất",
        error: error.message,
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      if (!this._passwordResetService) {
        return res.status(500).json({
          success: false,
          message: "Password reset service không được cấu hình",
        });
      }

      const { email, licenseNo, taxCode } = req.body;

      const result = await this._passwordResetService.requestPasswordReset(
        email,
        licenseNo,
        taxCode
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        ...(result.resetRequestId && {
          data: {
            resetRequestId: result.resetRequestId,
            expiresAt: result.expiresAt,
          },
        }),
      });
    } catch (error) {
      console.error("Lỗi khi tạo yêu cầu reset mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo yêu cầu reset mật khẩu",
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      await this._authService.resetPassword(token, newPassword);

      return res.status(200).json({
        success: true,
        message: "Reset mật khẩu thành công",
      });
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("Token") ||
          error.message.includes("hết hạn") ||
          error.message.includes("đã được sử dụng") ||
          error.message.includes("bắt buộc"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi reset mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi reset mật khẩu",
        error: error.message,
      });
    }
  }

  async getPasswordResetRequests(req, res) {
    try {
      if (!this._passwordResetService) {
        return res.status(500).json({
          success: false,
          message: "Password reset service không được cấu hình",
        });
      }

      const filters = {
        used: req.query.used,
        expired: req.query.expired,
        status: req.query.status,
        role: req.query.role,
      };

      const requests = await this._passwordResetService.getPasswordResetRequests(filters);

      return res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu reset mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách yêu cầu reset mật khẩu",
        error: error.message,
      });
    }
  }

  async approvePasswordReset(req, res) {
    try {
      if (!this._passwordResetService) {
        return res.status(500).json({
          success: false,
          message: "Password reset service không được cấu hình",
        });
      }

      const { resetRequestId } = req.params;
      const adminUserId = req.user?.id || req.user?._id?.toString();

      const result = await this._passwordResetService.approvePasswordReset(resetRequestId, adminUserId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.message && (error.message.includes("Không tìm thấy") || error.message.includes("đã được duyệt") || error.message.includes("đã bị từ chối"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi xác nhận yêu cầu reset mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xác nhận yêu cầu reset mật khẩu",
        error: error.message,
      });
    }
  }

  async rejectPasswordReset(req, res) {
    try {
      if (!this._passwordResetService) {
        return res.status(500).json({
          success: false,
          message: "Password reset service không được cấu hình",
        });
      }

      const { resetRequestId } = req.params;
      const { rejectionReason } = req.body;
      const adminUserId = req.user?.id || req.user?._id?.toString();

      const result = await this._passwordResetService.rejectPasswordReset(resetRequestId, adminUserId, rejectionReason);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      if (error.message && (error.message.includes("Không tìm thấy") || error.message.includes("đã được duyệt") || error.message.includes("đã bị từ chối"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi từ chối yêu cầu reset mật khẩu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi từ chối yêu cầu reset mật khẩu",
        error: error.message,
      });
    }
  }
}

