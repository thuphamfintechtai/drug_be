import express from "express";

export const createPublicRoutes = (publicController) => {
  const router = express.Router();

  // Public routes - không cần authentication
  router.get("/track/:tokenId", (req, res) =>
    publicController.trackDrugByNFTId(req, res)
  );
  router.get("/scanQR/:tokenId", (req, res) =>
    publicController.trackDrugByNFTId(req, res)
  );
  router.get("/Tracking/:identifier", (req, res) =>
    publicController.trackingDrugsInfo(req, res)
  );
  router.get("/drugs/search", (req, res) =>
    publicController.searchDrugByATCCode(req, res)
  );

  return router;
};

