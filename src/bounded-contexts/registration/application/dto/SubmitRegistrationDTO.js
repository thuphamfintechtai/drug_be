export class SubmitRegistrationDTO {
  constructor(
    username,
    email,
    password,
    role,
    walletAddress,
    licenseNo,
    taxCode,
    name = null,
    fullName = null,
    country = null,
    address = null,
    contactEmail = null,
    contactPhone = null,
    gmpCertNo = null
  ) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
    this.walletAddress = walletAddress;
    this.licenseNo = licenseNo;
    this.taxCode = taxCode;
    this.name = name || fullName || "";
    this.country = country || "";
    this.address = address || "";
    this.contactEmail = contactEmail || email || "";
    this.contactPhone = contactPhone || "";
    this.gmpCertNo = gmpCertNo || "";
  }

  static fromRequest(req, role) {
    const {
      username,
      email,
      password,
      walletAddress,
      taxCode,
      licenseNo,
      licenseNumber, 
      name,
      fullName,
      companyName,
      company,
      country,
      address,
      contactEmail,
      contactPhone,
      gmpCertNo,
    } = req.body;

    // Lấy licenseNo từ licenseNo hoặc licenseNumber
    const finalLicenseNo = licenseNo || licenseNumber;
    
    // Lấy taxCode từ taxCode hoặc company.taxCode
    const finalTaxCode = taxCode || company?.taxCode;
    
    // Lấy name từ name, companyName, hoặc company.name
    const finalName = name || companyName || company?.name;
    
    // Lấy contactPhone từ contactPhone hoặc phone
    const finalContactPhone = contactPhone || req.body.phone;

    return new SubmitRegistrationDTO(
      username,
      email,
      password,
      role,
      walletAddress,
      finalLicenseNo,
      finalTaxCode,
      finalName,
      fullName,
      country,
      address,
      contactEmail,
      finalContactPhone,
      gmpCertNo
    );
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

    if (!this.walletAddress || !this.walletAddress.trim()) {
      errors.push("WalletAddress là bắt buộc");
    }

    if (!this.licenseNo || !this.licenseNo.trim()) {
      errors.push("LicenseNo là bắt buộc");
    }

    if (!this.taxCode || !this.taxCode.trim()) {
      errors.push("TaxCode là bắt buộc");
    }

    if (!this.role) {
      errors.push("Role là bắt buộc");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

