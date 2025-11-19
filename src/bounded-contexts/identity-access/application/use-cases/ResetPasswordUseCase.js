import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";

export class ResetPasswordUseCase {
  constructor(userRepository, passwordHasher, passwordResetRepository) {
    this._userRepository = userRepository;
    this._passwordHasher = passwordHasher;
    this._passwordResetRepository = passwordResetRepository;
  }

  async execute(token, newPassword) {
    if (!token || !newPassword) {
      throw new Error("Token và mật khẩu mới là bắt buộc");
    }

    if (newPassword.length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    const passwordReset = await this._passwordResetRepository.findByToken(token);

    if (!passwordReset || passwordReset.used) {
      throw new Error("Token reset mật khẩu không hợp lệ hoặc đã được sử dụng");
    }

    if (new Date() > passwordReset.expiresAt) {
      throw new Error("Token reset mật khẩu đã hết hạn");
    }

    const user = await this._userRepository.findById(passwordReset.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    // Hash new password
    const newPasswordHash = await this._passwordHasher.hash(newPassword);
    user.updatePassword(newPasswordHash);

    // Mark token as used
    passwordReset.markAsUsed();
    
    await this._userRepository.save(user);
    await this._passwordResetRepository.save(passwordReset);

    return { success: true };
  }
}

