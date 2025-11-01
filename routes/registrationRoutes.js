import express from "express";
import {
  registerUser,
  registerAdmin,
  registerBusiness,
  approveRegistration,
  rejectRegistration,
  getRegistrationRequests,
  getRegistrationRequestById,
} from "../controllers/registrationController.js";

const router = express.Router();

// Đăng ký người dùng thông thường
router.post("/user", registerUser);

// Đăng ký admin (có thể cần middleware auth admin ở đây)
router.post("/admin", registerAdmin);

// Đăng ký business (pharma_company, distributor, pharmacy)
router.post("/business", registerBusiness);

// Lấy danh sách yêu cầu đăng ký (chỉ admin - cần middleware auth)
router.get("/requests", getRegistrationRequests);

// Lấy thông tin yêu cầu đăng ký theo ID
router.get("/requests/:requestId", getRegistrationRequestById);

// Phê duyệt đăng ký (chỉ admin - cần middleware auth)
router.post("/requests/:requestId/approve", approveRegistration);

// Từ chối đăng ký (chỉ admin - cần middleware auth)
router.post("/requests/:requestId/reject", rejectRegistration);

export default router;

