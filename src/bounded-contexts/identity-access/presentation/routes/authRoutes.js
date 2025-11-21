import express from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

export const createAuthRoutes = (authController) => {
  const router = express.Router();

  router.post("/login", (req, res) => authController.login(req, res));
  router.get("/me", authenticate, (req, res) => authController.getCurrentUser(req, res));
  router.post("/logout", authenticate, (req, res) => authController.logout(req, res));
  router.post("/register/user", (req, res) => authController.register(req, res));
  router.post("/register/admin", (req, res) => authController.registerAdmin(req, res));
  router.post("/forgot-password", (req, res) => authController.forgotPassword(req, res));
  router.post("/reset-password", (req, res) => authController.resetPassword(req, res));

  // Admin endpoints for password reset management
  router.get("/password-reset-requests", authenticate, isAdmin, (req, res) =>
    authController.getPasswordResetRequests(req, res)
  );
  router.post("/password-reset-requests/:resetRequestId/approve", authenticate, isAdmin, (req, res) =>
    authController.approvePasswordReset(req, res)
  );
  router.post("/password-reset-requests/:resetRequestId/reject", authenticate, isAdmin, (req, res) =>
    authController.rejectPasswordReset(req, res)
  );

  return router;
};

