export class AuthenticationDomainService {
  constructor(userRepository, passwordHasher) {
    this._userRepository = userRepository;
    this._passwordHasher = passwordHasher;
  }

  async authenticateUser(email, password) {
    const user = await this._userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (!user.canLogin()) {
      throw new Error(`Tài khoản của bạn đang ở trạng thái: ${user.status}`);
    }

    const isPasswordValid = await this._passwordHasher.verify(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    return user;
  }

  async validatePasswordStrength(password) {
    if (!password || password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }
    return true;
  }
}

