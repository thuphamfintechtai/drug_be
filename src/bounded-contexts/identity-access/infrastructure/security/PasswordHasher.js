import bcrypt from "bcryptjs";

export class PasswordHasher {
  constructor(saltRounds = 10) {
    this._saltRounds = saltRounds;
  }

  async hash(password) {
    return await bcrypt.hash(password, this._saltRounds);
  }

  async verify(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

