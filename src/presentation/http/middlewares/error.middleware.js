import { ErrorResponse } from "../responses/ErrorResponse.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error("Lỗi:", err);

  const errorResponse = ErrorResponse.fromError(err);

  return res.status(errorResponse.statusCode).json(errorResponse);
};

