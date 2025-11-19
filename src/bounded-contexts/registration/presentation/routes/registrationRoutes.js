import express from "express";
import { authenticate, isAdmin } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createRegistrationRoutes = (registrationController) => {
  const router = express.Router();

  router.post("/pharma-company", (req, res) =>
    registrationController.submitPharmaCompanyRegistration(req, res)
  );

  router.post("/distributor", (req, res) =>
    registrationController.submitDistributorRegistration(req, res)
  );

  router.post("/pharmacy", (req, res) =>
    registrationController.submitPharmacyRegistration(req, res)
  );

  router.get("/requests", authenticate, isAdmin, (req, res) =>
    registrationController.getRegistrationRequests(req, res)
  );

  router.get("/requests/:requestId", authenticate, isAdmin, (req, res) =>
    registrationController.getRegistrationRequestById(req, res)
  );

  router.post("/requests/:requestId/approve", authenticate, isAdmin, (req, res) =>
    registrationController.approveRegistration(req, res)
  );

  router.post("/requests/:requestId/reject", authenticate, isAdmin, (req, res) =>
    registrationController.rejectRegistration(req, res)
  );

  return router;
};

