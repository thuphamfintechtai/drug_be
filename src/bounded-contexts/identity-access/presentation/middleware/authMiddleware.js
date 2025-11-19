/**
 * Authentication and Authorization Middleware
 * 
 * This middleware uses injected dependencies from DI container.
 * For backward compatibility, we also export a factory function that accepts dependencies.
 */

let userRepository = null;
let jwtService = null;

/**
 * Initialize middleware with dependencies (called from bootstrap)
 */
export function initializeAuthMiddleware(repo, jwt) {
  userRepository = repo;
  jwtService = jwt;
}

/**
 * Create authenticate middleware function
 */
export function createAuthenticate(userRepo, jwt) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Không có token xác thực",
        });
      }

      const token = authHeader.substring(7);

      const decoded = (jwt || jwtService).verifyToken(token);

      const repo = userRepo || userRepository;
      const user = await repo.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      if (!user.canLogin()) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Token không hợp lệ",
      });
    }
  };
}

/**
 * Default authenticate middleware (uses injected dependencies)
 */
export const authenticate = async (req, res, next) => {
  if (!userRepository || !jwtService) {
    // Fallback: create instances if not initialized
    const { UserRepository } = await import("../../infrastructure/persistence/mongoose/UserRepository.js");
    const { JwtTokenService } = await import("../../infrastructure/security/JwtTokenService.js");
    const { appConfig } = await import("../../../../infrastructure/config/app.config.js");
    
    userRepository = userRepository || new UserRepository();
    jwtService = jwtService || new JwtTokenService(appConfig.jwtSecret, appConfig.jwtExpiresIn);
  }

  return createAuthenticate(userRepository, jwtService)(req, res, next);
};

/**
 * Create authorize middleware function
 */
export function createAuthorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này",
      });
    }

    next();
  };
}

/**
 * Default authorize middleware
 */
export const authorize = createAuthorize;

/**
 * Admin authorization middleware
 */
export const isAdmin = authorize("system_admin");

