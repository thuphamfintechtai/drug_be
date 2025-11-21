export class LoginDTO {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  static fromRequest(req) {
    const { email, password } = req.body;
    return new LoginDTO(email, password);
  }

  validate() {
    const errors = [];
    
    if (!this.email || !this.email.trim()) {
      errors.push("Email là bắt buộc");
    }
    
    if (!this.password || !this.password.trim()) {
      errors.push("Password là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

