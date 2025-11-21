import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../infrastructure/config/swagger.config.js";
import { errorMiddleware } from "./http/middlewares/error.middleware.js";

export const createApp = (routes) => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger Documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Drug Traceability API Documentation",
    })
  );

  // Health check
  /**
   * @swagger
   * /:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Drug Traceability Backend API
   */
  app.get("/", (req, res) => {
    res.json({ message: "Drug Traceability Backend API" });
  });

  // Mount routes
  if (routes) {
    Object.entries(routes).forEach(([path, router]) => {
      app.use(path, router);
    });
  }

  // Error handling middleware
  app.use(errorMiddleware);

  return app;
};
