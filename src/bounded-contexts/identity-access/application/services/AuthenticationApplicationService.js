import { LoginUserUseCase } from "../use-cases/LoginUserUseCase.js";
import { RegisterUserUseCase } from "../use-cases/RegisterUserUseCase.js";
import { ResetPasswordUseCase } from "../use-cases/ResetPasswordUseCase.js";
import { LoginDTO } from "../dto/LoginDTO.js";
import { RegisterUserDTO } from "../dto/RegisterUserDTO.js";

export class AuthenticationApplicationService {
  constructor(
    userRepository,
    passwordHasher,
    jwtService,
    eventBus,
    businessEntityService = null,
    passwordResetRepository = null
  ) {
    this._loginUseCase = new LoginUserUseCase(
      userRepository,
      null, // Will be set below
      jwtService,
      eventBus,
      businessEntityService
    );
    
    // Inject authentication domain service
    this._loginUseCase._authenticationDomainService = {
      authenticateUser: async (email, password) => {
        const user = await userRepository.findByEmail(email);
        if (!user) {
          throw new Error("Email hoặc mật khẩu không đúng");
        }
        if (!user.canLogin()) {
          throw new Error(`Tài khoản của bạn đang ở trạng thái: ${user.status}`);
        }
        const isPasswordValid = await passwordHasher.verify(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Email hoặc mật khẩu không đúng");
        }
        return user;
      },
    };

    this._registerUseCase = new RegisterUserUseCase(
      userRepository,
      passwordHasher,
      eventBus
    );

    this._resetPasswordUseCase = passwordResetRepository
      ? new ResetPasswordUseCase(userRepository, passwordHasher, passwordResetRepository)
      : null;
  }

  async login(loginDTO, ipAddress = null) {
    return await this._loginUseCase.execute(loginDTO, ipAddress);
  }

  async register(registerDTO, role = "user") {
    return await this._registerUseCase.execute(registerDTO, role);
  }

  async resetPassword(token, newPassword) {
    if (!this._resetPasswordUseCase) {
      throw new Error("Password reset service not configured");
    }
    return await this._resetPasswordUseCase.execute(token, newPassword);
  }
}

