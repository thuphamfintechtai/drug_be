import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createDrugRoutes = (drugController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate
  router.use(authenticate);

  // Chỉ pharma_company mới có thể thêm, sửa, xóa thuốc
  router.post("/", authorize("pharma_company"), (req, res) =>
    drugController.addDrug(req, res)
  );

  // Get all drugs for manufacturer
  router.get("/", authorize("pharma_company"), (req, res) =>
    drugController.getDrugs(req, res)
  );

  // Get drug by ID
  router.get("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.getDrugById(req, res)
  );

  // Update drug
  router.put("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.updateDrug(req, res)
  );

  // Delete drug
  router.delete("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.deleteDrug(req, res)
  );

  // Search drug by ATC code
  router.get("/search/atc", authorize("pharma_company"), (req, res) =>
    drugController.searchByATCCode(req, res)
  );

  return router;
};

