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

/**
 * Optional authenticate middleware - allows access if no admin exists (first admin setup)
 * If token is provided, validates it. If no token, allows access only if no admin exists.
 */
export const authenticateOrAllowFirstAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If token is provided, authenticate normally
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authenticate(req, res, next);
  }

  // If no token, check if any admin exists
  try {
    let repo = userRepository;
    if (!repo) {
      // Fallback: create instance if not initialized
      const { UserRepository } = await import("../../infrastructure/persistence/mongoose/UserRepository.js");
      repo = new UserRepository();
    }
    
    const adminCount = await repo.countByRole("system_admin");
    
    if (adminCount === 0) {
      // No admin exists, allow access for first admin setup
      return next();
    }

    // Admin exists, require authentication
    return res.status(401).json({
      success: false,
      message: "Không có token xác thực",
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền truy cập",
      error: error.message,
    });
  }
};

/**
 * Optional admin authorization - allows access if no admin exists or if user is admin
 */
export const isAdminOrAllowFirstAdmin = async (req, res, next) => {
  // If user is already authenticated and is admin, allow
  if (req.user && req.user.role === "system_admin") {
    return next();
  }

  // If no user, check if any admin exists
  try {
    let repo = userRepository;
    if (!repo) {
      const { UserRepository } = await import("../../infrastructure/persistence/mongoose/UserRepository.js");
      repo = new UserRepository();
    }
    
    const adminCount = await repo.countByRole("system_admin");
    
    if (adminCount === 0) {
      // No admin exists, allow access for first admin setup
      return next();
    }

    // Admin exists, require admin role
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này",
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền truy cập",
      error: error.message,
    });
  }
};

