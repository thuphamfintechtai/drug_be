export class RegisterUserDTO {
  constructor(username, email, password, fullName = null, phone = null, country = null, address = null) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.phone = phone;
    this.country = country;
    this.address = address;
  }

  static fromRequest(req) {
    const { username, email, password, fullName, phone, country, address } = req.body;
    return new RegisterUserDTO(username, email, password, fullName, phone, country, address);
  }

  validate() {
    const errors = [];
    
    if (!this.username || !this.username.trim()) {
      errors.push("Username là bắt buộc");
    }
    
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

