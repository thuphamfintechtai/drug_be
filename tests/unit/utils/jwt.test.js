import { generateToken, verifyToken } from "../../../utils/jwt.js";
import jwt from "jsonwebtoken";

describe("JWT Utils Tests", () => {
  const payload = {
    id: "507f1f77bcf86cd799439011",
    email: "test@test.com",
    role: "user",
  };

  describe("generateToken", () => {
    test("Tạo token thành công", () => {
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });

    test("Token có thể verify được", () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe("verifyToken", () => {
    test("Verify token hợp lệ thành công", () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("email");
      expect(decoded).toHaveProperty("role");
    });

    test("Verify token không hợp lệ sẽ throw error", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    test("Verify token đã hết hạn sẽ throw error", () => {
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
        expiresIn: "-1h",
      });

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });
  });
});

