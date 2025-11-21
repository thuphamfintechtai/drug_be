import crypto from "crypto";
import { EmailService } from "../../../registration/infrastructure/external/email/EmailService.js";

export class PasswordResetApplicationService {
  constructor(
    userRepository,
    passwordResetRepository,
    emailService = null,
    eventBus
  ) {
    this._userRepository = userRepository;
    this._passwordResetRepository = passwordResetRepository;
    this._emailService = emailService || new EmailService();
    this._eventBus = eventBus;
  }

  async requestPasswordReset(email, licenseNo = null, taxCode = null) {
    const user = await this._userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists for security
      return { success: true, message: "Yêu cầu reset mật khẩu đã được tạo" };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (user.roleVO.isBusinessRole() ? 24 : 1));

    // Delete old pending tokens
    await this._passwordResetRepository.deletePendingByUserId(user.id);

    // Create password reset request
    const passwordResetRequest = this._passwordResetRepository.create({
      userId: user.id,
      token: resetToken,
      expiresAt,
      verificationInfo: user.roleVO.isBusinessRole() && licenseNo && taxCode
        ? { licenseNo, taxCode }
        : null,
    });

    await this._passwordResetRepository.save(passwordResetRequest);

    // Request domain event
    user.requestPasswordReset(resetToken);
    user.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    // Send email if not business role
    if (!user.roleVO.isBusinessRole()) {
      try {
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
        await this._emailService.sendPasswordResetEmail(user.email, resetToken, resetUrl);
      } catch (error) {
        console.error("Error sending password reset email:", error);
      }
    }

    return {
      success: true,
      message: user.roleVO.isBusinessRole()
        ? "Yêu cầu reset mật khẩu đã được tạo. Vui lòng chờ admin xác nhận."
        : "Yêu cầu reset mật khẩu đã được tạo. Vui lòng kiểm tra email.",
      resetRequestId: passwordResetRequest.id,
      expiresAt: passwordResetRequest.expiresAt,
    };
  }

  async getPasswordResetRequests(filters = {}) {
    return await this._passwordResetRepository.findAll(filters);
  }

  async approvePasswordReset(resetRequestId, adminUserId) {
    const passwordReset = await this._passwordResetRepository.findById(resetRequestId);
    
    if (!passwordReset) {
      throw new Error("Không tìm thấy yêu cầu reset mật khẩu");
    }

    if (passwordReset.status === "approved") {
      throw new Error("Yêu cầu reset mật khẩu này đã được duyệt");
    }

    if (passwordReset.status === "rejected") {
      throw new Error("Yêu cầu reset mật khẩu này đã bị từ chối");
    }

    // Generate new random password
    const generateRandomPassword = () => {
      const length = 12;
      const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lowercase = "abcdefghijklmnopqrstuvwxyz";
      const numbers = "0123456789";
      const all = uppercase + lowercase + numbers;
      
      let password = "";
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      
      for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
      }
      
      return password.split("").sort(() => Math.random() - 0.5).join("");
    };

    const newPassword = generateRandomPassword();

    // Get user and update password
    const user = await this._userRepository.findById(passwordReset.userId);
    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    const PasswordHasher = (await import("../../infrastructure/security/PasswordHasher.js")).PasswordHasher;
    const passwordHasher = new PasswordHasher();
    const hashedPassword = await passwordHasher.hash(newPassword);
    user.updatePassword(hashedPassword);
    await this._userRepository.save(user);

    // Update password reset request
    passwordReset.approve(adminUserId, newPassword);
    passwordReset.markAsUsed();
    await this._passwordResetRepository.save(passwordReset);

    // Send email with new password
    try {
      const EmailService = (await import("../../../registration/infrastructure/external/email/EmailService.js")).EmailService;
      const emailService = new EmailService();
      await emailService.sendNewPasswordEmail(
        user.email,
        newPassword,
        user.username || user.email
      );
      
      // Clear plaintext password after sending email
      passwordReset.newPassword = null;
      await this._passwordResetRepository.save(passwordReset);
    } catch (emailError) {
      console.error("Lỗi khi gửi email mật khẩu mới:", emailError);
    }

    return {
      success: true,
      message: "Yêu cầu reset mật khẩu đã được admin duyệt. Mật khẩu mới đã được gửi đến email của người dùng.",
    };
  }

  async rejectPasswordReset(resetRequestId, adminUserId, rejectionReason = null) {
    const passwordReset = await this._passwordResetRepository.findById(resetRequestId);
    
    if (!passwordReset) {
      throw new Error("Không tìm thấy yêu cầu reset mật khẩu");
    }

    if (passwordReset.status === "approved") {
      throw new Error("Yêu cầu reset mật khẩu này đã được duyệt, không thể từ chối");
    }

    if (passwordReset.status === "rejected") {
      throw new Error("Yêu cầu reset mật khẩu này đã bị từ chối");
    }

    passwordReset.reject(adminUserId);
    await this._passwordResetRepository.save(passwordReset);

    return {
      success: true,
      message: "Yêu cầu reset mật khẩu đã bị từ chối",
      data: {
        id: passwordReset.id,
        status: passwordReset.status,
        rejectionReason: rejectionReason || "",
      },
    };
  }
}

