import jwt from "jsonwebtoken";

export class JwtTokenService {
  constructor(secret, expiresIn = "7d") {
    this._secret = secret || process.env.JWT_SECRET || "your-secret-key-change-in-production";
    this._expiresIn = expiresIn || process.env.JWT_EXPIRES_IN || "7d";
  }

  generateToken(payload) {
    return jwt.sign(payload, this._secret, {
      expiresIn: this._expiresIn,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this._secret);
    } catch (error) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

