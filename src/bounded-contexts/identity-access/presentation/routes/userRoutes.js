import express from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

export const createUserRoutes = (userController) => {
  const router = express.Router();

  // User profile endpoints
  router.get("/me", authenticate, (req, res) => userController.getCurrentUser(req, res));
  router.put("/profile", authenticate, (req, res) => userController.updateProfile(req, res));
  router.put("/profile/change-password", authenticate, (req, res) => userController.changePassword(req, res));

  // Admin user management endpoints
  router.get("/stats", authenticate, isAdmin, (req, res) => userController.getUserStats(req, res));
  router.get("/", authenticate, isAdmin, (req, res) => userController.getAllUsers(req, res));
  router.get("/:id", authenticate, (req, res) => userController.getUserById(req, res));
  router.put("/:id", authenticate, isAdmin, (req, res) => userController.updateUser(req, res));
  router.put("/:id/status", authenticate, isAdmin, (req, res) => userController.updateUserStatus(req, res));
  router.delete("/:id", authenticate, isAdmin, (req, res) => userController.deleteUser(req, res));

  return router;
};

