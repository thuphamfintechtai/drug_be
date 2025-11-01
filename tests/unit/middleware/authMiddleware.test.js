import { authenticate, isAdmin } from "../../../middleware/authMiddleware.js";
import { verifyToken } from "../../../utils/jwt.js";
import User from "../../../models/User.js";
import { createTestUser, createTestAdmin } from "../../helpers/testHelpers.js";
import "../setup/testSetup.js";

jest.mock("../../../utils/jwt.js");
jest.mock("../../../models/User.js");

describe("Auth Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("authenticate", () => {
    test("Xác thực thành công với token hợp lệ", async () => {
      const user = await createTestUser();
      const token = "valid_token";

      req.headers.authorization = `Bearer ${token}`;
      verifyToken.mockReturnValue({ id: user._id.toString() });
      User.findById = jest.fn().mockResolvedValue(user);

      await authenticate(req, res, next);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(User.findById).toHaveBeenCalled();
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    test("Xác thực fail khi không có token", async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("Xác thực fail khi token không hợp lệ", async () => {
      req.headers.authorization = "Bearer invalid_token";
      verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("Xác thực fail khi user không tồn tại", async () => {
      req.headers.authorization = "Bearer valid_token";
      verifyToken.mockReturnValue({ id: "507f1f77bcf86cd799439011" });
      User.findById = jest.fn().mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    test("Cho phép admin truy cập", async () => {
      const admin = await createTestAdmin();
      req.user = admin;

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("Từ chối user thường truy cập", async () => {
      const user = await createTestUser();
      req.user = user;

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

