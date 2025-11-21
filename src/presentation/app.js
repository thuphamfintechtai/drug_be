import express from "express";
import cors from "cors";
import { errorMiddleware } from "./http/middlewares/error.middleware.js";

export const createApp = (routes) => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
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

