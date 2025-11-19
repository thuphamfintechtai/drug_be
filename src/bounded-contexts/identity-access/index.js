// Public API for Identity-Access Bounded Context
export { AuthController } from "./presentation/controllers/AuthController.js";
export { UserController } from "./presentation/controllers/UserController.js";
export { createAuthRoutes } from "./presentation/routes/authRoutes.js";
export { createUserRoutes } from "./presentation/routes/userRoutes.js";
export { authenticate, authorize, isAdmin } from "./presentation/middleware/authMiddleware.js";

export { AuthenticationApplicationService } from "./application/services/AuthenticationApplicationService.js";
export { UserManagementApplicationService } from "./application/services/UserManagementApplicationService.js";
export { PasswordResetApplicationService } from "./application/services/PasswordResetApplicationService.js";

export { UserRepository } from "./infrastructure/persistence/mongoose/UserRepository.js";
export { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
export { PasswordHasher } from "./infrastructure/security/PasswordHasher.js";

