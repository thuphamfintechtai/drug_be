import { LoginDTO } from "../dto/LoginDTO.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { InvalidCredentialsException } from "../../domain/exceptions/InvalidCredentialsException.js";

export class LoginUserUseCase {
  constructor(
    userRepository,
    authenticationDomainService,
    jwtService,
    eventBus,
    businessEntityService = null
  ) {
    this._userRepository = userRepository;
    this._authenticationDomainService = authenticationDomainService;
    this._jwtService = jwtService;
    this._eventBus = eventBus;
    this._businessEntityService = businessEntityService;
  }

  async execute(loginDTO, ipAddress = null) {
    loginDTO.validate();

    try {
      const user = await this._authenticationDomainService.authenticateUser(
        loginDTO.email,
        loginDTO.password
      );

      // Record login event
      user.recordLogin(ipAddress);

      // Publish domain events
      user.domainEvents.forEach((event) => {
        this._eventBus.publish(event);
      });

      // Generate JWT token
      const token = this._jwtService.generateToken({
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      });

      // Get business profile if applicable
      let businessProfile = null;
      if (user.roleVO.isBusinessRole() && this._businessEntityService) {
        try {
          businessProfile =
            await this._businessEntityService.getBusinessProfile(user);
        } catch (error) {
          // Business entity might not exist yet
          console.log(`Business entity not found for user ${user.id}`);
        }
      }

      return {
        token,
      };
    } catch (error) {
      if (
        error.message.includes("Email hoặc mật khẩu") ||
        error.message.includes("trạng thái")
      ) {
        throw new InvalidCredentialsException(error.message);
      }
      throw error;
    }
  }
}
